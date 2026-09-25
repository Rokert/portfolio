"use client";

import { motion } from "framer-motion";
import { useLang } from "@/context/LanguageContext";
import { UI } from "@/lib/i18n";

// TODO: confirm years and role at Medea Interactiva
const EXPERIENCE = [
  {
    years: "2022 – 2026",
    roleES: "Creative Developer",
    roleEN: "Creative Developer",
    company: "Makata Studio · Remote",
    descES:
      "Entregué juegos, experiencias web 3D, apps iOS y herramientas de desarrollo para clientes como Cosmodinos, Rhezo, Peer, Infini, WeMoms, Usual y Mimir. Stack completo: Unity, WebGPU, React Three Fiber, Swift y Node.js.",
    descEN:
      "Shipped games, 3D web experiences, iOS apps and developer tools for clients including Cosmodinos, Rhezo, Peer, Infini, WeMoms, Usual and Mimir. Full stack: Unity, WebGPU, React Three Fiber, Swift and Node.js.",
    highlights: ["Unity", "WebGPU", "R3F", "Swift", "Next.js"],
  },
  {
    years: "2014 – 2022",
    roleES: "Desarrollador de Contenidos Virtuales y Videojuegos",
    roleEN: "Virtual Content & Video Game Developer",
    company: "Medea Interactiva · Medellín",
    descES:
      "Desarrollé videojuegos, experiencias VR/AR y metaversos interactivos para e-learning corporativo. Proyectos para más de 30 clientes incluyendo Bancolombia y Protección.",
    descEN:
      "Built video games, VR/AR experiences and interactive metaverses for corporate e-learning. Delivered projects for 30+ clients including Bancolombia and Protección.",
    highlights: ["Unity", "C#", "VR", "AR", "Gamification"],
  },
];

function WordReveal({ text, delay = 0, className = "" }: { text: string; delay?: number; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 16, filter: "blur(3px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: delay + i * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
          className="inline-block mr-[0.28em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export function ExperienceSection() {
  const { lang } = useLang();
  const t = UI[lang];

  return (
    <section id="experience" className="px-6 md:px-12 lg:px-20 py-24 max-w-7xl mx-auto w-full">
      <motion.p
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="text-[10px] font-mono text-(--accent) uppercase tracking-[0.2em] mb-3"
      >
        {t.expLabel}
      </motion.p>

      <h2 className="text-3xl md:text-4xl font-bold mb-12">
        <WordReveal text={t.expTitle} delay={0.05} />
      </h2>

      <div>
        {EXPERIENCE.map((exp, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="grid md:grid-cols-[180px_1fr] gap-4 md:gap-16 py-8 border-t border-(--border) last:border-b"
          >
            <div className="pt-0.5">
              <p className="text-sm font-mono text-(--accent)">{exp.years}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="font-bold text-xl leading-tight">
                {lang === "EN" ? exp.roleEN : exp.roleES}
              </p>
              <p className="text-sm text-(--foreground)/35 font-mono">{exp.company}</p>
              <p className="text-sm text-(--foreground)/55 leading-relaxed mt-2">
                {lang === "EN" ? exp.descEN : exp.descES}
              </p>
              {exp.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {exp.highlights.map((h) => (
                    <span
                      key={h}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-(--border) text-(--foreground)/35"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
