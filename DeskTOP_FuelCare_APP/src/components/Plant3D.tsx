import React, { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
  BakeShadows,
  AdaptiveDpr,
  AdaptiveEvents,
  Billboard,
  Text,
  Grid
} from '@react-three/drei';
import { Installation } from '../types';

/**
 * TRUE CLARITY v16.0
 * Zero-Fog, High-Contrast, Perfectly Scaled Composition
 */
const getProductColor = (product: string) => {
  const p = product.toLowerCase();
  if (p.includes('benzina') || p.includes('sspb')) return '#10b981'; // Vibrant Emerald
  if (p.includes('gasolio') || p.includes('gasol')) return '#f59e0b'; // Vibrant Amber
  if (p.includes('supreme') || p.includes('plus')) return '#3b82f6'; // Vibrant Blue
  return '#64748b';
};

const Bolt = ({ position }: { position: [number, number, number] }) => (
  <mesh position={position}>
    <cylinderGeometry args={[0.04, 0.04, 0.06, 6]} />
    <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
  </mesh>
);

const Hose = ({ start, end }: { start: [number, number, number], end: [number, number, number] }) => {
  const curve = useMemo(() => {
    const mid: [number, number, number] = [
      (start[0] + end[0]) / 2,
      Math.min(start[1], end[1]) - 0.7,
      (start[2] + end[2]) / 2 + 0.4
    ];
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...end)
    );
  }, [start, end]);

  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 24, 0.035, 8, false]} />
      <meshStandardMaterial color="#0f172a" roughness={0.9} />
    </mesh>
  );
};

