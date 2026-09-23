"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>
    </svg>
  );
}
import { useLang } from "@/context/LanguageContext";
import { UI } from "@/lib/i18n";

const SOCIALS = [
  { label: "Email",    href: "mailto:rokert34@gmail.com",                                    Icon: Mail        },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/julian-david-munoz-rodriguez/",   Icon: LinkedInIcon },
  { label: "GitHub",   href: "https://github.com/Rokert",                                   Icon: GitHubIcon  },
];

export function CtaSection() {
  const { lang } = useLang();
  const t = UI[lang];

  return (
    <section className="relative border-t border-[--border] overflow-hidden">
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] opacity-[0.07] blur-3xl rounded-full pointer-events-none"
        style={{ background: "var(--accent)" }}
      />

      <div className="relative px-6 md:px-12 lg:px-20 py-28 max-w-7xl mx-auto w-full">
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-tight mb-6 max-w-2xl"
        >
          {t.ctaTitle}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="text-base text-[--foreground]/45 mb-10 max-w-md"
        >
          {t.ctaSub}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.22 }}
          className="flex items-center gap-3"
        >
          {SOCIALS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              aria-label={label}
              className="w-12 h-12 rounded-full border border-[--border] flex items-center justify-center text-[--foreground]/50 hover:text-[--foreground] hover:border-[--foreground]/30 transition-colors"
            >
              <Icon size={18} />
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
