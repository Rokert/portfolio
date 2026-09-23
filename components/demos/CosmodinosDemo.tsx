"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Screen   = "lobby" | "game";
type GameMode = "Gem Smash" | "Shurikens";

const ROOMS = [
  { id: "room-01", name: "Sala Galáctica", players: 8,  max: 10, mode: "Gem Smash"  as GameMode, ping: 22 },
  { id: "room-02", name: "Arena Cosmo",    players: 15, max: 20, mode: "Shurikens"  as GameMode, ping: 45 },
  { id: "room-03", name: "Zona Júpiter",   players: 3,  max: 10, mode: "Gem Smash"  as GameMode, ping: 18 },
  { id: "room-04", name: "Nebulosa Beta",  players: 20, max: 20, mode: "Shurikens"  as GameMode, ping: 67 },
];

const DINO_COLORS = ["#f87171","#60a5fa","#34d399","#fbbf24","#a78bfa","#f472b6"];
const DINO_NAMES  = ["RaptorX","SaurBot","TRex99","DinoKing","VelociZ","StegaBro"];

interface Gem        { id: number; x: number; y: number; color: string; collected: boolean }
interface Player     { id: number; x: number; y: number; color: string; score: number; name: string; vx: number; vy: number }
interface Popup      { id: number; x: number; y: number; alpha: number }
interface Star       { x: number; y: number; r: number; phase: number }
interface ScoreEntry { name: string; color: string; score: number }

