"use client";

import { useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshDistortMaterial } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

type Tab = "home" | "baby" | "community" | "me";

/* ── Data ─────────────────────────────────────────────────────────────── */
const WEEKS = [
  { week: 6,  size: 0.15, color: "#f9a8d4", label: "Semilla de amapola", detail: "El corazón empieza a latir",   length: "0.6cm", weight: "<1g"   },
  { week: 10, size: 0.22, color: "#fca5a5", label: "Ciruela",             detail: "Se forman los dedos",         length: "3cm",   weight: "4g"    },
  { week: 16, size: 0.32, color: "#fb923c", label: "Aguacate",            detail: "Puede escuchar tu voz",       length: "11cm",  weight: "100g"  },
  { week: 20, size: 0.42, color: "#a78bfa", label: "Mango",               detail: "Ultrasonido morfológico",     length: "16cm",  weight: "300g"  },
  { week: 24, size: 0.52, color: "#60a5fa", label: "Mazorca",             detail: "Pesa casi 600g",              length: "21cm",  weight: "600g"  },
  { week: 28, size: 0.60, color: "#34d399", label: "Berenjena",           detail: "Abre los ojos",               length: "25cm",  weight: "1kg"   },
  { week: 32, size: 0.70, color: "#fbbf24", label: "Coco",                detail: "Pulmones casi maduros",       length: "28cm",  weight: "1.8kg" },
  { week: 36, size: 0.80, color: "#f472b6", label: "Papaya",              detail: "Posición cefálica",           length: "33cm",  weight: "2.7kg" },
  { week: 40, size: 0.90, color: "#818cf8", label: "Sandía pequeña",      detail: "¡Lista para nacer!",          length: "36cm",  weight: "3.4kg" },
];

const ETHNICITIES = ["Latina", "Afro", "Asiática", "Europea"];
const SKIN_TONES  = ["#c68642", "#8d5524", "#f1c27d", "#ffe0bd"];

const MILESTONES = [
  { week: 6,  icon: "♡",  text: "Latido detectado"     },
  { week: 10, icon: "✋", text: "Dedos formados"        },
  { week: 16, icon: "👂", text: "Puede oírte"           },
  { week: 20, icon: "👁",  text: "Morfológico"           },
  { week: 24, icon: "😴", text: "Ciclos de sueño"       },
  { week: 28, icon: "👀", text: "Abre los ojos"         },
  { week: 32, icon: "🫁", text: "Pulmones activos"      },
  { week: 36, icon: "🔄", text: "Posición cefálica"     },
  { week: 40, icon: "⭐", text: "¡Lista para nacer!"    },
];

const FEED = [
  { name: "Sofía M.",  week: 22, color: "#f9a8d4", ago: "2h",   text: "¿Alguien más tiene antojos a las 3am? 😅" },
  { name: "Ana K.",    week: 19, color: "#a78bfa", ago: "4h",   text: "¡Primera patadita! No me lo puedo creer 🥹" },
  { name: "Valentina", week: 28, color: "#34d399", ago: "6h",   text: "Yoga prenatal: la mejor decisión que tomé." },
  { name: "María J.",  week: 35, color: "#fbbf24", ago: "ayer", text: "Preparando la maleta para el hospital ✓" },
];

const trimester = (w: number) =>
  w <= 12 ? "1er Trimestre" : w <= 27 ? "2do Trimestre" : "3er Trimestre";

