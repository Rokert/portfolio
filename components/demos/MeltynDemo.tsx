"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// ── Types ──────────────────────────────────────────────────────────────────

interface MatParams {
  roughness: number;
  metalness: number;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  wireframe: boolean;
}
type Shape    = "sphere" | "cube" | "torus";
type InspTab  = "presets" | "material" | "stats";

// ── Presets ────────────────────────────────────────────────────────────────

const PRESETS: { name: string; group: string; params: MatParams }[] = [
  { name: "Chrome",       group: "Metal",    params: { roughness: 0.04, metalness: 1.0,  color: "#c8c8c8", emissive: "#000000", emissiveIntensity: 0,    wireframe: false } },
  { name: "Brushed Gold", group: "Metal",    params: { roughness: 0.38, metalness: 0.9,  color: "#d4a832", emissive: "#3a2500", emissiveIntensity: 0.12, wireframe: false } },
  { name: "Matte Black",  group: "Surface",  params: { roughness: 0.92, metalness: 0.0,  color: "#111111", emissive: "#000000", emissiveIntensity: 0,    wireframe: false } },
  { name: "Ceramic",      group: "Surface",  params: { roughness: 0.62, metalness: 0.0,  color: "#e8e0d8", emissive: "#000000", emissiveIntensity: 0,    wireframe: false } },
  { name: "Neon Glow",    group: "Emissive", params: { roughness: 0.5,  metalness: 0.05, color: "#050505", emissive: "#00ff88", emissiveIntensity: 2.0,  wireframe: false } },
  { name: "Wireframe",    group: "Debug",    params: { roughness: 0.5,  metalness: 0.0,  color: "#00ff88", emissive: "#000000", emissiveIntensity: 0,    wireframe: true  } },
];

const SHAPE_STATS: Record<Shape, { verts: string; tris: string }> = {
  sphere: { verts: "4 225", tris: "8 192" },
  cube:   { verts: "3 136", tris: "4 608" },
  torus:  { verts: "3 333", tris: "6 400" },
};

// ── Preview mesh ───────────────────────────────────────────────────────────

function PreviewMesh({ params, shape }: { params: MatParams; shape: Shape }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.44;
    groupRef.current.rotation.x = Math.sin(t * 0.31) * 0.18;
  });

  const mat = {
    color: params.color, roughness: params.roughness, metalness: params.metalness,
    emissive: params.emissive, emissiveIntensity: params.emissiveIntensity, wireframe: params.wireframe,
  };

  return (
    <group ref={groupRef}>
      {shape === "sphere" && <mesh><sphereGeometry args={[0.82, 64, 64]} /><meshStandardMaterial {...mat} /></mesh>}
      {shape === "cube"   && <RoundedBox args={[1.35, 1.35, 1.35]} radius={0.1} smoothness={5}><meshStandardMaterial {...mat} /></RoundedBox>}
      {shape === "torus"  && <mesh><torusGeometry args={[0.6, 0.24, 32, 100]} /><meshStandardMaterial {...mat} /></mesh>}
    </group>
  );
}

