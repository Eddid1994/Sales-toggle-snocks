import { NextResponse } from 'next/server';
import { ACCOUNTS } from '@/lib/config';
import { searchGoogleAds, mutateGoogleAds } from '@/lib/googleAds';

// Define types for our results
interface Operation {
  update: {
    resourceName: string;
    status: string;
  };
  updateMask: string; // 'status'
}

interface AccountResult {
  country: string;
  pmaxChanges: number;
  demandGenChanges: number;
  pmaxOperations: Operation[];
  demandGenOperations: Operation[];
  proposedChanges: {
    type: 'PMax' | 'Demand Gen';
    name: string;
    from: string;
    to: string;
    campaignName?: string;
  }[];
  errors?: string[];
}

export const dynamic = 'force-dynamic'; // Ensure it's not cached

// Define specific targets based on the CSV provided
interface PMaxTarget {
  campaign: string;
  assetGroup: string;
}

const SALE_PMAX_TARGETS: PMaxTarget[] = [
  // DE/AT PMax
  { campaign: '[Performance Max]_Generic_DE_[Socken][Sneaker Socken]', assetGroup: 'Sales Events Invisibles' },
  { campaign: '[Performance Max]_Generic_DE_[Socken][Sneaker Socken]', assetGroup: 'Sales Event Ankle' },
  { campaign: '[Performance Max]_Generic_DE_[Socken][Business Socken]', assetGroup: 'Sales Event Business-Socken' },
  { campaign: '[Performance Max]_Generic_DE_[Damen][Leggings]', assetGroup: 'Sales Event High Waist Leggings' },
  { campaign: '[Performance Max]_Generic_DE_[Socken][Tennissocken]', assetGroup: 'Sales Event Tennissocken' },
  
  // CH PMax
  { campaign: 'SN_Performance Max_CH_UND_Boxershorts', assetGroup: 'SALE Boxershorts - Full Build' },
  { campaign: 'SN_Performance Max_CH_UND_Boxershorts_Long', assetGroup: 'SALE Boxershorts - Full Build' },
  
  // FR, IT, PL PMax
  { campaign: 'FR_Performance Max | Sales [Generic]', assetGroup: '[Sale BFCM25]' },
  { campaign: 'IT_Performance Max | Sales [Generic]', assetGroup: '[Sale BFCM25]' },
  { campaign: 'PL_Performance Max | Sales [Generic]', assetGroup: '[Sale BFCM25]' },
  
  // DE/AT PMax (OceansApart)
  { campaign: 'OA_Performance Max_DE_AT_Sets', assetGroup: 'Sale Event - Sport Sets' },
  { campaign: 'OA_Performance Max_CH_[Leggings]', assetGroup: 'Sale Event - Leggings' }
];

const NON_SALE_PMAX_TARGETS: PMaxTarget[] = [
  // DE/AT PMax (OceansApart)
  { campaign: 'OA_Performance Max_DE_AT_Sets', assetGroup: '[Sport Sets] non-sale' },
  { campaign: 'OA_Performance Max_CH_[Leggings]', assetGroup: '[Leggings] non-sale' }
];

