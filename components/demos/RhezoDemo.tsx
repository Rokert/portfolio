"use client";

import { useRef, useEffect, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useVelocity,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
} from "framer-motion";

const AMBER = "#f59e0b";

/* ── Character split with 3D flip-in ──────────────────────────────────── */

const charContainer = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.044 } },
};
const charItem = {
  hidden: { opacity: 0, y: 22, rotateX: 72 },
  show:   { opacity: 1, y: 0,  rotateX: 0,
            transition: { duration: 0.36, ease: [0.2, 0, 0.1, 1] as const } },
};

function SplitText({ text, className }: { text: string; className?: string }) {
  return (
    <motion.span
      className={className}
      style={{ display: "inline-flex", flexWrap: "wrap", perspective: 600 }}
      variants={charContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, margin: "-10% 0px" }}
    >
      {text.split("").map((c, i) => (
        <motion.span key={i} variants={charItem} style={{ display: "inline-block" }}>
          {c === " " ? " " : c}
        </motion.span>
      ))}
    </motion.span>
  );
}

/* ── Counting stat ─────────────────────────────────────────────────────── */

function StatCount({ to, suffix, label }: { to: number; suffix: string; label: string }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-25% 0px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) { setVal(0); return; }
    let n = 0;
    const step = to / 32;
    const timer = setInterval(() => {
      n = Math.min(n + step, to);
      setVal(Math.round(n));
      if (n >= to) clearInterval(timer);
    }, 26);
    return () => clearInterval(timer);
  }, [inView, to]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1">
      <span className="text-[28px] font-black tabular-nums leading-none" style={{ color: AMBER }}>
        {val}{suffix}
      </span>
      <span className="text-[7px] font-mono text-white/25 uppercase tracking-[0.16em]">{label}</span>
    </div>
  );
}

/* ── 3D tilt card ──────────────────────────────────────────────────────── */

function TiltCard({ icon, label, desc, delay }: {
  icon: string; label: string; desc: string; delay: number;
}) {
  const rX  = useMotionValue(0);
  const rY  = useMotionValue(0);
  const srX = useSpring(rX, { stiffness: 350, damping: 25 });
  const srY = useSpring(rY, { stiffness: 350, damping: 25 });

  return (
    <motion.div
      style={{
        rotateX: srX, rotateY: srY, transformPerspective: 700,
        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)",
      }}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-12% 0px" }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0, 0.1, 1] as const }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        rX.set(-((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * 10);
        rY.set( ((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) * 10);
      }}
      onMouseLeave={() => { rX.set(0); rY.set(0); }}
      className="p-3.5 rounded-xl cursor-default select-none"
    >
      <span className="text-[17px] block mb-2" style={{ color: AMBER }}>{icon}</span>
      <p className="text-[10px] font-semibold text-white/72 mb-1">{label}</p>
      <p className="text-[8px] font-mono text-white/28 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

/* ── Marquee strip (CSS keyframe — see globals.css) ─────────────────────── */

const MARQUEE_ITEMS = ["GSAP", "Scroll Animations", "Next.js", "Zustand", "Parallax", "Tailwind", "TypeScript", "React"];

