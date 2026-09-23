"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FRAMER_BLUE = "#0055ff";
const INDIGO      = "#6366f1";

/* ── CMS collections ─────────────────────────────────────────────────── */
type Status = "published" | "draft" | "active" | "inactive" | "featured";

interface CmsItem { title: string; status: Status; meta: string }
interface Collection {
  label: string; icon: string; count: number;
  endpoint: string; ms: number; kb: string;
  items: CmsItem[];
}

const STATUS_COLOR: Record<Status, string> = {
  published: "#4ade80", active: "#4ade80", featured: "#a78bfa",
  draft: "rgba(255,255,255,0.2)", inactive: "rgba(255,255,255,0.2)",
};

const COLLECTIONS: Record<string, Collection> = {
  blog: {
    label: "Blog", icon: "✦", count: 12, endpoint: "/api/cms/blog", ms: 487, kb: "1.2",
    items: [
      { title: "WebGPU en producción", status: "published", meta: "2026-03-12" },
      { title: "R3F tips avanzados",   status: "published", meta: "2026-02-08" },
      { title: "Draft — Meltyn",       status: "draft",     meta: "2026-01-20" },
    ],
  },
  team: {
    label: "Team", icon: "◉", count: 4, endpoint: "/api/cms/team", ms: 312, kb: "0.6",
    items: [
      { title: "Julian", status: "active",   meta: "Full-Stack / Creative" },
      { title: "Ana",    status: "active",   meta: "3D Artist"             },
      { title: "Marco",  status: "inactive", meta: "Motion Designer"       },
    ],
  },
  projects: {
    label: "Projects", icon: "◈", count: 11, endpoint: "/api/cms/projects", ms: 534, kb: "0.9",
    items: [
      { title: "TROVE",     status: "featured", meta: "R3F · WebGPU"       },
      { title: "Larkboard", status: "featured", meta: "Next.js · Supabase" },
      { title: "makata.tv", status: "featured", meta: "R3F · Framer · GSAP"},
    ],
  },
  services: {
    label: "Services", icon: "⬡", count: 5, endpoint: "/api/cms/services", ms: 298, kb: "0.7",
    items: [
      { title: "3D Web",       status: "active", meta: "Three.js · R3F"      },
      { title: "Motion",       status: "active", meta: "Framer · GSAP"        },
      { title: "Headless CMS", status: "active", meta: "Framer · Sanity"      },
    ],
  },
};

const RESPONSES: Record<string, object> = {
  "/api/cms/blog": {
    collection: "blog", total: 12,
    items: [
      { id: "1a2b", title: "WebGPU en producción", slug: "webgpu-produccion", published: true,  date: "2026-03-12" },
      { id: "3c4d", title: "R3F tips avanzados",   slug: "r3f-tips",          published: true,  date: "2026-02-08" },
      { id: "5e6f", title: "Draft — Meltyn",       slug: "meltyn-wip",        published: false, date: "2026-01-20" },
    ],
  },
  "/api/cms/team": {
    collection: "team", total: 4,
    items: [
      { id: "t1", name: "Julian", role: "Full-Stack / Creative", active: true  },
      { id: "t2", name: "Ana",    role: "3D Artist",             active: true  },
      { id: "t3", name: "Marco",  role: "Motion Designer",       active: false },
    ],
  },
  "/api/cms/projects": {
    collection: "projects", total: 11,
    items: [
      { id: "p1", title: "TROVE",     stack: ["R3F","WebGPU"],          featured: true },
      { id: "p2", title: "Larkboard", stack: ["Next.js","Supabase"],    featured: true },
      { id: "p3", title: "makata.tv", stack: ["R3F","Framer","GSAP"],   featured: true },
    ],
  },
  "/api/cms/services": {
    collection: "services", total: 5,
    items: [
      { id: "s1", name: "3D Web",       tags: ["Three.js","R3F","WebGL"],       order: 1 },
      { id: "s2", name: "Motion",        tags: ["Framer Motion","GSAP"],         order: 2 },
      { id: "s3", name: "Headless CMS",  tags: ["Framer CMS","Sanity","GraphQL"],order: 3 },
    ],
  },
};

