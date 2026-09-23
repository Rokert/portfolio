"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Lang = "EN" | "FR";

const CONTENT: Record<Lang, { hero: string; sub: string; products: { name: string; price: string; tag: string }[] }> = {
  EN: {
    hero: "Timeless Pieces",
    sub: "Curated collection — free shipping worldwide",
    products: [
      { name: "Linen Overshirt", price: "$148", tag: "New" },
      { name: "Merino Crewneck", price: "$210", tag: "Bestseller" },
      { name: "Canvas Trousers", price: "$175", tag: "" },
      { name: "Leather Tote", price: "$320", tag: "Low stock" },
    ],
  },
  FR: {
    hero: "Pièces Intemporelles",
    sub: "Collection curatée — livraison mondiale offerte",
    products: [
      { name: "Surchemise Lin", price: "138 €", tag: "Nouveau" },
      { name: "Col Rond Mérinos", price: "195 €", tag: "Best-seller" },
      { name: "Pantalon Toile", price: "162 €", tag: "" },
      { name: "Tote Cuir", price: "298 €", tag: "Stock limité" },
    ],
  },
};

const COLORS = ["#d4c5b0", "#8b7355", "#2c2c2c", "#c9b99a"];

export default function InfiniDemo() {
  const [lang, setLang] = useState<Lang>("EN");
  const [cart, setCart] = useState<number[]>([]);
  const content = CONTENT[lang];

  return (
    <div className="w-full h-full flex flex-col bg-[#f5f0eb] text-[#1a1a1a] font-sans overflow-hidden">
      {/* Nav */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a1a1a]/10 bg-[#f5f0eb]/90 backdrop-blur shrink-0">
        <span className="font-semibold tracking-[0.15em] text-sm uppercase">Infini</span>
        <div className="flex items-center gap-3">
          {/* Lang toggle */}
          <div className="flex border border-[#1a1a1a]/20 rounded-full overflow-hidden text-[10px] font-mono">
            {(["EN", "FR"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 transition-colors ${lang === l ? "bg-[#1a1a1a] text-white" : "text-[#1a1a1a]/60 hover:text-[#1a1a1a]"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="text-[11px]">Bag</span>
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 w-3.5 h-3.5 bg-[#1a1a1a] text-white text-[8px] rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <AnimatePresence mode="wait">
        <motion.div
          key={lang + "-hero"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="px-5 py-5 border-b border-[#1a1a1a]/10 shrink-0"
        >
          <h1 className="text-2xl font-light tracking-tight leading-tight">{content.hero}</h1>
          <p className="text-xs text-[#1a1a1a]/50 mt-1">{content.sub}</p>
        </motion.div>
      </AnimatePresence>

      {/* Products grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={lang + "-products"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 overflow-y-auto grid grid-cols-2 gap-px bg-[#1a1a1a]/10"
        >
          {content.products.map((product, i) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="relative bg-[#f5f0eb] p-3 flex flex-col gap-2"
            >
              {/* Fake product image */}
              <div
                className="w-full aspect-[3/4] rounded-sm flex items-center justify-center"
                style={{ background: `${COLORS[i]}40` }}
              >
                <div
                  className="w-10 h-14 rounded-sm opacity-60"
                  style={{ background: COLORS[i] }}
                />
              </div>
              {product.tag && (
                <span className="absolute top-4 left-4 text-[8px] font-mono uppercase px-1.5 py-0.5 bg-[#1a1a1a] text-white rounded">
                  {product.tag}
                </span>
              )}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-medium leading-tight">{product.name}</p>
                  <p className="text-[10px] text-[#1a1a1a]/50">{product.price}</p>
                </div>
                <button
                  onClick={() => setCart((c) => cart.includes(i) ? c.filter((x) => x !== i) : [...c, i])}
                  className={`text-[9px] font-mono px-2 py-1 border rounded transition-colors ${
                    cart.includes(i)
                      ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                      : "border-[#1a1a1a]/30 text-[#1a1a1a]/60 hover:border-[#1a1a1a]/60"
                  }`}
                >
                  {cart.includes(i) ? "✓" : "+"}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="px-4 py-2 border-t border-[#1a1a1a]/10 text-center text-[10px] font-mono text-[#1a1a1a]/30 bg-[#f5f0eb] shrink-0">
        Infini · Shopify Hydrogen + Remix + Sanity CMS
      </div>
    </div>
  );
}
