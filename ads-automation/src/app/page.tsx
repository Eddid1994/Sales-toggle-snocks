'use client';

import { useState } from 'react';

export default function Home() {
  const [mode, setMode] = useState<'start' | 'end'>('start');
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');

  const runAutomation = async () => {
    setLoading(true);
    setResult(null);
    try {
      const params = new URLSearchParams({
        mode,
        dryRun: dryRun.toString(),
        key: apiKey
      });
      
      const res = await fetch(`/api/toggle-sale?${params.toString()}`);
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to run automation' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-100">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-white p-8 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">🍰 Google Ads Automation</h1>
          <p className="text-gray-500 mt-2">Toggle "Sale" campaigns and asset groups automatically.</p>
        </div>

        {/* Controls */}
        <div className="p-8 space-y-6">
          
          {/* API Key Input (Optional/Mock) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CRON Secret (Optional if local)
            </label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Enter CRON_SECRET if configured..."
            />
          </div>

          {/* Mode Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('start')}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                mode === 'start' 
                  ? 'border-green-500 bg-green-50 text-green-700 font-semibold shadow-sm' 
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">🔥</div>
              Start Sale
              <div className="text-xs mt-1 font-normal opacity-75">Enable Sale, Pause Standard</div>
            </button>

            <button
              onClick={() => setMode('end')}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                mode === 'end' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-sm' 
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">✅</div>
              End Sale
              <div className="text-xs mt-1 font-normal opacity-75">Pause Sale, Enable Standard</div>
            </button>
          </div>

          {/* Dry Run Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">Dry Run Mode</span>
              <span className="text-sm text-gray-500">Simulate changes without applying them</span>
            </div>
            <button 
              onClick={() => setDryRun(!dryRun)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                dryRun ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${
                  dryRun ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Action Button */}
          <button
            onClick={runAutomation}
            disabled={loading}
            className="w-full bg-black text-white p-4 rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Processing...' : 'Run Automation'}
          </button>

        </div>

        {/* Results Console */}
        {result && (
          <div className="bg-gray-900 text-gray-100 p-6 overflow-x-auto border-t border-gray-800">
            <h3 className="text-sm font-mono text-gray-400 mb-2 uppercase tracking-wider">Execution Result</h3>
            <pre className="font-mono text-sm whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
      </div>
    </main>
  );
}

