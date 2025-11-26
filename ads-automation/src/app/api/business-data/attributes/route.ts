import { NextResponse } from 'next/server';
import { searchGoogleAds } from '@/lib/googleAds';
import { COUNTRY_DATA } from '@/lib/businessDataConfig';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authKey = searchParams.get('key');
  const countryKey = searchParams.get('countryKey');

  // Basic security check
  if (process.env.CRON_SECRET && authKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let targetAccount;
    
    if (countryKey && COUNTRY_DATA[countryKey]) {
      targetAccount = COUNTRY_DATA[countryKey];
    } else {
      // Fallback or error? Let's default to DE_AT if specifically requested, 
      // but if we want per-country we really need the key.
      // If no key provided, we might return a list of available keys?
      // For now, let's require a key or error if invalid.
      return NextResponse.json({ 
        error: 'Missing or invalid countryKey parameter' 
      }, { status: 400 });
    }

    const attributeQuery = `
      SELECT 
        customizer_attribute.id, 
        customizer_attribute.name 
      FROM customizer_attribute 
      WHERE customizer_attribute.status = 'ENABLED'
    `;

    const rows = await searchGoogleAds(targetAccount.customerId, attributeQuery);
    
    const attributes = rows.map((row: any) => ({
      id: row.customizerAttribute.id,
      name: row.customizerAttribute.name
    }));

    return NextResponse.json({ 
      countryKey,
      attributes 
    });
  } catch (error: any) {
    console.error(`Error fetching attributes for ${countryKey}:`, error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch attributes' 
    }, { status: 500 });
  }
}
