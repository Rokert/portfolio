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
  shortDescEN?: string;
  longDescEN?: string;
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
    shortDescEN: "Animation asset review platform for Creature Co., built with a custom .lark renderer.",
    longDescEN:
      "Custom TypeScript render engine porting the Python reference renderer. Encodes H.264 video directly in the browser via WebCodecs API and mp4-muxer. Uploads to Supabase Storage via signed URL and supports frame-anchored comments with real-time sync.",
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
    shortDescEN: "3D collectible card and pack system rendered in WebGPU.",
    longDescEN:
      "Custom shaders for hologram, X-Ray, and particle effects. Includes a native Swift package that ports the experience to iOS. Rendered exclusively with WebGPU and custom GLSL.",
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
    shortDescEN: "Interactive 3D TV with particle explosion, orbit + tilt and FBM shader site view.",
    longDescEN:
      "Retro TV in React Three Fiber with OrbitControls, hot→orange→blue particle system on double-click, and subtle mouse tilt. Second integrated view: makata.tv UI over an FBM shader with mouse distortion and glitch effect.",
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
    shortDescEN: "Four marketing sites for an AI platform with 3D hero.",
    longDescEN:
      "Four marketing sites (main, gaming, corporate, landing) with a 3D hero scene, scroll-driven animations, and a battlepass-style card system.",
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
    shortDescEN: "Headless Shopify Hydrogen + Remix e-commerce, bilingual EN/FR.",
    longDescEN:
      "Headless e-commerce store with bilingual (EN/FR) content managed in Sanity CMS and a local fallback when the CMS is unreachable.",
    tags: ["Shopify", "Remix", "Sanity", "TypeScript", "GraphQL"],
    demoType: "interactive",
    url: "https://infiniwater.com",
    color: "#10b981",
  },
  {
    id: "rhezo",
    title: "Rhezo",
    year: "2024",
    shortDesc: "Sitio web de cliente con animaciones GSAP, migrado de Astro a Next.js.",
    longDesc:
      "Reconstruido de un prototipo en Astro a Next.js con Zustand para manejo de estado. Animaciones GSAP scroll-driven en toda la experiencia.",
    shortDescEN: "Client website with GSAP animations, migrated from Astro to Next.js.",
    longDescEN:
      "Rebuilt from an Astro prototype to Next.js with Zustand for state management. GSAP scroll-driven animations throughout the experience.",
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
    shortDescEN: "Serverless Vercel layer exposing Framer CMS collections as JSON endpoints.",
    longDescEN:
      "Serverless API layer so code components and external clients can consume Framer CMS data without coupling to its internal API.",
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
    shortDescEN: "iOS pregnancy tracking app with a SceneKit 3D scene.",
    longDescEN:
      "iOS app with a SceneKit 3D scene for each of the 40 weeks of gestation, with idle animations and ethnicity variants.",
    tags: ["Swift", "SwiftUI", "SceneKit"],
    demoType: "interactive",
    url: "https://apps.apple.com/us/app/wemoms-pregnancy-baby-app/id938845147",
    color: "#f43f5e",
  },
  {
    id: "meltyn",
    title: "Meltyn",
    year: "2025–2026",
    shortDesc: "Entorno de preview de materiales y shaders en tiempo real en Unity.",
    longDesc:
      "Usado por el equipo de modelado para validar el output de materiales y shaders antes de la entrega a cliente.",
    shortDescEN: "Real-time material and shader preview environment in Unity.",
    longDescEN:
      "Used by the modeling team to validate material and shader output before client delivery.",
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
    shortDescEN: "Real-time multiplayer PC game demo, up to 20 simultaneous players.",
    longDescEN:
      "Room/lobby system with two game modes: Gem Smash and shuriken combat. Built in Unity with C#.",
    tags: ["Unity", "C#"],
    demoType: "video",
    color: "#0ea5e9",
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
