import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, Environment, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { WaterGlass3D } from '../dashboard/components/indicators';

// --- Avatar Component ---
function PlayerAvatar({ position, targetPosition }: { position: THREE.Vector3, targetPosition: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Lerp position towards target
      groupRef.current.position.lerp(targetPosition, delta * 4);
      
      // Look at target if moving
      const distance = groupRef.current.position.distanceTo(targetPosition);
      if (distance > 0.1) {
         // Create a lookAt vector on the XZ plane
         const lookAtPos = new THREE.Vector3(targetPosition.x, groupRef.current.position.y, targetPosition.z);
         groupRef.current.lookAt(lookAtPos);
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.3, 0.9, 4, 16]} />
        <meshStandardMaterial color="#00B894" />
      </mesh>
      {/* Rosto / Direção */}
      <mesh position={[0, 1.2, 0.25]}>
        <boxGeometry args={[0.4, 0.2, 0.2]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}

// --- Interactive Object Component ---
function InteractiveZone({ 
  position, 
  color, 
  label, 
  onClick 
}: { 
  position: [number, number, number], 
  color: string, 
  label: string, 
  onClick?: () => void 
}) {
  const [hovered, setHovered] = useState(false);
  const scale = hovered ? 1.1 : 1.0;

  return (
    <group position={position}>
      <mesh 
        castShadow 
        receiveShadow 
        position={[0, 0.5, 0]} 
        scale={scale}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default'; }}
        onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000"
      >
        {label}
      </Text>
    </group>
  );
}

export interface MetaverseWorldProps {
  onNavigate: (tab: any) => void;
  hydrationData: { currentAmount: number, dailyGoal: number };
}

export function MetaverseWorld({ onNavigate, hydrationData }: MetaverseWorldProps) {
  const [targetPos, setTargetPos] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  const handleFloorClick = (e: any) => {
    e.stopPropagation();
    if (e.point) {
      // Set new target position on the XZ plane
      setTargetPos(new THREE.Vector3(e.point.x, 0, e.point.z));
    }
  };

  return (
    <div className="w-full h-full bg-slate-900 absolute inset-0">
      <Canvas shadows>
        <OrthographicCamera 
          makeDefault 
          position={[10, 10, 10]} 
          zoom={60} 
          near={0.1} 
          far={100}
        />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        
        {/* Floor */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          receiveShadow 
          onClick={handleFloorClick}
          onPointerMove={(e) => {
              // Optional: show cursor interaction for walking
          }}
        >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#2d3748" />
          <gridHelper args={[20, 20, 0x4a5568, 0x4a5568]} rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0.01]} />
        </mesh>

        {/* Walls */}
        <mesh position={[0, 1, -10]} receiveShadow>
           <boxGeometry args={[20, 2, 0.5]} />
           <meshStandardMaterial color="#4a5568" />
        </mesh>
        <mesh position={[-10, 1, 0]} receiveShadow>
           <boxGeometry args={[0.5, 2, 20]} />
           <meshStandardMaterial color="#4a5568" />
        </mesh>

        {/* Player Avatar */}
        <PlayerAvatar position={new THREE.Vector3(0, 0, 0)} targetPosition={targetPos} />

        {/* Zones */}
        <group position={[5, 1, -5]}>
           {/* Glass as HTML overlay in 3D space */}
           <Html transform distanceFactor={10} zIndexRange={[100, 0]}>
             <div 
               className="cursor-pointer" 
               onClick={(e) => { e.stopPropagation(); onNavigate('home'); }}
               style={{ width: '250px', height: '345px' }}
             >
               <WaterGlass3D 
                 currentAmount={hydrationData.currentAmount}
                 dailyGoal={hydrationData.dailyGoal}
                 size="lg"
                 animated={true}
               />
             </div>
           </Html>
        </group>
        
        <InteractiveZone 
          position={[-5, 0, -5]} 
          color="#E53E3E" 
          label="Fliperama (Minigames)" 
          onClick={() => onNavigate('minigames')}
        />
        
        <InteractiveZone 
          position={[5, 0, 5]} 
          color="#805AD5" 
          label="Cama (Perfil)" 
          onClick={() => onNavigate('profile')}
        />

        <Environment preset="city" />
      </Canvas>
      
      {/* UI Overlay placeholder */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <h1 className="text-2xl font-bold text-white drop-shadow-md">Hydropush 3D Base</h1>
        <p className="text-gray-300">Toque no chão para andar.</p>
      </div>
    </div>
  );
}