// ── Slider ─────────────────────────────────────────────────────────────────

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] font-mono text-white/32 w-[56px] shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-[2px] accent-emerald-400 cursor-pointer min-w-0" />
      <span className="text-[8px] font-mono text-white/50 w-6 text-right tabular-nums shrink-0">{value.toFixed(2)}</span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function MeltynDemo() {
  const [params, setParams]       = useState<MatParams>({ ...PRESETS[0].params });
  const [activePreset, setPreset] = useState(0);
  const [shape, setShape]         = useState<Shape>("sphere");
  const [inspTab, setInspTab]     = useState<InspTab>("presets");

  const set = (key: keyof MatParams, val: number | string | boolean) =>
    setParams(p => ({ ...p, [key]: val }));

  const applyPreset = (i: number) => { setPreset(i); setParams({ ...PRESETS[i].params }); };

  const stats = SHAPE_STATS[shape];

  return (
    <div className="w-full h-full flex flex-col bg-[#0c0c0c] overflow-hidden select-none">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 py-[5px] bg-[#181818] border-b border-white/[0.07] shrink-0">
        <span className="text-[9px] font-mono font-semibold text-white/38">Meltyn</span>
        <span className="text-white/10">|</span>
        <span className="text-[8px] font-mono text-white/18">Material Preview</span>
        <div className="ml-auto flex">
          {["Scene", "Game", "Inspector"].map((t, i) => (
            <span key={t} className={`text-[8px] font-mono px-2 py-0.5 ${i === 0 ? "bg-[#252525] text-white/55 rounded-sm" : "text-white/14"}`}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── Viewport (full width) + overlaid inspector ── */}
      <div className="relative flex-1 min-h-0 bg-[#111111]">

        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
          backgroundSize: "36px 36px",
        }} />
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center,transparent 30%,rgba(0,0,0,0.72) 100%)" }} />

        {/* Canvas — fills everything */}
        <Canvas camera={{ position: [0, 0, 3.2], fov: 46 }} gl={{ antialias: true }}>
          <color attach="background" args={["#111111"]} />
          <ambientLight intensity={0.16} />
          <hemisphereLight args={["#ddeeff", "#220033", 0.48]} />
          <directionalLight position={[5, 7, 5]}  intensity={3.0} color="#fff8f4" />
          <pointLight      position={[-4, 2, 3]}  intensity={1.8} color="#8877ff" />
          <pointLight      position={[3, -3, -2]} intensity={0.9} color="#ff8840" />
          <PreviewMesh params={params} shape={shape} />
        </Canvas>

        {/* Viewport corner labels */}
        <div className="absolute top-2 left-2.5 text-[7.5px] font-mono text-white/16 pointer-events-none">Persp</div>
        <div className="absolute top-2 right-[146px] text-[7.5px] font-mono text-white/16 pointer-events-none">Shaded</div>

        {/* Shape selector — bottom center (left of inspector) */}
        <div className="absolute bottom-2 left-0 right-[142px] flex justify-center gap-1 pointer-events-auto">
          {(["sphere", "cube", "torus"] as Shape[]).map(s => (
            <button key={s} type="button" onClick={() => setShape(s)}
              className="text-[7.5px] font-mono px-2 py-0.5 rounded-sm transition-all"
              style={{
                background: shape === s ? "rgba(52,211,153,0.14)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${shape === s ? "rgba(52,211,153,0.32)" : "rgba(255,255,255,0.07)"}`,
                color: shape === s ? "rgba(110,231,183,0.85)" : "rgba(255,255,255,0.22)",
              }}>
              {s}
            </button>
          ))}
        </div>

        {/* ── Inspector overlay — right side ── */}
        <div className="absolute inset-y-0 right-0 w-[140px] flex flex-col
          border-l border-white/[0.08] text-[8px] font-mono"
          style={{ background: "rgba(12,12,12,0.92)", backdropFilter: "blur(8px)" }}>

          {/* Tabs */}
          <div className="flex shrink-0 border-b border-white/[0.07]">
            {(["presets", "material", "stats"] as InspTab[]).map(tab => (
              <button key={tab} type="button" onClick={() => setInspTab(tab)}
                className="flex-1 capitalize py-1.5 transition-colors"
                style={{
                  fontSize: "7px",
                  color: inspTab === tab ? "rgba(255,255,255,0.60)" : "rgba(255,255,255,0.18)",
                  borderBottom: inspTab === tab ? "1px solid rgba(255,255,255,0.22)" : "1px solid transparent",
                  background: inspTab === tab ? "rgba(255,255,255,0.03)" : "transparent",
                }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 px-2 py-2 overflow-hidden">

            {/* Presets */}
            {inspTab === "presets" && (
              <div className="flex flex-col gap-0.5">
                {PRESETS.map((pr, i) => (
                  <button key={pr.name} type="button" onClick={() => applyPreset(i)}
                    className="w-full text-left px-1.5 py-[3px] rounded-sm transition-colors"
                    style={{
                      background: activePreset === i ? "rgba(255,255,255,0.07)" : "transparent",
                      color: activePreset === i ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.28)",
                    }}>
                    <span className="mr-1" style={{ color: "rgba(255,255,255,0.14)", fontSize: "6.5px" }}>{pr.group}</span>
                    {pr.name}
                  </button>
                ))}
              </div>
            )}

            {/* Material */}
            {inspTab === "material" && (
              <div className="flex flex-col gap-2">
                <Slider label="Roughness" value={params.roughness}         min={0} max={1} step={0.01} onChange={v => set("roughness", v)} />
                <Slider label="Metalness" value={params.metalness}         min={0} max={1} step={0.01} onChange={v => set("metalness", v)} />
                <Slider label="Emission"  value={params.emissiveIntensity} min={0} max={3} step={0.05} onChange={v => set("emissiveIntensity", v)} />
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-white/30 w-[56px] shrink-0">Albedo</span>
                  <input type="color" value={params.color}    onChange={e => set("color",    e.target.value)} className="w-5 h-4 cursor-pointer border-0 p-0 bg-transparent rounded" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/30 w-[56px] shrink-0">Emissive</span>
                  <input type="color" value={params.emissive} onChange={e => set("emissive", e.target.value)} className="w-5 h-4 cursor-pointer border-0 p-0 bg-transparent rounded" />
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={params.wireframe} onChange={e => set("wireframe", e.target.checked)} className="accent-emerald-400" />
                  <span className="text-white/36">Wireframe</span>
                </label>
              </div>
            )}

            {/* Stats */}
            {inspTab === "stats" && (
              <div className="flex flex-col gap-1.5">
                {[
                  ["Vertices",    stats.verts],
                  ["Triangles",   stats.tris],
                  ["Draw Calls",  "1"],
                  ["SetPass",     "2"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-white/22">{k}</span>
                    <span className="text-white/50 tabular-nums">{v}</span>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-white/[0.06] flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-white/22">Shape</span>
                    <span className="text-emerald-400/70 capitalize">{shape}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/22">Preset</span>
                    <span className="text-white/40 truncate ml-1 text-right">{PRESETS[activePreset].name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="flex items-center px-3 py-[3px] border-t border-white/[0.07] shrink-0 bg-[#0a0a0a]">
        <span className="text-[7.5px] font-mono text-white/14">Meltyn · ShaderLab / HLSL</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(52,211,153,0.7)" }} />
          <span className="text-[7.5px] font-mono text-white/18">GPU Ready</span>
        </div>
      </div>
    </div>
  );
}
