"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const W = 320;
const H = 180;
const FPS = 30;
const TOTAL_FRAMES = 90; // 3 seconds

function drawFrame(ctx: CanvasRenderingContext2D, frame: number) {
  const t = (frame / TOTAL_FRAMES) * Math.PI * 2;

  ctx.fillStyle = "#080c18";
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = "rgba(59,130,246,0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  const cx = W / 2, cy = H / 2 - 10;

  // Shadow
  ctx.beginPath();
  ctx.ellipse(cx, cy + 50 + Math.sin(t) * 4, 18, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(59,130,246,0.15)";
  ctx.fill();

  // Body
  const bodyY = cy + Math.sin(t) * 6;
  ctx.strokeStyle = "#60a5fa";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  // Head
  ctx.beginPath();
  ctx.arc(cx, bodyY - 18, 10, 0, Math.PI * 2);
  ctx.strokeStyle = "#93c5fd";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Spine
  ctx.beginPath(); ctx.moveTo(cx, bodyY - 8); ctx.lineTo(cx, bodyY + 16);
  ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 2; ctx.stroke();

  // Arms
  const armSwing = Math.sin(t) * 20;
  ctx.beginPath();
  ctx.moveTo(cx, bodyY - 2);
  ctx.lineTo(cx + Math.cos(t + Math.PI) * 16, bodyY + 2 + Math.sin(t + Math.PI) * 8);
  ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, bodyY - 2);
  ctx.lineTo(cx + Math.cos(t) * 16, bodyY + 2 + Math.sin(t) * 8);
  ctx.stroke();

  // Legs
  const legL = Math.sin(t) * 18;
  const legR = Math.sin(t + Math.PI) * 18;
  ctx.beginPath(); ctx.moveTo(cx, bodyY + 16);
  ctx.lineTo(cx - 8 + legL * 0.3, bodyY + 28);
  ctx.lineTo(cx - 12 + legL * 0.5, bodyY + 40);
  ctx.strokeStyle = "#2563eb"; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, bodyY + 16);
  ctx.lineTo(cx + 8 + legR * 0.3, bodyY + 28);
  ctx.lineTo(cx + 12 + legR * 0.5, bodyY + 40);
  ctx.stroke();

  // Frame counter overlay
  ctx.fillStyle = "rgba(59,130,246,0.6)";
  ctx.font = "9px monospace";
  ctx.fillText(`F${String(frame).padStart(3, "0")}`, 6, 14);

  // Timecode
  const sec = (frame / FPS).toFixed(2);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "8px monospace";
  ctx.fillText(`00:00:${sec}`, W - 58, 14);
}

interface EncodeStats {
  encodedFrames: number;
  encodedBytes: number;
  elapsedMs: number;
  codec: string;
}

