'use client';

import { useState } from 'react';

interface Change {
  type: 'PMax' | 'Demand Gen';
  name: string;
  from: string;
  to: string;
  campaignName?: string;
}

interface AccountResult {
  country: string;
  pmaxChanges: number;
  demandGenChanges: number;
  proposedChanges: Change[];
  errors?: string[];
}

interface ApiResponse {
  message: string;
  mode: string;
  dryRun: boolean;
  totalChanges: number;
  details: AccountResult[];
  error?: string;
  details_error?: string;
}

export default function Home() {
  const [mode, setMode] = useState<'start' | 'end'>('start');
  const [apiKey, setApiKey] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ApiResponse | null>(null);
  const [finalResult, setFinalResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    setLoading(true);
    setPreviewData(null);
    setFinalResult(null);
    setError(null);

    try {
      const params = new URLSearchParams({
        mode,
        dryRun: 'true',
        key: apiKey
      });
      
      const res = await fetch(`/api/toggle-sale?${params.toString()}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch preview');
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
      const params = new URLSearchParams({
        mode,
        dryRun: 'false',
        key: apiKey
      });
      
      const res = await fetch(`/api/toggle-sale?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to execute automation');
      }

      setFinalResult(data);
      setPreviewData(null); // Clear preview after execution
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 bg-gray-50 font-sans">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🍰</span> Google Ads Sale Automation
          </h1>
          <p className="text-gray-500 mt-1">
            Toggle "Sale" campaigns and asset groups across all markets.
          </p>
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

            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setMode('start'); setPreviewData(null); setFinalResult(null); }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  mode === 'start' 
                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900 text-lg">Start Sale 🔥</div>
                <div className="text-sm text-gray-500 mt-1">Enable "Sale" items, pause regular ones.</div>
              </button>

              <button
                onClick={() => { setMode('end'); setPreviewData(null); setFinalResult(null); }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  mode === 'end' 
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900 text-lg">End Sale ✅</div>
                <div className="text-sm text-gray-500 mt-1">Pause "Sale" items, enable regular ones.</div>
              </button>
            </div>

            {/* Primary Action */}
            {!previewData && !finalResult && (
              <button
                onClick={handlePreview}
                disabled={loading}
                className="w-full bg-black text-white p-4 rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-lg"
              >
                {loading ? 'Analyzing Accounts...' : 'Preview Changes'}
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
                <h2 className="text-lg font-bold text-gray-900">Preview Mode</h2>
                <p className="text-sm text-gray-500">Review proposed changes before executing.</p>
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
                  {loading ? 'Executing...' : 'Confirm & Run'}
                </button>
              </div>
            </div>

            {previewData.totalChanges === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No changes needed. All accounts are already in the desired state.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {previewData.details.map((account) => (
                  account.proposedChanges.length > 0 && (
                    <div key={account.country} className="p-6">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                          {account.country}
                        </span>
                        {account.country} Account
                      </h3>
                      <div className="space-y-3">
                        {account.proposedChanges.map((change, idx) => (
                          <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  change.type === 'PMax' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {change.type}
                                </span>
                                <span className="font-medium text-gray-900">{change.name}</span>
                              </div>
                              {change.campaignName && (
                                <div className="text-xs text-gray-500 pl-1">
                                  in campaign: {change.campaignName}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span className={`font-mono ${getStatusColor(change.from)}`}>{change.from}</span>
                              <span className="text-gray-400">→</span>
                              <span className={`font-mono font-bold ${getStatusColor(change.to)}`}>{change.to}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {/* Final Result */}
        {finalResult && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ✨
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Automation Executed Successfully</h2>
              <p className="text-gray-600">
                Processed {finalResult.details.length} accounts with {finalResult.totalChanges} total changes.
              </p>
              <button
                onClick={() => setFinalResult(null)}
                className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Start New Run
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

function getStatusColor(status: string) {
  if (status === 'ENABLED') return 'text-green-600';
  if (status === 'PAUSED') return 'text-gray-500';
  return 'text-gray-900';
}
