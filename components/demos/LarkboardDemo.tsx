"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const W = 480;
const H = 270;
const FPS = 30;
const TOTAL_FRAMES = 90;

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function rng(s: number) { const x = Math.sin(s + 1) * 43758.5453; return x - Math.floor(x); }

function drawBg(ctx: CanvasRenderingContext2D, frame: number) {
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.68);
  sky.addColorStop(0, "#07091a"); sky.addColorStop(1, "#131b38");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  // Stars
  for (let i = 0; i < 38; i++) {
    const sx = rng(i * 3.1) * W, sy = rng(i * 7.3) * H * 0.60;
    const pulse = Math.sin(frame * 0.04 + i) * 0.2 + 0.6;
    ctx.fillStyle = `rgba(180,210,255,${pulse * 0.55})`;
    ctx.fillRect(Math.floor(sx), Math.floor(sy), 1, 1);
  }

  // Ground fill
  const gnd = ctx.createLinearGradient(0, H * 0.68, 0, H);
  gnd.addColorStop(0, "#14183a"); gnd.addColorStop(1, "#0a0e22");
  ctx.fillStyle = gnd; ctx.fillRect(0, H * 0.68, W, H * 0.32);

  // Horizon perspective grid
  const vp = W / 2, gy = H * 0.68;
  ctx.strokeStyle = "rgba(60,100,220,0.13)"; ctx.lineWidth = 1;
  for (let xi = -9; xi <= 9; xi++) {
    const bx = vp + xi * (W / 9);
    ctx.beginPath(); ctx.moveTo(vp, gy); ctx.lineTo(bx, H); ctx.stroke();
  }
  for (let row = 0; row <= 5; row++) {
    const p = row / 5, y = gy + (H - gy) * p;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Horizon glow
  const hg = ctx.createLinearGradient(0, gy - 6, 0, gy + 6);
  hg.addColorStop(0, "transparent"); hg.addColorStop(0.5, "rgba(70,120,255,0.18)"); hg.addColorStop(1, "transparent");
  ctx.fillStyle = hg; ctx.fillRect(0, gy - 6, W, 12);
}

function drawChar(
  ctx: CanvasRenderingContext2D,
  cx: number, baseY: number,
  legL: number, legR: number,
  armL: number, armR: number,
  bodyOff: number, lean: number,
  squashX: number, squashY: number,
) {
  ctx.save();
  ctx.translate(cx, baseY);
  ctx.rotate(lean);

  const headY = -52 + bodyOff;
  const bodyBot = -16 + bodyOff;

  ctx.lineCap = "round"; ctx.lineJoin = "round";

  // ── Back limbs ───────────────────────────────────────────────────────────
  // Back leg
  ctx.beginPath();
  ctx.moveTo(0, bodyBot * squashY);
  ctx.lineTo(-6 + legR * 0.4 * squashX, (bodyBot + 16) * squashY);
  ctx.lineTo(-10 + legR * 0.75 * squashX, (bodyBot + 30) * squashY);
  ctx.strokeStyle = "#2045a0"; ctx.lineWidth = 6; ctx.stroke();

  // Back arm
  ctx.beginPath();
  ctx.moveTo(0, (headY + 22) * squashY);
  ctx.lineTo(armR * 0.5 * squashX + 7, (headY + 33 + armR * 0.18) * squashY);
  ctx.strokeStyle = "#2045a0"; ctx.lineWidth = 4; ctx.stroke();

  // ── Body ─────────────────────────────────────────────────────────────────
  const bodyGrad = ctx.createLinearGradient(0, headY * squashY, 0, bodyBot * squashY);
  bodyGrad.addColorStop(0, "#5090f0"); bodyGrad.addColorStop(1, "#3060c0");
  ctx.beginPath();
  ctx.moveTo(0, (headY + 11) * squashY);
  ctx.lineTo(0, bodyBot * squashY);
  ctx.strokeStyle = bodyGrad; ctx.lineWidth = 7; ctx.stroke();

  // ── Front limbs ──────────────────────────────────────────────────────────
  // Front leg
  ctx.beginPath();
  ctx.moveTo(0, bodyBot * squashY);
  ctx.lineTo(-6 + legL * 0.4 * squashX, (bodyBot + 16) * squashY);
  ctx.lineTo(-10 + legL * 0.75 * squashX, (bodyBot + 30) * squashY);
  ctx.strokeStyle = "#4070d8"; ctx.lineWidth = 6; ctx.stroke();

  // Front arm
  ctx.beginPath();
  ctx.moveTo(0, (headY + 22) * squashY);
  ctx.lineTo(armL * 0.5 * squashX - 7, (headY + 33 + armL * 0.18) * squashY);
  ctx.strokeStyle = "#4070d8"; ctx.lineWidth = 4; ctx.stroke();

  // ── Head ─────────────────────────────────────────────────────────────────
  const hg = ctx.createRadialGradient(2, headY * squashY - 3, 0, 0, headY * squashY, 11);
  hg.addColorStop(0, "#90c0ff"); hg.addColorStop(1, "#4070d0");
  ctx.beginPath(); ctx.arc(0, headY * squashY, 11 * squashX, 0, Math.PI * 2);
  ctx.fillStyle = hg; ctx.fill();
  ctx.strokeStyle = "#70a8ff"; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.restore();
}

