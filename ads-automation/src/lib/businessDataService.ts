import { searchGoogleAds, mutateGoogleAds } from './googleAds';
import { COUNTRY_DATA, SalePhase, CountryData, CountryTexts } from './businessDataConfig';

export interface AccountUpdateResult {
  accountName: string;
  customerId: string;
  success: boolean;
  headlineUpdated: string;
  descriptionUpdated: string;
  headlineBefore?: string;
  descriptionBefore?: string;
  error?: string;
  dryRun?: boolean;
}

function getTextsForPhase(texts: CountryTexts, phase: SalePhase): { headline: string; desc: string } {
  switch (phase) {
    case SalePhase.START_SALE:
      return { headline: texts.saleTitle, desc: texts.saleDesc };
    case SalePhase.TWO_DAYS_BEFORE:
      return { headline: texts.saleTitle2Days, desc: texts.saleDesc2Days };
    case SalePhase.LAST_DAY:
      return { headline: texts.saleTitleLast, desc: texts.saleDescLast };
    case SalePhase.END_SALE:
      return { headline: texts.normalTitle, desc: texts.normalDesc };
    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
}

export async function processAccount(
  countryKey: string, 
  phase: SalePhase, 
  dryRun: boolean,
  headlineAttributeName: string = 'From Brand to SALE',
  descriptionAttributeName: string = 'From Brand to SALE Description'
): Promise<AccountUpdateResult> {
  const country = COUNTRY_DATA[countryKey];
  const { headline, desc } = getTextsForPhase(country.texts, phase);
  let headlineBefore = '';
  let descriptionBefore = '';

  try {
    // 1. Discover Ad Customizer Attributes (Modern)
    // Based on "Business data > Ad customizer attributes" screenshot.
    // We use `customizer_attribute` resource.
    
    const attributeQuery = `
      SELECT 
        customizer_attribute.id, 
        customizer_attribute.name 
      FROM customizer_attribute 
      WHERE customizer_attribute.status = 'ENABLED'
    `;

    let attributeRows;
    try {
      attributeRows = await searchGoogleAds(country.customerId, attributeQuery);
    } catch (e: any) {
       console.error(`Error searching customizer_attribute for ${countryKey}:`, e.response?.data || e.message);
       // If this fails, check specific error details. 
       throw new Error(`Failed to search for customizer attributes: ${JSON.stringify(e.response?.data?.error?.details || e.message)}`);
    }

    // Find the target attributes
    // Note: exact match based on provided names (or default)
    const headlineAttr = attributeRows.find((r: any) => r.customizerAttribute.name === headlineAttributeName);
    const descAttr = attributeRows.find((r: any) => r.customizerAttribute.name === descriptionAttributeName);

    if (!headlineAttr || !descAttr) {
       // If not found, list available to help debug
       const found = attributeRows.map((r:any) => r.customizerAttribute.name).join(', ');
       throw new Error(`Could not find required Ad Customizer Attributes. Looking for "${headlineAttributeName}", "${descriptionAttributeName}". Found: ${found}`);
    }
    
    
    // 2. Get Current Values (Customer Customizers)
    // Screenshot shows "Account value", which means `customer_customizer`.
    
    const customizerQuery = `
      SELECT 
        customer_customizer.resource_name, 
        customer_customizer.customizer_attribute, 
        customer_customizer.value.string_value
      FROM customer_customizer
      WHERE customer_customizer.status = 'ENABLED'
    `;
    
    const customizerRows = await searchGoogleAds(country.customerId, customizerQuery);
    
    // Match by resource name of the attribute
    const headlineCustomizer = customizerRows.find((r: any) => r.customerCustomizer.customizerAttribute === headlineAttr.customizerAttribute.resourceName);
    const descCustomizer = customizerRows.find((r: any) => r.customerCustomizer.customizerAttribute === descAttr.customizerAttribute.resourceName);
    
    // Capture "Before"
    headlineBefore = headlineCustomizer?.customerCustomizer?.value?.stringValue || '(not set)';
    descriptionBefore = descCustomizer?.customerCustomizer?.value?.stringValue || '(not set)';
    
    const operations = [];
    
    // Operation for Headline
    if (headlineCustomizer) {
      // Update existing
      operations.push({
        update: {
          resourceName: headlineCustomizer.customerCustomizer.resourceName,
          value: { stringValue: headline }
        },
        updateMask: 'value'
      });
    } else {
      // Create new (Account Value)
      operations.push({
        create: {
          customizerAttribute: headlineAttr.customizerAttribute.resourceName,
          value: { stringValue: headline }
        }
      });
    }

    // Operation for Description
    if (descCustomizer) {
      // Update existing
      operations.push({
        update: {
          resourceName: descCustomizer.customerCustomizer.resourceName,
          value: { stringValue: desc }
        },
        updateMask: 'value'
      });
    } else {
       // Create new
       operations.push({
        create: {
          customizerAttribute: descAttr.customizerAttribute.resourceName,
          value: { stringValue: desc }
        }
      });
    }

    if (!dryRun && operations.length > 0) {
      // Note: 'customerCustomizers' resource for mutate
      await mutateGoogleAds(country.customerId, 'customerCustomizers', operations);
    }

    return {
      accountName: country.accountName,
      customerId: country.customerId,
      success: true,
      headlineUpdated: headline,
      descriptionUpdated: desc,
      headlineBefore,
      descriptionBefore,
      dryRun
    };

  } catch (error: any) {
    console.error(`Error processing ${country.accountName}:`, error);
    
    const googleError = error.response?.data?.error?.details?.[0]?.errors?.[0]?.message 
      || error.response?.data?.error?.message
      || error.message;

    return {
      accountName: country.accountName,
      customerId: country.customerId,
      success: false,
      headlineUpdated: headline,
      descriptionUpdated: desc,
      headlineBefore,
      descriptionBefore,
      error: googleError || 'Unknown error',
      dryRun
    };
  }
}
