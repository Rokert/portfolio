"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const glslFrag = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1,0)), f.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for(int i = 0; i < 5; i++) {
      v += amp * noise(p);
      p = p * 2.1 + vec2(1.7, 9.2);
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.25;

    float n = fbm(uv * 3.0 + vec2(t * 0.5, t));
    float n2 = fbm(uv * 2.0 - vec2(t * 0.3, t * 0.8) + n * 0.5);

    vec3 c1 = vec3(0.94, 0.0, 0.55);   // magenta
    vec3 c2 = vec3(0.0, 0.1, 0.9);     // deep blue
    vec3 c3 = vec3(0.05, 0.02, 0.12);  // dark

    vec3 col = mix(c3, c2, n2);
    col = mix(col, c1, n * 0.6);

    float bloom = smoothstep(0.5, 0.8, n2) * 0.5;
    col += vec3(1.0, 0.3, 0.8) * bloom;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const glslVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function ShaderPlane() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh>
      <planeGeometry args={[4, 3, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={glslVert}
        fragmentShader={glslFrag}
        uniforms={{ uTime: { value: 0 } }}
      />
    </mesh>
  );
}

export default function MakataWebsiteDemo() {
  return (
    <div className="relative w-full h-full min-h-[300px]">
      <Canvas camera={{ position: [0, 0, 1.5], fov: 60 }} gl={{ antialias: true }}>
        <ShaderPlane />
      </Canvas>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-white font-semibold text-2xl tracking-widest uppercase mix-blend-overlay">
          Makata
        </p>
        <p className="text-white/40 text-xs font-mono mt-1 mix-blend-overlay">Studio</p>
      </div>
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/20">
        Makata Website · GLSL fbm shader + SelectiveBloom
      </p>
    </div>
  );
}
