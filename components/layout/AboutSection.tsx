"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useInView } from "framer-motion";
import { useLang } from "@/context/LanguageContext";
import { UI } from "@/lib/i18n";

const STATS = [
  { value: 12, suffix: "+", labelES: "años de experiencia",  labelEN: "years of experience" },
  { value: 10, suffix: "",  labelES: "proyectos entregados", labelEN: "projects shipped"    },
  { value: 5,  suffix: "",  labelES: "plataformas",          labelEN: "platforms"           },
];

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18, restDelta: 0.5 });
  const inView = useInView(ref, { once: false, margin: "0px 0px -40px 0px" });

  useEffect(() => {
    motionVal.set(inView ? value : 0);
  }, [inView, value, motionVal]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      if (ref.current) ref.current.textContent = Math.round(latest) + suffix;
    });
  }, [spring, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

function WordReveal({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: delay + i * 0.045, ease: [0.25, 0.1, 0.25, 1] }}
          className="inline-block mr-[0.3em]"
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}

export function AboutSection() {
  const { lang } = useLang();
  const t = UI[lang];

  return (
    <section id="about" className="px-6 md:px-12 lg:px-20 pt-14 pb-24 max-w-7xl mx-auto w-full">
      <motion.p
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="text-[10px] font-mono text-[--accent] uppercase tracking-[0.2em] mb-8"
      >
        {t.aboutLabel}
      </motion.p>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
        <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-[1.15] tracking-tight">
          <WordReveal text={t.aboutStatement} delay={0.05} />
        </h2>

        <div className="flex flex-col justify-between gap-10">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base text-[--foreground]/55 leading-relaxed"
          >
            {t.aboutBio}
          </motion.p>

          <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-6 border-t border-[--border]">
            {STATS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
              >
                <p className="text-3xl sm:text-4xl font-bold text-[--accent] tracking-tight tabular-nums">
                  <CountUp value={s.value} suffix={s.suffix} />
                </p>
                <p className="text-[11px] text-[--foreground]/35 mt-1.5 font-mono leading-snug">
                  {lang === "EN" ? s.labelEN : s.labelES}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
