"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// ─── Card artwork — drawn procedurally on an offscreen canvas ────────────────

function buildCardTexture(): THREE.CanvasTexture {
  const W = 512, H = 768;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;

  // ── Background: deep space ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#05010f");
  bg.addColorStop(0.5, "#0a0520");
  bg.addColorStop(1, "#0d0a1a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Stars
  const rng = (seed: number) => { let x = Math.sin(seed) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < 120; i++) {
    const sx = rng(i * 3.1) * W;
    const sy = rng(i * 7.3) * H * 0.65;
    const sr = rng(i * 5.7) * 1.5 + 0.3;
    const sa = rng(i * 2.9) * 0.6 + 0.4;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${sa})`;
    ctx.fill();
  }

  // Nebula blobs
  const nebulas = [
    { x: 0.3, y: 0.25, r: 80, c: "rgba(80,0,160,0.18)" },
    { x: 0.7, y: 0.15, r: 60, c: "rgba(0,60,180,0.15)" },
    { x: 0.5, y: 0.35, r: 100, c: "rgba(120,0,200,0.12)" },
  ];
  nebulas.forEach(({ x, y, r, c }) => {
    const g = ctx.createRadialGradient(x * W, y * H, 0, x * W, y * H, r);
    g.addColorStop(0, c); g.addColorStop(1, "transparent");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  });

  // ── Card frame border ──
  const pad = 16;
  ctx.strokeStyle = "rgba(160,80,255,0.7)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#a050ff";
  ctx.shadowBlur = 12;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 20);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Inner frame line
  ctx.strokeStyle = "rgba(160,80,255,0.25)";
  ctx.lineWidth = 1;
  roundRect(ctx, pad + 6, pad + 6, W - (pad + 6) * 2, H - (pad + 6) * 2, 16);
  ctx.stroke();

  // ── Art frame (upper 60%) ──
  const artY = 56, artH = H * 0.56;
  ctx.strokeStyle = "rgba(160,80,255,0.4)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, pad + 12, artY, W - (pad + 12) * 2, artH, 10);
  ctx.stroke();
  ctx.save();
  roundRect(ctx, pad + 12, artY, W - (pad + 12) * 2, artH, 10);
  ctx.clip();

  // Art bg glow
  const artGlow = ctx.createRadialGradient(W / 2, artY + artH * 0.45, 0, W / 2, artY + artH * 0.45, 200);
  artGlow.addColorStop(0, "rgba(100,0,200,0.35)");
  artGlow.addColorStop(0.5, "rgba(30,0,80,0.2)");
  artGlow.addColorStop(1, "transparent");
  ctx.fillStyle = artGlow; ctx.fillRect(0, 0, W, H);

  // Serpent body (stylized with bezier curves)
  drawSerpent(ctx, W, artY, artH);

  ctx.restore();

  // ── Card name banner ──
  const bannerY = artY + artH + 8;
  ctx.fillStyle = "rgba(10,5,30,0.85)";
  roundRect(ctx, pad + 12, bannerY, W - (pad + 12) * 2, 38, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(160,80,255,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#e8d0ff";
  ctx.font = "bold 22px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "2px";
  ctx.fillText("KAEL", W / 2 - 28, bannerY + 26);
  ctx.fillStyle = "rgba(180,120,255,0.7)";
  ctx.font = "11px 'Arial', sans-serif";
  ctx.fillText("VOID SERPENT", W / 2 + 36, bannerY + 26);

  // ── Type line ──
  ctx.fillStyle = "rgba(180,120,255,0.55)";
  ctx.font = "10px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Legendary · Cosmic Creature", W / 2, bannerY + 52);

  // ── Description box ──
  const descY = bannerY + 64;
  ctx.fillStyle = "rgba(10,5,30,0.6)";
  roundRect(ctx, pad + 12, descY, W - (pad + 12) * 2, 78, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(160,80,255,0.15)";
  ctx.lineWidth = 1; ctx.stroke();

  ctx.fillStyle = "rgba(200,170,255,0.7)";
  ctx.font = "italic 10px 'Arial', sans-serif";
  ctx.textAlign = "center";
  const lines = [
    "Nació en el vacío entre galaxias, donde",
    "la luz nunca alcanza. Su escama absorbe",
    "toda energía que toca.",
  ];
  lines.forEach((line, i) => ctx.fillText(line, W / 2, descY + 18 + i * 15));

  // ── Stats bar ──
  const statsY = descY + 90;
  ctx.fillStyle = "rgba(10,5,30,0.8)";
  roundRect(ctx, pad + 12, statsY, W - (pad + 12) * 2, 44, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(160,80,255,0.25)";
  ctx.lineWidth = 1; ctx.stroke();

  const stats = [
    { label: "ATK", value: "∞", color: "#ff6b6b" },
    { label: "DEF", value: "888", color: "#6baaff" },
    { label: "VOI", value: "∅", color: "#b06bff" },
  ];
  stats.forEach(({ label, value, color }, i) => {
    const sx = pad + 30 + i * ((W - (pad + 12) * 2 - 20) / 3);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "8px 'Arial', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, sx + 20, statsY + 14);
    ctx.fillStyle = color;
    ctx.font = "bold 14px 'Arial', sans-serif";
    ctx.fillText(value, sx + 20, statsY + 32);
  });

  // ── Rarity gems (top corners) ──
  [[pad + 24, pad + 28], [W - pad - 24, pad + 28]].forEach(([gx, gy]) => {
    const gem = ctx.createRadialGradient(gx, gy, 0, gx, gy, 10);
    gem.addColorStop(0, "#e0a0ff");
    gem.addColorStop(0.4, "#9000ff");
    gem.addColorStop(1, "rgba(80,0,160,0)");
    ctx.fillStyle = gem;
    ctx.beginPath(); ctx.arc(gx, gy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(200,100,255,0.7)"; ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Rarity label
  ctx.fillStyle = "rgba(180,80,255,0.6)";
  ctx.font = "bold 9px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("◆ VOID RARE ◆", W / 2, pad + 30);

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawSerpent(ctx: CanvasRenderingContext2D, W: number, artY: number, artH: number) {
  const cx = W / 2, cy = artY + artH * 0.52;

  // Body glow
  for (let i = 5; i > 0; i--) {
    ctx.beginPath();
    ctx.moveTo(cx - 120, cy + 60);
    ctx.bezierCurveTo(cx - 80, cy - 80, cx + 80, cy + 80, cx + 120, cy - 60);
    ctx.bezierCurveTo(cx + 90, cy - 120, cx, cy - 60, cx - 30, cy - 100);
    ctx.bezierCurveTo(cx - 80, cy - 140, cx - 120, cy - 80, cx - 60, cy - 20);
    ctx.strokeStyle = `rgba(160,${60 + i * 20},255,${0.06 * i})`;
    ctx.lineWidth = 6 + i * 4;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Main serpent body
  ctx.beginPath();
  ctx.moveTo(cx - 120, cy + 60);
  ctx.bezierCurveTo(cx - 80, cy - 80, cx + 80, cy + 80, cx + 120, cy - 60);
  ctx.bezierCurveTo(cx + 90, cy - 120, cx, cy - 60, cx - 30, cy - 100);
  ctx.bezierCurveTo(cx - 80, cy - 140, cx - 120, cy - 80, cx - 60, cy - 20);
  const bodyGrad = ctx.createLinearGradient(cx - 120, cy + 60, cx + 120, cy - 120);
  bodyGrad.addColorStop(0, "#200040");
  bodyGrad.addColorStop(0.4, "#6000c0");
  bodyGrad.addColorStop(0.7, "#a040ff");
  bodyGrad.addColorStop(1, "#c080ff");
  ctx.strokeStyle = bodyGrad;
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.stroke();

  // Scales pattern
  ctx.strokeStyle = "rgba(200,120,255,0.4)";
  ctx.lineWidth = 1;
  for (let t = 0; t < 1; t += 0.06) {
    const px = lerp(-120, cx, t) + cx * 0.2;
    const py = lerp(cy + 60, cy - 80, t);
    ctx.beginPath();
    ctx.arc(px, py, 5 + t * 4, 0, Math.PI);
    ctx.stroke();
  }

  // Head
  ctx.beginPath();
  ctx.ellipse(cx - 60, cy - 20, 28, 20, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = "#7010d0";
  ctx.fill();
  ctx.strokeStyle = "rgba(200,100,255,0.8)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Eyes
  [[-72, cy - 26], [-48, cy - 26]].forEach(([ex, ey]) => {
    const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 8);
    eg.addColorStop(0, "#ff40ff");
    eg.addColorStop(0.4, "#8000ff");
    eg.addColorStop(1, "rgba(80,0,160,0)");
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(ex, ey, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ff80ff";
    ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill();
  });

  // Energy particles around body
  const rng = (s: number) => { const x = Math.sin(s) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < 20; i++) {
    const px = cx + (rng(i * 3.7) - 0.5) * 180;
    const py = cy + (rng(i * 5.1) - 0.5) * 140;
    const pr = rng(i * 2.3) * 2.5 + 0.5;
    const pg = ctx.createRadialGradient(px, py, 0, px, py, pr * 3);
    pg.addColorStop(0, `rgba(200,100,255,${rng(i * 4.1) * 0.8 + 0.2})`);
    pg.addColorStop(1, "transparent");
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(px, py, pr * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
  }
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ─── Card back texture ────────────────────────────────────────────────────────

function buildBackTexture(): THREE.CanvasTexture {
  const W = 512, H = 768;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#07020f";
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = "rgba(120,40,200,0.18)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Center glow
  const cg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 200);
  cg.addColorStop(0, "rgba(120,40,220,0.3)");
  cg.addColorStop(1, "transparent");
  ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);

  // Logo: TROVE hexagon
  const hx = W / 2, hy = H / 2, hr = 80;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    i === 0 ? ctx.moveTo(hx + Math.cos(a) * hr, hy + Math.sin(a) * hr)
            : ctx.lineTo(hx + Math.cos(a) * hr, hy + Math.sin(a) * hr);
  }
  ctx.closePath();
  ctx.strokeStyle = "rgba(180,80,255,0.8)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#a050ff"; ctx.shadowBlur = 20;
  ctx.stroke(); ctx.shadowBlur = 0;

  // Inner hex
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    i === 0 ? ctx.moveTo(hx + Math.cos(a) * (hr - 20), hy + Math.sin(a) * (hr - 20))
            : ctx.lineTo(hx + Math.cos(a) * (hr - 20), hy + Math.sin(a) * (hr - 20));
  }
  ctx.closePath(); ctx.strokeStyle = "rgba(180,80,255,0.3)"; ctx.lineWidth = 1; ctx.stroke();

  // TROVE text
  ctx.fillStyle = "rgba(200,130,255,0.9)";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.letterSpacing = "8px";
  ctx.shadowColor = "#a050ff"; ctx.shadowBlur = 15;
  ctx.fillText("TROVE", hx + 8, hy + 10);
  ctx.shadowBlur = 0;

  // Border
  const pad = 16;
  ctx.strokeStyle = "rgba(120,40,200,0.5)";
  ctx.lineWidth = 2;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 20);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

// ─── Hologram shader ──────────────────────────────────────────────────────────

const holoVert = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-worldPos.xyz);
    gl_Position = projectionMatrix * worldPos;
  }
`;

const holoFrag = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  uniform float uTime;
  uniform vec2  uMouse;   // -1..1
  uniform float uIntensity;
  uniform bool  uXray;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
               mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }

  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.5);
    float edgeFresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 1.0);

    // Rainbow hue driven by mouse + UV + time
    float hue = vUv.x * 0.4
              + vUv.y * 0.2
              + uMouse.x * 0.35
              + uMouse.y * 0.1
              + uTime * 0.06;
    vec3 rainbow = hsv2rgb(vec3(fract(hue), 0.85, 1.0));

    // Scanlines
    float scan = sin(vUv.y * 180.0 + uTime * 3.5) * 0.04 + 0.96;

    // Moving light caustic
    float caustic = noise(vUv * 6.0 + vec2(uTime * 0.4, uMouse.x * 2.0)) * 0.5;
    caustic += noise(vUv * 12.0 - vec2(uTime * 0.2, uMouse.y * 1.5)) * 0.25;
    caustic = smoothstep(0.4, 0.8, caustic);

    // Sparkle points
    float sparkle = step(0.985, hash(floor(vUv * 120.0) + floor(uTime * 8.0)));
    sparkle *= hash(floor(vUv * 60.0 + 0.5) + 99.0);

    // XRay mode
    if (uXray) {
      float edge = pow(1.0 - abs(dot(vNormal, vViewDir)), 3.0);
      float grid = step(0.92, sin(vUv.x * 40.0)) + step(0.92, sin(vUv.y * 60.0));
      grid = clamp(grid, 0.0, 1.0);
      vec3 xrayColor = mix(vec3(0.0, 0.8, 1.0), vec3(1.0, 0.2, 1.0), vUv.y);
      float pulse = sin(uTime * 2.0 + vUv.y * 8.0) * 0.3 + 0.7;
      gl_FragColor = vec4(xrayColor * (edge * 1.5 + grid * 0.6) * pulse, (edge + grid * 0.4) * 0.9);
      return;
    }

    // Combine hologram layers
    vec3 col = rainbow * (0.7 + caustic * 0.4) * scan;
    col += vec3(sparkle) * 0.9;
    col += rainbow * fresnel * 0.5;

    float alpha = (fresnel * 0.55 + caustic * 0.25 + sparkle * 0.15) * uIntensity;
    gl_FragColor = vec4(col, alpha);
  }
