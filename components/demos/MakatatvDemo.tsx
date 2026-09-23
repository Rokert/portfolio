"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Environment, Float } from "@react-three/drei";
import * as THREE from "three";

const fireSweepFrag = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uExplode;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.8;
    float n = noise(uv * 4.0 + vec2(0.0, -t));
    n += noise(uv * 8.0 + vec2(0.0, -t * 1.5)) * 0.5;
    float fire = smoothstep(0.3, 0.9, n) * (1.0 - uv.y);
    float sweep = smoothstep(uExplode - 0.1, uExplode, uv.y + noise(vec2(uv.x * 6.0, t)) * 0.1);

    vec3 fireColor = mix(vec3(1.0, 0.2, 0.0), vec3(1.0, 0.8, 0.0), fire);
    fireColor = mix(fireColor, vec3(1.0, 1.0, 0.9), fire * 0.4);

    float glow = sweep * 0.4;
    vec3 col = mix(vec3(0.0), fireColor, fire * (1.0 - sweep));
    col += vec3(0.8, 0.4, 0.1) * glow;

    gl_FragColor = vec4(col, fire * 0.9 + glow * 0.5);
  }
`;

const fireVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function TVModel({ exploding }: { exploding: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const explodeRef = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.15;
      if (exploding) {
        explodeRef.current = Math.min(explodeRef.current + 0.015, 1.2);
        groupRef.current.position.y = Math.sin(explodeRef.current * Math.PI) * 0.2;
      } else {
        explodeRef.current = Math.max(explodeRef.current - 0.02, 0);
      }
    }
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = t;
      matRef.current.uniforms.uExplode.value = explodeRef.current;
    }
  });

  return (
    <group ref={groupRef}>
      {/* TV body */}
      <RoundedBox args={[2, 1.3, 0.18]} radius={0.06} position={[0, 0.1, 0]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} />
      </RoundedBox>

      {/* Screen */}
      <mesh position={[0, 0.1, 0.1]}>
        <planeGeometry args={[1.75, 1.05]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={fireVert}
          fragmentShader={fireSweepFrag}
          uniforms={{ uTime: { value: 0 }, uExplode: { value: 0 } }}
          transparent
        />
      </mesh>

      {/* Screen base color */}
      <mesh position={[0, 0.1, 0.09]}>
        <planeGeometry args={[1.75, 1.05]} />
        <meshBasicMaterial color="#050505" />
      </mesh>

      {/* Stand */}
      <mesh position={[0, -0.6, 0]}>
        <boxGeometry args={[0.2, 0.3, 0.12]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.78, 0]}>
        <boxGeometry args={[0.7, 0.04, 0.25]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>
    </group>
  );
}

export default function MakatatvDemo() {
  const [exploding, setExploding] = useState(false);

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[3, 3, 3]} intensity={1} color="#fff" />
        <pointLight position={[-2, -2, 1]} intensity={0.5} color="#f97316" />
        <Environment preset="city" />
        <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.2}>
          <TVModel exploding={exploding} />
        </Float>
      </Canvas>

      <button
        onClick={() => setExploding((v) => !v)}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-mono px-4 py-2 rounded-full border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 transition-colors"
      >
        {exploding ? "■ detener" : "▶ play explosion"}
      </button>
      <p className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/20 whitespace-nowrap">
        makata.tv · fire-sweep shader
      </p>
    </div>
  );
}
