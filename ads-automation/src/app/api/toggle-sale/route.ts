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
  errors?: string[];
}

export const dynamic = 'force-dynamic'; // Ensure it's not cached

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
        const status = ag.status; // 'ENABLED' or 'PAUSED'
        const isSale = name.toLowerCase().includes('sale');
        
        let newStatus = '';
        let shouldChange = false;

        if (mode === 'start') {
          if (isSale && status === 'PAUSED') {
            shouldChange = true;
            newStatus = 'ENABLED';
          } else if (!isSale && status === 'ENABLED') {
            shouldChange = true;
            newStatus = 'PAUSED';
          }
        } else { // mode === 'end'
          if (isSale && status === 'ENABLED') {
            shouldChange = true;
            newStatus = 'PAUSED';
          } else if (!isSale && status === 'PAUSED') {
            shouldChange = true;
            newStatus = 'ENABLED';
          }
        }

        if (shouldChange) {
          accountResult.pmaxOperations.push({
            update: { resourceName: ag.resourceName, status: newStatus },
            updateMask: 'status'
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
        const isSale = name.toLowerCase().includes('sale');

        let newStatus = '';
        let shouldChange = false;

        if (mode === 'start') {
          if (isSale && status === 'PAUSED') {
            shouldChange = true;
            newStatus = 'ENABLED';
          } else if (!isSale && status === 'ENABLED') {
            shouldChange = true;
            newStatus = 'PAUSED';
          }
        } else { // mode === 'end'
          if (isSale && status === 'ENABLED') {
            shouldChange = true;
            newStatus = 'PAUSED';
          } else if (!isSale && status === 'PAUSED') {
            shouldChange = true;
            newStatus = 'ENABLED';
          }
        }

        if (shouldChange) {
          accountResult.demandGenOperations.push({
            update: { resourceName: camp.resourceName, status: newStatus },
            updateMask: 'status'
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