function drawShadow(ctx: CanvasRenderingContext2D, cx: number, gy: number, scale: number) {
  const r = 18 * scale;
  const sg = ctx.createRadialGradient(cx, gy, 0, cx, gy, r);
  sg.addColorStop(0, `rgba(50,90,220,${0.38 * scale})`);
  sg.addColorStop(1, "transparent");
  ctx.fillStyle = sg; ctx.fillRect(cx - r, gy - 3, r * 2, 7);
}

function drawWalk(ctx: CanvasRenderingContext2D, frame: number) {
  const t = (frame / TOTAL_FRAMES) * Math.PI * 2;
  const gy = H * 0.68;
  const cx = W / 2;
  const bob = Math.sin(t * 2) * 3;
  drawShadow(ctx, cx, gy, 1);
  drawChar(ctx, cx, gy,
    Math.sin(t) * 20, Math.sin(t + Math.PI) * 20,
    Math.sin(t + Math.PI) * 18, Math.sin(t) * 18,
    bob, 0, 1, 1,
  );
}

function drawRun(ctx: CanvasRenderingContext2D, frame: number) {
  const t = (frame / TOTAL_FRAMES) * Math.PI * 4;
  const gy = H * 0.68;
  const cx = W / 2;
  const bob = Math.sin(t) * 5;
  drawShadow(ctx, cx + 6, gy, 0.9);

  // Speed lines
  ctx.strokeStyle = "rgba(80,130,255,0.12)"; ctx.lineWidth = 1.5; ctx.lineCap = "round";
  for (let i = 0; i < 5; i++) {
    const lx = ((frame * 6 + i * 32) % (W * 0.6)) + W * 0.05;
    const ly = gy - 18 - i * 7;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - 28, ly); ctx.stroke();
  }

  drawChar(ctx, cx, gy,
    Math.sin(t) * 30, Math.sin(t + Math.PI) * 30,
    Math.sin(t + Math.PI) * 28, Math.sin(t) * 28,
    bob, -0.15, 1, 1,
  );
}

function drawJump(ctx: CanvasRenderingContext2D, frame: number) {
  const t = frame / TOTAL_FRAMES;
  const gy = H * 0.68;
  const cx = W / 2;

  let yOff = 0, sqX = 1, sqY = 1;
  if (t < 0.12) {
    // Squat
    const p = t / 0.12;
    yOff = Math.sin(p * Math.PI) * 10;
    sqX = 1 + Math.sin(p * Math.PI) * 0.25;
    sqY = 1 / sqX;
  } else if (t < 0.62) {
    // Air
    const p = (t - 0.12) / 0.50;
    yOff = -Math.sin(p * Math.PI) * 52;
    sqY = 1 + (1 - Math.sin(p * Math.PI)) * 0.15;
    sqX = 1 / sqY;
  } else if (t < 0.80) {
    // Land
    const p = (t - 0.62) / 0.18;
    yOff = Math.sin(p * Math.PI) * 8;
    sqX = 1 + Math.sin(p * Math.PI) * 0.35;
    sqY = 1 / sqX;
  }

  const airFrac = Math.max(0, -yOff / 52);
  drawShadow(ctx, cx, gy, 1 - airFrac * 0.7);

  const spread = airFrac * 22;
  drawChar(ctx, cx, gy + yOff,
    -spread, spread,
    -spread * 0.8, spread * 0.8,
    0, 0, sqX, sqY,
  );
}

