"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

interface MaterialParams {
  roughness: number;
  metalness: number;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  wireframe: boolean;
}

const PRESETS: { name: string; params: MaterialParams }[] = [
  { name: "Chrome", params: { roughness: 0.05, metalness: 1.0, color: "#cccccc", emissive: "#000000", emissiveIntensity: 0, wireframe: false } },
  { name: "Brushed Gold", params: { roughness: 0.35, metalness: 0.9, color: "#d4af37", emissive: "#3a2a00", emissiveIntensity: 0.2, wireframe: false } },
  { name: "Matte Obsidian", params: { roughness: 0.9, metalness: 0.0, color: "#1a1a2e", emissive: "#000033", emissiveIntensity: 0.1, wireframe: false } },
  { name: "Neon Emission", params: { roughness: 0.5, metalness: 0.1, color: "#0a0a0a", emissive: "#00ff88", emissiveIntensity: 1.5, wireframe: false } },
  { name: "Wireframe", params: { roughness: 0.5, metalness: 0.0, color: "#00ff88", emissive: "#000000", emissiveIntensity: 0, wireframe: true } },
];

function PreviewMesh({ params }: { params: MaterialParams }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.4;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.2;
    }
  });

  return (
    <RoundedBox ref={ref} args={[1.6, 1.6, 1.6]} radius={0.12} smoothness={6}>
      <meshStandardMaterial
        color={params.color}
        roughness={params.roughness}
        metalness={params.metalness}
        emissive={params.emissive}
        emissiveIntensity={params.emissiveIntensity}
        wireframe={params.wireframe}
      />
    </RoundedBox>
  );
}

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-white/40 w-20 shrink-0">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-0.5 accent-green-400"
      />
      <span className="text-[10px] font-mono text-white/60 w-8 text-right">{value.toFixed(2)}</span>
    </div>
  );
}

export default function MeltynDemo() {
  const [params, setParams] = useState<MaterialParams>(PRESETS[0].params);
  const [activePreset, setActivePreset] = useState(0);

  const set = (key: keyof MaterialParams, value: number | string | boolean) =>
    setParams((p) => ({ ...p, [key]: value }));

  const applyPreset = (i: number) => {
    setActivePreset(i);
    setParams(PRESETS[i].params);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0d0d] overflow-hidden">
      {/* Unity-style toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1a1a] border-b border-white/10 shrink-0">
        <span className="text-[10px] font-mono text-white/30">Meltyn</span>
        <span className="text-white/10 mx-1">|</span>
        <span className="text-[10px] font-mono text-white/30">Material Preview</span>
        <div className="ml-auto flex gap-1">
          {["Scene", "Game", "Inspector"].map((t) => (
            <span key={t} className={`text-[9px] font-mono px-2 py-0.5 rounded ${t === "Scene" ? "bg-[#2a2a2a] text-white/60" : "text-white/20"}`}>{t}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* 3D Viewport */}
        <div className="flex-1 min-w-0 relative">
          {/* Unity grid overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-10"
            style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />
          <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }}>
            <ambientLight intensity={0.4} />
            <pointLight position={[3, 3, 3]} intensity={2} />
            <pointLight position={[-3, -2, 2]} intensity={0.8} color="#8888ff" />
            <Environment preset="studio" />
            <PreviewMesh params={params} />
          </Canvas>

          {/* Viewport label */}
          <div className="absolute top-2 left-2 text-[9px] font-mono text-white/20">Perspective</div>
        </div>

        {/* Inspector panel */}
        <div className="w-52 shrink-0 bg-[#111] border-l border-white/10 flex flex-col overflow-y-auto">
          {/* Presets */}
          <div className="p-3 border-b border-white/10">
            <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Presets</p>
            <div className="flex flex-col gap-1">
              {PRESETS.map((preset, i) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(i)}
                  className={`text-left text-[10px] font-mono px-2 py-1 rounded transition-colors ${
                    activePreset === i ? "bg-[#2a2a2a] text-white" : "text-white/40 hover:text-white/60"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Material properties */}
          <div className="p-3 flex flex-col gap-3">
            <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Material</p>

            <Slider label="Roughness" value={params.roughness} min={0} max={1} step={0.01} onChange={(v) => set("roughness", v)} />
            <Slider label="Metalness" value={params.metalness} min={0} max={1} step={0.01} onChange={(v) => set("metalness", v)} />
            <Slider label="Emission" value={params.emissiveIntensity} min={0} max={3} step={0.05} onChange={(v) => set("emissiveIntensity", v)} />

            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono text-white/40 w-20 shrink-0">Albedo</span>
              <input type="color" value={params.color} onChange={(e) => set("color", e.target.value)}
                className="w-6 h-5 rounded cursor-pointer border-0 bg-transparent" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-white/40 w-20 shrink-0">Emissive</span>
              <input type="color" value={params.emissive} onChange={(e) => set("emissive", e.target.value)}
                className="w-6 h-5 rounded cursor-pointer border-0 bg-transparent" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input type="checkbox" checked={params.wireframe} onChange={(e) => set("wireframe", e.target.checked)}
                className="accent-green-400" />
              <span className="text-[10px] font-mono text-white/50">Wireframe</span>
            </label>
          </div>
        </div>
      </div>

      <div className="px-4 py-1.5 border-t border-white/10 text-center text-[10px] font-mono text-white/20 shrink-0 bg-[#0d0d0d]">
        Meltyn · Unity ShaderLab / HLSL
      </div>
    </div>
  );
}
