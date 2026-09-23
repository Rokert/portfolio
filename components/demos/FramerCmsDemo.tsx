"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MOCK_ENDPOINTS = [
  { path: "/api/cms/blog", label: "Blog posts" },
  { path: "/api/cms/team", label: "Team members" },
  { path: "/api/cms/projects", label: "Projects" },
];

const MOCK_RESPONSES: Record<string, object> = {
  "/api/cms/blog": {
    collection: "blog",
    total: 12,
    items: [
      { id: "1a2b", title: "WebGPU en producción", slug: "webgpu-produccion", published: true, date: "2026-03-12" },
      { id: "3c4d", title: "R3F tips avanzados", slug: "r3f-tips", published: true, date: "2026-02-08" },
      { id: "5e6f", title: "Draft — Meltyn", slug: "meltyn-wip", published: false, date: "2026-01-20" },
    ],
  },
  "/api/cms/team": {
    collection: "team",
    total: 4,
    items: [
      { id: "t1", name: "Julian", role: "Full-Stack / Creative", active: true },
      { id: "t2", name: "Ana", role: "3D Artist", active: true },
    ],
  },
  "/api/cms/projects": {
    collection: "projects",
    total: 11,
    items: [
      { id: "p1", title: "TROVE", stack: ["R3F", "WebGPU"], featured: true },
      { id: "p2", title: "Larkboard", stack: ["Next.js", "Supabase"], featured: true },
      { id: "p3", title: "makata.tv", stack: ["R3F", "Framer"], featured: true },
    ],
  },
};

export default function FramerCmsDemo() {
  const [selected, setSelected] = useState("/api/cms/blog");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<object | null>(MOCK_RESPONSES["/api/cms/blog"]);

  const fetch = (path: string) => {
    setSelected(path);
    setLoading(true);
    setResponse(null);
    setTimeout(() => {
      setLoading(false);
      setResponse(MOCK_RESPONSES[path]);
    }, 600);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0d0d] font-mono text-xs">
      {/* URL bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <span className="text-green-400">GET</span>
        <div className="flex-1 bg-white/5 rounded-lg px-3 py-1.5 text-white/50 border border-white/10">
          {selected}
        </div>
        <button
          onClick={() => fetch(selected)}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] transition-colors"
        >
          Send
        </button>
      </div>

      {/* Endpoints */}
      <div className="flex gap-1 px-4 py-2 border-b border-white/10">
        {MOCK_ENDPOINTS.map((ep) => (
          <button
            key={ep.path}
            onClick={() => fetch(ep.path)}
            className={`px-2.5 py-1 rounded-md text-[10px] transition-colors ${
              selected === ep.path
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {ep.label}
          </button>
        ))}
      </div>

      {/* Response */}
      <div className="flex-1 overflow-auto p-4 relative">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-white/30"
            >
              <div className="w-3 h-3 rounded-full border border-indigo-400 border-t-transparent animate-spin" />
              Fetching…
            </motion.div>
          ) : response ? (
            <motion.pre
              key={selected}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] leading-relaxed text-green-300/90 whitespace-pre-wrap"
            >
              {JSON.stringify(response, null, 2)
                .replace(/"(\w+)":/g, (_, k) => `"<span class="text-blue-400">${k}</span>":`)
              }
            </motion.pre>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="px-4 py-2 border-t border-white/10 text-center text-[10px] text-white/20">
        Framer CMS API · Vercel Serverless
      </div>
    </div>
  );
}
