export type Tag =
  | "Next.js" | "React" | "TypeScript" | "Three.js" | "R3F" | "WebGPU" | "GLSL"
  | "GSAP" | "Framer Motion" | "Supabase" | "WebCodecs" | "Swift" | "SwiftUI"
  | "Unity" | "C#" | "Node.js" | "Shopify" | "Remix" | "Sanity" | "GraphQL"
  | "Zustand" | "Tailwind" | "Vercel" | "ShaderLab" | "Framer" | "SceneKit";

export type DemoType = "3d" | "video" | "interactive" | "shader" | "screenshot";

export interface Project {
  id: string;
  title: string;
  year: string;
  shortDesc: string;
  longDesc: string;
  tags: Tag[];
  demoType: DemoType;
  url?: string;
  featured?: boolean;
  color: string;
}

export const projects: Project[] = [
  {
    id: "larkboard",
    title: "Larkboard",
    year: "2026",
    shortDesc: "Plataforma de revisión de assets de animación .lark para Creature Co.",
    longDesc:
      "Motor de render propio en TypeScript, port del renderer de referencia en Python. Codifica video H.264 directamente en el navegador con WebCodecs API y mp4-muxer. Sube a Supabase Storage vía signed URL y soporta comentarios anclados a frame con sincronización en tiempo real.",
    tags: ["Next.js", "React", "TypeScript", "Supabase", "WebCodecs"],
    demoType: "interactive",
    featured: true,
    color: "#3b82f6",
  },
  {
    id: "trove",
    title: "TROVE",
    year: "2025–2026",
    shortDesc: "Sistema de cartas y packs coleccionables en 3D, renderizado en WebGPU.",
    longDesc:
      "Shaders custom para efectos de holograma, XRay y partículas. Incluye un paquete nativo en Swift que porta la experiencia a iOS. Renderizado exclusivamente en WebGPU con GLSL custom.",
    tags: ["React", "TypeScript", "Three.js", "R3F", "WebGPU", "GLSL", "Swift"],
    demoType: "3d",
    featured: true,
    color: "#8b5cf6",
  },
  {
    id: "makata-tv",
    title: "makata.tv",
    year: "2025–2026",
    shortDesc: "TV 3D interactiva con explosión de partículas, orbit + tilt y vista del sitio con shader FBM.",
    longDesc:
      "TV retro en React Three Fiber con OrbitControls, sistema de partículas hot→naranja→azul en doble click y tilt suave con el mouse. Segunda vista integrada: UI del sitio makata.tv sobre un shader FBM con distorsión de mouse y efecto glitch.",
    tags: ["React", "TypeScript", "Three.js", "R3F", "GLSL", "Framer", "Vercel"],
    demoType: "3d",
    url: "https://makata.tv",
    featured: true,
    color: "#f97316",
  },
  {
    id: "peer",
    title: "Peer",
    year: "2025",
    shortDesc: "Cuatro sitios de marketing para una plataforma de IA con hero 3D.",
    longDesc:
      "Cuatro sitios de marketing (principal, gaming, corporativo y landing) con escena 3D hero, animaciones scroll-driven y un sistema de cartas tipo battlepass.",
    tags: ["Next.js", "React", "TypeScript", "R3F", "GSAP", "Framer Motion", "Tailwind"],
    demoType: "3d",
    url: "https://heypeer.ai",
    featured: true,
    color: "#06b6d4",
  },
  {
    id: "infini",
    title: "Infini",
    year: "2025",
    shortDesc: "E-commerce headless en Shopify Hydrogen + Remix, bilingüe EN/FR.",
    longDesc:
      "Tienda e-commerce headless con contenido bilingüe (EN/FR) gestionado en Sanity CMS y fallback local si el CMS no responde.",
    tags: ["Shopify", "Remix", "Sanity", "TypeScript", "GraphQL"],
    demoType: "screenshot",
    color: "#10b981",
  },
  {
    id: "rhezo",
    title: "Rhezo",
    year: "2024",
    shortDesc: "Sitio web de cliente con animaciones GSAP, migrado de Astro a Next.js.",
    longDesc:
      "Reconstruido de un prototipo en Astro a Next.js con Zustand para manejo de estado. Animaciones GSAP scroll-driven en toda la experiencia.",
    tags: ["Next.js", "TypeScript", "GSAP", "Zustand", "Tailwind"],
    demoType: "interactive",
    color: "#f59e0b",
  },
  {
    id: "framer-cms-api",
    title: "Framer CMS API",
    year: "2026",
    shortDesc: "Capa serverless en Vercel que expone colecciones de Framer CMS como endpoints JSON.",
    longDesc:
      "API serverless para que code components y clientes externos consuman datos de Framer CMS sin acoplarse a su API interna.",
    tags: ["Node.js", "TypeScript", "Vercel"],
    demoType: "interactive",
    color: "#6366f1",
  },
  {
    id: "wemoms",
    title: "WeMoms",
    year: "2023–2024",
    shortDesc: "App iOS de seguimiento de embarazo con escena 3D en SceneKit.",
    longDesc:
      "App iOS con una escena 3D en SceneKit para cada una de las 40 semanas de gestación, con animaciones idle y variantes por etnia.",
    tags: ["Swift", "SwiftUI", "SceneKit"],
    demoType: "video",
    color: "#f43f5e",
  },
  {
    id: "meltyn",
    title: "Meltyn",
    year: "2025–2026",
    shortDesc: "Entorno de preview de materiales y shaders en tiempo real en Unity.",
    longDesc:
      "Usado por el equipo de modelado para validar el output de materiales y shaders antes de la entrega a cliente.",
    tags: ["Unity", "C#", "ShaderLab"],
    demoType: "video",
    color: "#84cc16",
  },
  {
    id: "cosmodinos",
    title: "Cosmodinos",
    year: "2022–2023",
    shortDesc: "Demo de juego PC multijugador en tiempo real, hasta 20 jugadores simultáneos.",
    longDesc:
      "Sistema de salas/lobby y dos modos de juego: Gem Smash y combate con shurikens. Desarrollado en Unity con C#.",
    tags: ["Unity", "C#"],
    demoType: "video",
    color: "#0ea5e9",
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
