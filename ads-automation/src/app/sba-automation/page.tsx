'use client';

import { useState } from 'react';
import { SBA_CONFIG, SBAFilter } from '@/lib/sbaConfig';

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

export default function SBAAutomationPage() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ApiResponse | null>(null);
  const [finalResult, setFinalResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SBAFilter[]>(SBA_CONFIG.filters);

  const handleFilterChange = (index: number, checked: boolean) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], enabled: checked };
    setFilters(newFilters);
  };

  const handlePreview = async () => {
    setLoading(true);
    setPreviewData(null);
    setFinalResult(null);
    setError(null);

    try {
      const res = await fetch('/api/sba-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun: true,
          key: apiKey,
          filters: filters
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch preview');
      }
      
      setPreviewData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    setFinalResult(null);
    setError(null);

    try {
      const res = await fetch('/api/sba-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun: false,
          key: apiKey,
          filters: filters
        })
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute automation');
      }

      setFinalResult(data);
      setPreviewData(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 bg-gray-50 font-sans">
      <div className="w-full max-w-6xl space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>🍰</span> Seasonal Bid Adjustments (SBA)
            </h1>
            <p className="text-gray-500 mt-1">
              Momentum Bidding: Boost bids when Today's Conversion Rate (by time) beats Yesterday's by &gt;5%.
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

            {/* Campaign Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Target Campaigns
              </label>
              <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-60 overflow-y-auto">
                {filters.map((filter, idx) => (
                  <label key={idx} className="flex items-start gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition">
                    <input
                      type="checkbox"
                      checked={filter.enabled}
                      onChange={(e) => handleFilterChange(idx, e.target.checked)}
                      className="mt-1 w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <div className="text-sm">
                      <span className="font-medium text-gray-900 block">{filter.name}</span>
                      <span className="text-gray-500 text-xs break-all">{filter.contains}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Primary Action */}
            {!previewData && !finalResult && (
              <button
                onClick={handlePreview}
                disabled={loading}
                className="w-full bg-black text-white p-4 rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-lg"
              >
                {loading ? 'Analyzing Performance...' : 'Preview SBA Adjustments'}
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
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Preview Mode</h2>
                  <p className="text-sm text-gray-500">Review proposed adjustments.</p>
                </div>
                <div className="flex gap-2 text-sm">
                   <span className="px-3 py-1 bg-white rounded-full border border-gray-200 text-gray-600">
                     Processed: <b>{previewData.summary.processed}</b>
                   </span>
                   <span className="px-3 py-1 bg-green-100 rounded-full border border-green-200 text-green-700">
                     To Apply: <b>{previewData.summary.applied}</b>
                   </span>
                   <span className="px-3 py-1 bg-gray-100 rounded-full border border-gray-200 text-gray-500">
                     Skipped: <b>{previewData.summary.skipped}</b>
                   </span>
                </div>
              </div>
              <div className="flex gap-2">
                 <button
                  onClick={() => setPreviewData(null)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium text-sm transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecute}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Executing...' : 'Confirm & Apply'}
                </button>
              </div>
            </div>

            {previewData.summary.applied === 0 && previewData.summary.processed > 0 && (
               <div className="p-8 text-center text-gray-500">
                 No positive trends detected > 5%. No adjustments needed.
               </div>
            )}

            <div className="divide-y divide-gray-100">
              {previewData.details.map((account) => (
                account.results.length > 0 && (
                  <div key={account.country} className="p-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                        {account.country}
                      </span>
                      {account.country} Account
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 rounded-l-lg">Campaign</th>
                            <th className="px-4 py-3">Yesterday CR (Time)</th>
                            <th className="px-4 py-3">Today CR (Time)</th>
                            <th className="px-4 py-3">Change</th>
                            <th className="px-4 py-3">Action</th>
                            <th className="px-4 py-3 rounded-r-lg">Reason/Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {account.results.map((row, idx) => (
                            <tr key={idx} className={row.status.startsWith('SKIPPED') ? 'opacity-50' : ''}>
                              <td className="px-4 py-3 font-medium text-gray-900">{row.campaignName}</td>
                              <td className="px-4 py-3 text-gray-500">{row.yesterdayConvRate}%</td>
                              <td className="px-4 py-3 text-gray-900 font-semibold">{row.todayConvRate}%</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-md font-mono ${
                                  parseFloat(row.change) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
                                }`}>
                                  {parseFloat(row.change) > 0 ? '+' : ''}{row.change}%
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {row.action.includes('UPDATE') || row.action.includes('CREATE') ? (
                                   <span className="text-green-600 font-bold">
                                     SBA +{row.adjustmentApplied}%
                                   </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500">
                                {row.status.startsWith('SKIPPED') ? row.skipReason : row.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Final Result */}
        {finalResult && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ✨
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">SBA Automation Executed</h2>
              <p className="text-gray-600">
                Applied {finalResult.summary.applied} bid adjustments across {finalResult.details.length} accounts.
              </p>
              <button
                onClick={() => setFinalResult(null)}
                className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

