'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import QueryInput from '@/components/QueryInput';
import DepthChart from '@/components/DepthChart';
import FloatTable from '@/components/FloatTable';
import { Waves, Sparkles, Database, ExternalLink, Globe } from 'lucide-react';

// Dynamically import Globe3D to ensure SSR safety with Three.js / Canvas
const Globe3D = dynamic(() => import('@/components/Globe3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[460px] bg-ocean-950/80 rounded-2xl border border-ocean-700/60 flex items-center justify-center text-cyan-400">
      <div className="flex items-center space-x-3">
        <span className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
        <span className="text-sm font-medium">Initializing 3D Ocean Globe Canvas...</span>
      </div>
    </div>
  )
});

interface FloatPoint {
  float_id: string;
  lat: number;
  lon: number;
  depth: number;
  temp: number;
  salinity: number;
  value: number;
  variable: string;
  timestamp: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function FloatChatDashboard() {
  const [points, setPoints] = useState<FloatPoint[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [parsedFilters, setParsedFilters] = useState<any>(null);
  const [selectedFloatId, setSelectedFloatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuery = async (queryText: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });
      
      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }

      const data = await res.json();
      setPoints(data.points || []);
      setSummary(data.summary || 'Query executed successfully.');
      setParsedFilters(data.parsed_filters || null);

      if (data.points && data.points.length > 0) {
        setSelectedFloatId(data.points[0].float_id);
      }
    } catch (err: any) {
      console.error('Query failed:', err);
      setError(`Failed to connect to FloatChat backend: ${err.message}. Ensure uvicorn main:app is running at ${BACKEND_URL}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load query
  useEffect(() => {
    fetchQuery("show temperature readings near Chennai coast below 200m in 2023");
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-ocean-950 via-ocean-900 to-ocean-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-ocean-700/60">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-400">
                  FloatChat
                </h1>
                <p className="text-xs md:text-sm text-ocean-400">
                  Natural-Language Query & 3D Analytics Interface for ARGO Ocean Float Data
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-ocean-800 border border-ocean-700 text-gray-300 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>INCOIS ARGO NetCDF Engine</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Indian Ocean Sector</span>
            </div>
          </div>
        </header>

        {/* Natural Language Query Bar */}
        <QueryInput
          onSearch={fetchQuery}
          isLoading={isLoading}
          summary={summary}
          parsedFilters={parsedFilters}
        />

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Main 3D & 2D Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 3D Globe (7 cols) */}
          <div className="lg:col-span-7">
            <Globe3D
              points={points}
              selectedFloatId={selectedFloatId}
              onSelectFloat={(id) => setSelectedFloatId(id)}
              targetLocation={
                parsedFilters && parsedFilters.target_lat && parsedFilters.target_lon
                  ? {
                      name: parsedFilters.location || 'Target Region',
                      lat: parsedFilters.target_lat,
                      lon: parsedFilters.target_lon,
                    }
                  : null
              }
            />
          </div>

          {/* Right Column: 2D Thermocline Profile Chart (5 cols) */}
          <div className="lg:col-span-5">
            <DepthChart
              points={points}
              selectedFloatId={selectedFloatId}
              variable={parsedFilters?.variable || 'temperature'}
            />
          </div>
        </div>

        {/* Bottom Data Table & Float Profiles */}
        <FloatTable
          points={points}
          selectedFloatId={selectedFloatId}
          onSelectFloat={(id) => setSelectedFloatId(id)}
        />

        {/* Footer */}
        <footer className="pt-6 border-t border-ocean-700/50 flex flex-col md:flex-row items-center justify-between text-xs text-ocean-400 gap-2">
          <p>© 2026 FloatChat Prototype — ARGO Ocean Floating Data Natural Language Interface</p>
          <div className="flex items-center space-x-4">
            <span>FastAPI + xarray / NetCDF4</span>
            <span>•</span>
            <span>Next.js + React Three Fiber</span>
          </div>
        </footer>

      </div>
    </main>
  );
}
