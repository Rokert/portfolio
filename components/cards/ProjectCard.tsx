"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Play } from "lucide-react";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { DemoModal } from "@/components/cards/DemoModal";
import { useLang } from "@/context/LanguageContext";

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const [open, setOpen] = useState(false);
  const { lang } = useLang();
  const shortDesc = lang === "EN" && project.shortDescEN ? project.shortDescEN : project.shortDesc;

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          "group relative flex flex-col gap-4 rounded-2xl border border-[--border]",
          "bg-[--card-bg] p-6 cursor-pointer overflow-hidden",
          "hover:border-[--accent]/40 transition-colors duration-300"
        )}
        onClick={() => setOpen(true)}
      >
        {/* Color accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ background: project.color }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[--foreground]/40 font-mono">{project.year}</span>
            <h2 className="text-lg font-semibold leading-tight group-hover:text-[--accent] transition-colors">
              {project.title}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[--foreground]/30 hover:text-[--foreground] transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            )}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center border border-[--border] group-hover:border-[--accent]/40 transition-colors"
              style={{ background: `${project.color}18` }}
            >
              <Play size={12} style={{ color: project.color }} />
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-[--foreground]/60 leading-relaxed line-clamp-2">
          {shortDesc}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
          {project.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[--border] text-[--foreground]/40"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 5 && (
            <span className="text-[10px] font-mono px-2 py-0.5 text-[--foreground]/30">
              +{project.tags.length - 5}
            </span>
          )}
        </div>

        {/* Hover overlay hint */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top right, ${project.color}08, transparent 70%)` }}
        />
      </motion.article>

      <DemoModal project={project} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
