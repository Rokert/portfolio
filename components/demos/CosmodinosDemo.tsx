"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Screen = "lobby" | "game";
type GameMode = "Gem Smash" | "Shurikens";

const ROOMS = [
  { id: "room-01", name: "Sala Galáctica", players: 8, max: 10, mode: "Gem Smash" as GameMode, ping: 22 },
  { id: "room-02", name: "Arena Cosmo", players: 15, max: 20, mode: "Shurikens" as GameMode, ping: 45 },
  { id: "room-03", name: "Zona Júpiter", players: 3, max: 10, mode: "Gem Smash" as GameMode, ping: 18 },
  { id: "room-04", name: "Nebulosa Beta", players: 20, max: 20, mode: "Shurikens" as GameMode, ping: 67 },
];

const DINO_COLORS = ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#f472b6"];
const DINO_NAMES = ["RaptorX", "SaurBot", "TRex99", "DinoKing", "VelociZ", "StegaBro"];

interface Gem { id: number; x: number; y: number; color: string; collected: boolean }
interface Player { id: number; x: number; y: number; color: string; score: number; name: string }

function GameCanvas({ mode }: { mode: GameMode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    gems: [] as Gem[],
    players: [] as Player[],
    t: 0,
  });

  useEffect(() => {
    const state = stateRef.current;
    state.players = Array.from({ length: 6 }, (_, i) => ({
      id: i, x: 60 + (i % 3) * 100, y: 60 + Math.floor(i / 3) * 100,
      color: DINO_COLORS[i], score: 0, name: DINO_NAMES[i],
    }));
    state.gems = Array.from({ length: 12 }, (_, i) => ({
      id: i, x: 30 + (i % 6) * 55, y: 30 + Math.floor(i / 6) * 80,
      color: ["#fbbf24", "#60a5fa", "#34d399"][i % 3], collected: false,
    }));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const tick = () => {
      state.t += 0.04;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background grid
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      if (mode === "Gem Smash") {
        // Draw gems
        state.gems.forEach((gem) => {
          if (gem.collected) return;
          const pulse = 1 + Math.sin(state.t * 2 + gem.id) * 0.15;
          ctx.beginPath();
          ctx.moveTo(gem.x, gem.y - 8 * pulse);
          ctx.lineTo(gem.x + 6 * pulse, gem.y);
          ctx.lineTo(gem.x, gem.y + 6 * pulse);
          ctx.lineTo(gem.x - 6 * pulse, gem.y);
          ctx.closePath();
          ctx.fillStyle = gem.color;
          ctx.globalAlpha = 0.85;
          ctx.fill();
          ctx.globalAlpha = 1;

          // Glow
          ctx.shadowColor = gem.color;
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;
        });
      } else {
        // Shurikens flying
        for (let i = 0; i < 4; i++) {
          const sx = (w * 0.2 + i * w * 0.2 + state.t * 60 * (i % 2 === 0 ? 1 : -1)) % w;
          const sy = h * 0.3 + Math.sin(state.t + i * 1.2) * h * 0.25;
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(state.t * 3 + i);
          ctx.fillStyle = "#e2e8f0";
          ctx.globalAlpha = 0.7;
          for (let j = 0; j < 4; j++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(4, 0);
            ctx.lineTo(0, 4);
            ctx.lineTo(-4, 0);
            ctx.closePath();
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          ctx.restore();
        }
      }

      // Move players toward targets
      state.players.forEach((p, i) => {
        const target = state.gems[(i * 2 + Math.floor(state.t * 0.5)) % state.gems.length];
        if (target && !target.collected) {
          p.x += (target.x - p.x) * 0.02;
          p.y += (target.y - p.y) * 0.02;
          if (Math.hypot(target.x - p.x, target.y - p.y) < 10) {
            target.collected = true;
            p.score += 10;
            setTimeout(() => { target.collected = false; target.x = 20 + Math.random() * (w - 40); target.y = 20 + Math.random() * (h - 40); }, 1500);
          }
        } else {
          p.x += Math.sin(state.t * 0.8 + i * 1.3) * 0.8;
          p.y += Math.cos(state.t * 0.6 + i * 0.9) * 0.8;
          p.x = Math.max(20, Math.min(w - 20, p.x));
          p.y = Math.max(20, Math.min(h - 20, p.y));
        }

        // Draw dino (simple circle + eyes)
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Eyes
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(p.x - 3, p.y - 2, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(p.x + 3, p.y - 2, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#111";
        ctx.beginPath(); ctx.arc(p.x - 3, p.y - 2, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(p.x + 3, p.y - 2, 1, 0, Math.PI * 2); ctx.fill();

        // Name tag
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "7px monospace";
        ctx.textAlign = "center";
        ctx.fillText(p.name, p.x, p.y - 14);
      });

      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  return <canvas ref={canvasRef} width={380} height={200} className="w-full h-full" />;
}

export default function CosmodinosDemo() {
  const [screen, setScreen] = useState<Screen>("lobby");
  const [selectedRoom, setSelectedRoom] = useState(0);
  const [connecting, setConnecting] = useState(false);

  const join = () => {
    setConnecting(true);
    setTimeout(() => { setConnecting(false); setScreen("game"); }, 1200);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#080c14] overflow-hidden font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1320] border-b border-[#1e2d4a] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[#60a5fa] font-bold text-sm tracking-widest">COSMODINOS</span>
          <span className="text-[#1e3a5f] text-xs">v1.4.2</span>
        </div>
        {screen === "game" && (
          <button onClick={() => setScreen("lobby")} className="text-[10px] text-white/40 hover:text-white/70 transition-colors">
            ← Lobby
          </button>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-white/40">20 online</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {screen === "lobby" ? (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 min-h-0">
            {/* Room list */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Salas disponibles</p>
              {ROOMS.map((room, i) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(i)}
                  className={`text-left p-2.5 rounded-lg border transition-all ${
                    selectedRoom === i
                      ? "border-[#60a5fa]/50 bg-[#60a5fa]/10"
                      : "border-[#1e2d4a] hover:border-[#2a3d5a] bg-[#0d1320]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/80">{room.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${room.mode === "Gem Smash" ? "bg-yellow-500/20 text-yellow-400" : "bg-purple-500/20 text-purple-400"}`}>
                        {room.mode}
                      </span>
                      <span className={`text-[9px] ${room.ping < 30 ? "text-green-400" : room.ping < 60 ? "text-yellow-400" : "text-red-400"}`}>
                        {room.ping}ms
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: room.max }).map((_, j) => (
                        <div key={j} className={`w-1.5 h-1.5 rounded-sm ${j < room.players ? "bg-[#60a5fa]" : "bg-[#1e2d4a]"}`} />
                      ))}
                    </div>
                    <span className="text-[9px] text-white/30">{room.players}/{room.max}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Join button */}
            <div className="p-3 border-t border-[#1e2d4a] shrink-0">
              <button
                onClick={join}
                disabled={connecting || ROOMS[selectedRoom].players >= ROOMS[selectedRoom].max}
                className={`w-full py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${
                  ROOMS[selectedRoom].players >= ROOMS[selectedRoom].max
                    ? "bg-[#1e2d4a] text-white/20 cursor-not-allowed"
                    : "bg-[#60a5fa] hover:bg-[#3b82f6] text-[#080c14]"
                }`}
              >
                {connecting ? "Conectando…" : ROOMS[selectedRoom].players >= ROOMS[selectedRoom].max ? "Sala llena" : `Unirse · ${ROOMS[selectedRoom].name}`}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 min-h-0">
            {/* Scoreboard strip */}
            <div className="flex gap-2 px-3 py-1.5 bg-[#0d1320] border-b border-[#1e2d4a] overflow-x-auto shrink-0">
              {DINO_NAMES.map((name, i) => (
                <div key={name} className="flex items-center gap-1 shrink-0">
                  <div className="w-2 h-2 rounded-full" style={{ background: DINO_COLORS[i] }} />
                  <span className="text-[9px] text-white/50">{name}</span>
                  <span className="text-[9px] text-white/30">{(i * 30 + 10) % 120}</span>
                </div>
              ))}
            </div>

            {/* Game canvas */}
            <div className="flex-1 min-h-0">
              <GameCanvas mode={ROOMS[selectedRoom].mode} />
            </div>

            <div className="px-4 py-1.5 border-t border-[#1e2d4a] text-center text-[9px] text-white/20 shrink-0">
              Cosmodinos · Unity / C# · {ROOMS[selectedRoom].players} jugadores · {ROOMS[selectedRoom].mode}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
