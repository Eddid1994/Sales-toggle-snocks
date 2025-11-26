import { NextResponse } from 'next/server';
import { ACCOUNTS } from '@/lib/config';
import { searchGoogleAds, mutateGoogleAds } from '@/lib/googleAds';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

interface CampaignData {
  id: string;
  name: string;
  budgetResourceName: string;
  budgetAmountMicros: number;
  dailyBudget: number;
}

interface CampaignSpend {
  campaignId: string;
  costMicros: number;
}

interface CampaignResult {
  campaignId: string;
  campaignName: string;
  currentBudget: number;
  todaySpend: number;
  utilizationPercent: number;
  newBudget: number;
  increaseAmount: number;
  isDryRun: boolean;
  action: 'INCREASED' | 'SKIPPED' | 'ERROR';
  reason?: string;
}

interface AccountResult {
  country: string;
  accountId: string;
  processedCampaigns: number;
  increasedCampaigns: number;
  skippedCampaigns: number;
  details: CampaignResult[];
  errors?: string[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authKey = searchParams.get('key');
  const dryRun = searchParams.get('dryRun') === 'true';
  
  // Parse configuration with defaults
  const thresholdParam = searchParams.get('threshold');
  const increaseParam = searchParams.get('increase');
  
  const budgetThresholdPercent = thresholdParam ? parseFloat(thresholdParam) : 80;
  const budgetIncreasePercent = increaseParam ? parseFloat(increaseParam) : 20;

  // Validate configuration
  if (isNaN(budgetThresholdPercent) || budgetThresholdPercent <= 0) {
    return NextResponse.json({ error: 'Invalid budget threshold percentage' }, { status: 400 });
  }
  if (isNaN(budgetIncreasePercent) || budgetIncreasePercent <= 0) {
    return NextResponse.json({ error: 'Invalid budget increase percentage' }, { status: 400 });
  }

  // Security check
  if (process.env.CRON_SECRET && authKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: AccountResult[] = [];

  // Process all accounts in parallel
  await Promise.all(ACCOUNTS.map(async (account) => {
    const accountResult: AccountResult = {
      country: account.country,
      accountId: account.id,
      processedCampaigns: 0,
      increasedCampaigns: 0,
      skippedCampaigns: 0,
      details: [],
      errors: []
    };

    try {
      // 1. Get Active Campaigns and their budgets
      const campaignQuery = `
        SELECT 
          campaign.id, 
          campaign.name, 
          campaign.status, 
          campaign_budget.resource_name, 
          campaign_budget.amount_micros 
        FROM campaign 
        WHERE campaign.status = 'ENABLED'
      `;
      
      const campaignRows = await searchGoogleAds(account.id, campaignQuery);
      
      const campaigns: CampaignData[] = campaignRows.map((row: any) => ({
        id: row.campaign.id,
        name: row.campaign.name,
        budgetResourceName: row.campaignBudget.resourceName,
        budgetAmountMicros: parseInt(row.campaignBudget.amountMicros, 10),
        dailyBudget: parseInt(row.campaignBudget.amountMicros, 10) / 1_000_000
      }));

      // 2. Get Today's Spend for all enabled campaigns
      // We use segments.date DURING TODAY to get today's data
      const spendQuery = `
        SELECT 
          campaign.id, 
          metrics.cost_micros 
        FROM campaign 
        WHERE 
          campaign.status = 'ENABLED' 
          AND segments.date DURING TODAY
      `;

      const spendRows = await searchGoogleAds(account.id, spendQuery);
      const spendMap = new Map<string, number>();
      
      spendRows.forEach((row: any) => {
        spendMap.set(row.campaign.id, parseInt(row.metrics.costMicros, 10));
      });

      // 3. Analyze and Prepare Mutations
      const operations: any[] = [];

      for (const campaign of campaigns) {
        const costMicros = spendMap.get(campaign.id) || 0;
        const todaySpend = costMicros / 1_000_000;
        
        // Avoid division by zero
        if (campaign.dailyBudget <= 0) {
          accountResult.skippedCampaigns++;
          accountResult.details.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            currentBudget: campaign.dailyBudget,
            todaySpend,
            utilizationPercent: 0,
            newBudget: campaign.dailyBudget,
            increaseAmount: 0,
            isDryRun: dryRun,
            action: 'SKIPPED',
            reason: 'Zero budget'
          });
          continue;
        }

        const utilizationPercent = (todaySpend / campaign.dailyBudget) * 100;

        if (utilizationPercent >= budgetThresholdPercent) {
          const newBudget = campaign.dailyBudget * (1 + budgetIncreasePercent / 100);
          const newBudgetMicros = Math.round(newBudget * 1_000_000);
          
          accountResult.increasedCampaigns++;
          accountResult.details.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            currentBudget: campaign.dailyBudget,
            todaySpend,
            utilizationPercent,
            newBudget,
            increaseAmount: newBudget - campaign.dailyBudget,
            isDryRun: dryRun,
            action: 'INCREASED'
          });

          operations.push({
            update: {
              resourceName: campaign.budgetResourceName,
              amountMicros: newBudgetMicros
            },
            updateMask: 'amountMicros'
          });
        } else {
          accountResult.skippedCampaigns++;
          accountResult.details.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            currentBudget: campaign.dailyBudget,
            todaySpend,
            utilizationPercent,
            newBudget: campaign.dailyBudget,
            increaseAmount: 0,
            isDryRun: dryRun,
            action: 'SKIPPED',
            reason: `Utilization ${utilizationPercent.toFixed(1)}% < ${budgetThresholdPercent}%`
          });
        }
      }

      accountResult.processedCampaigns = campaigns.length;

      // 4. Execute Mutations (if not dry run)
      if (!dryRun && operations.length > 0) {
        await mutateGoogleAds(account.id, 'campaignBudgets', operations);
      }

    } catch (error: any) {
      accountResult.errors?.push(error.message || 'Unknown error');
      console.error(`Error processing account ${account.country}:`, error);
    }

    results.push(accountResult);
  }));

  const totalProcessed = results.reduce((sum, r) => sum + r.processedCampaigns, 0);
  const totalIncreased = results.reduce((sum, r) => sum + r.increasedCampaigns, 0);

  return NextResponse.json({
    message: `Processed ${results.length} accounts`,
    config: {
      budgetThresholdPercent,
      budgetIncreasePercent,
      dryRun
    },
    summary: {
      totalAccounts: results.length,
      totalProcessed,
      totalIncreased
    },
    details: results
  });
}