function MarqueeStrip() {
  return (
    <div className="overflow-hidden py-2.5 border-y border-white/[0.05]" style={{ background: `${AMBER}09` }}>
      <div
        className="flex whitespace-nowrap"
        style={{ animation: "marqueeLoop 22s linear infinite", width: "max-content" }}
      >
        {Array.from({ length: 4 }).flatMap((_, ci) =>
          MARQUEE_ITEMS.map((item, i) => (
            <span key={`${ci}-${i}`} className="text-[8px] font-mono px-5 shrink-0"
              style={{ color: i % 2 === 0 ? `${AMBER}65` : "rgba(255,255,255,0.14)" }}>
              {item}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Syntax-highlighted GSAP snippet ──────────────────────────────────── */

const K = (t: string) => <span style={{ color: AMBER }}>{t}</span>;
const F = (t: string) => <span className="text-[#7dd3fc]">{t}</span>;
const S = (t: string) => <span className="text-[#86efac]">{t}</span>;
const N = (t: string) => <span className="text-[#f9a8d4]">{t}</span>;
const C = (t: string) => <span className="text-white/22">{t}</span>;
const P = (t: string) => <span className="text-white/35">{t}</span>;
const W = (t: string) => <span className="text-white/58">{t}</span>;
const V = (t: string) => <span className="text-purple-300/60">{t}</span>;

function CodeSnippet() {
  return (
    <pre className="text-[7.5px] font-mono leading-[1.75] px-4 py-3.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      {C("// scroll-driven reveal · rhezo.com")}{"\n"}
      {K("gsap")}{P(".")}{F("registerPlugin")}{P("(")}{S("ScrollTrigger")}{P(")")}{"\n\n"}
      {V("const ")}{W("tl")}{P(" = ")}{K("gsap")}{P(".")}{F("timeline")}{P("({")}{"\n"}
      {"  "}{F("scrollTrigger")}{P(": {")}{"\n"}
      {"    "}{F("trigger")}{P(": ")}{S("'.hero'")}{P(",")}{"\n"}
      {"    "}{F("start")}{P(": ")}{S("'top 80%'")}{P(",")}{"\n"}
      {"    "}{F("scrub")}{P(": ")}{N("1")}{P(",")}{"\n"}
      {"  "}{P("},")}{"\n"}
      {P("});\n\n")}
      {W("tl")}{P(".")}{F("from")}{P("(")}{S("'.headline'")}{P(", {")}{"\n"}
      {"  "}{F("y")}{P(": ")}{N("60")}{P(", ")}{F("opacity")}{P(": ")}{N("0")}{P(", ")}{F("duration")}{P(": ")}{N("0.8")}{"\n"}
      {P("})\n")}
      {"  "}{P(".")}{F("from")}{P("(")}{S("'.subtitle'")}{P(", {")}{"\n"}
      {"  "}{F("y")}{P(": ")}{N("40")}{P(", ")}{F("opacity")}{P(": ")}{N("0")}{"\n"}
      {P("}, ")}{S("'-=0.4'")}{P(")")}
    </pre>
  );
}

/* ── Data ──────────────────────────────────────────────────────────────── */

const SERVICES = [
  { icon: "◈", label: "Web Design",  desc: "UI/UX que convierte visitas en clientes."    },
  { icon: "⬡", label: "Desarrollo",  desc: "Next.js + GSAP, animaciones scroll-driven."  },
  { icon: "◉", label: "Branding",    desc: "Identidad visual coherente y memorable."      },
  { icon: "▸",  label: "SEO & Copy", desc: "Contenido que posiciona y persuade."          },
];

const WORKS = [
  { label: "Plataforma E-commerce",  tag: "Web + Dev" },
  { label: "Rediseño Agencia Local", tag: "Branding"  },
  { label: "SaaS Dashboard",         tag: "Next.js"   },
];

/* ── Main ──────────────────────────────────────────────────────────────── */

export default function RhezoDemo() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [codeOpen, setCodeOpen] = useState(false);

  // Velocity-driven page skew + scroll progress bar
  const { scrollY, scrollYProgress } = useScroll({ container: scrollRef });
  const scrollVelocity = useVelocity(scrollY);
  const skewRaw  = useTransform(scrollVelocity, [-1200, 0, 1200], ["-2deg", "0deg", "2deg"]);
  const skew     = useSpring(skewRaw, { mass: 0.2, stiffness: 400, damping: 45 });
  const barWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Auto-scroll, pauses on hover
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0, pos = 0, active = true;
    const tick = () => {
      if (!active) return;
      pos += 0.55;
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

        {/* Sticky nav + amber progress bar — outside skew wrapper */}
        <div className="sticky top-0 z-20">
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.05]"
            style={{ background: "rgba(8,7,5,0.93)", backdropFilter: "blur(10px)" }}>
            <span className="text-[11px] font-bold tracking-[0.22em] text-white/90">RHEZO</span>
            <div className="flex gap-4 text-[8.5px] font-mono text-white/28">
              <span>Work</span><span>Servicios</span><span>Contacto</span>
              <span style={{ color: `${AMBER}88` }}>↗</span>
            </div>
          </div>
          <motion.div className="h-[1.5px] origin-left" style={{ width: barWidth, background: AMBER }} />
        </div>

        {/* All page content with velocity skew */}
        <motion.div style={{ skewY: skew }}>

          {/* ── Hero ── */}
          <div className="relative px-6 pt-10 pb-8 overflow-hidden">
            <div className="absolute -top-20 left-1/4 w-80 h-80 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${AMBER}12 0%, transparent 65%)` }} />

            <motion.div
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-10% 0px" }} transition={{ duration: 0.5 }}
              className="mb-4"
            >
              <span className="text-[8px] font-mono px-2.5 py-[3px] rounded-full border"
                style={{ borderColor: `${AMBER}38`, color: `${AMBER}88`, background: `${AMBER}0d` }}>
                Agencia digital · Medellín, CO
              </span>
            </motion.div>

            <h1 className="text-[32px] font-black leading-[1.05] tracking-tight mb-1">
              <SplitText text="Diseño web" className="text-white" />
            </h1>
            <h1 className="text-[32px] font-black leading-[1.05] tracking-tight mb-5"
              style={{ color: "rgba(255,255,255,0.15)" }}>
              <SplitText text="que convierte." />
            </h1>

            <motion.p
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              viewport={{ once: false, margin: "-10% 0px" }}
              transition={{ duration: 0.6, delay: 0.28 }}
              className="text-[9.5px] font-mono text-white/35 max-w-[240px] leading-relaxed mb-6"
            >
              Animaciones GSAP scroll-driven, Next.js y experiencias que posicionan tu marca.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-10% 0px" }}
              transition={{ duration: 0.5, delay: 0.38 }}
              className="flex items-center gap-3"
            >
              <button type="button" className="text-[9px] font-mono px-4 py-2 rounded-full"
                style={{ background: `${AMBER}20`, border: `1px solid ${AMBER}50`, color: AMBER }}>
                Empezar proyecto ↗
              </button>
              <span className="text-[8px] font-mono text-white/22">Ver trabajo →</span>
            </motion.div>
          </div>

          {/* ── Marquee ── */}
          <MarqueeStrip />

          {/* ── Stats ── */}
          <div className="px-6 py-6 border-b border-white/[0.05]" style={{ background: "#0c0a07" }}>
            <div className="grid grid-cols-3 divide-x divide-white/[0.05]">
              <StatCount to={50}  suffix="+" label="Proyectos"    />
              <StatCount to={98}  suffix="%" label="Satisfacción" />
              <StatCount to={3}   suffix="×" label="ROI promedio" />
            </div>
          </div>

          {/* ── Code toggle ── */}
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: "-12% 0px" }}
            transition={{ duration: 0.5 }}
            className="px-6 py-5 border-b border-white/[0.05]"
          >
            <div className="flex items-center justify-between mb-0">
              <p className="text-[7.5px] font-mono text-white/20 uppercase tracking-widest">
                Cómo lo hacemos
              </p>
              <button
                type="button"
                onClick={() => setCodeOpen(v => !v)}
                className="flex items-center gap-1.5 text-[8px] font-mono px-2.5 py-1 rounded-md transition-all"
                style={{
                  background: codeOpen ? `${AMBER}18` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${codeOpen ? `${AMBER}45` : "rgba(255,255,255,0.08)"}`,
                  color: codeOpen ? AMBER : "rgba(255,255,255,0.35)",
                }}
              >
                <span>{codeOpen ? "⌃" : "〈/〉"}</span>
                <span>{codeOpen ? "Cerrar" : "Ver código"}</span>
              </button>
            </div>

            <AnimatePresence initial={false}>
              {codeOpen && (
                <motion.div
                  key="code"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.2, 0, 0.1, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-xl overflow-hidden"
                    style={{ background: "#0a0908", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {/* File header */}
                    <div className="flex items-center justify-between px-4 py-1.5 border-b border-white/[0.05]"
                      style={{ background: "rgba(255,255,255,0.02)" }}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${AMBER}60` }} />
                        <span className="text-[7px] font-mono text-white/28">animations.js</span>
                      </div>
                      <span className="text-[7px] font-mono text-white/14">GSAP · ScrollTrigger</span>
                    </div>
                    <CodeSnippet />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Services ── */}
          <div className="px-6 py-7">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: false }}
              className="text-[7.5px] font-mono text-white/20 uppercase tracking-widest mb-4">
              Servicios
            </motion.p>
            <div className="grid grid-cols-2 gap-2">
              {SERVICES.map((s, i) => (
                <TiltCard key={s.label} {...s} delay={i * 0.08} />
              ))}
            </div>
          </div>

          {/* ── Work ── */}
          <div className="px-6 py-6 border-t border-white/[0.05]" style={{ background: "#0c0a07" }}>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: false }}
              className="text-[7.5px] font-mono text-white/20 uppercase tracking-widest mb-4">
              Trabajo reciente
            </motion.p>
            <div className="flex flex-col gap-2">
              {WORKS.map(({ label, tag }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, margin: "-12% 0px" }}
                  transition={{ duration: 0.45, delay: i * 0.08, ease: [0.2, 0, 0.1, 1] as const }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.055)" }}
                >
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
              style={{ background: `radial-gradient(ellipse at 50% 100%, ${AMBER}0e 0%, transparent 65%)` }} />
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: false }}
              className="text-[7.5px] font-mono text-white/18 uppercase tracking-widest mb-3">
              ¿Listo para empezar?
            </motion.p>
            <h2 className="text-[22px] font-black text-white mb-5">
              <SplitText text="Hablemos." className="text-white" />
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }} transition={{ duration: 0.4, delay: 0.3 }}
            >
              <button type="button" className="text-[10px] font-bold px-6 py-2.5 rounded-full"
                style={{ background: AMBER, color: "#000" }}>
                Contactar →
              </button>
            </motion.div>
          </div>

          <div className="h-4" />
        </motion.div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1.5 border-t border-white/[0.06] shrink-0 text-center text-[7.5px] font-mono text-white/14 bg-[#080705]">
        Rhezo · GSAP scroll-driven · Next.js + Zustand
      </div>
    </div>
  );
}