const RESP_HEADERS: Record<string, [string,string][]> = {
  "/api/cms/blog":     [["Content-Type","application/json; charset=utf-8"],["X-Cache","MISS"],["Cache-Control","s-maxage=60, stale-while-revalidate"],["Access-Control-Allow-Origin","*"]],
  "/api/cms/team":     [["Content-Type","application/json; charset=utf-8"],["X-Cache","HIT"], ["Cache-Control","s-maxage=60, stale-while-revalidate"],["Access-Control-Allow-Origin","*"]],
  "/api/cms/projects": [["Content-Type","application/json; charset=utf-8"],["X-Cache","MISS"],["Cache-Control","s-maxage=60, stale-while-revalidate"],["Access-Control-Allow-Origin","*"]],
  "/api/cms/services": [["Content-Type","application/json; charset=utf-8"],["X-Cache","HIT"], ["Cache-Control","s-maxage=60, stale-while-revalidate"],["Access-Control-Allow-Origin","*"]],
};

/* ── Syntax highlighter ──────────────────────────────────────────────── */
function highlight(json: string): string {
  return json
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      (m) => {
        let c = "#fdba74";
        if (/^"/.test(m)) c = /:$/.test(m) ? "#7dd3fc" : "#86efac";
        else if (/true|false/.test(m)) c = "#c4b5fd";
        else if (m === "null") c = "#f87171";
        return `<span style="color:${c}">${m}</span>`;
      }
    );
}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function FramerCmsDemo() {
  const [activeKey, setActiveKey] = useState("blog");
  const [loading,   setLoading]   = useState(false);
  const [response,  setResponse]  = useState<object | null>(RESPONSES["/api/cms/blog"]);
  const [resTab,    setResTab]    = useState<"body"|"headers">("body");
  const [copied,    setCopied]    = useState(false);

  const col = COLLECTIONS[activeKey];

  const select = (key: string) => {
    if (key === activeKey && !loading) return;
    setActiveKey(key);
    setLoading(true);
    setResponse(null);
    setResTab("body");
    setTimeout(() => { setLoading(false); setResponse(RESPONSES[COLLECTIONS[key].endpoint]); }, 580);
  };

  const copy = () => {
    if (!response) return;
    try { navigator.clipboard.writeText(JSON.stringify(response, null, 2)); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0d0f] font-mono text-[11px] overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] shrink-0"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        {/* Framer-ish logo mark */}
        <span className="text-[13px] font-bold" style={{ color: FRAMER_BLUE }}>⬡</span>
        <span className="text-white/70 text-[10px] font-semibold tracking-wide">Framer CMS</span>
        <span className="text-white/15 text-[9px] ml-1">→</span>
        <span className="text-white/25 text-[9px]">API Layer</span>
        <span className="text-white/15 text-[9px] ml-1">→</span>
        <span className="text-[9px]" style={{ color: INDIGO }}>Vercel Serverless</span>
      </div>

      {/* ── Split layout ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT: Framer CMS panel ── */}
        <div className="flex flex-col shrink-0 border-r overflow-hidden"
          style={{ width: "38%", borderColor: loading ? `${INDIGO}60` : "rgba(255,255,255,0.06)", transition: "border-color 0.2s" }}>

          {/* CMS header */}
          <div className="px-3 py-2 border-b border-white/[0.06] shrink-0">
            <p className="text-[8.5px] text-white/25 uppercase tracking-widest">Collections</p>
          </div>

          {/* Collection list */}
          <div className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: "none" }}>
            {Object.entries(COLLECTIONS).map(([key, c]) => {
              const isActive = key === activeKey;
              return (
                <div key={key}>
                  {/* Collection row */}
                  <button type="button" onClick={() => select(key)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors"
                    style={{ background: isActive ? "rgba(99,102,241,0.1)" : "transparent" }}>
                    <span className="text-[10px] w-3 shrink-0"
                      style={{ color: isActive ? "#a5b4fc" : "rgba(255,255,255,0.3)" }}>
                      {c.icon}
                    </span>
                    <span className="flex-1 text-[10px]"
                      style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.45)" }}>
                      {c.label}
                    </span>
                    <span className="text-[8.5px] tabular-nums"
                      style={{ color: isActive ? "#a5b4fc" : "rgba(255,255,255,0.2)" }}>
                      {c.count}
                    </span>
                    {isActive && (
                      <motion.div layoutId="cms-indicator"
                        className="w-0.5 h-3 rounded-full absolute right-0"
                        style={{ background: INDIGO }} />
                    )}
                  </button>

                  {/* Items sub-list */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden">
                        <div className="pb-1">
                          {c.items.map((item, i) => (
                            <motion.div key={item.title}
                              initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-center gap-2 px-3 py-1 ml-3 border-l border-white/[0.06]">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: STATUS_COLOR[item.status] }} />
                              <span className="flex-1 text-[9px] text-white/50 truncate">{item.title}</span>
                              <span className="text-[8px] text-white/18 shrink-0 hidden">{item.meta}</span>
                            </motion.div>
                          ))}
                          <div className="flex items-center gap-2 px-3 py-1 ml-3 border-l border-white/[0.06]">
                            <span className="text-[8.5px] text-white/20">+ {c.count - c.items.length} más</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* CMS footer */}
          <div className="px-3 py-2 border-t border-white/[0.06] shrink-0">
            <p className="text-[8px] text-white/18">framer.com/cms</p>
          </div>
        </div>

        {/* ── RIGHT: API response panel ── */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* URL bar */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06] shrink-0">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{ background: "#16a34a22", color: "#4ade80" }}>GET</span>
            <div className="flex-1 bg-white/[0.04] rounded px-2 py-1 text-white/35 border border-white/[0.06] truncate text-[9px]">
              {col.endpoint}
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-3 py-1 border-b border-white/[0.06] shrink-0"
            style={{ background: "rgba(255,255,255,0.015)" }}>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-white/28 text-[9px]">
                  <div className="w-2 h-2 rounded-full border border-indigo-400 border-t-transparent animate-spin" />
                  Fetching…
                </motion.div>
              ) : response ? (
                <motion.div key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2.5 text-[9px]">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-green-400 font-bold">200 OK</span>
                  </span>
                  <span className="text-white/22">{col.ms}ms</span>
                  <span className="text-white/22">{col.kb} KB</span>
                </motion.div>
              ) : (
                <div className="text-white/18 text-[9px]">—</div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-1">
              {response && (["body","headers"] as const).map(t => (
                <button key={t} type="button" onClick={() => setResTab(t)}
                  className="px-1.5 py-0.5 rounded text-[8.5px] capitalize transition-colors"
                  style={{ color: resTab === t ? "#a5b4fc" : "rgba(255,255,255,0.25)", background: resTab === t ? `${INDIGO}20` : "transparent" }}>
                  {t}
                </button>
              ))}
              {response && (
                <button type="button" onClick={copy}
                  className="ml-1 px-1.5 py-0.5 rounded text-[8px] transition-all"
                  style={{ background: copied ? "#16a34a33" : "rgba(255,255,255,0.05)", color: copied ? "#4ade80" : "rgba(255,255,255,0.25)" }}>
                  {copied ? "✓" : "Copy"}
                </button>
              )}
            </div>
          </div>

          {/* Response content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 relative"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                </motion.div>
              ) : response && resTab === "body" ? (
                <motion.pre key={activeKey + "-body"} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-[10px] leading-[1.65] whitespace-pre-wrap"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  dangerouslySetInnerHTML={{ __html: highlight(JSON.stringify(response, null, 2)) }}
                />
              ) : response && resTab === "headers" ? (
                <motion.div key={activeKey + "-headers"} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-2">
                  {RESP_HEADERS[col.endpoint].map(([k, v]) => (
                    <div key={k} className="flex gap-2 items-start">
                      <span className="shrink-0 text-[10px]" style={{ color: "#7dd3fc" }}>{k}:</span>
                      <span className="text-[10px] text-white/38 break-all">{v}</span>
                    </div>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-3 py-1.5 border-t border-white/[0.06] flex justify-between shrink-0">
        <span className="text-white/15 text-[8.5px]">Framer CMS API · Vercel Serverless · Node.js</span>
        <span className="text-white/15 text-[8.5px]">v1.0.0</span>
      </div>
    </div>
  );
}
