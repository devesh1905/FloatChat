'use client';

import React from 'react';
import { Database, Waves, MapPin, Thermometer, Droplets } from 'lucide-react';

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

interface FloatTableProps {
  points: FloatPoint[];
  selectedFloatId: string | null;
  onSelectFloat: (id: string) => void;
}

export default function FloatTable({ points, selectedFloatId, onSelectFloat }: FloatTableProps) {
  // Deduplicate float profile headers
  const floatSummaries = React.useMemo(() => {
    const map = new Map<string, { float_id: string; lat: number; lon: number; minDepth: number; maxDepth: number; minTemp: number; maxTemp: number; count: number }>();
    
    points.forEach((pt) => {
      if (!map.has(pt.float_id)) {
        map.set(pt.float_id, {
          float_id: pt.float_id,
          lat: pt.lat,
          lon: pt.lon,
          minDepth: pt.depth,
          maxDepth: pt.depth,
          minTemp: pt.temp,
          maxTemp: pt.temp,
          count: 1
        });
      } else {
        const item = map.get(pt.float_id)!;
        item.minDepth = Math.min(item.minDepth, pt.depth);
        item.maxDepth = Math.max(item.maxDepth, pt.depth);
        item.minTemp = Math.min(item.minTemp, pt.temp);
        item.maxTemp = Math.max(item.maxTemp, pt.temp);
        item.count += 1;
      }
    });
    
    return Array.from(map.values());
  }, [points]);

  return (
    <div className="w-full bg-ocean-900/80 rounded-2xl border border-ocean-700/60 p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          Active Float Profile Datasets ({floatSummaries.length} Floats)
        </h3>
        <span className="text-xs text-ocean-400 font-medium">Click float card to view depth profile</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {floatSummaries.map((f) => {
          const isSelected = f.float_id === selectedFloatId;
          return (
            <div
              key={f.float_id}
              onClick={() => onSelectFloat(f.float_id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-ocean-800 border-cyan-400 ring-2 ring-cyan-500/20 shadow-lg'
                  : 'bg-ocean-950/70 border-ocean-700/70 hover:border-ocean-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                  <Waves className="w-4 h-4 text-cyan-400" /> ARGO Float #{f.float_id}
                </span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-200 px-2 py-0.5 rounded-full font-semibold border border-cyan-500/30">
                  {f.count} sampling points
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>Lat: {f.lat}°N, Lon: {f.lon}°E</span>
                </div>
                <div className="flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Temp: {f.minTemp}°C - {f.maxTemp}°C</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Raw Data Sample Table */}
      <div className="overflow-x-auto max-h-[220px] overflow-y-auto rounded-xl border border-ocean-700/50">
        <table className="w-full text-xs text-left text-gray-300">
          <thead className="text-xs uppercase bg-ocean-950 text-ocean-300 sticky top-0 border-b border-ocean-700">
            <tr>
              <th className="px-4 py-2.5">Float ID</th>
              <th className="px-4 py-2.5">Coordinates</th>
              <th className="px-4 py-2.5">Depth (m)</th>
              <th className="px-4 py-2.5">Temperature</th>
              <th className="px-4 py-2.5">Salinity</th>
              <th className="px-4 py-2.5">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ocean-800/60 bg-ocean-900/40">
            {points.slice(0, 50).map((pt, idx) => (
              <tr
                key={idx}
                onClick={() => onSelectFloat(pt.float_id)}
                className={`hover:bg-ocean-800/60 transition-colors cursor-pointer ${
                  pt.float_id === selectedFloatId ? 'bg-cyan-500/10' : ''
                }`}
              >
                <td className="px-4 py-2 font-mono font-medium text-cyan-300">#{pt.float_id}</td>
                <td className="px-4 py-2">{pt.lat}°N, {pt.lon}°E</td>
                <td className="px-4 py-2 font-semibold text-white">{pt.depth}m</td>
                <td className="px-4 py-2 text-yellow-300 font-medium">{pt.temp} °C</td>
                <td className="px-4 py-2 text-teal-300 font-medium">{pt.salinity} PSU</td>
                <td className="px-4 py-2 text-gray-400">{pt.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
