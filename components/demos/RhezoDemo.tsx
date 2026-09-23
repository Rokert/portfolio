"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

const SECTIONS = [
  { label: "Inicio", color: "#f59e0b", desc: "Hero con text reveal" },
  { label: "Servicios", color: "#f59e0b", desc: "Cards stagger in" },
  { label: "Proyectos", color: "#f59e0b", desc: "Parallax scroll" },
  { label: "Contacto", color: "#f59e0b", desc: "Form fade in" },
];

export default function RhezoDemo() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let frame: number;
    let pos = 0;
    const tick = () => {
      pos += 0.3;
      if (pos > el.scrollHeight - el.clientHeight) pos = 0;
      el.scrollTop = pos;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const stop = () => cancelAnimationFrame(frame);
    el.addEventListener("mouseenter", stop);
    el.addEventListener("mouseleave", () => { frame = requestAnimationFrame(tick); });
    return () => { cancelAnimationFrame(frame); };
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Fake browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#111] border-b border-white/10 shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        <div className="ml-2 flex-1 bg-white/5 rounded px-2 py-0.5 text-[10px] font-mono text-white/30">
          rhezo.com
        </div>
      </div>

      {/* Scrollable page */}
      <div ref={containerRef} className="flex-1 overflow-y-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {SECTIONS.map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ root: containerRef, once: false, margin: "-20% 0px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="min-h-[140px] flex flex-col justify-center px-8 border-b border-white/5"
            style={{ background: i % 2 === 0 ? "#0a0a0a" : "#0e0e0e" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 rounded-full" style={{ background: section.color }} />
              <div>
                <h3 className="text-white font-semibold text-sm">{section.label}</h3>
                <p className="text-white/30 text-[10px] font-mono">{section.desc}</p>
              </div>
            </div>
            <div className="ml-4 flex gap-2">
              {[...Array(3)].map((_, j) => (
                <div
                  key={j}
                  className="h-1.5 rounded-full bg-white/10"
                  style={{ width: `${40 + j * 20}px`, opacity: 0.5 - j * 0.1 }}
                />
              ))}
            </div>
          </motion.div>
        ))}
        <div className="h-8" />
      </div>

      <div className="px-4 py-2 border-t border-white/10 text-center text-[10px] font-mono text-white/20">
        Rhezo · GSAP scroll-driven animations
      </div>
    </div>
  );
}