type Clip = "walk" | "run" | "jump";

function drawFrame(ctx: CanvasRenderingContext2D, frame: number, clip: Clip) {
  drawBg(ctx, frame);
  if (clip === "walk") drawWalk(ctx, frame);
  else if (clip === "run") drawRun(ctx, frame);
  else drawJump(ctx, frame);

  // HUD
  ctx.font = "9px monospace";
  ctx.fillStyle = "rgba(100,150,255,0.7)";
  ctx.fillText(`F${String(frame).padStart(3, "0")}`, 8, 15);
  const sec = (frame / FPS).toFixed(2);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "8px monospace";
  ctx.fillText(`00:00:${sec}`, W - 58, 15);
}

// ─── Code panel snippets ──────────────────────────────────────────────────────

const CODE = `// WebCodecs API — VideoEncoder → H.264
const encoder = new VideoEncoder({
  output: (chunk) => {
    chunks.push(chunk);
    bytes += chunk.byteLength;
  },
  error: (e) => console.error(e),
});

encoder.configure({
  codec:       "avc1.42001f",
  width:       480,
  height:      270,
  bitrate:     800_000,
  framerate:   30,
  latencyMode: "quality",
});

// Feed canvas frames
for (let f = 0; f < 90; f++) {
  drawFrame(ctx, f, clip);
  const vf = new VideoFrame(canvas, {
    timestamp: (f / 30) * 1_000_000,
    duration:  1_000_000 / 30,
  });
  encoder.encode(vf, { keyFrame: f % 15 === 0 });
  vf.close();
}
await encoder.flush();

// Mux to MP4
const { Muxer, ArrayBufferTarget } = mp4muxer;
const muxer = new Muxer({
  target: new ArrayBufferTarget(),
  video: { codec: "avc", width: 480, height: 270 },
  fastStart: "in-memory",
});
chunks.forEach(c => muxer.addVideoChunk(c));
muxer.finalize();`;

// ─── Main component ───────────────────────────────────────────────────────────

interface EncodeStats {
  frames: number; bytes: number; ms: number; encodeFps: number;
}

