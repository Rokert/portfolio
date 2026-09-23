"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Environment } from "@react-three/drei";
import * as THREE from "three";

const hologramVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uTime;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec3 pos = position;
    pos.z += sin(pos.y * 8.0 + uTime * 2.0) * 0.004;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const hologramFrag = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uTime;
  uniform vec3 uColor;

  void main() {
    float scanline = sin(vUv.y * 120.0 + uTime * 3.0) * 0.04 + 0.96;
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    float grid = step(0.97, sin(vUv.x * 40.0)) + step(0.97, sin(vUv.y * 60.0));
    grid = clamp(grid, 0.0, 1.0) * 0.3;
    float alpha = (fresnel * 0.6 + 0.2 + grid) * scanline;
    gl_FragColor = vec4(uColor * (0.8 + fresnel * 0.6), alpha * 0.85);
  }
`;

function HologramCard() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock, pointer }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.y = pointer.x * 0.6 + Math.sin(t * 0.4) * 0.1;
    meshRef.current.rotation.x = -pointer.y * 0.3;
    if (matRef.current) matRef.current.uniforms.uTime.value = t;
  });

  return (
    <mesh ref={meshRef}>
      <RoundedBox args={[1.4, 2, 0.04]} radius={0.06} smoothness={4}>
        <shaderMaterial
          ref={matRef}
          vertexShader={hologramVert}
          fragmentShader={hologramFrag}
          uniforms={{
            uTime: { value: 0 },
            uColor: { value: new THREE.Color("#a855f7") },
          }}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </RoundedBox>

      {/* Inner glow plane */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[1.35, 1.95]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.04} />
      </mesh>
    </mesh>
  );
}

function Particles() {
  const count = 60;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 4;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
  }

  const ref = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color="#a855f7" size={0.015} transparent opacity={0.5} />
    </points>
  );
}

export default function TroveDemo() {
  return (
    <div className="w-full h-full min-h-[300px]">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[2, 2, 2]} intensity={0.8} color="#a855f7" />
        <pointLight position={[-2, -1, 1]} intensity={0.4} color="#06b6d4" />
        <Environment preset="night" />
        <HologramCard />
        <Particles />
      </Canvas>
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/20">
        mueve el cursor · TROVE hologram shader
      </p>
    </div>
  );
}
