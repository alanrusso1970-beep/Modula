import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text, BakeShadows, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import { Installation } from '../types';

interface Plant3DProps {
  installation: Installation;
}

const getProductColor = (product: string) => {
  const p = product.toLowerCase();
  if (p.includes('benzina')) return '#22c55e'; // Vivid Green
  if (p.includes('gasolio')) return '#eab308'; // Vivid Yellow
  if (p.includes('supreme') || p.includes('plus')) return '#3b82f6'; // Vivid Blue
  if (p.includes('gpl')) return '#f97316'; // Vivid Orange
  if (p.includes('metano')) return '#06b6d4'; // Vivid Cyan
  return '#8b5cf6'; // Vivid Purple
};

const Tank = ({ position, volume, product, color, index }: { position: [number, number, number], volume: number, product: string, color: string, index: number }) => {
  // Scale length proportionally to volume (assuming volume is in Kl)
  const radius = 0.7;
  // If volume is in Kl (e.g. 25), scale it appropriately (e.g. 25/8 + 1.5 = 4.6)
  const length = Math.max(2, Math.min(6, volume / 8 + 1.5));
  const volumeFormatted = volume.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  
  return (
    <group position={position}>
      {/* Tank Body */}
      <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]} position={[0, radius + 0.2, 0]}>
        <cylinderGeometry args={[radius, radius, length, 16]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </mesh>
      
      {/* Tank Supports - adjusted to length */}
      <mesh castShadow receiveShadow position={[-length/3, 0.4, 0]}>
        <boxGeometry args={[0.2, 0.8, 1.0]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh castShadow receiveShadow position={[length/3, 0.4, 0]}>
        <boxGeometry args={[0.2, 0.8, 1.0]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Product Label */}
      <Text
        position={[0, radius * 2 + 1.0, 0]}
        fontSize={0.3}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#ffffff"
      >
        {`${product.toUpperCase()}\nCapacità: ${volumeFormatted} Kl`}
      </Text>
    </group>
  );
};

const Dispenser = ({ position, label, nozzles, dispId }: { position: [number, number, number], label: string, nozzles: number, dispId: string }) => {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.2, 0.5]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      
      {/* Main Body */}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 1.8, 0.4]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      
      {/* Top/Header */}
      <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.75, 0.3, 0.45]} />
        <meshStandardMaterial color="#ef4444" /> {/* Vivid Red Header */}
      </mesh>

      {/* Screen */}
      <mesh position={[0, 1.5, 0.21]}>
        <boxGeometry args={[0.4, 0.4, 0.02]} />
        <meshStandardMaterial color="#0f172a" emissive="#0f172a" emissiveIntensity={0.5} />
      </mesh>

      {/* Nozzles (Pistole) */}
      {Array.from({ length: nozzles }).map((_, i) => {
        const side = i % 2 === 0 ? 1 : -1; // Alternate sides
        const yPos = 1.2 - Math.floor(i / 2) * 0.3; // Stack them vertically
        const xPos = side * 0.38;
        
        // Alternate colors for nozzles
        const nozzleColors = ['#22c55e', '#eab308', '#3b82f6', '#f97316'];
        const nColor = nozzleColors[i % nozzleColors.length];

        return (
          <group key={`${dispId}-${i}`} position={[xPos, yPos, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.1, 0.2, 0.15]} />
              <meshStandardMaterial color={nColor} />
            </mesh>
          </group>
        );
      })}

      {/* Labels */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.2}
        color="#1e293b"
        anchorX="center"
        outlineWidth={0.02}
        outlineColor="#ffffff"
      >
        {label}
      </Text>
      <Text
        position={[0, 2.3, 0]}
        fontSize={0.15}
        color="#ef4444"
        anchorX="center"
        outlineWidth={0.01}
        outlineColor="#ffffff"
      >
        {`${nozzles} Pistole`}
      </Text>
    </group>
  );
};

