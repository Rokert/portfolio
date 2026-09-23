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
  // About
  aboutLabel: string;
  aboutStatement: string;
  aboutBio: string;
  // Capabilities
  capLabel: string;
  capTitle: string;
  // Clients
  clientsLabel: string;
  // Experience
  expLabel: string;
  expTitle: string;
  // CTA
  ctaTitle: string;
  ctaSub: string;
}> = {
  ES: {
    badge:         "Medellín · Freelance, worldwide",
    tagline:       "Desarrollo juegos, motores 3D en el navegador y productos digitales que viven en el cruce entre código y experiencia visual.",
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
    aboutLabel:    "Sobre mí",
    aboutStatement:"Construyo cosas que viven en el límite de lo que browsers, engines y dispositivos pueden hacer.",
    aboutBio:      "12 años construyendo en el cruce entre tecnología y entretenimiento — primero en Medea Interactiva desarrollando videojuegos, VR y AR para e-learning corporativo, luego en Makata Studio con WebGPU, React Three Fiber, iOS y e-commerce headless. Escribo el código y entiendo el oficio.",
    capLabel:      "Qué construyo",
    capTitle:      "Especialidades",
    clientsLabel:  "Construido para",
    expLabel:      "Experiencia",
    expTitle:      "Donde he estado",
    ctaTitle:      "Construyamos algo.",
    ctaSub:        "Disponible para freelance, contratos y roles de producto.",
  },
  EN: {
    badge:         "Medellín · Freelance, worldwide",
    tagline:       "I build games, browser 3D engines and digital products at the intersection of code and visual experience.",
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
    aboutLabel:    "About",
    aboutStatement:"I build things that live at the edge of what browsers, engines and devices can do.",
    aboutBio:      "12 years building at the intersection of technology and entertainment — first at Medea Interactiva shipping video games, VR and AR for corporate e-learning, then at Makata Studio with WebGPU, React Three Fiber, iOS and headless e-commerce. I write the code and understand the craft.",
    capLabel:      "What I build",
    capTitle:      "Specialties",
    clientsLabel:  "Built for",
    expLabel:      "Experience",
    expTitle:      "Where I've been",
    ctaTitle:      "Let's ship something.",
    ctaSub:        "Open to freelance, contracts and product roles.",
  },
};
