"use client";

import { useState, useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";

// ─── Animated canvas background ───────────────────────────────────────────────

function rng(s: number) { const x = Math.sin(s + 1) * 43758.5453; return x - Math.floor(x); }

function useAnimCanvas(ref: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    let raf = 0;
    let t = 0;

    // Static nodes
    const W = cvs.width, H = cvs.height;
    const nodes = Array.from({ length: 28 }, (_, i) => ({
      x: rng(i * 3.1) * W,
      y: rng(i * 7.3) * H,
      vx: (rng(i * 2.7) - 0.5) * 0.28,
      vy: (rng(i * 5.1) - 0.5) * 0.22,
      r: rng(i * 4.3) * 2.2 + 0.8,
    }));

    const tick = () => {
      raf = requestAnimationFrame(tick);
      t++;

      ctx.fillStyle = "rgba(8,6,22,0.28)";
      ctx.fillRect(0, 0, W, H);

      // Move nodes
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      // Draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.18;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(220,160,255,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((n, i) => {
        const pulse = Math.sin(t * 0.025 + i) * 0.3 + 0.7;
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3);
        g.addColorStop(0, `rgba(200,120,255,${0.7 * pulse})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(230,180,255,${0.85 * pulse})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      });

      // Horizon scan line
      const scanY = ((t * 0.6) % (H + 20)) - 10;
      const sg = ctx.createLinearGradient(0, scanY - 6, 0, scanY + 6);
      sg.addColorStop(0, "transparent");
      sg.addColorStop(0.5, "rgba(200,120,255,0.06)");
      sg.addColorStop(1, "transparent");
      ctx.fillStyle = sg; ctx.fillRect(0, scanY - 6, W, 12);
    };

    tick();
    return () => cancelAnimationFrame(raf);
  }, [ref]);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MakatatvDemo() {
  const [iframeStatus, setIframeStatus] = useState<"loading" | "blocked">("loading");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useAnimCanvas(canvasRef);

  useEffect(() => {
    const t = setTimeout(() => setIframeStatus("blocked"), 3500);
    return () => clearTimeout(t);
  }, []);

  const handleLoad = () => {
    try {
      void iframeRef.current?.contentWindow?.location.href;
      // If we can access href → loaded (rare)
    } catch {
      setIframeStatus("blocked");
    }
  };

  const blocked = iframeStatus === "blocked";

  const stack = ["Next.js 14", "React Three Fiber", "GSAP", "Framer Motion", "TypeScript", "Vercel"];
  const facts = [
    { label: "Tipo",       value: "Agencia creativa" },
    { label: "Ciudad",     value: "Medellín, CO" },
    { label: "Año",        value: "2023 – 2025" },
    { label: "Rol",        value: "Full-Stack Dev" },
  ];

  return (
    <div className="relative w-full h-full min-h-[320px] overflow-hidden bg-[#08061a]">

      {/* Canvas bg — always visible */}
      <canvas
        ref={canvasRef}
        width={800} height={500}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.85 }}
      />

      {/* Iframe attempt (hidden, just trying) */}
      {!blocked && (
        <iframe
          ref={iframeRef}
          src="https://makata.tv"
          onLoad={handleLoad}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="makata.tv"
          style={{ opacity: 0 }}
        />
      )}

      {/* Loading shimmer */}
      {!blocked && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-purple-500/35 border-t-purple-400 animate-spin" />
            <span className="text-[10px] font-mono text-white/28">Conectando…</span>
          </div>
        </div>
      )}

      {/* ── Main showcase (shown when blocked) ── */}
      {blocked && (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 gap-5">

          {/* Logo mark */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{
                background: "linear-gradient(135deg, rgba(180,80,255,0.25), rgba(100,40,200,0.18))",
                border: "1px solid rgba(180,80,255,0.35)",
                boxShadow: "0 0 28px rgba(180,80,255,0.18)",
                color: "#d080ff",
              }}
            >
              M
            </div>
            <div className="text-center">
              <h3
                className="text-xl font-bold tracking-tight"
                style={{ color: "#e8d0ff", textShadow: "0 0 30px rgba(180,80,255,0.5)" }}
              >
                makata.tv
              </h3>
              <p className="text-[11px] font-mono text-purple-300/55 mt-0.5">
                Creative Development Studio
              </p>
            </div>
          </div>

          {/* Divider */}
          <div
            className="w-24 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(180,80,255,0.45), transparent)" }}
          />

          {/* Facts grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            {facts.map(({ label, value }) => (
              <div key={label} className="flex flex-col">
                <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest">{label}</span>
                <span className="text-[11px] font-mono text-white/65">{value}</span>
              </div>
            ))}
          </div>

          {/* Stack badges */}
          <div className="flex flex-wrap justify-center gap-1.5 max-w-xs">
            {stack.map(s => (
              <span
                key={s}
                className="text-[9px] font-mono px-2 py-0.5 rounded-full border"
                style={{
                  background: "rgba(180,80,255,0.08)",
                  borderColor: "rgba(180,80,255,0.22)",
                  color: "rgba(210,150,255,0.75)",
                }}
              >{s}</span>
            ))}
          </div>

          {/* CTA */}
          <a
            href="https://makata.tv"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] font-mono px-4 py-2 rounded-full transition-all"
            style={{
              background: "rgba(160,60,255,0.18)",
              border: "1px solid rgba(180,80,255,0.40)",
              color: "#d080ff",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(160,60,255,0.28)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(160,60,255,0.18)")}
          >
            <ExternalLink size={11} />
            Abrir makata.tv
          </a>

          {/* X-Frame footnote */}
          <div
            className="flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1 rounded-full border"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.22)",
            }}
          >
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: "rgba(255,100,100,0.55)" }}
            />
            X-Frame-Options: SAMEORIGIN
          </div>
        </div>
      )}
    </div>
  );
}
