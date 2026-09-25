/**
 * Decorative "half-frame" — corner brackets + crossing lines around the
 * hologram panel, HUD/blueprint style. Purely visual, never interactive.
 */
export function HeroFrame() {
  return (
    <div className="absolute inset-0 z-[6] pointer-events-none">
      <div className="absolute top-8 right-8 w-10 h-10 border-t border-r border-(--foreground)/15" />
      <div className="absolute bottom-8 right-8 w-10 h-10 border-b border-r border-(--foreground)/15" />

      {/* Positioned via CSS vars HologramAvatar publishes from the figure's
          real measured bounds (see HologramAvatar.tsx) — inline style, not a
          Tailwind arbitrary-value class, so there's no build-time parsing of
          the var()/comma to go wrong. Fallback is the first-paint default
          before that JS has run once. */}
      <div
        className="absolute top-0 bottom-0 w-px bg-(--foreground)/10"
        style={{ left: "var(--figure-left, 62%)" }}
      />
      <div
        className="absolute left-0 right-0 h-px bg-(--foreground)/10"
        style={{ top: "var(--figure-top, 46%)" }}
      />
    </div>
  );
}
