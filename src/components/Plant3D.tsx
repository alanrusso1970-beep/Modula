import React, { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
  AdaptiveDpr,
  AdaptiveEvents,
  Billboard,
  Text,
  RoundedBox,
} from '@react-three/drei';
import { Installation } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const getProductColor = (product: string): string => {
  const p = product.toLowerCase();
  if (p.includes('benzina') || p.includes('sspb')) return '#10b981';
  if (p.includes('gasolio') || p.includes('diesel')) return '#f59e0b';
  if (p.includes('supreme') || p.includes('plus') || p.includes('sv-')) return '#3b82f6';
  if (p.includes('gpl') || p.includes('lpg')) return '#f43f5e';
  if (p.includes('metano') || p.includes('cng')) return '#06b6d4';
  return '#8b5cf6';
};

const getProductLabel = (product: string): string => {
  const p = product.toLowerCase();
  if (p.includes('benzina') || p.includes('sspb')) return 'BENZINA';
  if (p.includes('gasolio') || p.includes('diesel')) return 'GASOLIO';
  if (p.includes('supreme') || p.includes('plus') || p.includes('sv-')) return 'SUPREME';
  if (p.includes('gpl') || p.includes('lpg')) return 'GPL';
  if (p.includes('metano') || p.includes('cng')) return 'METANO';
  return product.toUpperCase().slice(0, 8);
};

// ─────────────────────────────────────────────────────────────────────────────
// MATERIALS (shared)
// ─────────────────────────────────────────────────────────────────────────────
const METAL_DARK = { color: '#1e293b', metalness: 0.85, roughness: 0.2 };
const METAL_MID  = { color: '#334155', metalness: 0.80, roughness: 0.3 };
const METAL_LITE = { color: '#64748b', metalness: 0.75, roughness: 0.25 };
const CONCRETE   = { color: '#cbd5e1', metalness: 0.0,  roughness: 0.9 };
const CONCRETE_DARK = { color: '#94a3b8', metalness: 0.0, roughness: 0.95 };
const WHITE_PAINTED = { color: '#f1f5f9', metalness: 0.05, roughness: 0.35 };
const RED_PAINTED   = { color: '#dc2626', metalness: 0.05, roughness: 0.4 };
const YELLOW_MARKING = { color: '#facc15', metalness: 0.0, roughness: 0.8 };

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Bullone decorativo */
const Bolt = ({ pos }: { pos: [number, number, number] }) => (
  <mesh position={pos}>
    <cylinderGeometry args={[0.035, 0.035, 0.07, 8]} />
    <meshStandardMaterial {...METAL_LITE} />
  </mesh>
);

