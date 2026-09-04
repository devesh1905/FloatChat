'use client';

import React, { useRef, useMemo, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';

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

interface TargetLocation {
  name: string;
  lat: number;
  lon: number;
}

interface Globe3DProps {
  points: FloatPoint[];
  selectedFloatId: string | null;
  onSelectFloat: (id: string) => void;
  targetLocation?: TargetLocation | null;
}

// Convert Lat/Lon to 3D Cartesian Position on Sphere (R=2.5)
function latLonToVector3(lat: number, lon: number, radius: number = 2.5, altitude: number = 0.05): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const r = radius + altitude;
  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

// Color scale mapping
function getValueColor(val: number, variable: string = 'temperature'): THREE.Color {
  if (variable === 'salinity') {
    return val > 35.5 ? new THREE.Color('#00f5d4') : new THREE.Color('#7b2cbf');
  }
  if (val > 25) return new THREE.Color('#ff3b5c');
  if (val > 20) return new THREE.Color('#ffb703');
  if (val > 15) return new THREE.Color('#00b4d8');
  if (val > 10) return new THREE.Color('#0077b6');
  return new THREE.Color('#03045e');
}

// Photorealistic NASA Earth Globe Model (Steady, Dead-Center Focus)
function NASAEarthGlobe({ targetLocation }: { targetLocation?: TargetLocation | null }) {
  const globeRef = useRef<THREE.Group>(null);

  // Load NASA Satellite Textures
  const [colorMap, normalMap, specularMap] = useTexture([
    '/textures/earth_day.jpg',
    '/textures/earth_normal.jpg',
    '/textures/earth_specular.jpg'
  ]);

  // Center globe directly on target location (or default Indian Ocean Lon 80°E)
  useEffect(() => {
    if (globeRef.current) {
      const targetLon = targetLocation ? targetLocation.lon : 80.0;
      const rotY = -(targetLon * (Math.PI / 180));
      globeRef.current.rotation.y = rotY;
    }
  }, [targetLocation]);

  return (
    <group ref={globeRef} rotation={[0, -1.396, 0]}>
      {/* Atmosphere Glow Outer Ring */}
      <mesh>
        <sphereGeometry args={[2.53, 32, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>

      {/* Real NASA Satellite Textured Earth */}
      <mesh>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          specularMap={specularMap}
          specular={new THREE.Color('#38bdf8')}
          shininess={15}
        />
      </mesh>

      {/* Target Landmark Pinpoint Beacon & Area Highlight */}
      {targetLocation && <TargetLandmarkBeacon location={targetLocation} />}
    </group>
  );
}

// Target Area Highlight Disk & Superscript Pin Banner
function TargetLandmarkBeacon({ location }: { location: TargetLocation }) {
  const basePos = latLonToVector3(location.lat, location.lon, 2.5, 0.01);
  const pinPos = latLonToVector3(location.lat, location.lon, 2.5, 0.38);

  const linePoints = [basePos, pinPos];
  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);

  return (
    <group>
      {/* 1. Highlighted Surface Coverage Area (Translucent Radar Target Zone) */}
      <mesh position={basePos} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.02, 0.42, 32]} />
        <meshBasicMaterial color="#ffb703" side={THREE.DoubleSide} transparent opacity={0.35} />
      </mesh>
      <mesh position={basePos} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.38, 0.43, 32]} />
        <meshBasicMaterial color="#ffb703" side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>

      {/* 2. Vertical Target Pole */}
      <primitive object={new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#ffb703', linewidth: 3 }))} />

      {/* 3. Glowing Target Center Node */}
      <mesh position={pinPos}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#ffb703" emissive="#ffb703" emissiveIntensity={1.8} />
      </mesh>

      {/* 4. Superscript Banner (Positioned Top-Right of the Mark) */}
      <Html position={[pinPos.x + 0.08, pinPos.y + 0.08, pinPos.z]} center distanceFactor={8}>
        <div
          style={{ transform: 'scale(0.48) translate(30%, -30%)', transformOrigin: 'bottom left' }}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold text-xs px-3 py-1 rounded-lg border-2 border-white shadow-2xl backdrop-blur-md flex items-center space-x-1.5 whitespace-nowrap pointer-events-none"
        >
          <span>🎯 Target: {location.name}</span>
          <span className="text-[10px] font-mono opacity-85">({location.lat}°N, {location.lon}°E)</span>
        </div>
      </Html>
    </group>
  );
}

