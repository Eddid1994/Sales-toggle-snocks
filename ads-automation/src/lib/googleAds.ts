import axios from 'axios';
import qs from 'qs';
import { MCC_ID, DEVELOPER_TOKEN, GOOGLE_ADS_API_VERSION } from './config';

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

export async function getAccessToken(): Promise<string> {
  // Check if cached token is valid (with 1 min buffer)
  if (cachedAccessToken && Date.now() < tokenExpiry - 60000) {
    return cachedAccessToken;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google OAuth credentials in environment variables');
  }

  try {
    const response = await axios.post<TokenResponse>(
      'https://oauth2.googleapis.com/token',
      qs.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    cachedAccessToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000;
    return cachedAccessToken;
  } catch (error: any) {
    console.error('Error fetching access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Google');
  }
}

export async function searchGoogleAds(customerId: string, query: string) {
  const accessToken = await getAccessToken();
  const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:search`;

  try {
    const response = await axios.post(
      url,
      { query },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': DEVELOPER_TOKEN,
          'login-customer-id': MCC_ID,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.results || [];
  } catch (error: any) {
    console.error(`Error querying Google Ads for customer ${customerId}:`, error.response?.data || error.message);
    throw error;
  }
}

export async function mutateGoogleAds(customerId: string, resource: 'assetGroups' | 'campaigns', operations: any[]) {
  if (operations.length === 0) return;

  const accessToken = await getAccessToken();
  const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/${resource}:mutate`;

  try {
    const response = await axios.post(
      url,
      { operations },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': DEVELOPER_TOKEN,
          'login-customer-id': MCC_ID,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error mutating ${resource} for customer ${customerId}:`, error.response?.data || error.message);
    throw error;
  }
}