const StationModel = ({ installation }: Plant3DProps) => {
  // Parse data
  const { tanks, dispensers } = useMemo(() => {
    const seenTanks = new Set<string>();
    const parsedTanks: any[] = [];
    
    const seenDispensers = new Set<string>();
    const parsedDispensers: any[] = [];

    installation.rows.forEach(row => {
      // Tanks
      const tankId = row["ID Serbatoio"];
      if (tankId && tankId !== "-" && !seenTanks.has(tankId)) {
        seenTanks.add(tankId);
        
        // Robust parsing for Italian number format (e.g., 25.000,00)
        let rawVol = row["Volume Serbatoio"] || '0';
        // Remove thousands separator (dot) and replace decimal separator (comma) with dot
        const cleanVol = rawVol.replace(/\./g, '').replace(',', '.');
        const vol = parseFloat(cleanVol) || 0;
        
        const product = row["Prodotto Serbatoio"] || 'N/D';
        parsedTanks.push({ 
          id: tankId, 
          volume: vol, 
          product, 
          color: getProductColor(product) 
        });
      }

      // Dispensers
      const dispId = row["ID Erogatore"];
      if (dispId && dispId !== "-" && !seenDispensers.has(dispId)) {
        seenDispensers.add(dispId);
        const nozzlesStr = row["Pistole Erogatore"];
        const nozzlesCount = parseInt(nozzlesStr || '0', 10) || 0;
        parsedDispensers.push({ 
          id: dispId, 
          nozzles: nozzlesCount
        });
      }
    });

    return { tanks: parsedTanks, dispensers: parsedDispensers };
  }, [installation]);

  // Layout calculations
  const tankSpacing = 6;
  const dispSpacing = 3;
  
  const tanksStartX = -((tanks.length - 1) * tankSpacing) / 2;
  const dispStartX = -((dispensers.length - 1) * dispSpacing) / 2;

  const canopyWidth = Math.max(dispensers.length * dispSpacing + 2, 6);
  const canopyDepth = 5;

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      
      {/* Tanks Area (Back) */}
      <group position={[0, 0, -6]}>
        {/* Concrete pad for tanks */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
          <planeGeometry args={[Math.max(tanks.length * tankSpacing + 2, 8), 4]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.8} />
        </mesh>

        {tanks.map((tank, i) => (
          <Tank 
            key={tank.id} 
            index={i}
            position={[tanksStartX + i * tankSpacing, 0, 0]} 
            volume={tank.volume} 
            product={tank.product} 
            color={tank.color} 
          />
        ))}
      </group>

      {/* Dispensers Area (Front) */}
      <group position={[0, 0, 2]}>
        {/* Canopy (Tettoia) */}
        {dispensers.length > 0 && (
          <group position={[0, 4.5, 0]}>
            {/* Canopy Roof */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[canopyWidth, 0.4, canopyDepth]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.1} roughness={0.2} />
            </mesh>
            {/* Canopy Rim */}
            <mesh castShadow receiveShadow position={[0, 0, 0]}>
              <boxGeometry args={[canopyWidth + 0.2, 0.6, canopyDepth + 0.2]} />
              <meshStandardMaterial color="#ef4444" /> {/* Vivid Red Rim */}
            </mesh>
            
            {/* Lights under canopy */}
            {dispensers.map((disp, i) => (
              <group key={`light-${disp.id}`} position={[dispStartX + i * dispSpacing, -0.2, 0]}>
                <mesh>
                  <boxGeometry args={[1.2, 0.05, 1.2]} />
                  <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
                </mesh>
                <pointLight position={[0, -1, 0]} intensity={0.5} distance={8} color="#ffffff" />
              </group>
            ))}

            {/* Columns */}
            {[-canopyWidth/2 + 1.5, canopyWidth/2 - 1.5].map((x, i) => (
              <group key={`col-${i}`} position={[x, -2.25, 0]}>
                {/* Main pillar */}
                <mesh castShadow receiveShadow>
                  <cylinderGeometry args={[0.15, 0.2, 4.5, 8]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.2} />
                </mesh>
                {/* Base */}
                <mesh position={[0, -2.1, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.8, 0.3, 0.8]} />
                  <meshStandardMaterial color="#64748b" />
                </mesh>
                {/* Yellow Bumper guards */}
                <mesh position={[0, -1.6, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.3, 0.3, 0.8, 8]} />
                  <meshStandardMaterial color="#eab308" roughness={0.5} />
                </mesh>
              </group>
            ))}
          </group>
        )}

        {/* Dispensers */}
        {dispensers.map((disp, i) => (
          <Dispenser 
            key={disp.id} 
            dispId={disp.id}
            position={[dispStartX + i * dispSpacing, 0, 0]} 
            label={`Erogatore ${disp.id}`} 
            nozzles={disp.nozzles}
          />
        ))}
      </group>

      {/* Lighting for vivid colors */}
      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[10, 15, 10]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <pointLight position={[0, 3, 2]} intensity={0.8} color="#ffffff" />
    </group>
  );
};

const Plant3D: React.FC<Plant3DProps> = ({ installation }) => {
  return (
    <div className="w-full h-[300px] md:h-[400px] rounded-[2rem] overflow-hidden bg-sky-50 shadow-inner relative border border-slate-200">
      <div className="absolute top-4 left-4 z-10">
        <span className="bg-white/90 text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
          Vista 3D Realistica
        </span>
      </div>
      
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 8, 16], fov: 45 }} performance={{ min: 0.5 }}>
        <Suspense fallback={null}>
          <StationModel installation={installation} />
          <Environment preset="city" />
          <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={40} blur={2} far={10} resolution={256} frames={1} />
          <BakeShadows />
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
        </Suspense>
        <OrbitControls 
          enablePan={true} 
          minDistance={5} 
          maxDistance={30} 
          maxPolarAngle={Math.PI / 2 - 0.05} // Don't go below ground
          target={[0, 2, 0]}
        />
      </Canvas>

      <div className="absolute bottom-4 right-4 z-10 text-right bg-white/80 p-2 rounded-xl backdrop-blur-sm border border-slate-200/50">
        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Trascina per ruotare</p>
        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Scroll per zoom</p>
      </div>
    </div>
  );
};

export default Plant3D;