/** Tubo con curva bezier */
const Pipe = ({
  start, end, radius = 0.04, color = '#0f172a'
}: { start: [number,number,number]; end: [number,number,number]; radius?: number; color?: string }) => {
  const curve = useMemo(() => {
    const mid: [number,number,number] = [(start[0]+end[0])/2, Math.min(start[1],end[1])-0.5, (start[2]+end[2])/2+0.3];
    return new THREE.QuadraticBezierCurve3(new THREE.Vector3(...start), new THREE.Vector3(...mid), new THREE.Vector3(...end));
  }, [start, end]);
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 20, radius, 7, false]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SERBATOIO FUORI TERRA (orizzontale, su basamento/selle)
// ─────────────────────────────────────────────────────────────────────────────
const AboveGroundTank = ({
  position, volume, product, color, tankId, index
}: {
  position: [number,number,number];
  volume: number;
  product: string;
  color: string;
  tankId: string;
  index: number;
}) => {
  const R = 0.85;
  // Lunghezza proporzionale al volume (es. 30Kl ≈ 5m, 50Kl ≈ 7m)
  const L = Math.max(3.5, Math.min(7.5, volume / 7.5 + 2.5));
  const groundY = 0; // il basamento parte da terra

  const boltPositions: [number,number,number][] = [
    [-L/2.5, R+0.55, R*0.85], [-L/2.5, R+0.55, -R*0.85],
    [ L/2.5, R+0.55, R*0.85], [ L/2.5, R+0.55, -R*0.85],
  ];

  return (
    <group position={position}>
      {/* Basamento in calcestruzzo (selle di supporto) */}
      {[-L/2.8, L/2.8].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* Sella: parte bassa */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.9, 0.7, 2.2]} />
            <meshStandardMaterial {...CONCRETE_DARK} />
          </mesh>
          {/* Colletto curvo sopra la sella */}
          <mesh position={[0, 0.65, 0]} castShadow>
            <cylinderGeometry args={[R+0.08, R+0.08, 0.28, 32, 1, true, 0, Math.PI]} />
            <meshStandardMaterial {...METAL_MID} side={THREE.DoubleSide} />
          </mesh>
          {/* Bulloni sella */}
          {[-0.4, 0.4].map((bz, j) => (
            <Bolt key={j} pos={[0.45, 0.38, bz]} />
          ))}
        </group>
      ))}

      {/* Fasciature di rinforzo strutturale */}
      {[-L/2.3, 0, L/2.3].map((x, i) => (
        <mesh key={i} position={[x, R+0.55, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[R+0.06, R+0.06, 0.2, 40]} />
          <meshStandardMaterial {...METAL_LITE} />
        </mesh>
      ))}

      {/* Corpo serbatoio (cilindro principale) */}
      <mesh rotation={[0, 0, Math.PI/2]} position={[0, R+0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[R, R, L, 48]} />
        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>

      {/* Striscia colorata prodotto sulla lunghezza */}
      <mesh rotation={[0, 0, Math.PI/2]} position={[0, R+0.55, 0]} castShadow>
        <cylinderGeometry args={[R+0.005, R+0.005, L*0.15, 48]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.3} />
      </mesh>

      {/* Calotte sulle estremità */}
      {[-L/2, L/2].map((x, i) => (
        <mesh key={i} position={[x, R+0.55, 0]} rotation={[0, i === 0 ? -Math.PI/2 : Math.PI/2]} castShadow>
          <cylinderGeometry args={[R+0.03, R+0.03, 0.45, 40]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.25} />
        </mesh>
      ))}

      {/* Passaggi uomo (manhole) sulla sommità */}
      {[-L/5, L/5].map((x, i) => (
        <group key={i} position={[x, R*2+0.6, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.22, 24]} />
            <meshStandardMaterial {...METAL_MID} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.27, 0.27, 0.05, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Bulloni del passaggio uomo */}
          {[0,1,2,3,4,5].map(bi => (
            <Bolt key={bi} pos={[
              Math.cos(bi*Math.PI/3)*0.35,
              0.06,
              Math.sin(bi*Math.PI/3)*0.35
            ]} />
          ))}
        </group>
      ))}

      {/* Valvola di sfiato/sicurezza */}
      <group position={[L*0.35, R*2+0.55, 0]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.07, 0.45, 10]} />
          <meshStandardMaterial {...METAL_DARK} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.14, 0.06, 0.14, 10]} />
          <meshStandardMaterial {...METAL_DARK} />
        </mesh>
      </group>

      {/* Indicatore di livello (tubo verticale trasparente) */}
      <group position={[L/2-0.4, R+0.55, R+0.08]}>
        <mesh>
          <cylinderGeometry args={[0.055, 0.055, R*1.6, 10]} />
          <meshStandardMaterial color="#93c5fd" metalness={0.1} roughness={0} transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Bulloni decorativi */}
      {boltPositions.map((p, i) => <Bolt key={i} pos={p} />)}

      {/* Targa impianto */}
      <group position={[0, R+0.55, R+0.12]} rotation={[0, 0, 0]}>
        <mesh>
          <planeGeometry args={[1.6, 0.6]} />
          <meshStandardMaterial color="#0f172a" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[1.5, 0.5]} />
          <meshStandardMaterial color={color} metalness={0.1} roughness={0.4} />
        </mesh>
      </group>

      {/* HUD label */}
      <Billboard position={[0, R*2+2.8, 0]}>
        <group>
          <mesh>
            <planeGeometry args={[4.0, 1.4]} />
            <meshStandardMaterial color="#0f172a" transparent opacity={0.85} metalness={0} roughness={0.5} />
          </mesh>
          <mesh position={[-1.95, 0, 0.01]}>
            <planeGeometry args={[0.09, 1.4]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <Text position={[-1.6, 0.3, 0.02]} fontSize={0.38} color={color} fontWeight="900" anchorX="left">
            {getProductLabel(product)} [{tankId}]
          </Text>
          <Text position={[-1.6, -0.22, 0.02]} fontSize={0.28} color="#94a3b8" anchorX="left">
            {`${volume.toLocaleString('it-IT')} Kl  —  L=${L.toFixed(1)}m`}
          </Text>
        </group>
      </Billboard>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EROGATORE (pompa) – con pistole laterali sulle fiancate
// ─────────────────────────────────────────────────────────────────────────────
const Dispenser = ({
  position, nozzles, dispenserId, index
}: {
  position: [number,number,number];
  nozzles: number;
  dispenserId: string;
  index: number;
}) => {
  const nozzleCount = Math.max(1, Math.min(8, nozzles));
  const nozzlesPerSide = Math.ceil(nozzleCount / 2);
  const bodyH = 2.1;
  const bodyW = 0.72;
  const bodyD = 0.56;
  const baseH = 0.18;

  return (
    <group position={position} castShadow>
      {/* ── Basamento in calcestruzzo ── */}
      <mesh position={[0, baseH/2, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.4, baseH, 1.1]} />
        <meshStandardMaterial {...CONCRETE_DARK} />
      </mesh>
      {/* Bordo giallo anti-urto */}
      {[-0.7, 0.7].map((x, i) => (
        <mesh key={i} position={[x, baseH+0.05, 0]} castShadow>
          <boxGeometry args={[0.06, 0.1, 1.1]} />
          <meshStandardMaterial {...YELLOW_MARKING} />
        </mesh>
      ))}

      {/* ── Corpo principale erogatore ── */}
      <group position={[0, baseH + bodyH/2, 0]}>
        {/* Pannello anteriore/posteriore bianco */}
        <mesh castShadow>
          <boxGeometry args={[bodyW, bodyH, bodyD]} />
          <meshStandardMaterial {...WHITE_PAINTED} />
        </mesh>

        {/* Striscia verticale colorata sui lati */}
        {[-bodyW/2-0.005, bodyW/2+0.005].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} castShadow>
            <boxGeometry args={[0.02, bodyH, bodyD+0.01]} />
            <meshStandardMaterial color="#dc2626" metalness={0.1} roughness={0.3} />
          </mesh>
        ))}

        {/* Display digitale */}
        <mesh position={[0, bodyH*0.22, bodyD/2+0.01]}>
          <boxGeometry args={[0.44, 0.32, 0.03]} />
          <meshStandardMaterial color="#020617" metalness={0.2} roughness={0.1} />
        </mesh>
        {/* Glow display */}
        <mesh position={[0, bodyH*0.22, bodyD/2+0.02]}>
          <planeGeometry args={[0.40, 0.28]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.35} />
        </mesh>

        {/* Tastierino (3x4 bottoni) */}
        {[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]].map(([c,r], bi) => (
          <mesh key={bi} position={[-0.08+c*0.08, bodyH*-0.05-r*0.075, bodyD/2+0.01]}>
            <boxGeometry args={[0.055, 0.055, 0.02]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
          </mesh>
        ))}

        {/* Slot inserimento carta */}
        <mesh position={[0, -bodyH*0.36, bodyD/2+0.01]}>
          <boxGeometry args={[0.22, 0.05, 0.02]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Logo brand (rosso) */}
        <mesh position={[0, bodyH*0.42, bodyD/2+0.01]}>
          <planeGeometry args={[0.35, 0.12]} />
          <meshBasicMaterial color="#dc2626" />
        </mesh>

        {/* Cappello/sommità rosso */}
        <mesh position={[0, bodyH/2+0.12, 0]} castShadow>
          <boxGeometry args={[bodyW+0.1, 0.24, bodyD+0.1]} />
          <meshStandardMaterial {...RED_PAINTED} />
        </mesh>
      </group>

      {/* ── Pistole erogazione ── */}
      {Array.from({ length: nozzleCount }).map((_, ni) => {
        const side = ni % 2 === 0 ? 1 : -1; // lato sinistro/destro
        const row = Math.floor(ni / 2);      // riga dall'alto
        const nozzleX = side * (bodyW/2 + 0.35);
        const nozzleY = baseH + bodyH*0.7 - row * 0.42;
        const attachY  = baseH + bodyH*0.75 - row * 0.42;

        return (
          <group key={ni}>
            {/* Staffa portapistola */}
            <mesh position={[side*(bodyW/2+0.05), nozzleY, 0]}>
              <boxGeometry args={[0.22, 0.08, 0.18]} />
              <meshStandardMaterial {...METAL_DARK} />
            </mesh>

            {/* Pistola */}
            <group position={[nozzleX, nozzleY-0.12, 0]} rotation={[0.3, 0, side*0.4]}>
              {/* Maniglia */}
              <mesh>
                <boxGeometry args={[0.08, 0.32, 0.06]} />
                <meshStandardMaterial color="#111827" roughness={0.85} />
              </mesh>
              {/* Ugello */}
              <mesh position={[0, 0.23, 0]} rotation={[0.8, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.025, 0.25, 8]} />
                <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.2} />
              </mesh>
            </group>

            {/* Tuboflessibile pistola → corpo */}
            <Pipe
              start={[side*(bodyW/2+0.01), attachY, 0]}
              end={[nozzleX, nozzleY, 0.05]}
              radius={0.03}
              color="#0f172a"
            />
          </group>
        );
      })}

      {/* Label ID erogatore */}
      <Billboard position={[0, baseH + bodyH + 1.35, 0]}>
        <group>
          <mesh>
            <planeGeometry args={[2.2, 0.9]} />
            <meshStandardMaterial color="#0f172a" transparent opacity={0.88} />
          </mesh>
          <mesh position={[-1.06, 0, 0.01]}>
            <planeGeometry args={[0.07, 0.9]} />
            <meshBasicMaterial color="#dc2626" />
          </mesh>
          <Text position={[-0.85, 0.16, 0.02]} fontSize={0.3} color="#f1f5f9" fontWeight="900" anchorX="left">
            {`POMPA ${dispenserId}`}
          </Text>
          <Text position={[-0.85, -0.2, 0.02]} fontSize={0.22} color="#64748b" anchorX="left">
            {`${nozzleCount} PISTOL${nozzleCount !== 1 ? 'E' : 'A'}`}
          </Text>
        </group>
      </Billboard>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PENSILINA REALISTICA