export default function LarkboardDemo() {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [clip, setClip] = useState<Clip>("walk");
  const [phase, setPhase] = useState<"idle" | "encoding" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<EncodeStats | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showCode, setShowCode] = useState(false);

  const chunksRef = useRef<EncodedVideoChunk[]>([]);
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const clipRef = useRef<Clip>("walk");

  // Keep clipRef in sync for RAF callback
  useEffect(() => { clipRef.current = clip; }, [clip]);

  // Live preview — throttled to FPS
  useEffect(() => {
    let frame = 0;
    const interval = 1000 / FPS;
    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (now - lastTickRef.current < interval) return;
      lastTickRef.current = now;
      const canvas = previewRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const f = frame % TOTAL_FRAMES;
      drawFrame(ctx, f, clipRef.current);
      setCurrentFrame(f);
      frame++;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !("VideoEncoder" in window))
      setSupported(false);
  }, []);

  const encode = useCallback(async () => {
    if (!supported) return;
    setPhase("encoding"); setProgress(0);
    chunksRef.current = [];

    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const ctx = off.getContext("2d")!;
    const start = performance.now();
    let bytes = 0;

    const encoder = new VideoEncoder({
      output: (chunk) => { chunksRef.current.push(chunk); bytes += chunk.byteLength; },
      error: (e) => console.error("VideoEncoder:", e),
    });
    encoder.configure({ codec: "avc1.42001f", width: W, height: H, bitrate: 800_000, framerate: FPS, latencyMode: "quality" });

    for (let f = 0; f < TOTAL_FRAMES; f++) {
      drawFrame(ctx, f, clipRef.current);
      const vf = new VideoFrame(off, {
        timestamp: Math.round((f / FPS) * 1_000_000),
        duration:  Math.round(1_000_000 / FPS),
      });
      encoder.encode(vf, { keyFrame: f % 15 === 0 });
      vf.close();
      setProgress(Math.round(((f + 1) / TOTAL_FRAMES) * 100));
      if (f % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }
    await encoder.flush(); encoder.close();

    const elapsed = performance.now() - start;

    try {
      const { Muxer, ArrayBufferTarget } = await import("mp4-muxer");
      const target = new ArrayBufferTarget();
      const muxer = new Muxer({ target, video: { codec: "avc", width: W, height: H }, fastStart: "in-memory" });
      chunksRef.current.forEach(c => muxer.addVideoChunk(c, undefined));
      muxer.finalize();
      const url = URL.createObjectURL(new Blob([target.buffer], { type: "video/mp4" }));
      setVideoUrl(url);
      bytes = target.buffer.byteLength;
    } catch { /* show stats without video */ }

    setStats({ frames: TOTAL_FRAMES, bytes, ms: Math.round(elapsed), encodeFps: Math.round(TOTAL_FRAMES / (elapsed / 1000)) });
    setPhase("done");
  }, [supported]);

  const reset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null); setPhase("idle"); setProgress(0); setStats(null);
  };

  const clips: { id: Clip; label: string }[] = [
    { id: "walk", label: "Walk" },
    { id: "run",  label: "Run"  },
    { id: "jump", label: "Jump" },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#07091a] font-mono text-xs overflow-hidden select-none">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-white/55 text-[10px]">{clip}_cycle_v4.lark</span>
          </div>
          {/* Clip tabs */}
          <div className="flex items-center gap-0.5">
            {clips.map(c => (
              <button
                key={c.id}
                onClick={() => { setClip(c.id); if (phase === "done") reset(); }}
                className={`text-[9px] px-2 py-0.5 rounded transition-colors ${
                  clip === c.id
                    ? "bg-blue-600/30 text-blue-300 border border-blue-500/30"
                    : "text-white/28 hover:text-white/55"
                }`}
              >{c.label}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded border ${
            supported
              ? "bg-emerald-900/30 border-emerald-500/25 text-emerald-400"
              : "bg-red-900/20 border-red-500/20 text-red-400"
          }`}>
            <div className={`w-1 h-1 rounded-full ${supported ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            {supported ? "WebCodecs" : "no soportado"}
          </div>
          <span className="text-white/25 text-[9px]">F{String(currentFrame).padStart(3, "0")}/{TOTAL_FRAMES}</span>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 min-h-0">

        {/* Viewport */}
        <div className="flex-1 flex items-center justify-center bg-black/20 relative overflow-hidden">
          <canvas
            ref={previewRef}
            width={W}
            height={H}
            className="max-w-full max-h-full"
            style={{ imageRendering: "pixelated" }}
          />
          {/* Frame marker pins */}
          {phase === "idle" && (
            <div className="absolute inset-0 pointer-events-none">
              {([
                { x: "28%", y: "62%", f: "F015", col: "#3b82f6" },
                { x: "50%", y: "40%", f: "F045", col: "#8b5cf6" },
                { x: "72%", y: "58%", f: "F075", col: "#06b6d4" },
              ] as const).map(p => (
                <div key={p.f} className="absolute flex flex-col items-center gap-0.5"
                  style={{ left: p.x, top: p.y, transform: "translate(-50%,-50%)" }}>
                  <div className="w-3.5 h-3.5 rounded-full border border-white/30 flex items-center justify-center text-[6px] font-bold text-white"
                    style={{ background: p.col }} />
                  <span className="text-[7px] text-white/30">{p.f}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-36 shrink-0 border-l border-white/8 flex flex-col">
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col flex-1 p-3 gap-3">
                <div>
                  <p className="text-[9px] text-white/25 uppercase tracking-widest mb-2">Preview</p>
                  <p className="text-white/45 text-[10px] leading-relaxed">
                    {TOTAL_FRAMES} frames<br/>{FPS}fps · {(TOTAL_FRAMES / FPS).toFixed(1)}s
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-white/25 uppercase tracking-widest mb-1.5">Export</p>
                  <p className="text-[10px] text-white/38">H.264 · {W}×{H}</p>
                  <p className="text-[10px] text-white/38">800 kbps · {FPS}fps</p>
                  <p className="text-[10px] text-white/38">mp4-muxer</p>
                </div>
                <button
                  onClick={encode}
                  disabled={!supported}
                  className="mt-auto w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-white/8 disabled:text-white/18 text-white text-[11px] font-bold transition-colors"
                >Encode →</button>
              </motion.div>
            )}

            {phase === "encoding" && (
              <motion.div key="encoding" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col flex-1 p-3 gap-2.5 justify-center items-center">
                <div className="w-4 h-4 rounded-full border-2 border-blue-500/35 border-t-blue-400 animate-spin" />
                <p className="text-[10px] text-white/45">Encodando…</p>
                <div className="w-full bg-white/8 rounded-full h-1.5 overflow-hidden">
                  <motion.div className="h-full bg-blue-500 rounded-full"
                    animate={{ width: `${progress}%` }} transition={{ duration: 0.08 }} />
                </div>
                <p className="text-[10px] text-blue-400">{progress}%</p>
              </motion.div>
            )}

            {phase === "done" && stats && (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col flex-1 p-3 gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-[10px] text-emerald-400 font-bold">Listo</p>
                </div>
                {([
                  ["Codec",   "H.264"],
                  ["Frames",  String(stats.frames)],
                  ["Tamaño",  `${(stats.bytes / 1024).toFixed(1)} KB`],
                  ["Tiempo",  `${stats.ms} ms`],
                  ["Ratio",   `${stats.encodeFps}× RT`],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[10px]">
                    <span className="text-white/28">{k}</span>
                    <span className={k === "Ratio" ? "text-emerald-400" : "text-white/55"}>{v}</span>
                  </div>
                ))}
                {videoUrl && (
                  <video src={videoUrl} autoPlay loop muted playsInline
                    className="w-full rounded border border-white/8 mt-1" />
                )}
                <button onClick={reset}
                  className="mt-auto w-full py-1 rounded border border-white/10 text-white/35 hover:text-white/60 text-[10px] transition-colors">
                  Reset
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Code panel overlay ── */}
      <AnimatePresence>
        {showCode && (
          <motion.div
            key="code"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 z-30 flex flex-col"
            style={{ background: "rgba(4,6,18,0.96)", backdropFilter: "blur(8px)" }}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 shrink-0">
              <span className="text-[10px] text-blue-300/80 font-mono">VideoEncoder API</span>
              <button onClick={() => setShowCode(false)}
                className="text-[11px] text-white/28 hover:text-white/60 transition-colors">✕ cerrar</button>
            </div>
            <div className="flex-1 overflow-auto px-5 py-4">
              <pre className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap select-text"
                style={{ color: "#abb2bf" }}>
                {CODE.split("\n").map((line, i) => {
                  // Simple syntax coloring
                  const html = line
                    .replace(/(\/\/.*)/g, '<span style="color:#6a9955">$1</span>')
                    .replace(/\b(const|await|new|for|let|if)\b/g, '<span style="color:#c792ea">$1</span>')
                    .replace(/"([^"]*)"/g, '<span style="color:#c3e88d">"$1"</span>')
                    .replace(/\b(\d[\d_]*)\b/g, '<span style="color:#f78c6c">$1</span>');
                  return <span key={i} dangerouslySetInnerHTML={{ __html: html + "\n" }} />;
                })}
              </pre>
            </div>
            <p className="text-center text-[9px] font-mono text-white/12 pb-2">
              Larkboard · WebCodecs API real
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Timeline ── */}
      <div className="px-3 pt-2 pb-2 border-t border-white/8 shrink-0 flex items-center gap-3">
        <div className="relative flex-1 h-1.5 bg-white/8 rounded-full overflow-visible">
          {/* Playhead */}
          <motion.div
            className="absolute top-0 h-full bg-blue-500/55 rounded-full"
            animate={{ width: `${(currentFrame / TOTAL_FRAMES) * 100}%` }}
            transition={{ duration: 0 }}
          />
          {/* Keyframe markers */}
          {[15, 45, 75].map((f, idx) => (
            <div key={f}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-[#07091a] -translate-x-1/2"
              style={{
                left: `${(f / TOTAL_FRAMES) * 100}%`,
                background: ["#3b82f6", "#8b5cf6", "#06b6d4"][idx],
              }}
            />
          ))}
        </div>
        {/* Code toggle */}
        <button
          onClick={() => setShowCode(v => !v)}
          className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
            showCode
              ? "bg-blue-600/25 border-blue-400/40 text-blue-300"
              : "border-white/10 text-white/30 hover:text-white/55 hover:border-white/22"
          }`}
        >{"{ }"}</button>
      </div>

      <p className="text-center text-[9px] text-white/12 pb-1.5 shrink-0 font-mono">
        Larkboard · WebCodecs VideoEncoder → H.264 → mp4-muxer
      </p>
    </div>
  );
}
