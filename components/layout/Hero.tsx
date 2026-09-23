"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/context/LanguageContext";
import { UI } from "@/lib/i18n";

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { lang, setLang } = useLang();
  const t = UI[lang];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      time += 0.004;

      const numLines = 6;
      for (let i = 0; i < numLines; i++) {
        const y = h * (0.2 + i * 0.15) + Math.sin(time + i * 0.7) * 20;
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(
          0.3 + Math.sin(time * 0.8 + i) * 0.2,
          `hsla(${90 + i * 15}, 80%, 60%, 0.06)`
        );
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 4) {
          ctx.lineTo(x, y + Math.sin(x * 0.008 + time + i) * 8);
        }
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden px-6">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      <div className="relative z-10 max-w-3xl text-center flex flex-col items-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex items-center gap-2 text-xs font-mono text-[--foreground]/40 border border-[--border] rounded-full px-4 py-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[--accent] animate-pulse" />
          {t.badge}
          <span className="mx-1 text-[--foreground]/20">·</span>
          <button
            onClick={() => setLang(lang === "ES" ? "EN" : "ES")}
            className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-[--border] hover:border-[--accent]/50 hover:text-[--accent] transition-colors"
          >
            {lang === "ES" ? "EN" : "ES"}
          </button>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight"
        >
          Game Dev &amp;
          <br />
          <span className="text-[--accent]">Creative</span> Dev
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-base md:text-lg text-[--foreground]/50 max-w-xl leading-relaxed"
        >
          {t.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center gap-3 mt-2"
        >
          <a
            href="mailto:rokert34@gmail.com"
            className="px-6 py-2.5 rounded-full bg-[--accent] text-black font-semibold text-sm hover:bg-[--accent]/90 transition-colors"
          >
            {t.contact}
          </a>
          <a
            href="#proyectos"
            className="px-6 py-2.5 rounded-full border border-[--border] text-sm hover:border-[--foreground]/30 transition-colors"
          >
            {t.viewProjects}
          </a>
        </motion.div>
      </div>

    </section>
  );
}