// ─────────────────────────────────────────────────────────────────────────────
const Canopy = ({
  width, depth = 12, height = 6.5, columns
}: {
  width: number; depth?: number; height?: number; columns: number;
}) => {
  const columnPositions = useMemo(() => {
    const pos: number[] = [];
    const step = width / (columns - 1);
    for (let i = 0; i < columns; i++) pos.push(-width/2 + i * step);
    return pos;
  }, [width, columns]);

  const slabThickness = 0.45;
  const colR = 0.22;
  const colH = height;

  return (
    <group>
      {/* ── Solaio principale pensilina ── */}
      <mesh position={[0, height, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, slabThickness, depth]} />
        <meshStandardMaterial {...WHITE_PAINTED} />
      </mesh>

      {/* Bordo superiore colorato (fascia rossa) */}
      <mesh position={[0, height + slabThickness/2 + 0.06, 0]}>
        <boxGeometry args={[width + 0.3, 0.12, depth + 0.3]} />
        <meshStandardMaterial {...RED_PAINTED} />
      </mesh>

      {/* Travi trasversali sotto la pensilina */}
      {[-depth/2+1.5, 0, depth/2-1.5].map((z, i) => (
        <mesh key={i} position={[0, height - slabThickness/2 - 0.1, z]} castShadow>
          <boxGeometry args={[width, 0.2, 0.35]} />
          <meshStandardMaterial {...METAL_MID} />
        </mesh>
      ))}

      {/* Travi longitudinali */}
      {[-width/2+1, width/2-1].map((x, i) => (
        <mesh key={i} position={[x, height - slabThickness/2 - 0.1, 0]} castShadow>
          <boxGeometry args={[0.3, 0.2, depth]} />
          <meshStandardMaterial {...METAL_MID} />
        </mesh>
      ))}

      {/* ── Colonne ── */}
      {columnPositions.map((x, i) => (
        <group key={i}>
          {/* Colonna */}
          <mesh position={[x, colH/2, 0]} castShadow>
            <cylinderGeometry args={[colR, colR*1.1, colH, 16]} />
            <meshStandardMaterial {...METAL_LITE} />
          </mesh>
          {/* Capitello */}
          <mesh position={[x, colH - 0.06, 0]} castShadow>
            <cylinderGeometry args={[colR*1.5, colR, 0.25, 16]} />
            <meshStandardMaterial {...METAL_MID} />
          </mesh>
          {/* Base colonna */}
          <mesh position={[x, 0.1, 0]} castShadow>
            <cylinderGeometry args={[colR*1.8, colR*1.8, 0.2, 16]} />
            <meshStandardMaterial {...CONCRETE_DARK} />
          </mesh>
          {/* Placca ancoraggio */}
          <mesh position={[x, 0.01, 0]}>
            <boxGeometry args={[colR*3.5, 0.07, colR*3.5]} />
            <meshStandardMaterial {...METAL_DARK} />
          </mesh>
          {/* Bulloni piastra */}
          {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([bx, bz], bi) => (
            <Bolt key={bi} pos={[x + bx*colR*1.4, 0.05, bz*colR*1.4]} />
          ))}
        </group>
      ))}

      {/* ── Corpi illuminanti sulla pensilina ── */}
      {columnPositions.map((x, i) => (
        <group key={i} position={[x, height - slabThickness - 0.12, depth/4]}>
          <mesh>
            <boxGeometry args={[1.8, 0.12, 0.45]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.07, 0]}>
            <planeGeometry args={[1.6, 0.35]} />
            <meshBasicMaterial color="#fef9c3" transparent opacity={0.9} />
          </mesh>
        </group>
      ))}

      {/* Grondaia bordo anteriore */}
      <mesh position={[0, height - slabThickness/2, depth/2 + 0.15]}>
        <boxGeometry args={[width + 0.5, 0.14, 0.3]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, height - slabThickness/2, -depth/2 - 0.15]}>
        <boxGeometry args={[width + 0.5, 0.14, 0.3]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EDIFICIO KIOSK / STORE
// ─────────────────────────────────────────────────────────────────────────────
const KioskBuilding = ({ position }: { position: [number,number,number] }) => (
  <group position={position}>
    {/* Corpo */}
    <mesh castShadow receiveShadow>
      <boxGeometry args={[8, 3.8, 6]} />
      <meshStandardMaterial color="#f8fafc" metalness={0.05} roughness={0.7} />
    </mesh>
    {/* Tetto a falda */}
    <mesh position={[0, 2.7, 0]} castShadow>
      <boxGeometry args={[8.4, 0.45, 6.4]} />
      <meshStandardMaterial color="#dc2626" metalness={0.1} roughness={0.5} />
    </mesh>
    {/* Vetrina frontale */}
    <mesh position={[0, -0.2, 3.05]}>
      <boxGeometry args={[5.5, 2.5, 0.08]} />
      <meshStandardMaterial color="#bfdbfe" metalness={0.3} roughness={0.05} transparent opacity={0.65} />
    </mesh>
    {/* Porta */}
    <mesh position={[2.4, -0.6, 3.05]}>
      <boxGeometry args={[1.1, 1.9, 0.06]} />
      <meshStandardMaterial color="#93c5fd" metalness={0.2} roughness={0.1} transparent opacity={0.55} />
    </mesh>
    {/* Cornice porta */}
    <mesh position={[2.4, -0.6, 3.09]}>
      <boxGeometry args={[1.2, 2.0, 0.04]} />
      <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.3} />
    </mesh>
    {/* Insegna */}
    <mesh position={[0, 1.6, 3.07]}>
      <boxGeometry args={[4.0, 0.55, 0.04]} />
      <meshStandardMaterial color="#dc2626" metalness={0.05} roughness={0.4} />
    </mesh>
    <Text position={[0, 1.6, 3.12]} fontSize={0.32} color="#ffffff" fontWeight="900" anchorX="center">
      STORE
    </Text>
    {/* Muri laterali */}
    {[-4.05, 4.05].map((x, i) => (
      <mesh key={i} position={[x, -0.15, 0]}>
        <boxGeometry args={[0.18, 3.5, 6]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.0} roughness={0.8} />
      </mesh>
    ))}
  </group>
);