// ARGO Float Beacons with Superscript Floating Tooltips
function FloatBeacons({ points, selectedFloatId, onSelectFloat, targetLocation }: { points: FloatPoint[]; selectedFloatId: string | null; onSelectFloat: (id: string) => void; targetLocation?: TargetLocation | null }) {
  const uniqueFloats = useMemo(() => {
    const map = new Map<string, FloatPoint>();
    points.forEach((pt) => {
      if (!map.has(pt.float_id) || pt.depth === 0) {
        map.set(pt.float_id, pt);
      }
    });
    return Array.from(map.values());
  }, [points]);

  const rotY = targetLocation ? -(targetLocation.lon * (Math.PI / 180)) : -1.396;

  return (
    <group rotation={[0, rotY, 0]}>
      {uniqueFloats.map((pt) => {
        const isSelected = pt.float_id === selectedFloatId;
        const pos = latLonToVector3(pt.lat, pt.lon, 2.5, 0.05);
        const topPos = latLonToVector3(pt.lat, pt.lon, 2.5, 0.35);
        const color = getValueColor(pt.value, pt.variable);

        const linePoints = [pos, topPos];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);

        return (
          <group key={pt.float_id}>
            {/* Vertical Laser Pillar */}
            <primitive object={new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: color, linewidth: isSelected ? 2.5 : 1.2, transparent: true, opacity: isSelected ? 0.95 : 0.6 }))} />

            {/* Surface Beacon Node */}
            <mesh position={topPos} onClick={() => onSelectFloat(pt.float_id)}>
              <sphereGeometry args={[isSelected ? 0.06 : 0.04, 16, 16]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* Pulsating Outer Ring */}
            <mesh position={topPos} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.04, 0.07, 16]} />
              <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={isSelected ? 0.85 : 0.4} />
            </mesh>

            {/* Superscript Float Banner (Positioned Top-Right of the Beacon Dot) */}
            {isSelected && (
              <Html position={[topPos.x + 0.08, topPos.y + 0.08, topPos.z]} center distanceFactor={8}>
                <div
                  style={{ transform: 'scale(0.45) translate(25%, -25%)', transformOrigin: 'bottom left' }}
                  className="bg-ocean-950/95 text-white p-3.5 rounded-2xl border-2 border-cyan-400/80 shadow-2xl backdrop-blur-xl w-[260px] pointer-events-none select-none"
                >
                  <div className="flex items-center space-x-2 font-bold text-cyan-300 mb-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                    <span>ARGO Float #{pt.float_id}</span>
                  </div>
                  <p className="text-gray-200 text-xs leading-relaxed">
                    Depth: <span className="font-semibold text-white">{pt.depth}m</span> | {pt.variable}:{' '}
                    <span className="font-bold text-yellow-300">
                      {pt.value} {pt.variable === 'temperature' ? '°C' : 'PSU'}
                    </span>
                  </p>
                  <p className="text-[10px] text-cyan-400/90 mt-1 font-mono">
                    Location: ({pt.lat}°N, {pt.lon}°E)
                  </p>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

export default function Globe3D({ points, selectedFloatId, onSelectFloat, targetLocation }: Globe3DProps) {
  return (
    <div className="w-full h-[460px] bg-[#030712] rounded-2xl border border-ocean-700/60 overflow-hidden relative shadow-2xl">
      {/* Header Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2.5 bg-ocean-900/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-ocean-700/80 text-xs shadow-lg">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
        <span className="font-bold text-white tracking-wide">NASA 3D Ocean Visualizer</span>
        <span className="text-cyan-300/80 font-mono text-[11px]">({points.length} Profile Points)</span>
      </div>

      {/* Active Location Target Badge */}
      {targetLocation && (
        <div className="absolute top-4 right-4 z-10 bg-amber-500/20 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-400/60 text-xs text-amber-300 font-bold flex items-center space-x-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>Target Area: {targetLocation.name}</span>
        </div>
      )}

      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-ocean-900/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-ocean-700/80 text-xs text-gray-300 flex items-center space-x-3.5 shadow-lg">
        <span className="text-ocean-400 font-semibold">Temp Scale (°C):</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff3b5c] shadow-sm"></span>
          <span className="font-medium text-white">&gt;25°C</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ffb703] shadow-sm"></span>
          <span className="font-medium text-white">20°C</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#00b4d8] shadow-sm"></span>
          <span className="font-medium text-white">15°C</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#03045e] shadow-sm"></span>
          <span className="font-medium text-white">&lt;10°C</span>
        </div>
      </div>

      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0.8, 4.2], fov: 45 }}
      >
        <color attach="background" args={['#030712']} />

        {/* Realistic Lighting for NASA Textures */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 8]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-10, -5, -5]} intensity={0.4} color="#38bdf8" />

        <Suspense
          fallback={
            <Html center>
              <div className="text-cyan-400 text-xs font-semibold flex items-center space-x-2 bg-ocean-900/90 px-3 py-2 rounded-xl border border-cyan-500/40">
                <span className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
                <span>Loading NASA Earth 3D Model...</span>
              </div>
            </Html>
          }
        >
          <NASAEarthGlobe targetLocation={targetLocation} />
          <FloatBeacons points={points} selectedFloatId={selectedFloatId} onSelectFloat={onSelectFloat} targetLocation={targetLocation} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={3.0}
          maxDistance={6.5}
          autoRotate={false}
          target={[0, 0.2, 0]}
        />
      </Canvas>
    </div>
  );
}
