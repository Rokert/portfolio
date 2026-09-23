"use client";

import { useState, useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";

// ─── Canvas — floating peer avatars that connect ──────────────────────────────

const AVATARS = [
  { label: "AI", color: "#06b6d4" },
  { label: "JD", color: "#8b5cf6" },
  { label: "SR", color: "#10b981" },
  { label: "MK", color: "#f59e0b" },
  { label: "PE", color: "#06b6d4" },
  { label: "LN", color: "#ec4899" },
];

function useAvatarCanvas(ref: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const W = cvs.width, H = cvs.height;
    let raf = 0, t = 0;

    const nodes = AVATARS.map((av, i) => {
      const angle = (i / AVATARS.length) * Math.PI * 2;
      const r = Math.min(W, H) * 0.28;
      return {
        ...av,
        x: W / 2 + Math.cos(angle) * r,
        y: H / 2 + Math.sin(angle) * r,
        ox: W / 2 + Math.cos(angle) * r,
        oy: H / 2 + Math.sin(angle) * r,
        phase: i * 1.05,
        speed: 0.008 + i * 0.0012,
      };
    });

    // Which pairs are "connected" — rotating
    const pairs = [[0, 1], [0, 3], [1, 2], [2, 4], [3, 5], [4, 5]] as const;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      t++;

      // Fade trail
      ctx.fillStyle = "rgba(5,12,28,0.22)";
      ctx.fillRect(0, 0, W, H);

      // Gentle drift
      nodes.forEach(n => {
        n.x = n.ox + Math.sin(t * n.speed + n.phase) * 14;
        n.y = n.oy + Math.cos(t * n.speed * 0.8 + n.phase) * 10;
      });

      // Active pair (rotates every ~120 frames)
      const activePair = pairs[Math.floor(t / 120) % pairs.length];

      // Draw edges — dimmed
      for (const [a, b] of pairs) {
        const active = (a === activePair[0] && b === activePair[1]);
        const alpha = active ? 0 : 0.06;
        ctx.beginPath();
        ctx.moveTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(nodes[b].x, nodes[b].y);
        ctx.strokeStyle = `rgba(6,182,212,${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Active connection — animated pulse along the line
      if (activePair) {
        const a = nodes[activePair[0]], b = nodes[activePair[1]];
        const prog = (t % 60) / 60;
        const px = a.x + (b.x - a.x) * prog;
        const py = a.y + (b.y - a.y) * prog;

        // Line gradient
        const lg = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        lg.addColorStop(0, "rgba(6,182,212,0.5)");
        lg.addColorStop(0.5, "rgba(139,92,246,0.6)");
        lg.addColorStop(1, "rgba(6,182,212,0.5)");
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = lg; ctx.lineWidth = 1.5; ctx.stroke();

        // Travelling dot
        const dg = ctx.createRadialGradient(px, py, 0, px, py, 6);
        dg.addColorStop(0, "rgba(255,255,255,0.95)");
        dg.addColorStop(0.4, "rgba(6,182,212,0.7)");
        dg.addColorStop(1, "transparent");
        ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
      }

      // Draw avatar circles
      nodes.forEach((n, i) => {
        const isActive = activePair && (i === activePair[0] || i === activePair[1]);
        const pulse = Math.sin(t * 0.04 + n.phase) * 0.15 + 0.85;
        const radius = isActive ? 22 : 18;

        // Glow
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * 2);
        glow.addColorStop(0, n.color + (isActive ? "38" : "18"));
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(n.x, n.y, radius * 2, 0, Math.PI * 2); ctx.fill();

        // Circle bg
        ctx.beginPath(); ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(5,12,28,0.85)`; ctx.fill();
        ctx.strokeStyle = isActive ? n.color : n.color + "55";
        ctx.lineWidth = isActive ? 2 : 1.2; ctx.stroke();

        // Label
        ctx.fillStyle = isActive ? "#ffffff" : `rgba(255,255,255,${0.55 * pulse})`;
        ctx.font = `bold ${isActive ? 10 : 9}px monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(n.label, n.x, n.y);
      });

      // Center "peer" hub
      const cg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 18);
      cg.addColorStop(0, "rgba(6,182,212,0.25)"); cg.addColorStop(1, "transparent");
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(6,182,212,0.35)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 10, 0, Math.PI * 2); ctx.stroke();
    };

    tick();
    return () => cancelAnimationFrame(raf);
  }, [ref]);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PeerDemo() {
  const [blocked, setBlocked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useAvatarCanvas(canvasRef);

  useEffect(() => {
    const t = setTimeout(() => setBlocked(true), 3500);
    return () => clearTimeout(t);
  }, []);

  const handleLoad = () => {
    try { void iframeRef.current?.contentWindow?.location.href; }
    catch { setBlocked(true); }
  };

  const stack = ["Next.js", "OpenAI API", "WebSockets", "Framer Motion", "Prisma", "Vercel"];
  const features = [
    "Matching AI-to-human en tiempo real",
    "Sesiones de mentoring peer-to-peer",
    "Feed personalizado con IA generativa",
    "Notificaciones WebSocket live",
  ];

  return (
    <div className="relative w-full h-full min-h-[320px] overflow-hidden bg-[#05080f]">

      {/* Canvas background */}
      <canvas
        ref={canvasRef}
        width={700} height={460}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Iframe attempt */}
      {!blocked && (
        <iframe
          ref={iframeRef}
          src="https://heypeer.ai"
          onLoad={handleLoad}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="heypeer.ai"
          style={{ opacity: 0 }}
        />
      )}

      {/* Loading */}
      {!blocked && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-cyan-500/35 border-t-cyan-400 animate-spin" />
            <span className="text-[10px] font-mono text-white/28">Conectando…</span>
          </div>
        </div>
      )}

      {/* ── Showcase ── */}
      {blocked && (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-8 gap-4">

          {/* Brand */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold"
              style={{
                background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.15))",
                border: "1px solid rgba(6,182,212,0.35)",
                boxShadow: "0 0 24px rgba(6,182,212,0.15)",
                color: "#22d3ee",
              }}
            >P</div>
            <h3 className="text-lg font-bold" style={{ color: "#a5f3fc", textShadow: "0 0 24px rgba(6,182,212,0.45)" }}>
              heypeer.ai
            </h3>
            <p className="text-[10px] font-mono text-cyan-400/45">AI Peer Matching Platform</p>
          </div>

          <div className="w-20 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent)" }} />

          {/* Feature list */}
          <div className="flex flex-col gap-1.5 w-full max-w-[260px]">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-cyan-400/60 mt-0.5 shrink-0" style={{ fontSize: 9 }}>▸</span>
                <span className="text-[10px] font-mono text-white/50 leading-tight">{f}</span>
              </div>
            ))}
          </div>

          {/* Stack */}
          <div className="flex flex-wrap justify-center gap-1.5 max-w-xs">
            {stack.map(s => (
              <span key={s} className="text-[9px] font-mono px-2 py-0.5 rounded-full border"
                style={{ background: "rgba(6,182,212,0.07)", borderColor: "rgba(6,182,212,0.2)", color: "rgba(103,232,249,0.7)" }}>
                {s}
              </span>
            ))}
          </div>

          {/* CTA */}
          <a
            href="https://heypeer.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] font-mono px-4 py-1.5 rounded-full transition-all"
            style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.35)", color: "#22d3ee" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(6,182,212,0.22)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(6,182,212,0.12)")}
          >
            <ExternalLink size={11} /> Abrir heypeer.ai
          </a>

          <div className="flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1 rounded-full border"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.2)" }}>
            <span className="w-1 h-1 rounded-full" style={{ background: "rgba(255,100,100,0.5)" }} />
            X-Frame-Options: SAMEORIGIN
          </div>
        </div>
      )}
    </div>
  );
}