// ─────────────────────────────────────────────────────────────────────────────
// COLONNINA RIFORNIMENTO GPL / CNG (diversa dal dispenser classico)
// ─────────────────────────────────────────────────────────────────────────────
const GasColumn = ({ position }: { position: [number,number,number] }) => (
  <group position={position}>
    <mesh position={[0, 0.6, 0]} castShadow>
      <cylinderGeometry args={[0.25, 0.28, 1.2, 16]} />
      <meshStandardMaterial color="#f8fafc" metalness={0.1} roughness={0.3} />
    </mesh>
    <mesh position={[0, 1.28, 0]} castShadow>
      <cylinderGeometry args={[0.22, 0.25, 0.16, 16]} />
      <meshStandardMaterial color="#dc2626" metalness={0.1} roughness={0.3} />
    </mesh>
    <Pipe start={[0.25, 0.8, 0]} end={[0.5, 0.4, 0]} radius={0.035} color="#1e293b" />
  </group>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAVIMENTO IMPIANTO con marcature
// ─────────────────────────────────────────────────────────────────────────────
const Forecourt = ({
  width, depth
}: { width: number; depth: number }) => {
  return (
    <group>
      {/* Manto asfalto */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#1e293b" roughness={0.95} metalness={0.0} />
      </mesh>
      {/* Cordolo perimetrale bianco */}
      {[
        { pos: [0, 0.04, depth/2] as [number,number,number], args: [width+0.3, 0.06, 0.25] as [number,number,number] },
        { pos: [0, 0.04, -depth/2] as [number,number,number], args: [width+0.3, 0.06, 0.25] as [number,number,number] },
        { pos: [width/2, 0.04, 0] as [number,number,number], args: [0.25, 0.06, depth] as [number,number,number] },
        { pos: [-width/2, 0.04, 0] as [number,number,number], args: [0.25, 0.06, depth] as [number,number,number] },
      ].map((c, i) => (
        <mesh key={i} position={c.pos}>
          <boxGeometry args={c.args} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.85} />
        </mesh>
      ))}

      {/* Strisce gialle corsie */}
      {[-width/5, 0, width/5].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[x, 0.025, 0]}>
          <planeGeometry args={[0.18, depth * 0.6]} />
          <meshStandardMaterial color="#facc15" roughness={0.9} />
        </mesh>
      ))}

      {/* Frecce direzionali */}
      {[-width/5, width/5].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, i === 0 ? 0 : Math.PI]} position={[x, 0.026, depth/4]}>
          <planeGeometry args={[0.6, 1.2]} />
          <meshStandardMaterial color="#facc15" roughness={0.9} transparent opacity={0.85} />
        </mesh>
      ))}

      {/* Stop line */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.026, depth/2 - 2]}>
        <planeGeometry args={[width*0.8, 0.3]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PALO ILLUMINAZIONE
// ─────────────────────────────────────────────────────────────────────────────
const LightPole = ({ position }: { position: [number,number,number] }) => (
  <group position={position}>
    <mesh castShadow>
      <cylinderGeometry args={[0.1, 0.14, 8, 12]} />
      <meshStandardMaterial {...METAL_DARK} />
    </mesh>
    <mesh position={[0.55, 4.0, 0]} castShadow>
      <cylinderGeometry args={[0.06, 0.06, 1.1, 8]} />
      <meshStandardMaterial {...METAL_DARK} />
    </mesh>
    <mesh position={[1.08, 4.0, 0]}>
      <boxGeometry args={[0.45, 0.16, 0.25]} />
      <meshStandardMaterial color="#fef9c3" metalness={0.2} roughness={0.4} />
    </mesh>
    <pointLight position={[1.08, 3.85, 0]} intensity={0.6} color="#fef9c3" distance={18} decay={2} castShadow />
  </group>
);

// ─────────────────────────────────────────────────────────────────────────────
// MODELLO STAZIONE COMPLETO
// ─────────────────────────────────────────────────────────────────────────────
const StationModel = ({ installation }: { installation: Installation }) => {
  const { tanks, dispensers } = useMemo(() => {
    const tMap = new Map<string, any>();
    const dMap = new Map<string, any>();
    if (!installation?.rows) return { tanks: [], dispensers: [] };

    installation.rows.forEach(row => {
      // Tanks
      const tid = row['ID Serbatoio'];
      if (tid && tid !== '-' && tid !== 'N/D' && !tMap.has(tid)) {
        const volStr = (row['Volume Serbatoio'] || '0').replace(/\./g, '').replace(',', '.');
        const vol = parseFloat(volStr) || 0;
        const product = row['Prodotto Serbatoio'] || 'N/D';
        tMap.set(tid, { id: tid, volume: vol, product, color: getProductColor(product) });
      }
      // Dispensers
      const did = row['ID Erogatore'];
      if (did && did !== '-' && did !== 'N/D' && did !== '0') {
        if (!dMap.has(did)) dMap.set(did, { id: did, nozzles: 0 });
        const n = parseInt(row['Pistole Erogatore'] || '0', 10);
        if (n > dMap.get(did).nozzles) dMap.get(did).nozzles = n;
      }
    });

    return {
      tanks: Array.from(tMap.values()),
      dispensers: Array.from(dMap.values()),
    };
  }, [installation]);

  // ── Layout ──
  const TANK_SPACING   = 12;
  const DISP_SPACING   = 6.5;
  const TANK_Z         = -14;
  const DISP_Z         = 5;
  const KIOSK_Z        = 18;

  const tanksW   = Math.max(tanks.length * TANK_SPACING, 24);
  const dispsW   = Math.max(dispensers.length * DISP_SPACING, 18);
  const tanksX0  = -((tanks.length - 1) * TANK_SPACING) / 2;
  const dispsX0  = -((dispensers.length - 1) * DISP_SPACING) / 2;

  const canopyW  = Math.max(dispsW + 10, tanks.length === 0 ? 28 : dispsW + 10);
  const canopyCols = Math.max(2, Math.min(6, dispensers.length + 1));
  const totalW   = Math.max(tanksW + 14, canopyW + 14);

  return (
    <group>
      {/* ── Terreno esteso ── */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#1a2e1a" roughness={0.95} />
      </mesh>

      {/* ── Pavimento impianto ── */}
      <Forecourt width={totalW} depth={48} />

      {/* ── Area serbatoi (cemento separato) ── */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, TANK_Z]} receiveShadow>
        <planeGeometry args={[tanksW + 18, 16]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>
      {/* Cordolo area serbatoi */}
      <mesh position={[0, 0.12, TANK_Z]} castShadow>
        <boxGeometry args={[tanksW + 18, 0.24, 16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>

      {/* ── Serbatoi ── */}
      {tanks.map((t, i) => (
        <AboveGroundTank
          key={t.id}
          position={[tanksX0 + i * TANK_SPACING, 0.24, TANK_Z]}
          volume={t.volume}
          product={t.product}
          color={t.color}
          tankId={t.id}
          index={i}
        />
      ))}

      {/* ── Pensilina ── */}
      {dispensers.length > 0 && (
        <Canopy
          width={canopyW}
          depth={12}
          height={6.5}
          columns={canopyCols}
        />
      )}

      {/* ── Erogatori ── */}
      {dispensers.map((d, i) => (
        <Dispenser
          key={d.id}
          position={[dispsX0 + i * DISP_SPACING, 0, DISP_Z]}
          nozzles={d.nozzles}
          dispenserId={d.id}
          index={i}
        />
      ))}

      {/* ── Kiosk / Store ── */}
      <KioskBuilding position={[0, 1.9, KIOSK_Z]} />

      {/* ── Pali illuminazione perimetrali ── */}
      {[
        [-totalW/2 + 2, 0, -22] as [number,number,number],
        [ totalW/2 - 2, 0, -22] as [number,number,number],
        [-totalW/2 + 2, 0,  20] as [number,number,number],
        [ totalW/2 - 2, 0,  20] as [number,number,number],
      ].map((p, i) => <LightPole key={i} position={p} />)}

      {/* ── Recinzione/Cordolo perimetrale ── */}
      {[
        { pos: [0, 0.3, -24] as [number,number,number],     args: [totalW+2, 0.6, 0.3] as [number,number,number] },
        { pos: [totalW/2+1, 0.3, -2] as [number,number,number], args: [0.3, 0.6, 44] as [number,number,number] },
        { pos: [-totalW/2-1, 0.3, -2] as [number,number,number], args: [0.3, 0.6, 44] as [number,number,number] },
      ].map((c, i) => (
        <mesh key={i} position={c.pos} castShadow>
          <boxGeometry args={c.args} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
        </mesh>
      ))}

      {/* ── Illuminazione scena ── */}
      <ambientLight intensity={0.55} color="#e0e7ff" />
      <directionalLight
        position={[60, 120, 60]}
        intensity={1.8}
        color="#fff7ed"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={300}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <directionalLight position={[-40, 60, -40]} intensity={0.4} color="#dbeafe" />
      <pointLight position={[0, 25, DISP_Z]} intensity={0.8} color="#fff7ed" distance={80} decay={2} />
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// INFO PANEL OVERLAY (HTML)
// ─────────────────────────────────────────────────────────────────────────────
const InfoPanel = ({ installation }: { installation: Installation }) => {
  const { tanks, dispensers } = useMemo(() => {
    const tMap = new Map<string, any>();
    const dMap = new Map<string, any>();
    installation.rows.forEach(row => {
      const tid = row['ID Serbatoio'];
      if (tid && tid !== '-' && !tMap.has(tid)) {
        const v = parseFloat((row['Volume Serbatoio']||'0').replace(/\./g,'').replace(',','.')) || 0;
        tMap.set(tid, { id: tid, vol: v, product: row['Prodotto Serbatoio']||'N/D' });
      }
      const did = row['ID Erogatore'];
      if (did && did !== '-' && !dMap.has(did)) {
        dMap.set(did, { id: did, nozzles: parseInt(row['Pistole Erogatore']||'0',10) });
      }
    });
    return { tanks: Array.from(tMap.values()), dispensers: Array.from(dMap.values()) };
  }, [installation]);

  return (
    <div className="absolute bottom-4 left-4 z-10 space-y-2 pointer-events-none">
      <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-xl p-3 text-[10px] font-mono text-slate-400 space-y-1 max-w-[260px]">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-1 mb-2">NODE_SPEC</p>
        <div className="flex justify-between"><span>SERBATOI</span><span className="text-blue-400 font-bold">{tanks.length}×</span></div>
        <div className="flex justify-between"><span>EROGATORI</span><span className="text-emerald-400 font-bold">{dispensers.length}×</span></div>
        <div className="flex justify-between"><span>PISTOLE TOT</span><span className="text-amber-400 font-bold">{dispensers.reduce((a,d)=>a+d.nozzles,0)}×</span></div>
        <div className="flex justify-between"><span>VOL TOT</span><span className="text-indigo-400 font-bold">{tanks.reduce((a,t)=>a+t.vol,0).toLocaleString('it-IT')} Kl</span></div>
      </div>
      <div className="bg-slate-950/60 backdrop-blur-md border border-white/5 rounded-xl px-3 py-2 text-[9px] font-mono text-slate-600 max-w-[260px]">
        🖱 Trascina per ruotare · Scroll per zoom
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────
const Plant3D: React.FC<{ installation: Installation }> = ({ installation }) => {
  return (
    <div className="w-full h-[500px] md:h-[640px] rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl"
      style={{ background: 'linear-gradient(to bottom, #1e3a5f 0%, #0f2744 40%, #1a2e1a 100%)' }}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [55, 38, 55], fov: 28 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      >
        <fog attach="fog" args={['#0f2744', 120, 380]} />
        <Suspense fallback={null}>
          <StationModel installation={installation} />
          <Environment preset="sunset" />
          <ContactShadows
            position={[0, 0.05, 0]}
            opacity={0.55}
            scale={250}
            blur={3.5}
            far={50}
            color="#0f172a"
          />
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
        </Suspense>
        <OrbitControls
          enablePan={true}
          minDistance={22}
          maxDistance={300}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 4, 0]}
          enableDamping
          dampingFactor={0.06}
        />
      </Canvas>
      <InfoPanel installation={installation} />
    </div>
  );
};

export default Plant3D;
