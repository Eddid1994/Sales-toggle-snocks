import { NextResponse } from 'next/server';
import { processAccount } from '@/lib/businessDataService';
import { COUNTRY_DATA, SalePhase } from '@/lib/businessDataConfig';

export const dynamic = 'force-dynamic'; // Ensure it's not cached

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phase = searchParams.get('phase') as SalePhase;
  const dryRun = searchParams.get('dryRun') === 'true';
  const authKey = searchParams.get('key');
  
  // Mappings: JSON string of { [countryKey]: { headline: string, desc: string } }
  const mappingsJson = searchParams.get('mappings');
  let mappings: Record<string, { headline: string, desc: string }> = {};
  
  try {
    if (mappingsJson) {
      mappings = JSON.parse(mappingsJson);
    }
  } catch (e) {
    console.warn('Failed to parse mappings JSON', e);
  }

  // Basic security check
  if (process.env.CRON_SECRET && authKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!phase || !Object.values(SalePhase).includes(phase)) {
    return NextResponse.json({ 
      error: 'Invalid or missing phase', 
      validPhases: Object.values(SalePhase) 
    }, { status: 400 });
  }

  const results = [];
  const errors = [];

  // Process all countries
  const countryKeys = Object.keys(COUNTRY_DATA);

  // We run them in parallel
  await Promise.all(countryKeys.map(async (key) => {
    // Get attributes for this country from mapping, or fallback to defaults
    const countryMapping = mappings[key] || {};
    const headlineAttr = countryMapping.headline || 'From Brand to SALE';
    const descAttr = countryMapping.desc || 'From Brand to SALE Description';

    const result = await processAccount(key, phase, dryRun, headlineAttr, descAttr);
    results.push(result);
    if (!result.success) {
      errors.push(result);
    }
  }));

  return NextResponse.json({
    message: `Processed ${results.length} accounts`,
    phase,
    dryRun,
    successCount: results.length - errors.length,
    errorCount: errors.length,
    results
  });
}
