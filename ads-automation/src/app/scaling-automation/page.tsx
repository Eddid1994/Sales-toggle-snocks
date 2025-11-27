'use client';

import { useState } from 'react';

interface CampaignResult {
  campaignId: string;
  campaignName: string;
  currentBudget: number;
  todaySpend: number;
  todayRoas: number;
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

interface ApiResponse {
  message: string;
  config: {
    budgetThresholdPercent: number;
    budgetIncreasePercent: number;
    roasThreshold: number;
    dryRun: boolean;
  };
  summary: {
    totalAccounts: number;
    totalProcessed: number;
    totalIncreased: number;
  };
  details: AccountResult[];
  error?: string;
}

export default function ScalingAutomationPage() {
  const [apiKey, setApiKey] = useState('');
  const [threshold, setThreshold] = useState(80);
  const [increase, setIncrease] = useState(20);
  const [roasThreshold, setRoasThreshold] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ApiResponse | null>(null);
  const [finalResult, setFinalResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAutomation = async (dryRun: boolean) => {
    setLoading(true);
    setError(null);
    if (dryRun) {
        setPreviewData(null);
        setFinalResult(null);
    } else {
        setFinalResult(null);
    }

    try {
      const params = new URLSearchParams({
        dryRun: dryRun.toString(),
        threshold: threshold.toString(),
        increase: increase.toString(),
        roasThreshold: roasThreshold.toString(),
        key: apiKey
      });
      
      const res = await fetch(`/api/scaling-automation?${params.toString()}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to run automation');
      }
      
      if (dryRun) {
        setPreviewData(data);
      } else {
        setFinalResult(data);
        setPreviewData(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 bg-gray-50 font-sans">
      <div className="w-full max-w-5xl space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>🚀</span> Budget Scaling Automation
            </h1>
            <p className="text-gray-500 mt-1">
              Automatically increase budgets for high-performing campaigns hitting their spend cap.
            </p>
          </div>
          <a 
            href="/" 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition flex items-center gap-2 text-sm"
          >
            <span>🏠</span> Back to Home
          </a>
        </div>

        {/* Configuration Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-6">
            
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Authentication Key
              </label>
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition bg-gray-50"
                placeholder="Enter CRON_SECRET..."
              />
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Utilization Threshold (%)
                </label>
                <div className="relative">
                    <input 
                        type="number" 
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition bg-gray-50"
                    />
                    <span className="absolute right-4 top-3.5 text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Trigger increase if spend &ge; this % of daily budget</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Increase Amount (%)
                </label>
                <div className="relative">
                    <input 
                        type="number" 
                        value={increase}
                        onChange={(e) => setIncrease(Number(e.target.value))}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition bg-gray-50"
                    />
                    <span className="absolute right-4 top-3.5 text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Amount to add to the current daily budget</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min. ROAS Threshold
                </label>
                <div className="relative">
                    <input 
                        type="number" 
                        value={roasThreshold}
                        onChange={(e) => setRoasThreshold(Number(e.target.value))}
                        step="0.1"
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition bg-gray-50"
                    />
                    <span className="absolute right-4 top-3.5 text-gray-400">x</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Required ROAS (Conv. value / Cost)</p>
              </div>
            </div>

            {/* Primary Action */}
            {!previewData && !finalResult && (
              <button
                onClick={() => runAutomation(true)}
                disabled={loading || !apiKey}
                className="w-full bg-black text-white p-4 rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-lg"
              >
                {loading ? 'Analyzing Budgets...' : 'Preview Increases'}
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Preview Results */}
        {previewData && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-yellow-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Dry Run Preview</h2>
                <p className="text-sm text-gray-500">
                    Found {previewData.summary.totalIncreased} campaigns to increase across {previewData.summary.totalAccounts} accounts.
                </p>
              </div>
              <div className="flex gap-2">
                 <button
                  onClick={() => setPreviewData(null)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium text-sm transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => runAutomation(false)}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Applying...' : 'Apply Increases'}
                </button>
              </div>
            </div>

            <ResultList details={previewData.details} showSkipped={false} />
          </div>
        )}

        {/* Final Result */}
        {finalResult && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-8 text-center border-b border-green-50">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ✨
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Budgets Updated Successfully</h2>
              <p className="text-gray-600">
                Increased budgets for {finalResult.summary.totalIncreased} campaigns.
              </p>
              <button
                onClick={() => setFinalResult(null)}
                className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Start New Run
              </button>
            </div>
             <ResultList details={finalResult.details} showSkipped={false} />
          </div>
        )}

      </div>
    </main>
  );
}

function ResultList({ details, showSkipped }: { details: AccountResult[], showSkipped: boolean }) {
    const hasChanges = details.some(d => d.increasedCampaigns > 0);

    if (!hasChanges && !showSkipped) {
        return (
            <div className="p-8 text-center text-gray-500">
                No campaigns met the criteria for budget increase.
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100">
            {details.map((account) => (
                (showSkipped || account.increasedCampaigns > 0) && (
                    <div key={account.country} className="p-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                                {account.country}
                            </span>
                            {account.country} Account 
                            <span className="text-gray-400 font-normal normal-case ml-1">
                                ({account.increasedCampaigns} updates)
                            </span>
                        </h3>
                        <div className="space-y-3">
                            {account.details
                                .filter(c => showSkipped || c.action === 'INCREASED')
                                .map((campaign) => (
                                <div key={campaign.campaignId} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900">{campaign.campaignName}</span>
                                            {campaign.action === 'INCREASED' && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                                    Increasing
                                                </span>
                                            )}
                                        </div>
                                    <div className="text-xs text-gray-500 flex gap-3">
                                        <span>Spend: <span className="font-mono text-gray-700">€{campaign.todaySpend.toFixed(2)}</span></span>
                                        <span>ROAS: <span className={`font-mono ${campaign.todayRoas >= 0 ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>{campaign.todayRoas.toFixed(2)}</span></span>
                                        <span>Utilization: <span className={`font-mono ${campaign.utilizationPercent >= 80 ? 'text-red-600 font-bold' : 'text-gray-700'}`}>{campaign.utilizationPercent.toFixed(1)}%</span></span>
                                    </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-mono text-gray-500 line-through">€{campaign.currentBudget.toFixed(2)}</span>
                                            <span className="text-gray-400">→</span>
                                            <span className="font-mono font-bold text-green-600">€{campaign.newBudget.toFixed(2)}</span>
                                        </div>
                                        <div className="text-xs text-green-600 font-medium mt-1">
                                            +€{campaign.increaseAmount.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
}




