"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

// ── Data ───────────────────────────────────────────────────────────────────

const AMBER = "#f59e0b";

const SERVICES = [
  { icon: "◈", label: "Web Design",  desc: "UI/UX que convierte visitas en clientes."    },
  { icon: "⬡", label: "Desarrollo",  desc: "Next.js + GSAP, animaciones scroll-driven."  },
  { icon: "◉", label: "Branding",    desc: "Identidad visual coherente y memorable."      },
  { icon: "▸",  label: "SEO & Copy", desc: "Contenido que posiciona y persuade."          },
];

const WORKS = [
  { label: "Plataforma E-commerce",  tag: "Web + Dev"  },
  { label: "Rediseño Agencia Local", tag: "Branding"   },
  { label: "SaaS Dashboard",         tag: "Next.js"    },
];

const STATS = [
  { val: "50+", lbl: "Proyectos"    },
  { val: "98%", lbl: "Satisfacción" },
  { val: "3×",  lbl: "ROI promedio" },
];

// ── Shared animation variant ───────────────────────────────────────────────

const rv = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, margin: "-15% 0px" } as const,
  transition: { duration: 0.52, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

// ── Component ──────────────────────────────────────────────────────────────

export default function RhezoDemo() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll, pauses on hover
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0, pos = 0, active = true;
    const tick = () => {
      if (!active) return;
      pos += 0.5;
      if (pos >= el.scrollHeight - el.clientHeight) pos = 0;
      el.scrollTop = pos;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const stop  = () => { active = false; cancelAnimationFrame(raf); };
    const start = () => { active = true;  raf = requestAnimationFrame(tick); };
    el.addEventListener("mouseenter", stop);
    el.addEventListener("mouseleave", start);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[#080705] overflow-hidden">

      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#101010] border-b border-white/[0.07] shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        <div className="ml-2 flex-1 bg-white/[0.05] rounded px-3 py-0.5 text-[9px] font-mono text-white/28">
          rhezo.com
        </div>
      </div>

      {/* Scrollable page */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* ── Nav ── */}
        <div className="flex items-center justify-between px-5 py-2.5 sticky top-0 z-10 border-b border-white/[0.05]"
          style={{ background: "rgba(8,7,5,0.92)", backdropFilter: "blur(8px)" }}>
          <span className="text-[11px] font-bold tracking-[0.22em] text-white/90">RHEZO</span>
          <div className="flex gap-4 text-[8.5px] font-mono text-white/28">
            <span>Work</span><span>Servicios</span><span>Contacto</span>
            <span style={{ color: AMBER + "88" }}>↗</span>
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="relative px-6 py-10 overflow-hidden">
          <div className="absolute -top-16 left-1/3 w-72 h-72 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${AMBER}14 0%, transparent 65%)` }} />

          <motion.div {...rv(0)} className="mb-3">
            <span className="text-[8px] font-mono px-2.5 py-[3px] rounded-full border"
              style={{ borderColor: `${AMBER}40`, color: `${AMBER}90`, background: `${AMBER}0d` }}>
              Agencia digital · Medellín, CO
            </span>
          </motion.div>

          <motion.h1 {...rv(0.07)}
            className="text-[28px] font-black leading-[1.08] tracking-tight"
            style={{ color: "#fff" }}>
            Diseño web
          </motion.h1>
          <motion.h1 {...rv(0.13)}
            className="text-[28px] font-black leading-[1.08] tracking-tight mb-4"
            style={{ color: "rgba(255,255,255,0.18)" }}>
            que convierte.
          </motion.h1>

          <motion.p {...rv(0.19)}
            className="text-[10px] font-mono text-white/38 max-w-[230px] leading-relaxed mb-6">
            Sitios rápidos, animaciones GSAP y experiencias que posicionan tu marca en el mercado digital.
          </motion.p>

          <motion.div {...rv(0.25)} className="flex items-center gap-3">
            <button className="text-[9px] font-mono px-4 py-2 rounded-full transition-all"
              style={{ background: `${AMBER}22`, border: `1px solid ${AMBER}55`, color: AMBER }}>
              Empezar proyecto ↗
            </button>
            <span className="text-[8.5px] font-mono text-white/25">Ver trabajo →</span>
          </motion.div>
        </div>

        {/* ── Stats ── */}
        <div className="px-6 py-5 border-y border-white/[0.05]" style={{ background: "#0c0a07" }}>
          <div className="grid grid-cols-3">
            {STATS.map(({ val, lbl }, i) => (
              <motion.div key={lbl} {...rv(i * 0.08)}
                className="flex flex-col items-center gap-0.5 border-r border-white/[0.05] last:border-0">
                <span className="text-[22px] font-black" style={{ color: AMBER }}>{val}</span>
                <span className="text-[7.5px] font-mono text-white/28 uppercase tracking-widest">{lbl}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Services ── */}
        <div className="px-6 py-7">
          <motion.p {...rv(0)} className="text-[7.5px] font-mono text-white/20 uppercase tracking-widest mb-4">
            Servicios
          </motion.p>
          <div className="grid grid-cols-2 gap-2">
            {SERVICES.map(({ icon, label, desc }, i) => (
              <motion.div key={label} {...rv(i * 0.07)}
                className="p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)" }}>
                <span className="text-[15px] block mb-1.5" style={{ color: AMBER }}>{icon}</span>
                <p className="text-[10px] font-semibold text-white/72 mb-0.5">{label}</p>
                <p className="text-[8px] font-mono text-white/28 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Work ── */}
        <div className="px-6 py-6 border-t border-white/[0.05]" style={{ background: "#0c0a07" }}>
          <motion.p {...rv(0)} className="text-[7.5px] font-mono text-white/20 uppercase tracking-widest mb-4">
            Trabajo reciente
          </motion.p>
          <div className="flex flex-col gap-1.5">
            {WORKS.map(({ label, tag }, i) => (
              <motion.div key={label} {...rv(i * 0.08)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.055)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: AMBER }} />
                  <span className="text-[9.5px] text-white/62">{label}</span>
                </div>
                <span className="text-[7.5px] font-mono px-2 py-0.5 rounded-full shrink-0 ml-2"
                  style={{ background: `${AMBER}12`, color: `${AMBER}99`, border: `1px solid ${AMBER}28` }}>
                  {tag}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="relative px-6 py-12 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 50% 100%, ${AMBER}10 0%, transparent 60%)` }} />
          <motion.p {...rv(0)}
            className="text-[7.5px] font-mono text-white/20 uppercase tracking-widest mb-3">
            ¿Listo para empezar?
          </motion.p>
          <motion.h2 {...rv(0.1)}
            className="text-[22px] font-black text-white mb-5 leading-tight">
            Hablemos.
          </motion.h2>
          <motion.div {...rv(0.18)}>
            <button className="text-[10px] font-bold px-6 py-2.5 rounded-full transition-all"
              style={{ background: AMBER, color: "#000" }}>
              Contactar →
            </button>
          </motion.div>
        </div>

        <div className="h-3" />
      </div>

      {/* Status bar */}
      <div className="px-4 py-1.5 border-t border-white/[0.06] shrink-0 text-center text-[7.5px] font-mono text-white/16 bg-[#080705]">
        Rhezo · GSAP scroll-driven · Next.js + Zustand
      </div>
    </div>
  );
}
