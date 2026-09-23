"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Lang   = "EN" | "FR";
type CatKey = "all" | "tops" | "bottoms" | "accessories";
interface CartItem { id: number; size: string; qty: number }

const GREEN = "#10b981";
const SWATCHES = ["#d4c5b0", "#8b7355", "#2c2c2c", "#c9b99a", "#e8e0d8", "#b5c4a8"];
const SIZES    = ["XS", "S", "M", "L", "XL"];

/* ── Product metadata (language-independent) ─────────────────────────── */
const META: { id: number; cat: CatKey; colors: number[]; tag?: string }[] = [
  { id: 0, cat: "tops",         colors: [0,1,2], tag: "New"       },
  { id: 1, cat: "tops",         colors: [2,4,5], tag: "Bestseller"},
  { id: 2, cat: "bottoms",      colors: [1,0,2]                   },
  { id: 3, cat: "accessories",  colors: [1,2,3], tag: "Low stock" },
  { id: 4, cat: "bottoms",      colors: [0,3,5]                   },
  { id: 5, cat: "accessories",  colors: [4,2,0]                   },
];

/* ── Bilingual copy ──────────────────────────────────────────────────── */
const CAT_LABELS: Record<Lang, Record<CatKey, string>> = {
  EN: { all: "All",  tops: "Tops",  bottoms: "Bottoms", accessories: "Accessories" },
  FR: { all: "Tout", tops: "Hauts", bottoms: "Bas",     accessories: "Accessoires" },
};

