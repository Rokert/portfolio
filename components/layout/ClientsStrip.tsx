"use client";

import { motion } from "framer-motion";
import { useLang } from "@/context/LanguageContext";
import { UI } from "@/lib/i18n";

const CLIENTS = [
  "Creature Co.",
  "Peer",
  "Infini",
  "WeMoms",
];

export function ClientsStrip() {
  const { lang } = useLang();
  const t = UI[lang];

  const items = [...CLIENTS, ...CLIENTS, ...CLIENTS];

  return (
    <div className="border-t border-b border-[--border] py-4 overflow-hidden">
      {/* Label row */}
      <p className="text-[9px] font-mono text-[--foreground]/25 uppercase tracking-[0.25em] text-center mb-3">
        {t.clientsLabel}
      </p>

      {/* Marquee */}
      <div className="relative overflow-hidden">
        <motion.div
          className="flex w-max"
          animate={{ x: ["0%", "-33.33%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear", repeatType: "loop" }}
        >
          {items.map((c, i) => (
            <span
              key={i}
              className="text-sm font-mono text-[--foreground]/30 hover:text-[--foreground]/55 transition-colors whitespace-nowrap select-none px-8"
            >
              {c}
              <span className="ml-8 text-[--foreground]/12">·</span>
            </span>
          ))}
        </motion.div>

        <div className="absolute inset-y-0 left-0 w-16 pointer-events-none"
          style={{ background: "linear-gradient(to right, var(--background), transparent)" }} />
        <div className="absolute inset-y-0 right-0 w-16 pointer-events-none"
          style={{ background: "linear-gradient(to left, var(--background), transparent)" }} />
      </div>
    </div>
  );
}
