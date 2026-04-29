import React, { Suspense, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera, ContactShadows, Text } from '@react-three/drei';
import { Installation } from '../types';

interface Plant2DProps {
  installation: Installation;
  onCapture?: (dataUrl: string) => void;
}

const getProductColor = (product: string) => {
  const p = product.toLowerCase();
  if (p.includes('benzina')) return '#22c55e';
  if (p.includes('gasolio')) return '#eab308';
  if (p.includes('supreme') || p.includes('plus')) return '#3b82f6';
  if (p.includes('gpl')) return '#f97316';
  if (p.includes('metano')) return '#06b6d4';
  return '#8b5cf6';
};

const Tank2D = ({ position, volume, product, color }: { position: [number, number, number], volume: number, product: string, color: string }) => {
  const radius = 0.7;
  const length = Math.max(2, Math.min(6, volume / 8 + 1.5));
  
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, length, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.25}
        color="#1e293b"
        anchorX="center"
        fontWeight="bold"
      >
        {`${product}\n${volume} Kl`}
      </Text>
    </group>
  );
};

const Dispenser2D = ({ position, label }: { position: [number, number, number], label: string }) => {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.8, 0.4, 0.5]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.2}
        color="#1e293b"
        anchorX="center"
      >
        {label}
      </Text>
    </group>
  );
};

const StationModel2D = ({ installation }: { installation: Installation }) => {
  const { tanks, dispensers } = useMemo(() => {
    const seenTanks = new Set<string>();
    const parsedTanks: any[] = [];
    const seenDispensers = new Set<string>();
    const parsedDispensers: any[] = [];

    installation.rows.forEach(row => {
      const tankId = row["ID Serbatoio"];
      if (tankId && tankId !== "-" && !seenTanks.has(tankId)) {
        seenTanks.add(tankId);
        const rawVol = row["Volume Serbatoio"] || '0';
        const cleanVol = rawVol.replace(/\./g, '').replace(',', '.');
        const vol = parseFloat(cleanVol) || 0;
        const product = row["Prodotto Serbatoio"] || 'N/D';
        parsedTanks.push({ id: tankId, volume: vol, product, color: getProductColor(product) });
      }

      const dispId = row["ID Erogatore"];
      if (dispId && dispId !== "-" && !seenDispensers.has(dispId)) {
        seenDispensers.add(dispId);
        parsedDispensers.push({ id: dispId });
      }
    });

    return { tanks: parsedTanks, dispensers: parsedDispensers };
  }, [installation]);

  const tankSpacing = 6;
  const dispSpacing = 4;
  const tanksStartX = -((tanks.length - 1) * tankSpacing) / 2;
  const dispStartX = -((dispensers.length - 1) * dispSpacing) / 2;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {/* Tanks */}
      <group position={[0, 0, 6]}>
        {tanks.map((tank) => (
          <Tank2D 
            key={tank.id} 
            position={[tanksStartX + tanks.indexOf(tank) * tankSpacing, 0, 0]} 
            volume={tank.volume} 
            product={tank.product} 
            color={tank.color} 
          />
        ))}
      </group>

      {/* Dispensers */}
      <group position={[0, 0, -2]}>
        {dispensers.map((disp) => (
          <Dispenser2D 
            key={disp.id} 
            position={[dispStartX + dispensers.indexOf(disp) * dispSpacing, 0, 0]} 
            label={`P${disp.id}`} 
          />
        ))}
      </group>

      <ambientLight intensity={1.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
    </group>
  );
};

const CameraSetup = () => {
  const { camera } = useThree();
  React.useEffect(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
};

const Plant2D: React.FC<Plant2DProps> = ({ installation, onCapture }) => {
  const handleCreated = ({ gl, scene, camera }: any) => {
    // Set a solid background color to avoid transparency issues in PDF
    gl.setClearColor('#ffffff', 1);
    
    if (onCapture) {
      const capture = () => {
        // Ensure the camera is looking at the center
        camera.lookAt(0, 0, 0);
        gl.render(scene, camera);
        
        const dataUrl = gl.domElement.toDataURL('image/png');
        // A valid 1200x600 PNG with content should be significantly larger than 5KB
        if (dataUrl && dataUrl.length > 5000) {
          onCapture(dataUrl);
        } else {
          // Retry with a slightly longer delay if it looks empty
          setTimeout(() => {
            gl.render(scene, camera);
            const retryUrl = gl.domElement.toDataURL('image/png');
            if (retryUrl && retryUrl.length > 2000) {
              onCapture(retryUrl);
            }
          }, 1000);
        }
      };
      // Wait for Suspense and Text components to settle
      setTimeout(capture, 2500);
    }
  };

  return (
    <div style={{ width: '1200px', height: '600px', background: '#ffffff', position: 'relative' }}>
      <Canvas 
        gl={{ 
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: false // Disable alpha for solid background
        }}
        onCreated={handleCreated}
      >
        <OrthographicCamera 
          makeDefault 
          position={[0, 30, 0]} 
          zoom={40} 
          up={[0, 0, -1]} 
        />
        <CameraSetup />
        <Suspense fallback={null}>
          <StationModel2D installation={installation} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Plant2D;