`;

// ─── Particle system ──────────────────────────────────────────────────────────

function Particles({ xray }: { xray: boolean }) {
  const COUNT = 80;
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  const { positions, phases } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const phases = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const r = 1.2 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      positions[i * 3] = r * Math.cos(theta) * Math.cos(phi);
      positions[i * 3 + 1] = r * Math.sin(phi) * 1.4;
      positions[i * 3 + 2] = r * Math.sin(theta) * Math.cos(phi) * 0.3;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, phases };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current || !matRef.current) return;
    const t = clock.getElapsedTime();
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < COUNT; i++) {
      const phase = phases[i];
      const r = 1.2 + Math.sin(t * 0.3 + phase) * 0.4;
      const theta = t * 0.15 + phase * 2.5;
      const phi = Math.sin(t * 0.2 + phase) * 0.8;
      pos.setXYZ(i,
        r * Math.cos(theta) * Math.cos(phi),
        r * Math.sin(phi) * 1.4 + Math.sin(t * 0.5 + phase) * 0.15,
        r * Math.sin(theta) * Math.cos(phi) * 0.3,
      );
    }
    pos.needsUpdate = true;
    ref.current.rotation.y = t * 0.08;
    matRef.current.color.set(xray ? "#00ccff" : "#b060ff");
    matRef.current.opacity = xray ? 0.8 : 0.55;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial ref={matRef} color="#b060ff" size={0.018} transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

// ─── The 3D card ──────────────────────────────────────────────────────────────

function Card3D({
  mouseRef,
  xray,
  flipped,
  frontTex,
  backTex,
}: {
  mouseRef: React.MutableRefObject<[number, number]>;
  xray: boolean;
  flipped: boolean;
  frontTex: THREE.CanvasTexture;
  backTex: THREE.CanvasTexture;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const holoRef = useRef<THREE.ShaderMaterial>(null);
  const holoBackRef = useRef<THREE.ShaderMaterial>(null);
  const flipRef = useRef(0); // current flip angle
  const targetFlipRef = useRef(0);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const [mx, my] = mouseRef.current;

    // Idle float
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.06;

    // Mouse tilt (only when not flipping)
    const tiltX = my * -0.25;
    const tiltY = mx * 0.35;

    // Flip animation
    targetFlipRef.current = flipped ? Math.PI : 0;
    flipRef.current += (targetFlipRef.current - flipRef.current) * 0.07;

    groupRef.current.rotation.x = tiltX * (1 - Math.abs(Math.sin(flipRef.current)));
    groupRef.current.rotation.y = tiltY * (1 - Math.abs(Math.sin(flipRef.current))) + flipRef.current;

    // Update hologram uniforms
    const uniforms = { uTime: t, uMouse: new THREE.Vector2(mx, my), uIntensity: 1.0, uXray: xray };
    if (holoRef.current) {
      holoRef.current.uniforms.uTime.value = t;
      holoRef.current.uniforms.uMouse.value.set(mx, my);
      holoRef.current.uniforms.uXray.value = xray;
    }
    if (holoBackRef.current) {
      holoBackRef.current.uniforms.uTime.value = t;
      holoBackRef.current.uniforms.uMouse.value.set(mx, my);
      holoBackRef.current.uniforms.uXray.value = xray;
    }
    void uniforms;
  });

  const holoUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uIntensity: { value: 1.0 },
    uXray: { value: false },
  }), []);

  const holoBackUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uIntensity: { value: 0.6 },
    uXray: { value: false },
  }), []);

  return (
    <group ref={groupRef}>
      {/* Card body */}
      <RoundedBox args={[1.5, 2.18, 0.04]} radius={0.06} smoothness={6}>
        <meshStandardMaterial color="#0a0520" roughness={0.2} metalness={0.5} side={THREE.FrontSide} />
      </RoundedBox>

      {/* Front face — card artwork */}
      <mesh position={[0, 0, 0.021]}>
        <planeGeometry args={[1.47, 2.14]} />
        <meshBasicMaterial map={frontTex} transparent />
      </mesh>

      {/* Back face — TROVE logo */}
      <mesh position={[0, 0, -0.021]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.47, 2.14]} />
        <meshBasicMaterial map={backTex} transparent />
      </mesh>

      {/* Hologram overlay — front */}
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry args={[1.47, 2.14]} />
        <shaderMaterial
          ref={holoRef}
          vertexShader={holoVert}
          fragmentShader={holoFrag}
          uniforms={holoUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Hologram overlay — back */}
      <mesh position={[0, 0, -0.022]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.47, 2.14]} />
        <shaderMaterial
          ref={holoBackRef}
          vertexShader={holoVert}
          fragmentShader={holoFrag}
          uniforms={holoBackUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Edge glow rim */}
      <RoundedBox args={[1.52, 2.2, 0.045]} radius={0.065} smoothness={6}>
        <meshStandardMaterial
          color="#8030ff"
          emissive="#6020d0"
          emissiveIntensity={0.4}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </RoundedBox>
    </group>
  );
}

// ─── Scene lighting ───────────────────────────────────────────────────────────

function SceneLights({ xray }: { xray: boolean }) {
  const light1 = useRef<THREE.PointLight>(null);
  const light2 = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (light1.current) {
      light1.current.position.set(Math.sin(t * 0.5) * 2, Math.cos(t * 0.4) * 1.5, 2);
      light1.current.color.set(xray ? "#00ccff" : "#9040ff");
    }
    if (light2.current) {
      light2.current.position.set(Math.cos(t * 0.3) * 2, Math.sin(t * 0.6) * 1.5, 1.5);
      light2.current.color.set(xray ? "#ff00ff" : "#4080ff");
    }
  });
  return (
    <>
      <ambientLight intensity={xray ? 0.05 : 0.2} />
      <pointLight ref={light1} intensity={xray ? 2 : 1.5} distance={6} decay={2} />
      <pointLight ref={light2} intensity={xray ? 1.5 : 1} distance={5} decay={2} />
      <pointLight position={[0, 0, 3]} intensity={0.5} color="#ffffff" distance={4} decay={2} />
    </>
  );
}

// ─── Camera rig ──────────────────────────────────────────────────────────────

function CameraRig({ mouseRef }: { mouseRef: React.MutableRefObject<[number, number]> }) {
  const { camera } = useThree();
  useFrame(() => {
    const [mx] = mouseRef.current;
    camera.position.x += (mx * 0.15 - camera.position.x) * 0.04;
  });
  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function TroveDemo() {
  const [xray, setXray] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [gpuSupported, setGpuSupported] = useState(false);
  const mouseRef = useRef<[number, number]>([0, 0]);
  const containerRef = useRef<HTMLDivElement>(null);

  const frontTex = useMemo(() => typeof window !== "undefined" ? buildCardTexture() : null, []);
  const backTex = useMemo(() => typeof window !== "undefined" ? buildBackTexture() : null, []);

  useEffect(() => {
    setGpuSupported(!!(navigator as unknown as { gpu?: unknown }).gpu);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = [
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    ];
  };

  const handleMouseLeave = () => { mouseRef.current = [0, 0]; };

  if (!frontTex || !backTex) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full min-h-[340px] bg-[#04010c] overflow-hidden"
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: xray ? "radial-gradient(ellipse at center, rgba(0,80,120,0.25) 0%, transparent 70%)" : "radial-gradient(ellipse at center, rgba(60,0,120,0.25) 0%, transparent 70%)" }}
      />

      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 42 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <Environment preset="night" />
        <SceneLights xray={xray} />
        <CameraRig mouseRef={mouseRef} />
        <Card3D mouseRef={mouseRef} xray={xray} flipped={flipped} frontTex={frontTex} backTex={backTex} />
        <Particles xray={xray} />
      </Canvas>

      {/* Top badges */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
        <div className={`flex items-center gap-1.5 text-[9px] font-mono px-2 py-1 rounded-full border ${
          gpuSupported
            ? "bg-violet-500/15 border-violet-500/30 text-violet-300"
            : "bg-white/5 border-white/10 text-white/30"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${gpuSupported ? "bg-violet-400 animate-pulse" : "bg-white/20"}`} />
          {gpuSupported ? "WebGPU detected" : "WebGL · GLSL"}
        </div>
        {xray && (
          <div className="flex items-center gap-1.5 text-[9px] font-mono px-2 py-1 rounded-full border bg-cyan-500/15 border-cyan-500/30 text-cyan-300">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            X-Ray mode
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <button
          onClick={() => setFlipped((v) => !v)}
          className="text-[11px] font-mono px-3 py-1.5 rounded-full border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition-colors bg-black/40 backdrop-blur"
        >
          {flipped ? "↺ ver frente" : "↻ ver dorso"}
        </button>
        <button
          onClick={() => setXray((v) => !v)}
          className={`text-[11px] font-mono px-3 py-1.5 rounded-full border transition-colors backdrop-blur ${
            xray
              ? "border-cyan-400/50 text-cyan-300 bg-cyan-500/10"
              : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60 bg-black/40"
          }`}
        >
          ⬡ X-Ray
        </button>
      </div>

      <p className="absolute bottom-0 left-1/2 -translate-x-1/2 pb-0.5 text-[9px] font-mono text-white/15 whitespace-nowrap pointer-events-none">
        TROVE · mueve el cursor
      </p>
    </div>
  );
}