export default function LarkboardDemo() {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"idle" | "encoding" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<EncodeStats | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [webCodecsSupported, setWebCodecsSupported] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const chunksRef = useRef<EncodedVideoChunk[]>([]);
  const rafRef = useRef<number>(0);

  // Live preview animation
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const canvas = previewRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawFrame(ctx, frame % TOTAL_FRAMES);
      setCurrentFrame(frame % TOTAL_FRAMES);
      frame++;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !("VideoEncoder" in window)) {
      setWebCodecsSupported(false);
    }
  }, []);

  const encode = useCallback(async () => {
    if (!webCodecsSupported) return;
    setPhase("encoding");
    setProgress(0);
    chunksRef.current = [];

    const offscreen = document.createElement("canvas");
    offscreen.width = W;
    offscreen.height = H;
    const ctx = offscreen.getContext("2d")!;

    const start = performance.now();
    let encodedBytes = 0;

    const encoder = new VideoEncoder({
      output: (chunk) => {
        chunksRef.current.push(chunk);
        encodedBytes += chunk.byteLength;
      },
      error: (e) => console.error("VideoEncoder error:", e),
    });

    encoder.configure({
      codec: "avc1.42001f",
      width: W,
      height: H,
      bitrate: 800_000,
      framerate: FPS,
      latencyMode: "quality",
    });

    for (let f = 0; f < TOTAL_FRAMES; f++) {
      drawFrame(ctx, f);
      const videoFrame = new VideoFrame(offscreen, {
        timestamp: Math.round((f / FPS) * 1_000_000),
        duration: Math.round(1_000_000 / FPS),
      });
      encoder.encode(videoFrame, { keyFrame: f % 15 === 0 });
      videoFrame.close();
      setProgress(Math.round(((f + 1) / TOTAL_FRAMES) * 100));
      // Yield to keep UI responsive
      if (f % 10 === 0) await new Promise((r) => setTimeout(r, 0));
    }

    await encoder.flush();
    encoder.close();

    const elapsed = performance.now() - start;

    // Build MP4 manually via mp4-muxer
    try {
      const { Muxer, ArrayBufferTarget } = await import("mp4-muxer");
      const target = new ArrayBufferTarget();
      const muxer = new Muxer({
        target,
        video: { codec: "avc", width: W, height: H },
        fastStart: "in-memory",
      });

      for (const chunk of chunksRef.current) {
        muxer.addVideoChunk(chunk, undefined);
      }
      muxer.finalize();

      const blob = new Blob([target.buffer], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      encodedBytes = target.buffer.byteLength;
    } catch {
      // mp4-muxer failed — still show stats
    }

    setStats({
      encodedFrames: TOTAL_FRAMES,
      encodedBytes,
      elapsedMs: Math.round(elapsed),
      codec: "H.264 avc1.42001f",
    });
    setPhase("done");
  }, [webCodecsSupported]);

  const reset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setPhase("idle");
    setProgress(0);
    setStats(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#080c18] font-mono text-xs overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-white/60">walk_cycle_v4.lark</span>
        </div>
        <div className="flex items-center gap-2">
          {webCodecsSupported ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20">
              WebCodecs API
            </span>
          ) : (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/20">
              WebCodecs no soportado
            </span>
          )}
          <span className="text-white/30">F{String(currentFrame).padStart(3, "0")} / {TOTAL_FRAMES}</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Preview canvas */}
        <div className="flex-1 flex items-center justify-center bg-black/40 relative">
          <canvas
            ref={previewRef}
            width={W}
            height={H}
            className="max-w-full max-h-full"
            style={{ imageRendering: "pixelated" }}
          />

          {/* Frame pins overlay */}
          {phase === "idle" && (
            <div className="absolute inset-0 pointer-events-none">
              {[
                { x: "32%", y: "45%", color: "#3b82f6", label: "F008" },
                { x: "65%", y: "28%", color: "#a855f7", label: "F022" },
                { x: "50%", y: "72%", color: "#f97316", label: "F035" },
              ].map((pin) => (
                <div
                  key={pin.label}
                  className="absolute flex flex-col items-center gap-0.5"
                  style={{ left: pin.x, top: pin.y, transform: "translate(-50%,-50%)" }}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center text-[7px] text-white font-bold"
                    style={{ background: pin.color }}
                  />
                  <span className="text-[7px] text-white/40">{pin.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-44 shrink-0 border-l border-white/10 flex flex-col">
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1 p-3 gap-3">
                <div>
                  <p className="text-[9px] text-white/30 uppercase tracking-widest mb-2">Preview</p>
                  <p className="text-white/50 text-[10px] leading-relaxed">
                    Animación cargada.<br />
                    {TOTAL_FRAMES} frames · {FPS}fps · {(TOTAL_FRAMES / FPS).toFixed(1)}s
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5">Output</p>
                  <p className="text-[10px] text-white/40">H.264 · {W}×{H}</p>
                  <p className="text-[10px] text-white/40">800 kbps · {FPS}fps</p>
                </div>
                <button
                  onClick={encode}
                  disabled={!webCodecsSupported}
                  className="mt-auto w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/20 text-white text-[11px] font-bold transition-colors"
                >
                  Encode H.264 →
                </button>
              </motion.div>
            )}

            {phase === "encoding" && (
              <motion.div key="encoding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1 p-3 gap-3 justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-blue-500/40 border-t-blue-500 animate-spin" />
                  <p className="text-[10px] text-white/50">Encodando…</p>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <p className="text-center text-[10px] text-blue-400">{progress}% · VideoEncoder API</p>
              </motion.div>
            )}

            {phase === "done" && stats && (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1 p-3 gap-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <p className="text-[10px] text-green-400 font-bold">Encode completo</p>
                </div>
                <div className="flex flex-col gap-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-white/30">Codec</span>
                    <span className="text-white/60">H.264</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30">Frames</span>
                    <span className="text-white/60">{stats.encodedFrames}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30">Tamaño</span>
                    <span className="text-white/60">{(stats.encodedBytes / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30">Tiempo</span>
                    <span className="text-white/60">{stats.elapsedMs}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30">Ratio</span>
                    <span className="text-green-400">{(stats.encodedFrames / (stats.elapsedMs / 1000)).toFixed(0)} fps</span>
                  </div>
                </div>
                {videoUrl && (
                  <video
                    src={videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full rounded-lg border border-white/10 mt-1"
                  />
                )}
                <button onClick={reset} className="mt-auto w-full py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white/70 text-[10px] transition-colors">
                  Reset
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-4 py-2 border-t border-white/10 shrink-0">
        <div className="relative w-full h-1.5 bg-white/10 rounded-full">
          <motion.div
            className="h-full bg-blue-500/60 rounded-full"
            animate={{ width: `${((currentFrame) / TOTAL_FRAMES) * 100}%` }}
            transition={{ duration: 0 }}
          />
          {[8, 22, 35].map((f) => (
            <div
              key={f}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-[#080c18]"
              style={{
                left: `${(f / TOTAL_FRAMES) * 100}%`,
                background: ["#3b82f6", "#a855f7", "#f97316"][Math.floor(f / 15)],
              }}
            />
          ))}
        </div>
        <p className="text-center text-[9px] text-white/20 mt-1.5">
          Larkboard · WebCodecs API · VideoEncoder → H.264 → mp4-muxer
        </p>
      </div>
    </div>
  );
}