const COPY: Record<Lang, {
  hero: string; sub: string; add: string; view: string;
  bag: string; checkout: string; subtotal: string; empty: string; detail: string;
  shipping: string;
  products: { name: string; price: string; desc: string }[];
}> = {
  EN: {
    hero: "Timeless Pieces", sub: "Curated collection — free shipping worldwide",
    add: "Add to bag", view: "Quick view", bag: "Bag", checkout: "Checkout",
    subtotal: "Subtotal", empty: "Your bag is empty.", detail: "Detail", shipping: "Free shipping · 30-day returns",
    products: [
      { name: "Linen Overshirt",   price: "$148", desc: "Relaxed fit, breathable linen. Perfect for warm months." },
      { name: "Merino Crewneck",   price: "$210", desc: "Extra-fine merino wool 18.5μ. Temperature-regulating." },
      { name: "Canvas Trousers",   price: "$175", desc: "Wide-leg silhouette, heavyweight cotton canvas." },
      { name: "Leather Tote",      price: "$320", desc: "Full-grain vegetable-tanned leather. Develops patina." },
      { name: "Linen Shorts",      price: "$125", desc: "Mid-rise relaxed cut. Same linen as the overshirt." },
      { name: "Cashmere Scarf",    price: "$185", desc: "Grade-A Mongolian cashmere, 2-ply. Hand-finished." },
    ],
  },
  FR: {
    hero: "Pièces Intemporelles", sub: "Collection curatée — livraison mondiale offerte",
    add: "Ajouter", view: "Aperçu", bag: "Panier", checkout: "Commander",
    subtotal: "Sous-total", empty: "Votre panier est vide.", detail: "Détail", shipping: "Livraison offerte · Retours 30j",
    products: [
      { name: "Surchemise Lin",    price: "138 €", desc: "Coupe décontractée, lin respirant. Idéale en été." },
      { name: "Col Rond Mérinos",  price: "195 €", desc: "Laine mérinos 18,5μ. Régulation thermique naturelle." },
      { name: "Pantalon Toile",    price: "162 €", desc: "Coupe large en canvas coton épais. Taille unisexe." },
      { name: "Tote Cuir",         price: "298 €", desc: "Cuir pleine fleur tanné végétal. Patine avec le temps." },
      { name: "Short Lin",         price: "116 €", desc: "Taille mi-haute, coupe décontractée. Lin brut." },
      { name: "Écharpe Cachemire", price: "172 €", desc: "Cachemire grade A, 2 fils. Finition main." },
    ],
  },
};

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function InfiniDemo() {
  const [lang,      setLang]      = useState<Lang>("EN");
  const [filter,    setFilter]    = useState<CatKey>("all");
  const [drawer,    setDrawer]    = useState<number | null>(null);
  const [cartOpen,  setCartOpen]  = useState(false);
  const [selSize,   setSelSize]   = useState("M");
  const [selColor,  setSelColor]  = useState(0);
  const [cart,      setCart]      = useState<CartItem[]>([]);

  const copy   = COPY[lang];
  const catLbl = CAT_LABELS[lang];

  const filtered = useMemo(
    () => filter === "all" ? META : META.filter(p => p.cat === filter),
    [filter]
  );

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalUSD   = cart.reduce((s, i) => {
    const n = parseFloat(COPY.EN.products[i.id].price.replace(/[^0-9.]/g, ""));
    return s + n * i.qty;
  }, 0);

  const addToCart = (id: number) => {
    setCart(c => {
      const ex = c.find(i => i.id === id && i.size === selSize);
      if (ex) return c.map(i => i.id === id && i.size === selSize ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { id, size: selSize, qty: 1 }];
    });
    setDrawer(null);
    setCartOpen(true);
  };

  const removeItem = (id: number, size: string) =>
    setCart(c => c.filter(i => !(i.id === id && i.size === size)));

  const closeAll = () => { setDrawer(null); setCartOpen(false); };

  const dMeta = drawer !== null ? META[drawer] : null;
  const dProd = drawer !== null ? copy.products[drawer] : null;

  return (
    <div className="w-full h-full flex flex-col bg-[#f5f0eb] text-[#1a1a1a] relative overflow-hidden select-none"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── Nav ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a]/10 bg-[#f5f0eb]/95 shrink-0 z-10">
        <span className="font-semibold tracking-[0.18em] text-[11px] uppercase">Infini</span>
        <div className="flex items-center gap-3">
          {/* Lang toggle */}
          <div className="flex border border-[#1a1a1a]/18 rounded-full overflow-hidden text-[9px] font-mono">
            {(["EN", "FR"] as Lang[]).map(l => (
              <button key={l} type="button" onClick={() => setLang(l)}
                className="px-2.5 py-[3px] transition-colors"
                style={{ background: lang === l ? "#1a1a1a" : "transparent", color: lang === l ? "#fff" : "rgba(26,26,26,0.5)" }}>
                {l}
              </button>
            ))}
          </div>
          {/* Bag */}
          <button type="button" onClick={() => setCartOpen(true)}
            className="relative text-[10px] font-mono text-[#1a1a1a]/60 hover:text-[#1a1a1a]">
            {copy.bag}
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-3 w-3.5 h-3.5 text-white text-[7px] rounded-full flex items-center justify-center font-bold"
                style={{ background: GREEN }}>
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <AnimatePresence mode="wait">
        <motion.div key={lang + "-h"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.26 }}
          className="px-4 py-3 border-b border-[#1a1a1a]/10 shrink-0">
          <h1 className="text-[17px] font-light tracking-tight">{copy.hero}</h1>
          <p className="text-[9px] text-[#1a1a1a]/42 mt-0.5 font-mono">{copy.sub}</p>
        </motion.div>
      </AnimatePresence>

      {/* ── Filter bar ── */}
      <div className="flex gap-1 px-4 py-2 border-b border-[#1a1a1a]/10 shrink-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {(["all", "tops", "bottoms", "accessories"] as CatKey[]).map(cat => (
          <button key={cat} type="button" onClick={() => setFilter(cat)}
            className="text-[8px] font-mono px-2.5 py-[3px] rounded-full shrink-0 transition-all"
            style={{
              background: filter === cat ? "#1a1a1a" : "rgba(26,26,26,0.06)",
              color: filter === cat ? "#fff" : "rgba(26,26,26,0.52)",
              border: `1px solid ${filter === cat ? "#1a1a1a" : "rgba(26,26,26,0.12)"}`,
            }}>
            {catLbl[cat]}
          </button>
        ))}
      </div>

      {/* ── Product grid ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div className="grid grid-cols-3 gap-px" style={{ background: "rgba(26,26,26,0.08)" }}>
          <AnimatePresence mode="popLayout">
            {filtered.map(meta => {
              const product = copy.products[meta.id];
              return (
                <motion.div key={meta.id} layout
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
                  className="relative bg-[#f5f0eb] p-2 flex flex-col gap-1.5 group cursor-pointer"
                  onClick={() => { setDrawer(meta.id); setSelColor(0); setSelSize("M"); }}
                >
                  {/* Visual */}
                  <div className="relative w-full aspect-[3/4] rounded overflow-hidden"
                    style={{ background: `${SWATCHES[meta.colors[0]]}22` }}>
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-6 h-9 rounded-sm transition-transform duration-300 group-hover:scale-110"
                        style={{ background: SWATCHES[meta.colors[0]], opacity: 0.72 }} />
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-[6px] font-mono px-2 py-[3px] rounded-full bg-[#1a1a1a] text-white">
                        {copy.view}
                      </span>
                    </div>
                    {meta.tag && (
                      <span className="absolute top-1.5 left-1.5 text-[6px] font-mono uppercase px-1 py-[1px] bg-[#1a1a1a] text-white rounded leading-tight">
                        {meta.tag}
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div>
                    <p className="text-[8px] font-medium leading-tight truncate">{product.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[7px] text-[#1a1a1a]/50">{product.price}</p>
                      <div className="flex gap-0.5">
                        {meta.colors.slice(0, 2).map((ci, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full border border-white/30"
                            style={{ background: SWATCHES[ci] }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="px-4 py-1.5 border-t border-[#1a1a1a]/10 flex items-center justify-between shrink-0 text-[7.5px] font-mono text-[#1a1a1a]/28 bg-[#f5f0eb]">
        <span>Infini · Shopify Hydrogen + Remix</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GREEN }} />
          Sanity CMS · Live
        </span>
      </div>

      {/* ── Backdrop ── */}
      <AnimatePresence>
        {(drawer !== null || cartOpen) && (
          <motion.div className="absolute inset-0 bg-black/22 z-20"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeAll}
          />
        )}
      </AnimatePresence>

      {/* ── Product Drawer ── */}
      <AnimatePresence>
        {drawer !== null && dProd && dMeta && (
          <motion.div
            className="absolute inset-y-0 right-0 w-[76%] z-30 flex flex-col bg-[#f5f0eb] border-l border-[#1a1a1a]/12 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 310 }}
          >
            {/* Close */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a]/10 shrink-0">
              <span className="text-[8px] font-mono text-[#1a1a1a]/35 uppercase tracking-widest">{copy.detail}</span>
              <button type="button" onClick={closeAll} className="text-[15px] text-[#1a1a1a]/35 hover:text-[#1a1a1a] leading-none">×</button>
            </div>

            {/* Image */}
            <div className="w-full aspect-[4/3] flex items-center justify-center shrink-0 transition-colors duration-300"
              style={{ background: `${SWATCHES[dMeta.colors[selColor]]}20` }}>
              <div className="w-14 h-20 rounded-sm transition-all duration-300"
                style={{ background: SWATCHES[dMeta.colors[selColor]], opacity: 0.75 }} />
            </div>

            <div className="px-4 py-4 flex flex-col gap-3.5">
              {/* Info */}
              <div>
                {dMeta.tag && (
                  <span className="text-[7px] font-mono uppercase px-1.5 py-[2px] bg-[#1a1a1a] text-white rounded">
                    {dMeta.tag}
                  </span>
                )}
                <p className="text-[13px] font-medium mt-1 leading-tight">{dProd.name}</p>
                <p className="text-[11px] font-mono text-[#1a1a1a]/55 mt-0.5">{dProd.price}</p>
                <p className="text-[8.5px] text-[#1a1a1a]/40 mt-2 leading-relaxed">{dProd.desc}</p>
              </div>

              {/* Color */}
              <div>
                <p className="text-[7.5px] font-mono text-[#1a1a1a]/30 uppercase tracking-widest mb-1.5">Color</p>
                <div className="flex gap-2">
                  {dMeta.colors.map((ci, i) => (
                    <button key={i} type="button" onClick={() => setSelColor(i)}
                      className="w-5 h-5 rounded-full transition-all"
                      style={{
                        background: SWATCHES[ci],
                        outline: selColor === i ? "2px solid #1a1a1a" : "2px solid transparent",
                        outlineOffset: "2px",
                      }} />
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <p className="text-[7.5px] font-mono text-[#1a1a1a]/30 uppercase tracking-widest mb-1.5">
                  {lang === "EN" ? "Size" : "Taille"}
                </p>
                <div className="flex gap-1">
                  {SIZES.map(s => (
                    <button key={s} type="button" onClick={() => setSelSize(s)}
                      className="w-7 h-7 text-[8px] font-mono rounded transition-all"
                      style={{
                        background: selSize === s ? "#1a1a1a" : "rgba(26,26,26,0.06)",
                        color: selSize === s ? "#fff" : "rgba(26,26,26,0.52)",
                        border: `1px solid ${selSize === s ? "#1a1a1a" : "rgba(26,26,26,0.14)"}`,
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add */}
              <button type="button" onClick={() => addToCart(drawer)}
                className="w-full py-2.5 text-[10px] font-mono rounded text-white mt-1"
                style={{ background: "#1a1a1a" }}>
                {copy.add}
              </button>

              <p className="text-[7.5px] font-mono text-[#1a1a1a]/28 text-center">{copy.shipping}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cart Sidebar ── */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            className="absolute inset-y-0 right-0 w-[80%] z-30 flex flex-col bg-[#f5f0eb] border-l border-[#1a1a1a]/12"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 310 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a]/10 shrink-0">
              <span className="text-[11px] font-semibold tracking-[0.15em] uppercase">
                {copy.bag}{totalItems > 0 ? ` (${totalItems})` : ""}
              </span>
              <button type="button" onClick={closeAll} className="text-[15px] text-[#1a1a1a]/35 hover:text-[#1a1a1a] leading-none">×</button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: "none" }}>
              {cart.length === 0 ? (
                <p className="text-[9px] font-mono text-[#1a1a1a]/32 text-center mt-8">{copy.empty}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {cart.map(({ id, size, qty }) => {
                      const p = copy.products[id];
                      const m = META[id];
                      return (
                        <motion.div key={`${id}-${size}`} layout
                          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}
                          className="flex items-center gap-2.5">
                          <div className="w-9 h-12 rounded shrink-0"
                            style={{ background: `${SWATCHES[m.colors[0]]}45` }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[9.5px] font-medium truncate">{p.name}</p>
                            <p className="text-[7.5px] font-mono text-[#1a1a1a]/38">{size} · ×{qty}</p>
                            <p className="text-[9px] font-mono text-[#1a1a1a]/55 mt-0.5">{p.price}</p>
                          </div>
                          <button type="button" onClick={() => removeItem(id, size)}
                            className="text-[12px] text-[#1a1a1a]/25 hover:text-[#1a1a1a] shrink-0 leading-none">×</button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="px-4 py-4 border-t border-[#1a1a1a]/10 shrink-0 flex flex-col gap-2.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-[#1a1a1a]/45">{copy.subtotal}</span>
                  <span className="font-semibold">${totalUSD.toFixed(0)}</span>
                </div>
                <button type="button" className="w-full py-2.5 text-[10px] font-mono rounded text-white"
                  style={{ background: "#1a1a1a" }}>
                  {copy.checkout} →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
