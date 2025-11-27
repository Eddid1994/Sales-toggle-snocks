'use client';

import { useState } from 'react';
import { SalePhase } from '@/lib/businessDataConfig';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertCircle, Key, ArrowRight, Search, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Safely defined list of countries to avoid importing secrets
const COUNTRIES = [
  { key: 'SNOCKS_DE_AT', name: 'Germany / Austria' },
  { key: 'SNOCKS_CH', name: 'Switzerland' },
  { key: 'SNOCKS_NL', name: 'Netherlands' },
  { key: 'SNOCKS_FR', name: 'France' },
  { key: 'SNOCKS_IT', name: 'Italy' },
  { key: 'SNOCKS_PL', name: 'Poland' },
  { key: 'OCEANS_APART_DE_AT', name: 'Oceans Apart (DE/AT)' },
];

interface Attribute {
  id: string;
  name: string;
}

interface CountryMapping {
  headline: string;
  desc: string;
  availableAttributes: Attribute[];
  loading: boolean;
  error?: string;
}

export default function BusinessDataPage() {
  const [phase, setPhase] = useState<SalePhase>(SalePhase.START_SALE);
  const [authKey, setAuthKey] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Mappings state
  const [mappings, setMappings] = useState<Record<string, CountryMapping>>({});
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set(COUNTRIES.map(c => c.key)));
  
  const [previewData, setPreviewData] = useState<any>(null);
  const [finalResult, setFinalResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  const fetchAttributesForCountry = async (countryKey: string) => {
    if (!authKey) return;
    
    setMappings(prev => ({
      ...prev,
      [countryKey]: {
        headline: 'From Brand to SALE', 
        desc: 'From Brand to SALE Description',
        availableAttributes: [],
        ...prev[countryKey],
        loading: true,
        error: undefined
      }
    }));

    try {
      const res = await fetch(`/api/business-data/attributes?key=${authKey}&countryKey=${countryKey}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed');

      setMappings(prev => {
        const current = prev[countryKey] || {};
        // Check if defaults exist in fetched attributes
        const hasHeadline = data.attributes.some((a: Attribute) => a.name === current.headline);
        const hasDesc = data.attributes.some((a: Attribute) => a.name === current.desc);

        return {
          ...prev,
          [countryKey]: {
            loading: false,
            availableAttributes: data.attributes,
            headline: hasHeadline ? current.headline : 'From Brand to SALE', // Keep default or what was set
            desc: hasDesc ? current.desc : 'From Brand to SALE Description',
            error: undefined
          }
        };
      });
    } catch (err: any) {
      setMappings(prev => ({
        ...prev,
        [countryKey]: {
          ...prev[countryKey],
          loading: false,
          availableAttributes: [],
          headline: 'From Brand to SALE',
          desc: 'From Brand to SALE Description',
          error: err.message
        }
      }));
    }
  };

  const scanAll = async () => {
    if (!authKey) {
      setError("Please enter an API Key first.");
      return;
    }
    setError(null);
    await Promise.all(COUNTRIES.map(c => fetchAttributesForCountry(c.key)));
  };

  const updateMapping = (countryKey: string, field: 'headline' | 'desc', value: string) => {
    setMappings(prev => ({
      ...prev,
      [countryKey]: {
        ...prev[countryKey],
        [field]: value
      }
    }));
  };

  const toggleCountrySelection = (key: string) => {
    const newSet = new Set(selectedCountries);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedCountries(newSet);
  };

  const getPayloadMappings = () => {
    const payload: Record<string, { headline: string, desc: string }> = {};
    Object.entries(mappings).forEach(([key, data]) => {
      payload[key] = { headline: data.headline, desc: data.desc };
    });
    return JSON.stringify(payload);
  };

  const handlePreview = async () => {
    if (selectedCountries.size === 0) {
      setError("Please select at least one account to preview.");
      return;
    }
    setLoading(true);
    setError(null);
    setPreviewData(null);
    setFinalResult(null);

    try {
      const params = new URLSearchParams({
        phase,
        dryRun: 'true',
        key: authKey,
        mappings: getPayloadMappings(),
        countries: Array.from(selectedCountries).join(',')
      });
      const res = await fetch(`/api/business-data?${params.toString()}`);
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
    if (selectedCountries.size === 0) {
      setError("Please select at least one account to update.");
      return;
    }
    setLoading(true);
    setError(null);
    setFinalResult(null);

    try {
      const params = new URLSearchParams({
        phase,
        dryRun: 'false',
        key: authKey,
        mappings: getPayloadMappings(),
        countries: Array.from(selectedCountries).join(',')
      });
      const res = await fetch(`/api/business-data?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute update');
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
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>📝</span> Business Data Automation
            </h1>
            <p className="text-gray-500 mt-1">
              Update text assets across all markets for specific sale phases.
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
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    type="password" 
                    value={authKey}
                    onChange={(e) => setAuthKey(e.target.value)}
                    className="w-full pl-10 p-3 h-12 rounded-xl border border-gray-200 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 focus-visible:border-transparent transition bg-gray-50"
                    placeholder="Enter CRON_SECRET..."
                  />
                </div>
                <Button 
                  onClick={scanAll}
                  disabled={loading || !authKey}
                  variant="outline"
                  className="h-12 px-4"
                >
                   <Search className="h-4 w-4 mr-2" />
                   Scan Accounts
                </Button>
              </div>
            </div>

            {/* Country Mappings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Attribute Mapping per Account</Label>
                <span className="text-xs text-gray-500">Configure attributes for each country if they differ</span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {COUNTRIES.map((country) => {
                  const data = mappings[country.key] || { 
                    headline: 'From Brand to SALE', 
                    desc: 'From Brand to SALE Description', 
                    availableAttributes: [], 
                    loading: false 
                  };
                  const isExpanded = expandedCountry === country.key;
                  const isSelected = selectedCountries.has(country.key);

                  return (
                    <div key={country.key} className={`border rounded-xl transition-all ${isExpanded ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200 hover:border-gray-300'} ${!isSelected ? 'opacity-60' : ''}`}>
                      <div className="p-4 flex items-center gap-4">
                        <Switch 
                          checked={isSelected}
                          onCheckedChange={() => toggleCountrySelection(country.key)}
                        />
                        
                        <div 
                          className="flex-1 flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedCountry(isExpanded ? null : country.key)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                              {country.key.split('_')[1]}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{country.name}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                {data.loading ? (
                                  <span className="flex items-center gap-1 text-blue-600"><Loader2 className="h-3 w-3 animate-spin" /> Scanning...</span>
                                ) : data.error ? (
                                  <span className="text-red-500">Error scanning attributes</span>
                                ) : data.availableAttributes.length > 0 ? (
                                  <span className="text-green-600">{data.availableAttributes.length} attributes found</span>
                                ) : (
                                  <span>Default attributes (Scan to fetch)</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-gray-400">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>
                      </div>

                      {isExpanded && isSelected && (
                        <div className="px-4 pb-4 pt-0 space-y-4 animate-in slide-in-from-top-2 pl-16">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-500">Headline Attribute</Label>
                              <Select 
                                value={data.headline} 
                                onValueChange={(v) => updateMapping(country.key, 'headline', v)}
                                disabled={data.loading}
                              >
                                <SelectTrigger className="bg-white h-9 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {data.availableAttributes?.length > 0 ? (
                                    data.availableAttributes.map(a => (
                                      <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value={data.headline}>{data.headline}</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-500">Description Attribute</Label>
                               <Select 
                                value={data.desc} 
                                onValueChange={(v) => updateMapping(country.key, 'desc', v)}
                                disabled={data.loading}
                              >
                                <SelectTrigger className="bg-white h-9 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {data.availableAttributes?.length > 0 ? (
                                    data.availableAttributes.map(a => (
                                      <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value={data.desc}>{data.desc}</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {data.error && (
                            <p className="text-xs text-red-500">{data.error}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phase Selection */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <Label htmlFor="phase">Select Sale Phase</Label>
              <Select value={phase} onValueChange={(v) => { setPhase(v as SalePhase); setPreviewData(null); setFinalResult(null); }}>
                <SelectTrigger id="phase" className="w-full p-4 h-auto text-lg">
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SalePhase.START_SALE} className="py-3">
                    <span className="font-semibold block">Start Sale</span>
                    <span className="text-xs text-gray-500">"Bis zu 50% reduziert"</span>
                  </SelectItem>
                  <SelectItem value={SalePhase.TWO_DAYS_BEFORE} className="py-3">
                    <span className="font-semibold block">Two Days Before End</span>
                    <span className="text-xs text-gray-500">"Nur noch 2 Tage"</span>
                  </SelectItem>
                  <SelectItem value={SalePhase.LAST_DAY} className="py-3">
                    <span className="font-semibold block">Last Day</span>
                    <span className="text-xs text-gray-500">"Nur noch heute"</span>
                  </SelectItem>
                  <SelectItem value={SalePhase.END_SALE} className="py-3">
                    <span className="font-semibold block">End Sale (Revert)</span>
                    <span className="text-xs text-gray-500">Return to standard texts</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Primary Action */}
            {!previewData && !finalResult && (
              <Button
                onClick={handlePreview}
                disabled={loading || !authKey}
                className="w-full h-14 text-lg font-semibold shadow-sm"
              >
                {loading && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
                {loading ? 'Generating Preview...' : 'Preview Updates'}
              </Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Preview Results */}
        {previewData && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Previewing: {phase.replace('_', ' ')}</h2>
                <p className="text-sm text-gray-500">Review the texts that will be applied to each country.</p>
              </div>
              <div className="flex gap-2">
                 <Button
                  variant="ghost"
                  onClick={() => setPreviewData(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExecute}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  {loading ? 'Updating...' : 'Confirm & Update All'}
                </Button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {previewData.results.map((res: any, i: number) => (
                <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between w-full mb-2">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-gray-200 text-xs flex items-center justify-center text-gray-600">
                            {res.accountName.split('_')[1]}
                          </span>
                          {res.accountName}
                        </h3>
                        {res.success ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Ready</Badge>
                        ) : (
                          <Badge variant="destructive">Error</Badge>
                        )}
                      </div>
                      
                      {res.success ? (
                        <div className="grid grid-cols-1 gap-2 pl-8 text-sm">
                          {/* Headline Comparison */}
                          <div className="grid grid-cols-[80px_1fr_20px_1fr] items-center gap-2">
                            <span className="text-gray-500">Headline:</span>
                            <span className="text-gray-500 truncate line-through decoration-gray-400" title={res.headlineBefore}>
                              {res.headlineBefore || '(unknown)'}
                            </span>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <span className="font-medium text-gray-900 bg-green-50 px-2 py-0.5 rounded border border-green-100 truncate" title={res.headlineUpdated}>
                              {res.headlineUpdated}
                            </span>
                          </div>
                          
                          {/* Description Comparison */}
                          <div className="grid grid-cols-[80px_1fr_20px_1fr] items-center gap-2">
                            <span className="text-gray-500">Description:</span>
                            <span className="text-gray-500 truncate line-through decoration-gray-400" title={res.descriptionBefore}>
                              {res.descriptionBefore || '(unknown)'}
                            </span>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <span className="font-medium text-gray-900 bg-green-50 px-2 py-0.5 rounded border border-green-100 truncate" title={res.descriptionUpdated}>
                              {res.descriptionUpdated}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-red-500 pl-8">Error: {res.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Success State */}
        {finalResult && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ✅
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Update Complete</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Successfully updated Business Data feeds for {finalResult.successCount} accounts.
                {finalResult.errorCount > 0 && ` (${finalResult.errorCount} failures)`}
              </p>
              <Button
                onClick={() => setFinalResult(null)}
                variant="outline"
                className="mt-6"
              >
                Done
              </Button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
