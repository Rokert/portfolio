"use client";

import { useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

const demoComponents: Record<string, React.LazyExoticComponent<() => React.JSX.Element>> = {
  trove: lazy(() => import("@/components/demos/TroveDemo")),
  "makata-tv": lazy(() => import("@/components/demos/MakatatvDemo")),
  larkboard: lazy(() => import("@/components/demos/LarkboardDemo")),
  "framer-cms-api": lazy(() => import("@/components/demos/FramerCmsDemo")),
  peer: lazy(() => import("@/components/demos/PeerDemo")),
  rhezo: lazy(() => import("@/components/demos/RhezoDemo")),
  "makata-website": lazy(() => import("@/components/demos/MakataWebsiteDemo")),
  infini: lazy(() => import("@/components/demos/InfiniDemo")),
  wemoms: lazy(() => import("@/components/demos/WeMomsDemo")),
  meltyn: lazy(() => import("@/components/demos/MeltynDemo")),
  cosmodinos: lazy(() => import("@/components/demos/CosmodinosDemo")),
};

interface DemoModalProps {
  project: Project;
  open: boolean;
  onClose: () => void;
}

export function DemoModal({ project, open, onClose }: DemoModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const DemoComponent = demoComponents[project.id];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
              "fixed inset-4 md:inset-8 lg:inset-12 z-50",
              "rounded-2xl border border-[--border] bg-[--card-bg]",
              "flex flex-col overflow-hidden"
            )}
          >
            {/* Top accent */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: project.color }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[--border] shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: project.color }}
                />
                <div>
                  <h2 className="font-semibold text-lg leading-none">{project.title}</h2>
                  <span className="text-xs text-[--foreground]/40 font-mono">{project.year}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[--foreground]/50 hover:text-[--foreground] transition-colors px-3 py-1.5 rounded-lg border border-[--border] hover:border-[--foreground]/20"
                  >
                    <ExternalLink size={12} />
                    Ver sitio
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg border border-[--border] text-[--foreground]/50 hover:text-[--foreground] hover:border-[--foreground]/20 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body: Demo + Info */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
              {/* Demo area */}
              <div className="flex-1 flex items-center justify-center bg-black/40 overflow-hidden min-h-0">
                {DemoComponent ? (
                  <Suspense
                    fallback={
                      <div className="flex flex-col items-center gap-3 text-[--foreground]/30">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                          style={{ borderColor: `${project.color} transparent transparent transparent` }}
                        />
                        <span className="text-xs font-mono">Cargando demo…</span>
                      </div>
                    }
                  >
                    <DemoComponent />
                  </Suspense>
                ) : (
                  <PlaceholderDemo project={project} />
                )}
              </div>

              {/* Info sidebar */}
              <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-[--border] p-6 overflow-y-auto flex flex-col gap-5">
                <div>
                  <h3 className="text-xs font-mono text-[--foreground]/40 uppercase tracking-widest mb-2">
                    Descripción
                  </h3>
                  <p className="text-sm text-[--foreground]/70 leading-relaxed">
                    {project.longDesc}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-mono text-[--foreground]/40 uppercase tracking-widest mb-3">
                    Stack
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-[--border] text-[--foreground]/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PlaceholderDemo({ project }: { project: Project }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: `${project.color}20`, border: `1px solid ${project.color}40` }}
      >
        {project.demoType === "video" ? "▶" : project.demoType === "3d" ? "◈" : "⬡"}
      </div>
      <div>
        <p className="text-sm text-[--foreground]/50">Demo en construcción</p>
        <p className="text-xs text-[--foreground]/30 mt-1 font-mono">{project.title}</p>
      </div>
    </div>
  );
}
