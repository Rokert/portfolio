"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import * as THREE from "three";

const CARDS = [
  { pos: [-1.5, 0.2, -0.5] as [number, number, number], rot: [-0.1, -0.3, 0.08] as [number, number, number], color: "#06b6d4", label: "Cosmic" },
  { pos: [0, 0, 0] as [number, number, number], rot: [0.05, 0.1, -0.04] as [number, number, number], color: "#a855f7", label: "Storm" },
  { pos: [1.5, -0.2, -0.3] as [number, number, number], rot: [-0.08, 0.2, 0.06] as [number, number, number], color: "#f97316", label: "Inferno" },
];

function BattlepassCard({
  position,
  rotation,
  color,
  index,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  index: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock, pointer }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.x = rotation[0] + pointer.y * -0.15 + Math.sin(t * 0.5 + index) * 0.02;
    ref.current.rotation.y = rotation[1] + pointer.x * 0.25;
    ref.current.rotation.z = rotation[2];
    ref.current.position.y = position[1] + Math.sin(t * 0.6 + index * 1.2) * 0.06;
  });

  return (
    <group ref={ref} position={position}>
      {/* Card body */}
      <mesh>
        <boxGeometry args={[0.85, 1.2, 0.025]} />
        <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Colored glow face */}
      <mesh position={[0, 0, 0.013]}>
        <planeGeometry args={[0.82, 1.17]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.15}
        />
      </mesh>
      {/* Edge glow */}
      <lineSegments position={[0, 0, 0.014]}>
        <edgesGeometry args={[new THREE.BoxGeometry(0.85, 1.2, 0.001)]} />
        <lineBasicMaterial color={color} transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}

export default function PeerDemo() {
  return (
    <div className="relative w-full h-full min-h-[300px]">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 3, 3]} intensity={1.5} color="#fff" />
        <pointLight position={[-3, -2, 1]} intensity={0.8} color="#06b6d4" />
        <pointLight position={[3, -1, 1]} intensity={0.6} color="#a855f7" />
        <Environment preset="night" />
        {CARDS.map((card, i) => (
          <Float key={i} speed={0.8 + i * 0.2} floatIntensity={0.1}>
            <BattlepassCard
              position={card.pos}
              rotation={card.rot}
              color={card.color}
              index={i}
            />
          </Float>
        ))}
      </Canvas>
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/20">
        mueve el cursor · Peer battlepass cards
      </p>
    </div>
  );
}
