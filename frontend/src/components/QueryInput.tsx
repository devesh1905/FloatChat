'use client';

import React, { useState } from 'react';
import { Search, Sparkles, SlidersHorizontal, Waves, RefreshCw } from 'lucide-react';

interface QueryInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  summary: string | null;
  parsedFilters: any;
}

const SAMPLE_QUERIES = [
  "show temperature readings near Chennai coast below 200m in 2023",
  "show salinity in Arabian sea near Goa in 2023",
  "show deep ocean temperature below 500m in Bay of Bengal",
  "show surface water profiles near Equatorial Indian Ocean"
];

export default function QueryInput({ onSearch, isLoading, summary, parsedFilters }: QueryInputProps) {
  const [inputVal, setInputVal] = useState("show temperature readings near Chennai coast below 200m in 2023");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim() && !isLoading) {
      onSearch(inputVal.trim());
    }
  };

  const handleChipClick = (q: string) => {
    setInputVal(q);
    onSearch(q);
  };

  return (
    <div className="w-full bg-ocean-900/90 rounded-2xl border border-ocean-700/60 p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h2 className="text-lg font-bold text-white tracking-wide">
            Natural Language ARGO Query Engine
          </h2>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
          NLP Powered by Gemini / NetCDF Engine
        </span>
      </div>

      <form onSubmit={handleSubmit} className="relative mb-4">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask a question (e.g., 'show temperature near Chennai coast below 200m in 2023')..."
          className="w-full bg-ocean-950/90 text-white placeholder-ocean-500 text-sm md:text-base rounded-xl pl-5 pr-36 py-3.5 border border-ocean-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm px-5 rounded-lg flex items-center space-x-2 transition-all shadow-md disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Querying...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Search Data</span>
            </>
          )}
        </button>
      </form>

      {/* Preset Query Chips */}
      <div className="flex items-center flex-wrap gap-2 mb-3">
        <span className="text-xs font-medium text-ocean-400 flex items-center gap-1 mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Sample Queries:
        </span>
        {SAMPLE_QUERIES.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(q)}
            className="text-xs bg-ocean-800/80 hover:bg-cyan-500/20 text-ocean-300 hover:text-cyan-200 border border-ocean-700 hover:border-cyan-500/40 rounded-lg px-3 py-1.5 transition-all text-left truncate max-w-xs"
          >
            "{q}"
          </button>
        ))}
      </div>

      {/* Active Filter Summary Banner */}
      {summary && (
        <div className="bg-ocean-950/80 rounded-xl p-3.5 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-2 mt-4 text-xs">
          <div className="flex items-start space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1 flex-shrink-0"></span>
            <div>
              <p className="text-cyan-200 font-semibold text-sm">{summary}</p>
              {parsedFilters && (
                <p className="text-ocean-400 mt-0.5">
                  Filters: Lat [{parsedFilters.lat_min ?? '-90'}°, {parsedFilters.lat_max ?? '90'}°] | Lon [{parsedFilters.lon_min ?? '-180'}°, {parsedFilters.lon_max ?? '180'}°] | Depth [{parsedFilters.depth_min}m - {parsedFilters.depth_max}m] | Var: <span className="text-yellow-300 font-medium">{parsedFilters.variable}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
