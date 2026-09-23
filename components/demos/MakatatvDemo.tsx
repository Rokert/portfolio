"use client";

import { useState, useEffect, useRef } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

export default function MakatatvDemo() {
  const [status, setStatus] = useState<"loading" | "loaded" | "blocked">("loading");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    // If iframe doesn't respond in 4s, assume blocked
    timeoutRef.current = setTimeout(() => {
      if (status === "loading") setStatus("blocked");
    }, 4000);

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const handleLoad = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    try {
      // If X-Frame-Options blocks it, accessing href throws
      const _ = iframeRef.current?.contentWindow?.location.href;
      setStatus("loaded");
    } catch {
      setStatus("blocked");
    }
  };

  const reload = () => {
    setStatus("loading");
    if (iframeRef.current) iframeRef.current.src = "https://makata.tv";
    timeoutRef.current = setTimeout(() => setStatus("blocked"), 4000);
  };

  return (
    <div className="relative w-full h-full min-h-[300px] bg-black flex flex-col">
      {/* Live badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1 text-[10px] font-mono text-white/60">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        makata.tv — live
      </div>

      {status !== "blocked" && (
        <iframe
          ref={iframeRef}
          src="https://makata.tv"
          onLoad={handleLoad}
          className="w-full h-full border-0 flex-1"
          sandbox="allow-scripts allow-same-origin allow-forms"
          title="makata.tv"
          style={{ opacity: status === "loaded" ? 1 : 0, transition: "opacity 0.4s" }}
        />
      )}

      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
          <div className="w-6 h-6 rounded-full border-2 border-orange-500/40 border-t-orange-500 animate-spin" />
          <span className="text-[11px] font-mono text-white/30">Cargando makata.tv…</span>
        </div>
      )}

      {status === "blocked" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#0a0a0a]">
          <div className="text-center">
            <p className="text-white/60 text-sm font-medium mb-1">El sitio bloquea iframes</p>
            <p className="text-white/30 text-xs font-mono">X-Frame-Options: SAMEORIGIN</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={reload}
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors"
            >
              <RefreshCw size={12} /> Reintentar
            </button>
            <a
              href="https://makata.tv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-colors"
            >
              <ExternalLink size={12} /> Abrir makata.tv
            </a>
          </div>
          <p className="text-[10px] font-mono text-white/20">makata.tv · R3F / GSAP / Framer</p>
        </div>
      )}
    </div>
  );
}
