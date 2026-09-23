"use client";

import { motion } from "framer-motion";
import { useLang } from "@/context/LanguageContext";
import { UI } from "@/lib/i18n";

const CAPS = [
  {
    n: "01",
    titleES: "Desarrollo de Juegos",
    titleEN: "Game Development",
    descES: "Unity, C#, multijugador en tiempo real, sistemas de shaders y arquitectura de game loop. Desde prototipo hasta build de producción.",
    descEN: "Unity, C#, real-time multiplayer, shader systems and game loop architecture. From prototype to production build.",
    tags: ["Unity", "C#", "ShaderLab", "SceneKit"],
    color: "#0ea5e9",
  },
  {
    n: "02",
    titleES: "Web & 3D",
    titleEN: "Web & 3D",
    descES: "React Three Fiber, WebGPU, GLSL y Next.js — experiencias 3D interactivas que corren en el browser sin plugins.",
    descEN: "React Three Fiber, WebGPU, GLSL and Next.js — interactive 3D experiences that run natively in the browser.",
    tags: ["WebGPU", "R3F", "Three.js", "GLSL", "Next.js"],
    color: "#8b5cf6",
  },
  {
    n: "03",
    titleES: "Apps & Herramientas",
    titleEN: "Apps & Tools",
    descES: "Swift, SwiftUI e iOS nativo; e-commerce headless con Shopify Hydrogen; APIs serverless y tooling creativo en Vercel.",
    descEN: "Swift, SwiftUI and iOS native; headless Shopify Hydrogen; serverless APIs and creative tooling on Vercel.",
    tags: ["Swift", "SwiftUI", "Shopify", "Node.js", "Vercel"],
    color: "#10b981",
  },
  {
    n: "04",
    titleES: "Desarrollo con IA",
    titleEN: "AI-Assisted Dev",
    descES: "Integro Claude, Gemini y Copilot en el flujo de trabajo para entregar más rápido sin sacrificar calidad — generación de código, revisión de arquitectura y QA asistido.",
    descEN: "I integrate Claude, Gemini and Copilot into the workflow to ship faster without cutting corners — code generation, architecture review and AI-assisted QA.",
    tags: ["Claude", "Gemini", "Copilot", "Cursor"],
    color: "#f59e0b",
  },
];

function WordReveal({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 16, filter: "blur(3px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: delay + i * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
          className="inline-block mr-[0.28em]"
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}

export function CapabilitiesSection() {
  const { lang } = useLang();
  const t = UI[lang];

  return (
    <section className="border-t border-[--border] bg-[--card-bg]">
      <div className="px-6 md:px-12 lg:px-20 py-24 max-w-7xl mx-auto w-full">
        <div className="mb-12">
          <motion.p
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-[10px] font-mono text-[--accent] uppercase tracking-[0.2em] mb-3"
          >
            {t.capLabel}
          </motion.p>
          <h2 className="text-3xl font-bold">
            <WordReveal text={t.capTitle} delay={0.05} />
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {CAPS.map((cap, i) => (
            <motion.div
              key={cap.n}
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.13, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative flex flex-col gap-5 rounded-2xl border border-[--border] p-6 hover:border-[--foreground]/15 transition-colors duration-300"
              style={{
                background: `linear-gradient(135deg, ${cap.color}08 0%, transparent 55%)`,
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl opacity-40"
                style={{ background: cap.color }}
              />

              <span className="text-sm font-mono italic font-semibold" style={{ color: cap.color }}>
                {cap.n}
              </span>

              <h3 className="text-xl font-bold leading-tight">
                {lang === "EN" ? cap.titleEN : cap.titleES}
              </h3>

              <p className="text-sm text-[--foreground]/50 leading-relaxed flex-1">
                {lang === "EN" ? cap.descEN : cap.descES}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-4 border-t border-[--border]">
                {cap.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[--border] text-[--foreground]/35"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