/* ── 3D orb ───────────────────────────────────────────────────────────── */
function BabyOrb({ size, color }: { size: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.3;
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
  });
  return (
    <Float speed={1.5} floatIntensity={0.3}>
      <mesh ref={ref} scale={size * 2.5}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial color={color} distort={0.25} speed={1.5} roughness={0.1} metalness={0.2} transparent opacity={0.9} />
      </mesh>
      <mesh scale={size * 2.3}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
    </Float>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function WeMomsDemo() {
  const [weekIdx,   setWeekIdx]   = useState(3);
  const [ethnicity, setEthnicity] = useState(0);
  const [tab,       setTab]       = useState<Tab>("home");
  const week = WEEKS[weekIdx];

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0a12] overflow-hidden select-none"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between px-5 py-1.5 shrink-0">
        <span className="text-[10px] text-white/38 font-medium">9:41</span>
        <div className="w-20 h-3.5 bg-black rounded-full" />
        <div className="w-4 h-2.5 border border-white/30 rounded-sm relative">
          <div className="absolute inset-[2px] bg-white/30 rounded-sm" style={{ right: "30%" }} />
        </div>
      </div>

      {/* ── App header ── */}
      <div className="px-4 pb-2 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-white font-semibold text-[15px] leading-tight">WeMoms</h1>
          <p className="text-white/32 text-[9px] font-mono">{trimester(week.week)} · Semana {week.week}</p>
        </div>
        <div className="flex gap-1.5 items-center">
          {ETHNICITIES.map((e, i) => (
            <button key={e} type="button" onClick={() => setEthnicity(i)}
              className="rounded-full transition-all"
              style={{
                width: ethnicity === i ? "18px" : "13px",
                height: ethnicity === i ? "18px" : "13px",
                background: SKIN_TONES[i],
                outline: ethnicity === i ? "2px solid rgba(255,255,255,0.55)" : "none",
                outlineOffset: "2px",
              }} />
          ))}
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait">

          {/* HOME */}
          {tab === "home" && (
            <motion.div key="home" className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}>

              {/* 3D canvas */}
              <div className="relative" style={{ height: "52%" }}>
                <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
                  <color attach="background" args={["#0d0a12"]} />
                  <ambientLight intensity={0.3} />
                  <pointLight position={[2, 2, 2]} intensity={1.5} color={week.color} />
                  <pointLight position={[-2, -1, 1]} intensity={0.5} color={SKIN_TONES[ethnicity]} />
                  <BabyOrb key={`${week.week}-${ethnicity}`} size={week.size} color={SKIN_TONES[ethnicity]} />
                </Canvas>
                <AnimatePresence mode="wait">
                  <motion.div key={week.week} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
                    className="absolute top-3 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                    <p className="text-white/88 font-medium text-[12px]">{week.label}</p>
                    <p className="text-white/32 text-[9px] mt-0.5">{week.detail}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Stats strip */}
              <div className="flex gap-1.5 px-4 py-2 shrink-0">
                {[
                  { label: "Talla",       value: week.length },
                  { label: "Peso aprox.", value: week.weight },
                  { label: "Semana",      value: `${week.week}/40` },
                ].map(s => (
                  <AnimatePresence key={s.label} mode="wait">
                    <motion.div key={s.value}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
                      className="flex-1 rounded-xl px-2 py-2 text-center"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-white font-semibold text-[11px]">{s.value}</p>
                      <p className="text-white/28 text-[7.5px] mt-0.5 font-mono">{s.label}</p>
                    </motion.div>
                  </AnimatePresence>
                ))}
              </div>

              {/* Week navigation */}
              <div className="px-4 pb-2 shrink-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[8px] font-mono text-white/22">6</span>
                  <input type="range" min={0} max={WEEKS.length - 1} value={weekIdx}
                    onChange={e => setWeekIdx(Number(e.target.value))}
                    className="flex-1 h-0.5" style={{ accentColor: week.color }} />
                  <span className="text-[8px] font-mono text-white/22">40</span>
                </div>
                <div className="flex justify-between px-0.5">
                  {WEEKS.map((w, i) => (
                    <button key={w.week} type="button" onClick={() => setWeekIdx(i)}
                      className="rounded-full transition-all"
                      style={{
                        width:  i === weekIdx ? "7px" : "5px",
                        height: i === weekIdx ? "7px" : "5px",
                        background: i === weekIdx ? w.color : `${w.color}40`,
                      }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* MI BEBÉ */}
          {tab === "baby" && (
            <motion.div key="baby" className="absolute inset-0 overflow-y-auto px-4 pt-3 pb-2"
              style={{ scrollbarWidth: "none" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}>
              <p className="text-white/35 text-[8.5px] font-mono uppercase tracking-widest mb-2.5">
                Hitos · Semana {week.week}
              </p>
              <div className="flex flex-col gap-1.5">
                {MILESTONES.map((m, i) => {
                  const done = week.week >= m.week;
                  return (
                    <motion.div key={m.week}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 rounded-xl px-3 py-2"
                      style={{ background: done ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)" }}>
                      <span className="text-[14px] w-5 text-center" style={{ opacity: done ? 1 : 0.22 }}>
                        {m.icon}
                      </span>
                      <div className="flex-1">
                        <p className="text-[9.5px] font-medium"
                          style={{ color: done ? "#fff" : "rgba(255,255,255,0.22)" }}>
                          {m.text}
                        </p>
                        <p className="text-[7.5px] font-mono"
                          style={{ color: done ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)" }}>
                          Semana {m.week}
                        </p>
                      </div>
                      {done && (
                        <div className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: week.color }} />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* COMUNIDAD */}
          {tab === "community" && (
            <motion.div key="community" className="absolute inset-0 overflow-y-auto px-4 pt-3 pb-2"
              style={{ scrollbarWidth: "none" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-white/35 text-[8.5px] font-mono uppercase tracking-widest">
                  Red de mamás
                </p>
                <span className="text-[7.5px] font-mono px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(249,168,212,0.14)", color: "#f9a8d4" }}>
                  +12 hoy
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {FEED.map((post, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.055)" }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-black shrink-0"
                        style={{ background: post.color }}>
                        {post.name[0]}
                      </div>
                      <div>
                        <p className="text-white text-[9px] font-semibold leading-tight">{post.name}</p>
                        <p className="text-white/25 text-[7.5px] font-mono">Sem {post.week} · hace {post.ago}</p>
                      </div>
                    </div>
                    <p className="text-white/55 text-[9px] leading-relaxed">{post.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* YO */}
          {tab === "me" && (
            <motion.div key="me" className="absolute inset-0 flex flex-col items-center pt-6 px-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}>
              <div className="w-14 h-14 rounded-full mb-2 flex items-center justify-center text-[22px]"
                style={{ background: `${SKIN_TONES[ethnicity]}33`, border: `2px solid ${SKIN_TONES[ethnicity]}66` }}>
                <span style={{ filter: "grayscale(0)" }}>🤰</span>
              </div>
              <p className="text-white font-semibold text-[13px]">Mi perfil</p>
              <p className="text-white/28 text-[9px] font-mono mt-0.5 mb-4">
                {trimester(week.week)} · Semana {week.week}
              </p>
              <div className="w-full grid grid-cols-2 gap-2">
                {[
                  { label: "Semanas restantes", value: String(40 - week.week) },
                  { label: "Citas médicas",      value: "3"       },
                  { label: "Fotos guardadas",     value: "24"      },
                  { label: "En la red",           value: "12 días" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-2.5 text-center"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <p className="text-white font-semibold text-[12px]">{s.value}</p>
                    <p className="text-white/28 text-[7.5px] font-mono mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom tab bar ── */}
      <div className="shrink-0 flex border-t border-white/[0.06]"
        style={{ background: "rgba(10,8,16,0.96)" }}>
        {([
          { id: "home"      as Tab, label: "Inicio"   },
          { id: "baby"      as Tab, label: "Mi bebé"  },
          { id: "community" as Tab, label: "Red", badge: 3 },
          { id: "me"        as Tab, label: "Yo"       },
        ] as { id: Tab; label: string; badge?: number }[]).map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className="flex-1 py-2 flex flex-col items-center gap-0.5 relative"
            style={{ opacity: tab === t.id ? 1 : 0.32 }}>
            {tab === t.id && (
              <motion.div layoutId="tab-bar-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full"
                style={{ background: week.color }} />
            )}
            <div className="w-4 h-4 rounded-sm flex items-center justify-center"
              style={{ background: tab === t.id ? `${week.color}20` : "transparent" }}>
              <div className="w-1.5 h-1.5 rounded-full"
                style={{ background: tab === t.id ? week.color : "rgba(255,255,255,0.4)" }} />
            </div>
            <span className="text-[7px] font-mono"
              style={{ color: tab === t.id ? "#fff" : "rgba(255,255,255,0.4)" }}>
              {t.label}
            </span>
            {t.badge && tab !== t.id && (
              <span className="absolute top-1 right-[calc(50%-12px)] w-3 h-3 text-[6px] rounded-full flex items-center justify-center font-bold"
                style={{ background: "#f9a8d4", color: "#000" }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Status line ── */}
      <p className="text-center text-[7px] font-mono text-white/15 py-1 shrink-0">
        WeMoms · Swift / SwiftUI / SceneKit
      </p>
    </div>
  );
}
