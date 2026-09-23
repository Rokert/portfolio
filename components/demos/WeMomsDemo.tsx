"use client";

import { useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshDistortMaterial } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

const WEEKS = [
  { week: 6, size: 0.15, color: "#f9a8d4", label: "Semilla de amapola", detail: "El corazón empieza a latir" },
  { week: 10, size: 0.22, color: "#fca5a5", label: "Ciruela", detail: "Se forman los dedos" },
  { week: 16, size: 0.32, color: "#fb923c", label: "Aguacate", detail: "Puede escuchar tu voz" },
  { week: 20, size: 0.42, color: "#a78bfa", label: "Mango", detail: "Ultrasonido morfológico" },
  { week: 24, size: 0.52, color: "#60a5fa", label: "Mazorca de maíz", detail: "Pesa casi 600g" },
  { week: 28, size: 0.60, color: "#34d399", label: "Berenjena", detail: "Abre los ojos por primera vez" },
  { week: 32, size: 0.70, color: "#fbbf24", label: "Coco", detail: "Los pulmones casi maduros" },
  { week: 36, size: 0.80, color: "#f472b6", label: "Papaya", detail: "Posición cefálica" },
  { week: 40, size: 0.90, color: "#818cf8", label: "Sandía pequeña", detail: "¡Lista para nacer!" },
];

const ETHNICITIES = ["Latina", "Afro", "Asiática", "Europea"];

function BabyOrb({ size, color }: { size: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.3;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  return (
    <Float speed={1.5} floatIntensity={0.3}>
      <mesh ref={ref} scale={size * 2.5}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color={color}
          distort={0.25}
          speed={1.5}
          roughness={0.1}
          metalness={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Inner glow */}
      <mesh scale={size * 2.3}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
    </Float>
  );
}

export default function WeMomsDemo() {
  const [weekIdx, setWeekIdx] = useState(3);
  const [ethnicity, setEthnicity] = useState(0);
  const week = WEEKS[weekIdx];

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0a12] overflow-hidden">
      {/* iOS status bar mockup */}
      <div className="flex items-center justify-between px-5 py-2 shrink-0">
        <span className="text-[10px] text-white/40 font-medium">9:41</span>
        <div className="w-24 h-4 bg-black rounded-full" />
        <div className="flex gap-1 items-center">
          <div className="w-4 h-2.5 border border-white/40 rounded-sm relative">
            <div className="absolute inset-[2px] right-[2px] bg-white/40 rounded-sm" style={{ right: "30%" }} />
          </div>
        </div>
      </div>

      {/* App header */}
      <div className="px-5 pb-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-white font-semibold text-base">WeMoms</h1>
          <p className="text-white/40 text-[10px]">Semana {week.week} de 40</p>
        </div>
        {/* Ethnicity picker */}
        <div className="flex gap-1">
          {ETHNICITIES.map((e, i) => (
            <button
              key={e}
              onClick={() => setEthnicity(i)}
              className={`w-5 h-5 rounded-full border-2 transition-all ${
                ethnicity === i ? "border-white scale-110" : "border-white/20"
              }`}
              style={{
                background: ["#c68642", "#8d5524", "#f1c27d", "#ffe0bd"][i],
              }}
              title={e}
            />
          ))}
        </div>
      </div>

      {/* 3D Scene */}
      <div className="flex-1 min-h-0 relative">
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[2, 2, 2]} intensity={1.5} color={week.color} />
          <pointLight position={[-2, -1, 1]} intensity={0.5} color="#ffffff" />
          <Environment preset="night" />
          <AnimatePresence>
            <BabyOrb key={week.week} size={week.size} color={week.color} />
          </AnimatePresence>
        </Canvas>

        {/* Week info overlay */}
        <AnimatePresence mode="wait">
          <motion.div
            key={week.week}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 text-center pointer-events-none"
          >
            <p className="text-white/90 font-medium text-sm">{week.label}</p>
            <p className="text-white/40 text-[10px] mt-0.5">{week.detail}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Week slider */}
      <div className="px-5 pb-4 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-mono text-white/30">Sem 6</span>
          <input
            type="range"
            min={0}
            max={WEEKS.length - 1}
            value={weekIdx}
            onChange={(e) => setWeekIdx(Number(e.target.value))}
            className="flex-1 accent-pink-400 h-1"
          />
          <span className="text-[10px] font-mono text-white/30">Sem 40</span>
        </div>

        {/* Week dots */}
        <div className="flex justify-between">
          {WEEKS.map((w, i) => (
            <button
              key={w.week}
              onClick={() => setWeekIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === weekIdx ? "scale-150" : "opacity-30"
              }`}
              style={{ background: w.color }}
            />
          ))}
        </div>

        <p className="text-center text-[10px] font-mono text-white/20 mt-3">
          WeMoms · Swift / SwiftUI / SceneKit
        </p>
      </div>
    </div>
  );
}