/* ── Game canvas ─────────────────────────────────────────────────────── */
function GameCanvas({ mode, myColor, myName, onScores }: {
  mode: GameMode;
  myColor: string;
  myName: string;
  onScores: (s: ScoreEntry[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef({
    players: [] as Player[],
    gems:    [] as Gem[],
    popups:  [] as Popup[],
    stars:   [] as Star[],
    t: 0, popupId: 0,
  });

  useEffect(() => {
    const s = stateRef.current;
    s.players = DINO_NAMES.map((name, i) => ({
      id: i, name: i === 0 ? myName : name, color: i === 0 ? myColor : DINO_COLORS[i],
      x: 50 + (i % 3) * 110, y: 55 + Math.floor(i / 3) * 110,
      vx: 0, vy: 0, score: 0,
    }));
    s.gems = Array.from({ length: 10 }, (_, i) => ({
      id: i, collected: false,
      x: 30 + (i % 5) * 65, y: 35 + Math.floor(i / 5) * 90,
      color: ["#fbbf24","#60a5fa","#34d399"][i % 3],
    }));
    s.stars = Array.from({ length: 55 }, () => ({
      x: Math.random() * 380, y: Math.random() * 230,
      r: Math.random() * 1.2 + 0.3, phase: Math.random() * Math.PI * 2,
    }));
    s.t = 0; s.popups = [];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let lastScoreEmit = 0;

    const tick = () => {
      s.t += 0.04;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      /* ── Background ── */
      ctx.fillStyle = "#070c16";
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // Stars
      s.stars.forEach(st => {
        const a = 0.25 + Math.sin(s.t * 1.5 + st.phase) * 0.2;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${a})`; ctx.fill();
      });

      /* ── Mode-specific objects ── */
      if (mode === "Gem Smash") {
        s.gems.forEach(gem => {
          if (gem.collected) return;
          const pulse = 1 + Math.sin(s.t * 2.5 + gem.id) * 0.12;
          const sz = 7 * pulse;

          // Glow
          const grad = ctx.createRadialGradient(gem.x, gem.y, 0, gem.x, gem.y, sz * 2.5);
          grad.addColorStop(0, gem.color + "55");
          grad.addColorStop(1, "transparent");
          ctx.beginPath(); ctx.arc(gem.x, gem.y, sz * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = grad; ctx.fill();

          // Diamond
          ctx.beginPath();
          ctx.moveTo(gem.x, gem.y - sz);
          ctx.lineTo(gem.x + sz * 0.65, gem.y);
          ctx.lineTo(gem.x, gem.y + sz * 0.8);
          ctx.lineTo(gem.x - sz * 0.65, gem.y);
          ctx.closePath();
          ctx.fillStyle = gem.color; ctx.globalAlpha = 0.9; ctx.fill();
          // Shine
          ctx.beginPath();
          ctx.moveTo(gem.x - sz * 0.2, gem.y - sz * 0.6);
          ctx.lineTo(gem.x + sz * 0.3, gem.y - sz * 0.1);
          ctx.lineTo(gem.x - sz * 0.1, gem.y - sz * 0.1);
          ctx.closePath();
          ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fill();
          ctx.globalAlpha = 1;
        });
      } else {
        for (let i = 0; i < 5; i++) {
          const sx = (W * 0.1 + i * W * 0.18 + s.t * 55 * (i % 2 === 0 ? 1 : -1) + W * 10) % W;
          const sy = H * 0.3 + Math.sin(s.t + i * 1.3) * H * 0.28;
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(s.t * 3.5 + i);
          ctx.globalAlpha = 0.75;
          for (let j = 0; j < 4; j++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath(); ctx.moveTo(0,-11); ctx.lineTo(4,0); ctx.lineTo(0,5); ctx.lineTo(-4,0); ctx.closePath();
            ctx.fillStyle = j % 2 === 0 ? "#e2e8f0" : "#94a3b8"; ctx.fill();
          }
          ctx.globalAlpha = 1; ctx.restore();
        }
      }

      /* ── Players ── */
      s.players.forEach((p, i) => {
        if (mode === "Gem Smash") {
          const target = s.gems.find(g => !g.collected) ?? s.gems[(i * 2) % s.gems.length];
          if (target) {
            const dx = target.x - p.x, dy = target.y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 1) { p.vx += dx / dist * 0.18; p.vy += dy / dist * 0.18; }
            p.vx *= 0.88; p.vy *= 0.88;
            p.x += p.vx; p.y += p.vy;
            p.x = Math.max(14, Math.min(W - 14, p.x));
            p.y = Math.max(14, Math.min(H - 14, p.y));
            if (!target.collected && Math.hypot(target.x - p.x, target.y - p.y) < 12) {
              target.collected = true;
              p.score += 10;
              s.popups.push({ id: ++s.popupId, x: target.x, y: target.y - 6, alpha: 1 });
              setTimeout(() => {
                target.collected = false;
                target.x = 20 + Math.random() * (W - 40);
                target.y = 20 + Math.random() * (H - 40);
              }, 1400);
            }
          }
        } else {
          p.x += Math.sin(s.t * 0.7 + i * 1.4) * 0.9;
          p.y += Math.cos(s.t * 0.5 + i * 1.1) * 0.9;
          p.x = Math.max(14, Math.min(W - 14, p.x));
          p.y = Math.max(14, Math.min(H - 14, p.y));
        }

        // Body glow
        const grad2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
        grad2.addColorStop(0, p.color + "55"); grad2.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = grad2; ctx.fill();

        // Body
        ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1; ctx.stroke();

        // Eyes
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(p.x - 3, p.y - 2, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(p.x + 3, p.y - 2, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#111";
        ctx.beginPath(); ctx.arc(p.x - 3, p.y - 2, 1.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(p.x + 3, p.y - 2, 1.1, 0, Math.PI * 2); ctx.fill();

        // Name tag
        ctx.fillStyle = i === 0 ? "#fff" : "rgba(255,255,255,0.5)";
        ctx.font = `${i === 0 ? "bold " : ""}7px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(p.name, p.x, p.y - 15);
      });

      /* ── Score popups ── */
      s.popups = s.popups.filter(pop => {
        pop.y -= 0.7; pop.alpha -= 0.022;
        if (pop.alpha <= 0) return false;
        ctx.globalAlpha = pop.alpha;
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("+10", pop.x, pop.y);
        ctx.globalAlpha = 1;
        return true;
      });

      // Emit scores periodically
      if (s.t - lastScoreEmit > 0.5) {
        lastScoreEmit = s.t;
        onScores(s.players.map(p => ({ name: p.name, color: p.color, score: p.score })));
      }

      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, myColor, myName]);

  return <canvas ref={canvasRef} width={380} height={230} className="w-full h-full" />;
}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function CosmodinosDemo() {
  const [screen,       setScreen]       = useState<Screen>("lobby");
  const [selectedRoom, setSelectedRoom] = useState(0);
  const [connecting,   setConnecting]   = useState(false);
  const [myColorIdx,   setMyColorIdx]   = useState(0);
  const [myName,       setMyName]       = useState("RaptorX");
  const [scores,       setScores]       = useState<ScoreEntry[]>(
    DINO_NAMES.map((name, i) => ({ name, color: DINO_COLORS[i], score: 0 }))
  );

  const room = ROOMS[selectedRoom];

  const join = () => {
    if (room.players >= room.max) return;
    setConnecting(true);
    setTimeout(() => { setConnecting(false); setScreen("game"); }, 1100);
  };

  const sorted = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full h-full flex flex-col bg-[#070c16] overflow-hidden font-mono">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0c1422] border-b border-[#1a2840] shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[12px] tracking-[0.2em]" style={{ color: "#60a5fa" }}>COSMODINOS</span>
          <span className="text-[9px] text-[#1e3a5f]">v1.4.2</span>
        </div>
        <div className="flex items-center gap-3">
          {screen === "game" && (
            <button type="button" onClick={() => setScreen("lobby")}
              className="text-[9px] text-white/35 hover:text-white/60 transition-colors">
              ← Lobby
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] text-white/35">20 online</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── LOBBY ── */}
        {screen === "lobby" && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }} className="flex flex-col flex-1 min-h-0">

            {/* Character selector */}
            <div className="px-3 pt-2.5 pb-2 border-b border-[#1a2840] shrink-0">
              <p className="text-[8px] text-white/25 uppercase tracking-widest mb-2">Tu dino</p>
              <div className="flex items-center gap-2 mb-2">
                {DINO_COLORS.map((c, i) => (
                  <button key={c} type="button" onClick={() => setMyColorIdx(i)}
                    className="transition-all rounded-full"
                    style={{
                      width: myColorIdx === i ? "22px" : "16px",
                      height: myColorIdx === i ? "22px" : "16px",
                      background: c,
                      outline: myColorIdx === i ? `2px solid ${c}` : "none",
                      outlineOffset: "2px",
                      opacity: myColorIdx === i ? 1 : 0.45,
                    }} />
                ))}
              </div>
              <input
                type="text"
                value={myName}
                maxLength={10}
                onChange={e => setMyName(e.target.value)}
                className="bg-transparent border rounded px-2 py-1 text-[10px] outline-none w-32 transition-colors"
                style={{
                  borderColor: `${DINO_COLORS[myColorIdx]}55`,
                  color: DINO_COLORS[myColorIdx],
                  caretColor: DINO_COLORS[myColorIdx],
                }}
                placeholder="Tu nombre"
              />
            </div>

            {/* Room list */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5" style={{ scrollbarWidth: "none" }}>
              <p className="text-[8px] text-white/25 uppercase tracking-widest mb-1">Salas disponibles</p>
              {ROOMS.map((r, i) => (
                <button key={r.id} type="button" onClick={() => setSelectedRoom(i)}
                  className="text-left p-2.5 rounded-lg border transition-all"
                  style={selectedRoom === i ? {
                    borderColor: "rgba(96,165,250,0.45)",
                    background: "rgba(96,165,250,0.08)",
                  } : {
                    borderColor: "#1a2840",
                    background: "#0c1422",
                  }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10.5px] text-white/75">{r.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] px-1.5 py-0.5 rounded"
                        style={r.mode === "Gem Smash"
                          ? { background: "rgba(251,191,36,0.15)", color: "#fbbf24" }
                          : { background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>
                        {r.mode}
                      </span>
                      <span className="text-[8.5px]"
                        style={{ color: r.ping < 30 ? "#4ade80" : r.ping < 60 ? "#fbbf24" : "#f87171" }}>
                        {r.ping}ms
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(r.max, 16) }).map((_, j) => (
                        <div key={j} className="w-1.5 h-1.5 rounded-sm transition-colors"
                          style={{ background: j < r.players ? "#60a5fa" : "#1a2840" }} />
                      ))}
                    </div>
                    <span className="text-[8.5px] text-white/25">{r.players}/{r.max}</span>
                    {r.players >= r.max && (
                      <span className="text-[7.5px] text-red-400/70">LLENA</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Join button */}
            <div className="p-3 border-t border-[#1a2840] shrink-0">
              <button type="button" onClick={join}
                disabled={connecting || room.players >= room.max}
                className="w-full py-2.5 rounded-lg text-[11px] font-bold tracking-wide transition-all"
                style={room.players >= room.max
                  ? { background: "#1a2840", color: "rgba(255,255,255,0.2)", cursor: "not-allowed" }
                  : { background: "#60a5fa", color: "#070c16" }}>
                {connecting ? "Conectando…" : room.players >= room.max ? "Sala llena" : `Unirse · ${room.name}`}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── GAME ── */}
        {screen === "game" && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }} className="flex flex-col flex-1 min-h-0">

            {/* Scoreboard */}
            <div className="flex gap-2 px-3 py-1.5 bg-[#0c1422] border-b border-[#1a2840] overflow-x-auto shrink-0"
              style={{ scrollbarWidth: "none" }}>
              {sorted.map((s, rank) => (
                <div key={s.name} className="flex items-center gap-1 shrink-0">
                  <span className="text-[7.5px] text-white/20 w-3">{rank + 1}.</span>
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-[8.5px]"
                    style={{ color: s.name === DINO_NAMES[myColorIdx] ? "#fff" : "rgba(255,255,255,0.45)" }}>
                    {s.name}
                  </span>
                  <span className="text-[8.5px] tabular-nums" style={{ color: s.color }}>{s.score}</span>
                </div>
              ))}
            </div>

            {/* Canvas */}
            <div className="flex-1 min-h-0">
              <GameCanvas
                mode={room.mode}
                myColor={DINO_COLORS[myColorIdx]}
                myName={myName || "Dino"}
                onScores={setScores}
              />
            </div>

            {/* Status bar */}
            <div className="px-4 py-1.5 border-t border-[#1a2840] flex items-center justify-between shrink-0">
              <span className="text-[8px] text-white/18">Cosmodinos · Unity / C# / Socket.io</span>
              <div className="flex items-center gap-3 text-[8px] text-white/25">
                <span>{room.mode}</span>
                <span>{room.players} jugadores</span>
                <span style={{ color: room.ping < 30 ? "#4ade80" : "#fbbf24" }}>{room.ping}ms</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
