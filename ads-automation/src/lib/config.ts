export interface Account {
  id: string;
  country: string;
  name: string;
}

export const ACCOUNTS: Account[] = [
  { id: '6863838107', country: 'DE', name: 'Germany' },
  { id: '1593605425', country: 'PL', name: 'Poland' },
  { id: '7052478378', country: 'FR', name: 'France' },
  { id: '4570652903', country: 'IT', name: 'Italy' },
  { id: '7585673823', country: 'NL', name: 'Netherlands' }
];

export const MCC_ID = process.env.GOOGLE_MCC_ID || '3963045378';
export const DEVELOPER_TOKEN = process.env.GOOGLE_DEVELOPER_TOKEN || '93VIU4ehzkRJ4tXBqdiHeg'; // Fallback to value from JSON, but env var preferred

// API Version
export const API_VERSION = 'v17'; // Or v16/v18 depending on stability. JSON used v20 which is very new/beta? v17 is stable. Let's use v17 or v18.
// Actually, JSON used v20: https://googleads.googleapis.com/v20/...
// Let's stick to v17 for stability unless v20 is required. PMax and DemandGen are supported in v17.
// Wait, DemandGen is newer. Let's use v18 or v19.
export const GOOGLE_ADS_API_VERSION = 'v20'; 

