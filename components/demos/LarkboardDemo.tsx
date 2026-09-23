"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FRAMES = 48;
const PINS = [
  { frame: 8, x: 32, y: 45, user: "M", color: "#3b82f6", comment: "El timing del easing se siente lento en frame 8–12" },
  { frame: 22, x: 65, y: 28, user: "A", color: "#a855f7", comment: "Aquí el overlap necesita +2 frames de anticipación" },
  { frame: 35, x: 50, y: 70, user: "J", color: "#f97316", comment: "LGTM — exportar con alpha" },
];

export default function LarkboardDemo() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activePin, setActivePin] = useState<number | null>(null);

  // Fake playback
  useState(() => {
    let raf: number;
    const tick = () => {
      if (playing) {
        setCurrentFrame((f) => (f + 1) % FRAMES);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });

  const progress = (currentFrame / (FRAMES - 1)) * 100;

  const visiblePins = PINS.filter((p) => Math.abs(p.frame - currentFrame) <= 3 || !playing);

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0d0d] font-mono text-xs select-none">
      {/* Topbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-white/60">walk_cycle_v4.lark</span>
        <span className="ml-auto text-white/30">frame {currentFrame + 1} / {FRAMES}</span>
      </div>

      {/* Preview area */}
      <div className="relative flex-1 overflow-hidden bg-[#0a0a0a]">
        {/* Fake animation frame */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 200 200" width="160" height="160" className="opacity-80">
            <circle
              cx="100"
              cy={60 + Math.sin((currentFrame / FRAMES) * Math.PI * 2) * 15}
              r="18"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />
            <line
              x1="100" y1="78"
              x2="100"
              y2={120 + Math.cos((currentFrame / FRAMES) * Math.PI * 2) * 5}
              stroke="#3b82f6" strokeWidth="2"
            />
            <line
              x1="100" y1="95"
              x2={80 + Math.sin((currentFrame / FRAMES) * Math.PI * 2) * 20}
              y2={115 + Math.cos((currentFrame / FRAMES) * Math.PI * 2) * 10}
              stroke="#3b82f6" strokeWidth="2"
            />
            <line
              x1="100" y1="95"
              x2={120 - Math.sin((currentFrame / FRAMES) * Math.PI * 2) * 20}
              y2={115 - Math.cos((currentFrame / FRAMES) * Math.PI * 2) * 10}
              stroke="#3b82f6" strokeWidth="2"
            />
            <line
              x1="100" y1="120"
              x2={90 - Math.sin((currentFrame / FRAMES) * Math.PI * 2) * 15}
              y2="155"
              stroke="#3b82f6" strokeWidth="2"
            />
            <line
              x1="100" y1="120"
              x2={110 + Math.sin((currentFrame / FRAMES) * Math.PI * 2) * 15}
              y2="155"
              stroke="#3b82f6" strokeWidth="2"
            />
          </svg>
        </div>

        {/* Frame-anchored pins */}
        {visiblePins.map((pin, i) => (
          <button
            key={i}
            onClick={() => setActivePin(activePin === i ? null : i)}
            className="absolute transition-all"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          >
            <div
              className="w-5 h-5 rounded-full border-2 border-white text-[9px] font-bold flex items-center justify-center text-white hover:scale-125 transition-transform"
              style={{ background: pin.color }}
            >
              {pin.user}
            </div>
          </button>
        ))}

        {/* Pin comment tooltip */}
        <AnimatePresence>
          {activePin !== null && (
            <motion.div
              key={activePin}
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bottom-4 left-4 right-4 bg-[#1a1a1a] border border-white/10 rounded-xl p-3 z-10"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
                  style={{ background: PINS[activePin].color }}
                >
                  {PINS[activePin].user}
                </div>
                <span className="text-white/40">frame {PINS[activePin].frame}</span>
              </div>
              <p className="text-white/70 text-[11px] leading-relaxed">{PINS[activePin].comment}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timeline */}
      <div className="px-4 py-3 border-t border-white/10 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPlaying((v) => !v)}
            className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white"
          >
            {playing ? "■" : "▶"}
          </button>
          <div
            className="relative flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              setCurrentFrame(Math.round(pct * (FRAMES - 1)));
            }}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-none"
              style={{ width: `${progress}%` }}
            />
            {/* Pin markers on timeline */}
            {PINS.map((p, i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-[#0d0d0d]"
                style={{ left: `${(p.frame / (FRAMES - 1)) * 100}%`, background: p.color }}
              />
            ))}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-[#0d0d0d]"
              style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
            />
          </div>
        </div>
        <p className="text-center text-[10px] text-white/20">Larkboard · frame-anchored review</p>
      </div>
    </div>
  );
}
