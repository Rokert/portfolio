"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { medeaProjects } from "@/lib/projects";
import { useLang } from "@/context/LanguageContext";

export function OtherProjectsSection() {
  const { lang } = useLang();

  return (
    <section className="px-6 md:px-12 lg:px-20 py-16 max-w-7xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex items-baseline gap-4 mb-6"
      >
        <p className="text-[10px] font-mono text-[--foreground]/30 uppercase tracking-[0.2em]">
          {lang === "EN" ? "Other projects" : "Otros proyectos"}
        </p>
        <p className="text-[10px] font-mono text-[--foreground]/20">
          Medea Interactiva · 2014–2022
        </p>
      </motion.div>

      <div className="border-t border-[--border]">
        {medeaProjects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="group grid grid-cols-[80px_1fr_auto] md:grid-cols-[100px_1fr_200px_auto] items-center gap-4 md:gap-8 py-4 border-b border-[--border] hover:bg-[--foreground]/[0.02] transition-colors px-2 -mx-2 rounded-lg"
          >
            {/* Year */}
            <span className="text-xs font-mono text-[--accent] shrink-0">
              {project.year}
            </span>

            {/* Title + desc */}
            <div className="min-w-0">
              <p className="text-sm font-semibold group-hover:text-[--accent] transition-colors leading-snug">
                {project.title}
              </p>
              <p className="text-xs text-[--foreground]/40 leading-snug mt-0.5 line-clamp-1">
                {lang === "EN" ? project.shortDescEN : project.shortDesc}
              </p>
            </div>

            {/* Tags — hidden on mobile */}
            <div className="hidden md:flex flex-wrap gap-1.5">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-[--border] text-[--foreground]/30"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Link */}
            {project.url ? (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[--foreground]/25 hover:text-[--accent] transition-colors shrink-0"
                aria-label={`Ver ${project.title}`}
              >
                <ExternalLink size={14} />
              </a>
            ) : (
              <span className="w-[14px]" />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
