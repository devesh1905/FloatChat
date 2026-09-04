'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

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

interface DepthChartProps {
  points: FloatPoint[];
  selectedFloatId: string | null;
  variable: string;
}

export default function DepthChart({ points, selectedFloatId, variable }: DepthChartProps) {
  // Filter points for selected float or first float
  const activeFloatId = selectedFloatId || (points.length > 0 ? points[0].float_id : null);
  
  const chartData = React.useMemo(() => {
    if (!activeFloatId) return [];
    
    const floatPts = points.filter((p) => p.float_id === activeFloatId);
    // Sort by depth ascending
    return floatPts.sort((a, b) => a.depth - b.depth).map((p) => ({
      depth: p.depth,
      value: p.value,
      temp: p.temp,
      salinity: p.salinity,
      timestamp: p.timestamp
    }));
  }, [points, activeFloatId]);

  const varLabel = variable === 'salinity' ? 'Salinity (PSU)' : 'Temperature (°C)';
  const strokeColor = variable === 'salinity' ? '#00f5d4' : '#ff4d6d';

  if (!activeFloatId || chartData.length === 0) {
    return (
      <div className="w-full h-[320px] bg-ocean-900/60 rounded-2xl border border-ocean-700/60 flex items-center justify-center text-ocean-400 text-sm">
        No profile data selected. Query a region or click an ARGO float on the 3D map.
      </div>
    );
  }

  return (
    <div className="w-full bg-ocean-900/80 rounded-2xl border border-ocean-700/60 p-5 shadow-2xl relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            ARGO Float #{activeFloatId} — Depth Profile (Thermocline Curve)
          </h3>
          <p className="text-xs text-gray-400">
            Depth (meters) vs. {varLabel} from surface (0m) to abyss (1000m)
          </p>
        </div>
        <div className="bg-ocean-800 text-xs px-3 py-1 rounded-full text-cyan-300 border border-ocean-700 font-semibold">
          {chartData.length} Depth Sampling Levels
        </div>
      </div>

      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1C2541" />
            <XAxis
              dataKey="value"
              type="number"
              domain={['auto', 'auto']}
              tick={{ fill: '#90E0EF', fontSize: 12 }}
              label={{ value: varLabel, position: 'insideBottom', offset: -10, fill: '#48CAE4', fontSize: 12 }}
            />
            <YAxis
              dataKey="depth"
              type="number"
              reversed={true} // Inverted Y-axis so 0m is at top, 1000m is at bottom
              tick={{ fill: '#90E0EF', fontSize: 12 }}
              label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft', offset: 10, fill: '#48CAE4', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0B132B', borderColor: '#2F3E66', borderRadius: '12px', color: '#fff' }}
              formatter={(val: any) => [`${val} ${variable === 'salinity' ? 'PSU' : '°C'}`, varLabel]}
              labelFormatter={(depth: any) => `Ocean Depth: ${depth} meters`}
            />
            <Line
              type="monotone"
              dataKey="value"
              name={varLabel}
              stroke={strokeColor}
              strokeWidth={3}
              dot={{ r: 5, fill: strokeColor, stroke: '#0B132B', strokeWidth: 2 }}
              activeDot={{ r: 8, fill: '#ffffff', stroke: strokeColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
