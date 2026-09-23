export type Lang = "ES" | "EN";

export const UI: Record<Lang, {
  badge: string;
  tagline: string;
  contact: string;
  viewProjects: string;
  projectsTitle: string;
  projectsRange: string;
  projectsCount: (n: number) => string;
  description: string;
  stack: string;
  visitSite: string;
  loadingDemo: string;
  demoPending: string;
  footer: string;
}> = {
  ES: {
    badge:         "Medellín · Freelance, worldwide",
    tagline:       "Desarrollo juegos, motores 3D en el navegador y productos digitales que viven en el cruce entre código y experiencia visual — Unity, WebGPU, apps iOS y e-commerce headless.",
    contact:       "Contactar",
    viewProjects:  "Ver proyectos ↓",
    projectsTitle: "Proyectos",
    projectsRange: "2022 – 2026",
    projectsCount: (n) => `${n} proyectos · click para ver demo`,
    description:   "Descripción",
    stack:         "Stack",
    visitSite:     "Ver sitio",
    loadingDemo:   "Cargando demo…",
    demoPending:   "Demo en construcción",
    footer:        "Julian · Game Dev / Creative Developer",
  },
  EN: {
    badge:         "Medellín · Freelance, worldwide",
    tagline:       "I build games, browser 3D engines and digital products at the intersection of code and visual experience — Unity, WebGPU, iOS apps and headless e-commerce.",
    contact:       "Contact",
    viewProjects:  "View projects ↓",
    projectsTitle: "Projects",
    projectsRange: "2022 – 2026",
    projectsCount: (n) => `${n} projects · click to view demo`,
    description:   "Description",
    stack:         "Stack",
    visitSite:     "Visit site",
    loadingDemo:   "Loading demo…",
    demoPending:   "Demo coming soon",
    footer:        "Julian · Game Dev / Creative Developer",
  },
};
