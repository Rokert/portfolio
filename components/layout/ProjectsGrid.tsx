"use client";

import { projects } from "@/lib/projects";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { useLang } from "@/context/LanguageContext";
import { UI } from "@/lib/i18n";

export function ProjectsGrid() {
  const { lang } = useLang();
  const t = UI[lang];

  return (
    <section id="proyectos" className="px-6 md:px-12 lg:px-20 py-20 max-w-7xl mx-auto w-full">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs font-mono text-[--foreground]/30 mb-2">{t.projectsRange}</p>
          <h2 className="text-3xl font-bold">{t.projectsTitle}</h2>
        </div>
        <p className="text-sm text-[--foreground]/40 hidden md:block">
          {t.projectsCount(projects.length)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {projects.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} />
        ))}
      </div>
    </section>
  );
}
