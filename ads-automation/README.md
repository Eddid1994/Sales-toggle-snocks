# Google Ads Sale Toggle Automation

This project automates the toggling of "Sale" campaigns and asset groups in Google Ads for multiple countries (DE, PL, FR, IT, NL). It supports PMax Asset Groups and Demand Gen Campaigns.

## Features

- **PMax & Demand Gen**: Scans both types.
- **Naming Convention**: Toggles items containing "sale" (case-insensitive) in their name.
- **Modes**:
  - `mode=start` (Saturday): Enables Sale items, Pauses Non-Sale items.
  - `mode=end` (Monday): Pauses Sale items, Enables Non-Sale items.
- **Dry Run**: Defaults to dry run to prevent accidental changes.
- **Multi-Country**: Iterates through configured accounts.

## Setup

1. **Deploy to Vercel**:
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-repo%2Fads-automation)

2. **Environment Variables**:
   Set these in Vercel Project Settings:

   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REFRESH_TOKEN=your_refresh_token
   GOOGLE_DEVELOPER_TOKEN=your_developer_token
   GOOGLE_MCC_ID=3963045378
   CRON_SECRET=your_random_secret_key
   ```

   > **Note**: You need a Google Ads Developer Token and OAuth credentials (Client ID/Secret) with a Refresh Token authorized for the MCC.

3. **Cron Jobs (Vercel Cron)**:
   Add a `vercel.json` to your root (included):

   ```json
   {
     "crons": [
       {
         "path": "/api/toggle-sale?mode=start&key=${CRON_SECRET}&dryRun=false",
         "schedule": "0 23 * * 6"
       },
       {
         "path": "/api/toggle-sale?mode=end&key=${CRON_SECRET}&dryRun=false",
         "schedule": "0 23 * * 1"
       }
     ]
   }
   ```

## Local Development

1. `npm install`
2. Create `.env.local` with the variables above.
3. `npm run dev`
4. Visit: `http://localhost:3000/api/toggle-sale?mode=start&dryRun=true`

## Project Structure

- `src/app/api/toggle-sale/route.ts`: Main logic handler.
- `src/lib/googleAds.ts`: Google Ads API helpers.
- `src/lib/config.ts`: Account list and configuration.

