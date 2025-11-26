import { NextRequest, NextResponse } from 'next/server';
import { ACCOUNTS } from '@/lib/config';
import { searchGoogleAds, mutateGoogleAds } from '@/lib/googleAds';
import { SBA_CONFIG, SBAFilter } from '@/lib/sbaConfig';

export const maxDuration = 300; // 5 minutes timeout

interface SBACampaignResult {
  campaignName: string;
  todayConvRate: string;
  yesterdayConvRate: string;
  change: string;
  adjustmentApplied: string;
  action: string;
  sbaName: string;
  status: string;
  duration: string | null;
  skipReason?: string;
}

interface SBAAccountResult {
  country: string;
  accountId: string;
  results: SBACampaignResult[];
  error?: string;
}

interface ApiResponse {
  summary: {
    processed: number;
    applied: number;
    skipped: number;
    errors: number;
  };
  details: SBAAccountResult[];
}

function getBerlinDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);
  
  const getPart = (type: string) => parts.find(p => p.type === type)?.value;
  
  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
    second: getPart('second')
  };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDates() {
  const now = new Date();
  const berlinParts = getBerlinDateParts(now);
  
  // Current date in Berlin
  const todayStr = `${berlinParts.year}-${berlinParts.month}-${berlinParts.day}`;
  
  // Calculate Yesterday (subtract 1 day from Berlin date)
  const todayDate = new Date(todayStr);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = formatDate(yesterdayDate);
  
  // End of Today in Berlin (for SBA end time)
  const endOfTodayStr = `${todayStr} 23:59:59`;
  
  // Current time in Berlin (for SBA start time)
  const nowStr = `${todayStr} ${berlinParts.hour}:${berlinParts.minute}:${berlinParts.second}`;
  
  return {
    todayStr,
    yesterdayStr,
    nowStr,
    endOfTodayStr
  };
}