const Tank = ({ position, volume, product, color }: { position: [number, number, number], volume: number, product: string, color: string }) => {
  const radius = 0.9;
  const length = Math.max(4.0, Math.min(6.5, volume / 8 + 2.5));

  return (
    <group position={position}>
      {/* Heavy Mechanical Cradle */}
      <group position={[0, 0.2, 0]}>
        {[-length / 3, length / 3].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.8, 0.5, 2.2]} />
              <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
            </mesh>
            <Bolt position={[-0.35, 0.28, 1.0]} />
            <Bolt position={[0.35, 0.28, 1.0]} />
            <Bolt position={[-0.35, 0.28, -1.0]} />
            <Bolt position={[0.35, 0.28, -1.0]} />
          </group>
        ))}
      </group>

      {/* Structural Reinforcement Bands */}
      {[-length / 2.5, 0, length / 2.5].map((x, i) => (
        <mesh key={i} position={[x, radius + 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius + 0.05, radius + 0.05, 0.25, 32]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* Pure Crystal Shell (No Clearcoat Fog) */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, radius + 0.45, 0]}>
        <cylinderGeometry args={[radius, radius, length, 64]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.12}
          transmission={0.95}
          thickness={0.5}
          ior={1.45}
          metalness={0.1}
          roughness={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Pure High-Contrast Liquid Core */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, radius + 0.45, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.94, radius * 0.94, length * 0.998, 64]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          metalness={0.5}
          roughness={0.2}
          transparent={false}
        />
      </mesh>

      {/* Finials */}
      {[-length / 2, length / 2].map((x, i) => (
        <mesh key={i} position={[x, radius + 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius + 0.12, radius + 0.12, 0.5, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Crisp HUD Label */}
      <Billboard position={[0, radius * 2 + 3.0, 0]}>
        <group>
          <mesh>
            <planeGeometry args={[4.2, 1.5]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.90} metalness={0} roughness={0.5} />
          </mesh>
          <mesh position={[-2.05, 0, 0.01]}>
            <planeGeometry args={[0.1, 1.5]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <Text position={[-1.7, 0.35, 0.02]} fontSize={0.42} color="#0f172a" fontWeight="900" anchorX="left">
            {product.toUpperCase()}
          </Text>
          <Text position={[-1.7, -0.3, 0.02]} fontSize={0.32} color="#64748b" fontWeight="bold" anchorX="left">
            {`CAPACITÀ: ${volume.toLocaleString()} L`}
          </Text>
        </group>
      </Billboard>
    </group>
  );
};

const Dispenser = ({ position, nozzles }: { position: [number, number, number], nozzles: number }) => {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[2.2, 0.3, 1.6]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Body */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[0.95, 2.7, 0.8]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.1} roughness={0.2} />
      </mesh>

      {/* Top Cap */}
      <mesh position={[0, 3.1, 0]} castShadow>
        <boxGeometry args={[1.2, 0.6, 0.95]} />
        <meshStandardMaterial color="#ef4444" metalness={0.2} roughness={0.2} />
      </mesh>

      {/* Screen */}
      <mesh position={[0, 2.3, 0.42]}>
        <boxGeometry args={[0.65, 0.45, 0.05]} />
        <meshStandardMaterial color="#020617" />
      </mesh>

      {/* Nozzles and Hoses */}
      {Array.from({ length: nozzles }).map((_, i) => {
        const side = i % 2 === 0 ? 1 : -1;
        const col = Math.floor(i / 2);
        const nozzleX = side * 0.60;
        const nozzleY = 2.1 - col * 0.75;
        const dispenserAttachPoint: [number, number, number] = [nozzleX * 1.6, 2.5, 0.25];
        const nozzlePoint: [number, number, number] = [nozzleX, nozzleY, 0.1];

        return (
          <group key={i}>
            <mesh position={nozzlePoint} castShadow>
              <boxGeometry args={[0.22, 0.65, 0.4]} />
              <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
            </mesh>
            <Hose start={dispenserAttachPoint} end={nozzlePoint} />
          </group>
        );
      })}
    </group>
  );
};

const StationModel = ({ installation }: { installation: Installation }) => {
  const { tanks, dispensers } = useMemo(() => {
    const assets = { tanks: new Map<string, any>(), dispensers: new Map<string, any>() };
    if (!installation?.rows) return { tanks: [], dispensers: [] };

    installation.rows.forEach(row => {
      const tankId = row["ID Serbatoio"];
      if (tankId && tankId !== "-" && !assets.tanks.has(tankId)) {
        const volStr = (row["Volume Serbatoio"] || '0').replace(/\./g, '').replace(',', '.');
        const vol = parseFloat(volStr) || 0;
        const product = row["Prodotto Serbatoio"] || 'N/D';
        assets.tanks.set(tankId, { id: tankId, volume: vol, product, color: getProductColor(product) });
      }
      const dispId = row["ID Erogatore"];
      if (dispId && dispId !== "-" && dispId !== "N/D" && dispId !== "0") {
        if (!assets.dispensers.has(dispId)) assets.dispensers.set(dispId, { id: dispId, nozzles: 0 });
        const n = parseInt(row["Pistole Erogatore"] || '0', 10);
        assets.dispensers.get(dispId).nozzles = Math.max(assets.dispensers.get(dispId).nozzles, n);
      }
    });

    return {
      tanks: Array.from(assets.tanks.values()),
      dispensers: Array.from(assets.dispensers.values())
    };
  }, [installation]);

  const tankSpacing = 11;
  const dispSpacing = 10;
  const tanksStartX = -((tanks.length - 1) * tankSpacing) / 2;
  const dispStartX = -((dispensers.length - 1) * dispSpacing) / 2;

  // COMPACT COMPOSITION: Pull everything closer!
  const tankZ = -8;   // Was -40!
  const dispZ = 6;    // Was +20!

  const canopyWidth = Math.max(dispensers.length * dispSpacing + 12, 28);

  return (
    <group>
      {/* Crisp Daylight Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} metalness={0.1} />
      </mesh>
      <Grid
        sectionSize={15}
        sectionColor="#94a3b8"
        sectionThickness={2}
        cellSize={3}
        cellColor="#cbd5e1"
        cellThickness={1}
        position={[0, -0.15, 0]}
        fadeDistance={200}
        infiniteGrid
      />

      {/* TANKS - PULLED MASSIVELY FORWARD */}
      <group position={[0, 0, tankZ]}>
        {tanks.map((tank, i) => (
          <Tank key={tank.id} position={[tanksStartX + i * tankSpacing, 0, 0]} volume={tank.volume} product={tank.product} color={tank.color} />
        ))}
      </group>

      {/* SLEEK CANOPY */}
      {dispensers.length > 0 && (
        <group position={[0, 10.5, dispZ]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[canopyWidth, 0.8, 14]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.1} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[canopyWidth + 0.4, 0.15, 14.4]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>

          {/* ESSO Branding */}
          <Text
            position={[0, 0, 7.05]}
            fontSize={2.8}
            color="#ef4444"
            fontWeight="900"
            letterSpacing={0.05}
          >
            ESSO
          </Text>
          <Text
            position={[0, 0, -7.05]}
            rotation={[0, Math.PI, 0]}
            fontSize={2.8}
            color="#ef4444"
            fontWeight="900"
            letterSpacing={0.05}
          >
            ESSO
          </Text>

          {[-canopyWidth / 2 + 8, canopyWidth / 2 - 8].map((x, i) => (
            <mesh key={i} position={[x, -5.5, 0]} castShadow>
              <cylinderGeometry args={[0.6, 0.65, 11, 32]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
          ))}
        </group>
      )}



      {/* DISPENSERS - PULLED FORWARD */}
      <group position={[0, 0, dispZ]}>
        {dispensers.map((disp, i) => (
          <Dispenser key={i} position={[dispStartX + i * dispSpacing, 0, 0]} nozzles={disp.nozzles} />
        ))}
      </group>

      {/* PURE DAYLIGHT SETUP (No Overexposure) */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[50, 100, 50]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 20, 0]} intensity={0.5} color="#ffffff" />
    </group>
  );
};

const Plant3D: React.FC<{ installation: Installation }> = ({ installation }) => {
  return (
    <div className="w-full h-[400px] md:h-[550px] rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-[#e0e7ff] relative border-[8px] md:border-[16px] border-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.2)]">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [40, 30, 45], fov: 25 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#e0e7ff']} /> {/* Crisp Blue Daylight Sky */}
        <Suspense fallback={null}>
          <StationModel installation={installation} />
          <Environment preset="city" />

          <ContactShadows position={[0, 0.05, 0]} opacity={0.6} scale={200} blur={3} far={40} />
          <BakeShadows />
          <AdaptiveDpr />
          <AdaptiveEvents />
        </Suspense>

        {/* Adjusted OrbitControls parameters for the new tight scale, allowing deep zoom out */}
        <OrbitControls enablePan={true} minDistance={30} maxDistance={400} maxPolarAngle={Math.PI / 2.05} target={[0, 5, 0]} />
      </Canvas>
    </div>
  );
};

export default Plant3D;