// Demand Gen Campaigns to toggle
const DEMAND_GEN_CAMPAIGNS = [
  '[Demand_Gen]_NL_Sales_Discover',
  '[Demand_Gen]_FR_Sales_Discover',
  '[Demand Gen]_DE_Damen_Sale_ugc',
  '[Demand Gen]_DE_Herren_Sale_ugc',
  '[Discovery]_DE_Discovery_Herren_Sale',
  '[Discovery]_DE_Discovery_Damen_Sale'
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode'); // 'start' or 'end'
  const dryRun = searchParams.get('dryRun') === 'true';
  const authKey = searchParams.get('key'); // Simple protection

  // Check for missing environment variables
  const missingVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN'
  ].filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    return NextResponse.json({ 
      error: 'Missing Configuration', 
      details: `Please add the following to your .env.local file: ${missingVars.join(', ')}`,
      hint: 'These are OAuth credentials which are NOT included in the n8n export.'
    }, { status: 500 });
  }

  // Basic security check
  if (process.env.CRON_SECRET && authKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (mode !== 'start' && mode !== 'end') {
    return NextResponse.json({ error: 'Invalid mode. Use "start" or "end".' }, { status: 400 });
  }

  const results: AccountResult[] = [];

  // Process all accounts in parallel
  await Promise.all(ACCOUNTS.map(async (account) => {
    const accountResult: AccountResult = {
      country: account.country,
      pmaxChanges: 0,
      demandGenChanges: 0,
      pmaxOperations: [],
      demandGenOperations: [],
      proposedChanges: [],
      errors: []
    };

    try {
      // 1. PMax Asset Groups
      const pmaxQuery = `
        SELECT asset_group.id, asset_group.name, asset_group.status, asset_group.resource_name, campaign.id, campaign.name, campaign.status 
        FROM asset_group 
        WHERE campaign.advertising_channel_type = 'PERFORMANCE_MAX' 
        AND campaign.status = 'ENABLED' 
        AND asset_group.status IN ('ENABLED', 'PAUSED') 
        ORDER BY campaign.name, asset_group.name
      `;
      const pmaxRows = await searchGoogleAds(account.id, pmaxQuery);
      
      for (const row of pmaxRows) {
        const ag = row.assetGroup;
        const name = ag.name;
        const campaignName = row.campaign.name;
        const status = ag.status; // 'ENABLED' or 'PAUSED'
        
        // Logic based on CSV Targets - EXACT MATCH on Campaign AND Asset Group
        const isSaleAsset = SALE_PMAX_TARGETS.some(t => 
          t.campaign === campaignName && t.assetGroup === name
        );
        
        const isNonSaleTarget = NON_SALE_PMAX_TARGETS.some(t => 
          t.campaign === campaignName && t.assetGroup === name
        );

        let newStatus = '';
        let shouldChange = false;

        if (mode === 'start') {
          // START SALE: Enable Sale Assets, Pause Specific Non-Sale Assets
          if (isSaleAsset && status === 'PAUSED') {
            shouldChange = true;
            newStatus = 'ENABLED';
          } else if (isNonSaleTarget && status === 'ENABLED') {
            shouldChange = true;
            newStatus = 'PAUSED';
          }
        } else { // mode === 'end'
          // END SALE: Pause Sale Assets, Enable Specific Non-Sale Assets
          if (isSaleAsset && status === 'ENABLED') {
            shouldChange = true;
            newStatus = 'PAUSED';
          } else if (isNonSaleTarget && status === 'PAUSED') {
            shouldChange = true;
            newStatus = 'ENABLED';
          }
        }

        if (shouldChange) {
          accountResult.pmaxOperations.push({
            update: { resourceName: ag.resourceName, status: newStatus },
            updateMask: 'status'
          });
          accountResult.proposedChanges.push({
            type: 'PMax',
            name: name,
            campaignName: row.campaign.name,
            from: status,
            to: newStatus
          });
        }
      }

      // 2. Demand Gen Campaigns
      const demandGenQuery = `
        SELECT campaign.id, campaign.name, campaign.status, campaign.resource_name 
        FROM campaign 
        WHERE campaign.advertising_channel_type = 'DEMAND_GEN' 
        AND campaign.status != 'REMOVED' 
        ORDER BY campaign.name
      `;
      const demandGenRows = await searchGoogleAds(account.id, demandGenQuery);

      for (const row of demandGenRows) {
        const camp = row.campaign;
        const name = camp.name;
        const status = camp.status;
        
        // Logic based on CSV Targets
        const isSaleCampaign = DEMAND_GEN_CAMPAIGNS.some(target => name === target || name.includes(target));
        
        let newStatus = '';
        let shouldChange = false;

        if (mode === 'start') {
          if (isSaleCampaign && status === 'PAUSED') {
            shouldChange = true;
            newStatus = 'ENABLED';
          }
          // CSV shows "campaign off" for off-sale, which means we pause them.
          // It doesn't list specific "non-sale" campaigns to enable, so we likely just toggle these specific ones.
        } else { // mode === 'end'
          if (isSaleCampaign && status === 'ENABLED') {
            shouldChange = true;
            newStatus = 'PAUSED';
          }
        }

        if (shouldChange) {
          accountResult.demandGenOperations.push({
            update: { resourceName: camp.resourceName, status: newStatus },
            updateMask: 'status'
          });
          accountResult.proposedChanges.push({
            type: 'Demand Gen',
            name: name,
            from: status,
            to: newStatus
          });
        }
      }

      accountResult.pmaxChanges = accountResult.pmaxOperations.length;
      accountResult.demandGenChanges = accountResult.demandGenOperations.length;

      // Apply Changes if not dry run
      if (!dryRun) {
        if (accountResult.pmaxOperations.length > 0) {
          await mutateGoogleAds(account.id, 'assetGroups', accountResult.pmaxOperations);
        }
        if (accountResult.demandGenOperations.length > 0) {
          await mutateGoogleAds(account.id, 'campaigns', accountResult.demandGenOperations);
        }
      }

    } catch (error: any) {
      accountResult.errors?.push(error.message || 'Unknown error');
    }

    results.push(accountResult);
  }));

  const totalChanges = results.reduce((acc, r) => acc + r.pmaxChanges + r.demandGenChanges, 0);

  return NextResponse.json({
    message: `Successfully processed ${results.length} accounts`,
    mode: mode === 'start' ? 'START SALE' : 'END SALE',
    dryRun,
    totalChanges,
    details: results
  });
}