async function processAccount(account: { id: string; country: string; name: string }, dryRun: boolean, customFilters?: SBAFilter[]): Promise<SBAAccountResult> {
  const { todayStr, yesterdayStr, nowStr, endOfTodayStr } = getDates();
  const results: SBACampaignResult[] = [];
  
  try {
    // 1. Get All Enabled Campaigns
    const campaignsQuery = `SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.status = 'ENABLED'`;
    const allCampaigns = await searchGoogleAds(account.id, campaignsQuery);
    
    // 2. Filter Campaigns
    const filtersToUse = customFilters || SBA_CONFIG.filters;
    const filteredCampaigns = [];
    for (const filter of filtersToUse) {
      if (!filter.enabled) continue;
      
      for (const row of allCampaigns) {
        const campaignName = row.campaign.name;
        if (campaignName.includes(filter.contains)) {
          // Avoid duplicates if multiple filters match same campaign
          if (!filteredCampaigns.find(c => c.id === row.campaign.id)) {
            filteredCampaigns.push({
              id: row.campaign.id,
              name: campaignName,
              filterType: filter.name
            });
          }
        }
      }
    }

    if (filteredCampaigns.length === 0) {
       return { country: account.country, accountId: account.id, results: [] };
    }

    // 3. Process Each Campaign
    for (const campaign of filteredCampaigns) {
      try {
        // Get Today's Performance
        const todayQuery = `SELECT campaign.id, metrics.conversions, metrics.clicks, metrics.conversions_from_interactions_rate FROM campaign WHERE campaign.id = ${campaign.id} AND segments.date = '${todayStr}'`;
        const todayRows = await searchGoogleAds(account.id, todayQuery);
        const todayData = todayRows[0]?.metrics || { conversions: 0, clicks: 0, conversionsFromInteractionsRate: 0 };
        
        // Get Yesterday's Performance
        const yesterdayQuery = `SELECT campaign.id, metrics.conversions, metrics.clicks, metrics.conversions_from_interactions_rate FROM campaign WHERE campaign.id = ${campaign.id} AND segments.date = '${yesterdayStr}'`;
        const yesterdayRows = await searchGoogleAds(account.id, yesterdayQuery);
        const yesterdayData = yesterdayRows[0]?.metrics || { conversions: 0, clicks: 0, conversionsFromInteractionsRate: 0 };
        
        const todayClicks = Number(todayData.clicks);
        const yesterdayClicks = Number(yesterdayData.clicks);
        
        // Use API-provided conversion rate (handle camelCase from JSON response)
        // Fallback to 0 if undefined
        const todayConvRate = Number(todayData.conversionsFromInteractionsRate || todayData.conversions_from_interactions_rate || 0);
        const yesterdayConvRate = Number(yesterdayData.conversionsFromInteractionsRate || yesterdayData.conversions_from_interactions_rate || 0);

        // Calculate Change early for reporting
        const convRateChange = yesterdayConvRate > 0 
          ? ((todayConvRate - yesterdayConvRate) / yesterdayConvRate) * 100 
          : 0;
        
        // 4. Logic Checks
        // Min Clicks - Only require significant data for Today to detect scaling
        if (todayClicks < SBA_CONFIG.minClicksRequired) {
          results.push({
            campaignName: campaign.name,
            todayConvRate: (todayConvRate * 100).toFixed(2),
            yesterdayConvRate: (yesterdayConvRate * 100).toFixed(2),
            change: convRateChange.toFixed(2),
            adjustmentApplied: '0',
            action: 'SKIPPED',
            sbaName: 'N/A',
            status: 'SKIPPED - INSUFFICIENT_DATA',
            duration: null,
            skipReason: `Today Clicks < ${SBA_CONFIG.minClicksRequired} (T:${todayClicks})`
          });
          continue;
        }
          
        // ONLY Positive Changes > Min %
        if (convRateChange < SBA_CONFIG.minChangePercent) {
           results.push({
            campaignName: campaign.name,
            todayConvRate: (todayConvRate * 100).toFixed(2),
            yesterdayConvRate: (yesterdayConvRate * 100).toFixed(2),
            change: convRateChange.toFixed(2),
            adjustmentApplied: '0',
            action: 'SKIPPED',
            sbaName: 'N/A',
            status: 'SKIPPED - CHANGE_TOO_SMALL_OR_NEGATIVE',
            duration: null,
            skipReason: `Change ${convRateChange.toFixed(2)}% < ${SBA_CONFIG.minChangePercent}%`
          });
          continue;
        }
        
        // Cap Adjustment
        let adjustmentPercent = convRateChange;
        adjustmentPercent = Math.min(SBA_CONFIG.maxAdjustmentPercent, adjustmentPercent);
        
        const conversionRateModifier = 1 + (adjustmentPercent / 100);
        const sbaName = `Auto SBA ${account.country} - ${campaign.name}`;
        
        // 5. Check Existing SBA
        // Note: We need to escape single quotes in campaign name for the query if present
        const escapedSbaName = sbaName.replace(/'/g, "\\'");
        const sbaQuery = `SELECT bidding_seasonality_adjustment.resource_name, bidding_seasonality_adjustment.name FROM bidding_seasonality_adjustment WHERE bidding_seasonality_adjustment.name = '${escapedSbaName}'`;
        const sbaRows = await searchGoogleAds(account.id, sbaQuery);
        const existingSBA = sbaRows[0]?.biddingSeasonalityAdjustment?.resourceName;
        
        const shouldUpdate = !!existingSBA;
        
        // 6. Prepare Mutation
        if (!dryRun) {
          let operation;
          if (shouldUpdate) {
            operation = {
              updateMask: "conversionRateModifier,startDateTime,endDateTime,description",
              update: {
                resourceName: existingSBA,
                conversionRateModifier: Number(conversionRateModifier.toFixed(3)),
                startDateTime: nowStr,
                endDateTime: endOfTodayStr,
                description: `Today vs Yesterday: ${convRateChange.toFixed(2)}% change - Updated ${nowStr}`
              }
            };
          } else {
            operation = {
              create: {
                name: sbaName,
                scope: "CAMPAIGN",
                campaigns: [`customers/${account.id}/campaigns/${campaign.id}`],
                startDateTime: nowStr,
                endDateTime: endOfTodayStr,
                conversionRateModifier: Number(conversionRateModifier.toFixed(3)),
                description: `Today vs Yesterday: ${convRateChange.toFixed(2)}% change`
              }
            };
          }
          
          await mutateGoogleAds(account.id, 'biddingSeasonalityAdjustments', [operation]);
        }
        
        results.push({
          campaignName: campaign.name,
          todayConvRate: (todayConvRate * 100).toFixed(2),
          yesterdayConvRate: (yesterdayConvRate * 100).toFixed(2),
          change: convRateChange.toFixed(2),
          adjustmentApplied: adjustmentPercent.toFixed(2),
          action: dryRun 
            ? (shouldUpdate ? 'DRY RUN - UPDATE' : 'DRY RUN - CREATE')
            : (shouldUpdate ? 'UPDATED' : 'CREATED'),
          sbaName: sbaName,
          status: dryRun ? 'DRY RUN' : 'APPLIED',
          duration: `${nowStr} to ${endOfTodayStr}`
        });
        
      } catch (err: any) {
        console.error(`Error processing campaign ${campaign.name} in ${account.country}:`, err);
        results.push({
          campaignName: campaign.name,
          todayConvRate: '-',
          yesterdayConvRate: '-',
          change: '-',
          adjustmentApplied: '-',
          action: 'ERROR',
          sbaName: '-',
          status: 'ERROR',
          duration: null,
          skipReason: err.message
        });
      }
    }
    
    return {
      country: account.country,
      accountId: account.id,
      results
    };
    
  } catch (error: any) {
    console.error(`Error processing account ${account.country}:`, error);
    return {
      country: account.country,
      accountId: account.id,
      results: [],
      error: error.message
    };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');
  const dryRun = searchParams.get('dryRun') !== 'false'; // Default to true
  
  // Auth check
  if (key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const accountResults: SBAAccountResult[] = [];
  let processed = 0;
  let applied = 0;
  let skipped = 0;
  let errors = 0;
  
  // Process all accounts in parallel
  const promises = ACCOUNTS.map(account => processAccount(account, dryRun));
  const results = await Promise.all(promises);
  
  for (const result of results) {
    accountResults.push(result);
    for (const item of result.results) {
      processed++;
      if (item.status === 'ERROR') errors++;
      else if (item.status.startsWith('SKIPPED')) skipped++;
      else applied++;
    }
  }
  
  const response: ApiResponse = {
    summary: {
      processed,
      applied,
      skipped,
      errors
    },
    details: accountResults
  };
  
  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { key, dryRun: dryRunParam, filters } = body;
  const dryRun = dryRunParam !== false; // Default true
  
  // Auth check
  if (key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const accountResults: SBAAccountResult[] = [];
  let processed = 0;
  let applied = 0;
  let skipped = 0;
  let errors = 0;
  
  // Process all accounts in parallel
  const promises = ACCOUNTS.map(account => processAccount(account, dryRun, filters));
  const results = await Promise.all(promises);
  
  for (const result of results) {
    accountResults.push(result);
    for (const item of result.results) {
      processed++;
      if (item.status === 'ERROR') errors++;
      else if (item.status.startsWith('SKIPPED')) skipped++;
      else applied++;
    }
  }
  
  const response: ApiResponse = {
    summary: {
      processed,
      applied,
      skipped,
      errors
    },
    details: accountResults
  };
  
  return NextResponse.json(response);
}

