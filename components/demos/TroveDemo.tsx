"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function rng(seed: number) {
  const x = Math.sin(seed + 1) * 43758.5453;
  return x - Math.floor(x);
}

// ─── Card front texture (512×768) ─────────────────────────────────────────────

function buildFrontTexture(): THREE.CanvasTexture {
  const W = 512, H = 768;
  const cvs = document.createElement("canvas");
  cvs.width = W; cvs.height = H;
  const g = cvs.getContext("2d")!;

  // Background
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#06010e"); bg.addColorStop(0.6, "#0b0422"); bg.addColorStop(1, "#0e0818");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);

  // Nebula blobs
  [
    { x: 0.3, y: 0.2, r: 120, c: "rgba(90,0,180,0.22)" },
    { x: 0.75, y: 0.3, r: 90, c: "rgba(0,40,200,0.18)" },
    { x: 0.5, y: 0.45, r: 160, c: "rgba(130,0,210,0.14)" },
  ].forEach(({ x, y, r, c }) => {
    const grad = g.createRadialGradient(x * W, y * H, 0, x * W, y * H, r);
    grad.addColorStop(0, c); grad.addColorStop(1, "transparent");
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
  });

  // Stars
  for (let i = 0; i < 140; i++) {
    const sx = rng(i * 3.1) * W, sy = rng(i * 7.3) * H * 0.68;
    const sr = rng(i * 5.7) * 1.4 + 0.4, sa = rng(i * 2.9) * 0.5 + 0.5;
    g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2);
    g.fillStyle = `rgba(255,255,255,${sa})`; g.fill();
  }

  // Outer border
  const pad = 14;
  g.strokeStyle = "#9040ff"; g.lineWidth = 2.5;
  g.shadowColor = "#a060ff"; g.shadowBlur = 14;
  roundRect(g, pad, pad, W - pad * 2, H - pad * 2, 22); g.stroke();
  g.shadowBlur = 0;
  // Inner border
  g.strokeStyle = "rgba(160,80,255,0.28)"; g.lineWidth = 1;
  roundRect(g, pad + 7, pad + 7, W - (pad + 7) * 2, H - (pad + 7) * 2, 16); g.stroke();

  // Top: rarity tag
  g.fillStyle = "rgba(180,80,255,0.65)"; g.font = "bold 10px Arial";
  g.textAlign = "center"; g.letterSpacing = "3px";
  g.fillText("◆  VOID RARE  ◆", W / 2, pad + 26);

  // Top corner gems
  [[pad + 22, pad + 22], [W - pad - 22, pad + 22]].forEach(([gx, gy]) => {
    const gem = g.createRadialGradient(gx, gy, 0, gx, gy, 11);
    gem.addColorStop(0, "#e0a0ff"); gem.addColorStop(0.45, "#8000e0"); gem.addColorStop(1, "transparent");
    g.fillStyle = gem; g.beginPath(); g.arc(gx, gy, 11, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(220,120,255,0.75)"; g.lineWidth = 1; g.stroke();
  });

  // Art frame
  const artX = pad + 14, artY = pad + 40, artW = W - (pad + 14) * 2, artH = Math.round(H * 0.52);
  g.strokeStyle = "rgba(160,80,255,0.45)"; g.lineWidth = 1.5;
  roundRect(g, artX, artY, artW, artH, 10); g.stroke();
  g.save(); roundRect(g, artX, artY, artW, artH, 10); g.clip();

  // Art bg inner glow
  const ag = g.createRadialGradient(W / 2, artY + artH * 0.48, 0, W / 2, artY + artH * 0.48, 210);
  ag.addColorStop(0, "rgba(110,0,210,0.4)"); ag.addColorStop(0.55, "rgba(40,0,90,0.25)"); ag.addColorStop(1, "transparent");
  g.fillStyle = ag; g.fillRect(artX, artY, artW, artH);

  // ── Serpent creature ─────────────────────────────────────────────────────
  const cx = W / 2, cy = artY + artH * 0.52;

  // Body outer glow
  for (let pass = 6; pass >= 1; pass--) {
    g.beginPath();
    g.moveTo(cx - 115, cy + 55); g.bezierCurveTo(cx - 70, cy - 90, cx + 85, cy + 75, cx + 115, cy - 55);
    g.bezierCurveTo(cx + 85, cy - 115, cx + 5, cy - 55, cx - 28, cy - 95);
    g.bezierCurveTo(cx - 82, cy - 148, cx - 118, cy - 78, cx - 58, cy - 18);
    g.strokeStyle = `rgba(150,${50 + pass * 18},255,${0.055 * pass})`;
    g.lineWidth = 5 + pass * 5; g.lineCap = "round"; g.stroke();
  }

  // Body fill
  g.beginPath();
  g.moveTo(cx - 115, cy + 55); g.bezierCurveTo(cx - 70, cy - 90, cx + 85, cy + 75, cx + 115, cy - 55);
  g.bezierCurveTo(cx + 85, cy - 115, cx + 5, cy - 55, cx - 28, cy - 95);
  g.bezierCurveTo(cx - 82, cy - 148, cx - 118, cy - 78, cx - 58, cy - 18);
  const sg = g.createLinearGradient(cx - 115, cy + 55, cx + 60, cy - 130);
  sg.addColorStop(0, "#1a0035"); sg.addColorStop(0.4, "#5800b0"); sg.addColorStop(0.75, "#9838e0"); sg.addColorStop(1, "#c070ff");
  g.strokeStyle = sg; g.lineWidth = 20; g.lineCap = "round"; g.stroke();

  // Scale highlights
  g.strokeStyle = "rgba(200,130,255,0.4)"; g.lineWidth = 1;
  for (let t = 0.05; t < 0.9; t += 0.065) {
    const px = cx - 115 + t * 230 + Math.sin(t * 8) * 20;
    const py = cy + 55 - t * 170 + Math.cos(t * 6) * 15;
    g.beginPath(); g.arc(px, py, 4 + t * 5, 0, Math.PI); g.stroke();
  }

  // Head
  g.beginPath(); g.ellipse(cx - 55, cy - 16, 30, 22, -0.35, 0, Math.PI * 2);
  g.fillStyle = "#6808c0"; g.fill();
  g.strokeStyle = "rgba(200,100,255,0.85)"; g.lineWidth = 1.5; g.stroke();

  // Eyes
  [[-68, cy - 24], [-42, cy - 24]].forEach(([ex, ey]) => {
    const eg = g.createRadialGradient(ex, ey, 0, ex, ey, 9);
    eg.addColorStop(0, "#ff60ff"); eg.addColorStop(0.35, "#9000ff"); eg.addColorStop(1, "transparent");
    g.fillStyle = eg; g.beginPath(); g.arc(ex, ey, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ffaaff"; g.beginPath(); g.arc(ex, ey, 3.5, 0, Math.PI * 2); g.fill();
  });

  // Fangs
  g.fillStyle = "rgba(230,180,255,0.8)";
  [[-64, cy - 6], [-46, cy - 6]].forEach(([fx, fy]) => {
    g.beginPath(); g.moveTo(fx - 3, fy); g.lineTo(fx + 3, fy); g.lineTo(fx, fy + 10); g.closePath(); g.fill();
  });

  // Energy sparks around body
  for (let i = 0; i < 22; i++) {
    const px = cx + (rng(i * 3.7) - 0.5) * 190;
    const py = cy + (rng(i * 5.1) - 0.5) * 150;
    const pr = rng(i * 2.3) * 3 + 0.6;
    const pg = g.createRadialGradient(px, py, 0, px, py, pr * 3.5);
    pg.addColorStop(0, `rgba(200,110,255,${rng(i * 4.1) * 0.7 + 0.3})`); pg.addColorStop(1, "transparent");
    g.fillStyle = pg; g.beginPath(); g.arc(px, py, pr * 3.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(px, py, pr * 0.6, 0, Math.PI * 2); g.fill();
  }

  g.restore();

  // Name banner
  const bnY = artY + artH + 10;
  g.fillStyle = "rgba(8,2,22,0.88)"; roundRect(g, artX, bnY, artW, 40, 7); g.fill();
  g.strokeStyle = "rgba(160,80,255,0.32)"; g.lineWidth = 1; g.stroke();
  g.fillStyle = "#ecdeff"; g.font = "bold 20px Arial"; g.textAlign = "left"; g.letterSpacing = "1px";
  g.fillText("KAEL", artX + 14, bnY + 27);
  g.fillStyle = "rgba(190,130,255,0.72)"; g.font = "10px Arial"; g.letterSpacing = "0px";
  g.fillText("VOID SERPENT", artX + 78, bnY + 27);
  g.fillStyle = "#c080ff"; g.font = "bold 12px Arial"; g.textAlign = "right";
  g.fillText("∞", artX + artW - 14, bnY + 27);

  // Type line
  g.fillStyle = "rgba(180,110,255,0.5)"; g.font = "10px Arial"; g.textAlign = "center"; g.letterSpacing = "0px";
  g.fillText("Legendary  ·  Cosmic Creature", W / 2, bnY + 54);

  // Description box
  const dY = bnY + 62;
  g.fillStyle = "rgba(8,2,22,0.62)"; roundRect(g, artX, dY, artW, 72, 6); g.fill();
  g.strokeStyle = "rgba(160,80,255,0.14)"; g.lineWidth = 1; g.stroke();
  g.fillStyle = "rgba(205,170,255,0.72)"; g.font = "italic 10px Arial";
  [
    "Nació en el vacío entre galaxias, donde",
    "la luz nunca alcanza. Su escama absorbe",
    'toda energía que toca. "Void Eternal."',
  ].forEach((line, i) => g.fillText(line, W / 2, dY + 17 + i * 16));

  // Stats
  const sY = dY + 80;
  g.fillStyle = "rgba(8,2,22,0.82)"; roundRect(g, artX, sY, artW, 42, 6); g.fill();
  g.strokeStyle = "rgba(160,80,255,0.22)"; g.lineWidth = 1; g.stroke();
  [
    { label: "ATK", value: "∞", col: "#ff7070", x: artX + artW * 0.2 },
    { label: "DEF", value: "888", col: "#70aaff", x: artX + artW * 0.5 },
    { label: "VOID", value: "∅", col: "#c070ff", x: artX + artW * 0.8 },
  ].forEach(({ label, value, col, x }) => {
    g.fillStyle = "rgba(255,255,255,0.28)"; g.font = "8px Arial"; g.textAlign = "center";
    g.fillText(label, x, sY + 14);
    g.fillStyle = col; g.font = "bold 15px Arial";
    g.fillText(value, x, sY + 32);
  });

  const tex = new THREE.CanvasTexture(cvs);
  tex.needsUpdate = true;
  return tex;
}

// ─── Card back texture ────────────────────────────────────────────────────────

function buildBackTexture(): THREE.CanvasTexture {
  const W = 512, H = 768;
  const cvs = document.createElement("canvas");
  cvs.width = W; cvs.height = H;
  const g = cvs.getContext("2d")!;

  g.fillStyle = "#050010"; g.fillRect(0, 0, W, H);

  // Grid
  g.strokeStyle = "rgba(110,30,200,0.2)"; g.lineWidth = 1;
  for (let x = 0; x < W; x += 28) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y < H; y += 28) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }

  // Center radial glow
  const cg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 220);
  cg.addColorStop(0, "rgba(130,40,230,0.32)"); cg.addColorStop(1, "transparent");
  g.fillStyle = cg; g.fillRect(0, 0, W, H);

  // Hexagon
  const hx = W / 2, hy = H / 2, hr = 88;
  const hex = (r: number) => {
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      i === 0 ? g.moveTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r)
              : g.lineTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r);
    }
    g.closePath();
  };
  g.shadowColor = "#b060ff"; g.shadowBlur = 22;
  g.strokeStyle = "rgba(190,90,255,0.9)"; g.lineWidth = 2.5; hex(hr); g.stroke();
  g.shadowBlur = 0;
  g.strokeStyle = "rgba(160,70,255,0.3)"; g.lineWidth = 1; hex(hr - 14); g.stroke();
  hex(hr - 28); g.stroke();

  // TROVE text
  g.fillStyle = "rgba(215,150,255,0.95)"; g.font = "bold 30px Arial";
  g.textAlign = "center"; g.letterSpacing = "8px";
  g.shadowColor = "#a050ff"; g.shadowBlur = 18;
  g.fillText("TROVE", hx + 8, hy + 11); g.shadowBlur = 0;

  // Corner dots
  [[22, 22], [W - 22, 22], [22, H - 22], [W - 22, H - 22]].forEach(([dx, dy]) => {
    g.fillStyle = "rgba(170,70,255,0.5)"; g.beginPath(); g.arc(dx, dy, 5, 0, Math.PI * 2); g.fill();
  });

  // Border
  const pad = 14;
  g.strokeStyle = "#9040ff"; g.lineWidth = 2.5;
  g.shadowColor = "#a060ff"; g.shadowBlur = 12;
  roundRect(g, pad, pad, W - pad * 2, H - pad * 2, 22); g.stroke();
  g.shadowBlur = 0;

  const tex = new THREE.CanvasTexture(cvs);
  tex.needsUpdate = true;
  return tex;
}

// ─── Hologram overlay shader ──────────────────────────────────────────────────

const HOLO_VERT = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const HOLO_FRAG = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  uniform float uTime;
  uniform vec2  uMouse;
  uniform bool  uXray;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }

  void main() {
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.2);

    if (uXray) {
      float edge = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 3.5);
      float gridX = step(0.93, sin(vUv.x * 38.0));
      float gridY = step(0.93, sin(vUv.y * 56.0));
      float grid = clamp(gridX + gridY, 0.0, 1.0);
      float pulse = sin(uTime * 2.2 + vUv.y * 10.0) * 0.3 + 0.7;
      vec3 col = mix(vec3(0.0, 0.75, 1.0), vec3(1.0, 0.15, 1.0), vUv.y);
      gl_FragColor = vec4(col * (edge * 1.8 + grid * 0.7) * pulse, (edge + grid * 0.5) * 0.92);
      return;
    }

    // Rainbow hue driven by mouse + angle
    float hue = vUv.x * 0.5 + uMouse.x * 0.4 + uTime * 0.07 + vUv.y * 0.1;
    vec3 rainbow = hsv2rgb(vec3(fract(hue), 0.88, 1.0));

    // Scanlines
    float scan = sin(vUv.y * 200.0 + uTime * 4.0) * 0.035 + 0.965;

    // Caustic noise
    float caustic = noise(vUv * 5.5 + vec2(uTime * 0.5, uMouse.x * 2.0));
    caustic += noise(vUv * 11.0 - vec2(uTime * 0.25, uMouse.y * 1.5)) * 0.5;
    caustic = smoothstep(0.35, 0.85, caustic * 0.66);

    // Sparkle
    float sp = step(0.984, hash(floor(vUv * 110.0) + floor(uTime * 7.0)));

    vec3 col = rainbow * (0.65 + caustic * 0.45) * scan + vec3(sp) * 0.85;
    col += rainbow * fresnel * 0.45;
    float alpha = (fresnel * 0.6 + caustic * 0.28 + sp * 0.12) * 0.88;
    gl_FragColor = vec4(col, alpha);
  }
`;

// ─── Particle field ───────────────────────────────────────────────────────────

function Particles({ xray }: { xray: boolean }) {
  const COUNT = 90;
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = 1.4 + rng(i * 13.7) * 1.4;
      const th = rng(i * 5.3) * Math.PI * 2;
      const ph = (rng(i * 7.1) - 0.5) * Math.PI;
      positions[i * 3]     = r * Math.cos(th) * Math.cos(ph);
      positions[i * 3 + 1] = r * Math.sin(ph) * 1.5;
      positions[i * 3 + 2] = r * Math.sin(th) * Math.cos(ph) * 0.25;
      seeds[i * 3] = rng(i * 2.9); seeds[i * 3 + 1] = rng(i * 4.1); seeds[i * 3 + 2] = rng(i * 6.3);
    }
    return { positions, seeds };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!ref.current || !matRef.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      const s0 = seeds[i * 3], s1 = seeds[i * 3 + 1], s2 = seeds[i * 3 + 2];
      const r = 1.4 + Math.sin(t * 0.28 + s0 * 6.28) * 0.45;
      const th = t * 0.12 + s0 * Math.PI * 4;
      const ph = Math.sin(t * 0.18 + s1 * 6.28) * 0.85;
      pos.setXYZ(i,
        r * Math.cos(th) * Math.cos(ph),
        r * Math.sin(ph) * 1.5 + Math.sin(t * 0.45 + s2 * 6.28) * 0.12,
        r * Math.sin(th) * Math.cos(ph) * 0.25,
      );
    }
    pos.needsUpdate = true;
    ref.current.rotation.y = t * 0.07;
    matRef.current.color.set(xray ? "#00eeff" : "#b860ff");
    matRef.current.opacity = xray ? 0.85 : 0.6;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial ref={matRef} color="#b860ff" size={0.016} transparent opacity={0.6} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ─── 3D Card ──────────────────────────────────────────────────────────────────

interface CardProps {
  mouseRef: React.MutableRefObject<[number, number]>;
  xray: boolean;
  flipped: boolean;
  frontTex: THREE.CanvasTexture;
  backTex: THREE.CanvasTexture;
}

function Card({ mouseRef, xray, flipped, frontTex, backTex }: CardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const holoFrontRef = useRef<THREE.ShaderMaterial>(null);
  const holoBackRef = useRef<THREE.ShaderMaterial>(null);
  const currentY = useRef(0);

  const holoUniforms = useMemo(() => ({
    uTime:   { value: 0 },
    uMouse:  { value: new THREE.Vector2() },
    uXray:   { value: false },
  }), []);

  const holoBackUniforms = useMemo(() => ({
    uTime:   { value: 0 },
    uMouse:  { value: new THREE.Vector2() },
    uXray:   { value: false },
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const [mx, my] = mouseRef.current;
    if (!groupRef.current) return;

    // Idle bob
    groupRef.current.position.y = Math.sin(t * 0.75) * 0.055;

    // Flip (target 0 or π)
    const targetY = flipped ? Math.PI : 0;
    currentY.current += (targetY - currentY.current) * 0.075;

    // Mouse tilt — lerped so leaving the canvas eases back smoothly
    const flipProgress = Math.abs(Math.sin(currentY.current));
    const tiltX = my * -0.28 * (1 - flipProgress);
    const tiltY = mx * 0.38 * (1 - flipProgress) + currentY.current;
    groupRef.current.rotation.x += (tiltX - groupRef.current.rotation.x) * 0.055;
    groupRef.current.rotation.y += (tiltY - groupRef.current.rotation.y) * 0.055;

    // Update hologram uniforms
    const uTime = t, uMouse = new THREE.Vector2(mx, my);
    if (holoFrontRef.current) {
      holoFrontRef.current.uniforms.uTime.value  = uTime;
      holoFrontRef.current.uniforms.uMouse.value = uMouse;
      holoFrontRef.current.uniforms.uXray.value  = xray;
    }
    if (holoBackRef.current) {
      holoBackRef.current.uniforms.uTime.value  = uTime;
      holoBackRef.current.uniforms.uMouse.value = uMouse;
      holoBackRef.current.uniforms.uXray.value  = xray;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Card body */}
      <RoundedBox args={[1.52, 2.22, 0.038]} radius={0.065} smoothness={6} castShadow>
        <meshStandardMaterial color="#130828" roughness={0.18} metalness={0.65} />
      </RoundedBox>

      {/* Front artwork */}
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry args={[1.48, 2.18]} />
        <meshBasicMaterial map={frontTex} />
      </mesh>

      {/* Back artwork */}
      <mesh position={[0, 0, -0.022]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.48, 2.18]} />
        <meshBasicMaterial map={backTex} />
      </mesh>

      {/* Hologram — front */}
      <mesh position={[0, 0, 0.023]}>
        <planeGeometry args={[1.48, 2.18]} />
        <shaderMaterial
          ref={holoFrontRef}
          vertexShader={HOLO_VERT}
          fragmentShader={HOLO_FRAG}
          uniforms={holoUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Hologram — back */}
      <mesh position={[0, 0, -0.023]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.48, 2.18]} />
        <shaderMaterial
          ref={holoBackRef}
          vertexShader={HOLO_VERT}
          fragmentShader={HOLO_FRAG}
          uniforms={holoBackUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Edge glow (backside of body) */}
      <RoundedBox args={[1.56, 2.26, 0.046]} radius={0.07} smoothness={6}>
        <meshStandardMaterial
          color={xray ? "#00ccff" : "#7020d0"}
          emissive={xray ? "#004488" : "#4010a0"}
          emissiveIntensity={0.55}
          transparent opacity={0.14}
          side={THREE.BackSide}
        />
      </RoundedBox>
    </group>
  );
}

// ─── Scene lights ─────────────────────────────────────────────────────────────

function Lights({ xray }: { xray: boolean }) {
  const ref1 = useRef<THREE.PointLight>(null);
  const ref2 = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref1.current) {
      ref1.current.position.set(Math.sin(t * 0.45) * 2.2, Math.cos(t * 0.38) * 1.8, 2.2);
      ref1.current.color.set(xray ? "#00aaff" : "#8030ff");
    }
    if (ref2.current) {
      ref2.current.position.set(Math.cos(t * 0.28) * 2.2, Math.sin(t * 0.55) * 1.5, 1.8);
      ref2.current.color.set(xray ? "#ff00ff" : "#3060ff");
    }
  });
  return (
    <>
      <ambientLight intensity={xray ? 0.12 : 0.5} />
      <pointLight ref={ref1} intensity={xray ? 4 : 2.5} distance={7}  decay={2} />
      <pointLight ref={ref2} intensity={xray ? 3 : 1.8} distance={6}  decay={2} />
      {/* Key front light — compensates for removed Environment HDR fill */}
      <pointLight position={[0, 0.5, 3.2]} intensity={1.8} color="#ffffff" distance={6} decay={2} />
      <pointLight position={[0, -0.5, 3.2]} intensity={0.6} color="#c0a0ff" distance={5} decay={2} />
    </>
  );
}

// ─── Camera subtle drift ──────────────────────────────────────────────────────

function CameraDrift({ mouseRef }: { mouseRef: React.MutableRefObject<[number, number]> }) {
  const { camera } = useThree();
  useFrame(() => {
    const [mx] = mouseRef.current;
    camera.position.x += (mx * 0.12 - camera.position.x) * 0.035;
  });
  return null;
}

// ─── Code snippets ────────────────────────────────────────────────────────────

const CODE_TABS = ["GLSL", "Canvas 2D", "R3F"] as const;
type CodeTab = (typeof CODE_TABS)[number];

const CODE_SNIPPETS: Record<CodeTab, { lines: { t: "c" | "k" | "n" | "s" | "p"; v: string }[][] }> = {
  "GLSL": {
    lines: [
      [{ t: "c", v: "// Hologram fragment shader — rainbow + caustic + sparkle" }],
      [{ t: "k", v: "void" }, { t: "n", v: " main" }, { t: "p", v: "() {" }],
      [{ t: "n", v: "  float " }, { t: "s", v: "fresnel" }, { t: "n", v: " = pow(1.0 - max(" }],
      [{ t: "n", v: "    dot(vNormal, vViewDir), 0.0), 2.2);" }],
      [{ t: "p", v: "" }],
      [{ t: "c", v: "  // Rainbow hue driven by mouse + time" }],
      [{ t: "k", v: "  float " }, { t: "s", v: "hue" }, { t: "n", v: " = vUv.x * 0.5" }],
      [{ t: "n", v: "       + uMouse.x * 0.4 + uTime * 0.07;" }],
      [{ t: "k", v: "  vec3 " }, { t: "s", v: "rainbow" }, { t: "n", v: " = hsv2rgb(" }],
      [{ t: "n", v: "    vec3(fract(hue), 0.88, 1.0));" }],
      [{ t: "p", v: "" }],
      [{ t: "c", v: "  // Caustic noise — double octave" }],
      [{ t: "k", v: "  float " }, { t: "s", v: "caustic" }, { t: "n", v: " = noise(vUv*5.5" }],
      [{ t: "n", v: "    + vec2(uTime*0.5, uMouse.x*2.0));" }],
      [{ t: "n", v: "  caustic += noise(vUv*11.0)*0.5;" }],
      [{ t: "n", v: "  caustic = smoothstep(0.35, 0.85, caustic*0.66);" }],
      [{ t: "p", v: "" }],
      [{ t: "c", v: "  // Sparkle — hash-based point flicker" }],
      [{ t: "k", v: "  float " }, { t: "s", v: "sp" }, { t: "n", v: " = step(0.984," }],
      [{ t: "n", v: "    hash(floor(vUv*110.0) + floor(uTime*7.0)));" }],
      [{ t: "p", v: "" }],
      [{ t: "k", v: "  vec3 " }, { t: "s", v: "col" }, { t: "n", v: " = rainbow" }],
      [{ t: "n", v: "    * (0.65 + caustic*0.45) + sp*0.85;" }],
      [{ t: "n", v: "  col += rainbow * fresnel * 0.45;" }],
      [{ t: "k", v: "  float " }, { t: "s", v: "alpha" }, { t: "n", v: " = fresnel*0.6" }],
      [{ t: "n", v: "    + caustic*0.28 + sp*0.12;" }],
      [{ t: "n", v: "  gl_FragColor = vec4(col, alpha);" }],
      [{ t: "p", v: "}" }],
    ],
  },
  "Canvas 2D": {
    lines: [
      [{ t: "c", v: "// Procedural card art — Canvas 2D API" }],
      [{ t: "k", v: "function " }, { t: "n", v: "buildFrontTexture" }, { t: "p", v: "() {" }],
      [{ t: "k", v: "  const " }, { t: "s", v: "cvs" }, { t: "n", v: " = document.createElement(" }, { t: "s", v: '"canvas"' }, { t: "n", v: ");" }],
      [{ t: "n", v: "  cvs.width = " }, { t: "s", v: "512" }, { t: "n", v: "; cvs.height = " }, { t: "s", v: "768" }, { t: "n", v: ";" }],
      [{ t: "k", v: "  const " }, { t: "s", v: "g" }, { t: "n", v: " = cvs.getContext(" }, { t: "s", v: '"2d"' }, { t: "n", v: ")!;" }],
      [{ t: "p", v: "" }],
      [{ t: "c", v: "  // Deep space gradient background" }],
      [{ t: "k", v: "  const " }, { t: "s", v: "bg" }, { t: "n", v: " = g.createLinearGradient(" }],
      [{ t: "n", v: "    0, 0, 0, H);" }],
      [{ t: "n", v: "  bg.addColorStop(0, " }, { t: "s", v: '"#06010e"' }, { t: "n", v: ");" }],
      [{ t: "n", v: "  bg.addColorStop(1, " }, { t: "s", v: '"#0e0818"' }, { t: "n", v: ");" }],
      [{ t: "p", v: "" }],
      [{ t: "c", v: "  // Serpent body — bezier curves" }],
      [{ t: "n", v: "  g.bezierCurveTo(" }],
      [{ t: "n", v: "    cx-70, cy-90,  cx+85, cy+75," }],
      [{ t: "n", v: "    cx+115, cy-55);" }],
      [{ t: "p", v: "" }],
      [{ t: "c", v: "  // CanvasTexture → Three.js material" }],
      [{ t: "k", v: "  const " }, { t: "s", v: "tex" }, { t: "n", v: " = new THREE.CanvasTexture(" }, { t: "s", v: "cvs" }, { t: "n", v: ");" }],
      [{ t: "n", v: "  tex.needsUpdate = " }, { t: "k", v: "true" }, { t: "n", v: ";" }],
      [{ t: "k", v: "  return " }, { t: "n", v: "tex;" }],
      [{ t: "p", v: "}" }],
    ],
  },
  "R3F": {
    lines: [
      [{ t: "c", v: "// Card animation — React Three Fiber" }],
      [{ t: "k", v: "function " }, { t: "n", v: "Card" }, { t: "p", v: "({ mouseRef, xray, flipped }) {" }],
      [{ t: "k", v: "  const " }, { t: "s", v: "groupRef" }, { t: "n", v: " = useRef();" }],
      [{ t: "k", v: "  const " }, { t: "s", v: "currentY" }, { t: "n", v: " = useRef(" }, { t: "s", v: "0" }, { t: "n", v: ");" }],
      [{ t: "p", v: "" }],
      [{ t: "n", v: "  useFrame(({ clock }) => {" }],
      [{ t: "k", v: "    const " }, { t: "s", v: "t" }, { t: "n", v: " = clock.getElapsedTime();" }],
      [{ t: "k", v: "    const " }, { t: "s", v: "[mx, my]" }, { t: "n", v: " = mouseRef.current;" }],
      [{ t: "p", v: "" }],
      [{ t: "c", v: "    // Idle float" }],
      [{ t: "n", v: "    groupRef.current.position.y =" }],
      [{ t: "n", v: "      Math.sin(t * 0.75) * 0.055;" }],
      [{ t: "p", v: "" }],
      [{ t: "c", v: "    // Smooth flip via lerp" }],
      [{ t: "k", v: "    const " }, { t: "s", v: "target" }, { t: "n", v: " = flipped ? Math.PI : 0;" }],
      [{ t: "n", v: "    currentY.current +=" }],
      [{ t: "n", v: "      (target - currentY.current) * 0.075;" }],
      [{ t: "p", v: "" }],
      [{ t: "c", v: "    // Mouse tilt" }],
      [{ t: "n", v: "    groupRef.current.rotation.x = my * -0.28;" }],
      [{ t: "n", v: "    groupRef.current.rotation.y =" }],
      [{ t: "n", v: "      mx * 0.38 + currentY.current;" }],
      [{ t: "n", v: "  });" }],
      [{ t: "p", v: "  // ..." }],
      [{ t: "p", v: "}" }],
    ],
  },
};

function CodeLine({ tokens }: { tokens: { t: "c" | "k" | "n" | "s" | "p"; v: string }[] }) {
  const colors = { c: "#6a9955", k: "#c792ea", n: "#82aaff", s: "#c3e88d", p: "#abb2bf" };
  return (
    <span className="block leading-[1.6]">
      {tokens.map((tok, i) => (
        <span key={i} style={{ color: colors[tok.t] }}>{tok.v}</span>
      ))}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TroveDemo() {
  const [xray,     setXray]     = useState(false);
  const [flipped,  setFlipped]  = useState(false);
  const [webgpu,   setWebgpu]   = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [codeTab,  setCodeTab]  = useState<CodeTab>("GLSL");
  const [ready,    setReady]    = useState(false);

  const [frontTex, setFrontTex] = useState<THREE.CanvasTexture | null>(null);
  const [backTex,  setBackTex]  = useState<THREE.CanvasTexture | null>(null);

  const mouseRef     = useRef<[number, number]>([0, 0]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFrontTex(buildFrontTexture());
    setBackTex(buildBackTexture());
    setWebgpu(!!(navigator as unknown as { gpu?: unknown }).gpu);
    // Small delay so Three.js finishes first frame before we fade in
    const t = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    mouseRef.current = [
      ((e.clientX - r.left) / r.width)  * 2 - 1,
      -((e.clientY - r.top)  / r.height) * 2 + 1,
    ];
  }, []);

  const loaded = !!(frontTex && backTex);

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={() => { mouseRef.current = [0, 0]; }}
      className="relative w-full h-full min-h-[360px] overflow-hidden"
      style={{ background: "#04010c" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: xray
            ? "radial-gradient(ellipse at 50% 45%, rgba(0,80,140,0.28) 0%, transparent 68%)"
            : "radial-gradient(ellipse at 50% 45%, rgba(70,0,150,0.28) 0%, transparent 68%)",
        }}
      />

      {/* ── Loading skeleton ── */}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20">
          {/* Card silhouette */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{ width: 90, height: 128, background: "rgba(120,40,255,0.07)", border: "1px solid rgba(160,80,255,0.18)" }}
          >
            {/* Shimmer sweep */}
            <div
              className="absolute inset-0 animate-shimmer"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(160,80,255,0.12) 50%, transparent 60%)",
                backgroundSize: "200% 100%",
              }}
            />
            {/* Fake card lines */}
            <div className="absolute inset-x-3 top-3 h-1 rounded-full bg-violet-500/15" />
            <div className="absolute inset-x-3 top-6 h-[52px] rounded-lg bg-violet-500/08" />
            <div className="absolute inset-x-3 bottom-8 h-1.5 rounded-full bg-violet-500/12" />
            <div className="absolute inset-x-3 bottom-5 h-1 rounded-full bg-violet-500/08" />
            <div className="absolute inset-x-3 bottom-2 h-1 rounded-full bg-violet-500/06" />
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-violet-400/60">
            <div className="w-3.5 h-3.5 rounded-full border border-violet-500/40 border-t-violet-400 animate-spin" />
            Inicializando WebGL…
          </div>
        </div>
      )}

      {/* ── 3D Scene ── */}
      {loaded && (
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: ready ? 1 : 0 }}
        >
          <Canvas
            camera={{ position: [0, 0, 3.6], fov: 40 }}
            gl={{ antialias: true, alpha: true }}
            style={{ position: "absolute", inset: 0 }}
          >
            <Lights xray={xray} />
            <CameraDrift mouseRef={mouseRef} />
            <Card
              mouseRef={mouseRef}
              xray={xray}
              flipped={flipped}
              frontTex={frontTex!}
              backTex={backTex!}
            />
            <Particles xray={xray} />
          </Canvas>
        </div>
      )}

      {/* ── Code panel ── */}
      {showCode && (
        <div
          className="absolute inset-0 z-30 flex flex-col"
          style={{ background: "rgba(5,2,15,0.96)", backdropFilter: "blur(8px)" }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 shrink-0">
            <div className="flex items-center gap-1">
              {CODE_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setCodeTab(tab)}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors ${
                    codeTab === tab
                      ? "bg-violet-500/22 text-violet-300 border border-violet-500/30"
                      : "text-white/30 hover:text-white/55"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCode(false)}
              className="text-[11px] font-mono text-white/30 hover:text-white/65 px-2 py-1 transition-colors"
            >
              ✕ cerrar
            </button>
          </div>

          {/* Code body */}
          <div className="flex-1 overflow-auto px-4 py-3">
            <pre className="text-[11px] font-mono leading-relaxed select-text">
              {CODE_SNIPPETS[codeTab].lines.map((line, i) => (
                <CodeLine key={i} tokens={line} />
              ))}
            </pre>
          </div>

          <p className="text-center text-[9px] font-mono text-white/15 pb-2">
            TROVE · código real del demo · {codeTab}
          </p>
        </div>
      )}

      {/* ── Top-left badges ── */}
      {loaded && (
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
          <div className={`flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1 rounded-full border backdrop-blur-sm ${
            webgpu ? "bg-violet-900/50 border-violet-500/35 text-violet-300"
                   : "bg-white/5 border-white/10 text-white/35"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${webgpu ? "bg-violet-400 animate-pulse" : "bg-white/25"}`} />
            {webgpu ? "WebGPU detected" : "WebGL · GLSL"}
          </div>
          {xray && (
            <div className="flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1 rounded-full border bg-cyan-900/40 border-cyan-400/30 text-cyan-300 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              X-Ray active
            </div>
          )}
        </div>
      )}

      {/* ── Top-right: code toggle ── */}
      {loaded && (
        <button
          onClick={() => setShowCode(v => !v)}
          className={`absolute top-3 right-3 z-10 text-[10px] font-mono px-2.5 py-1 rounded-full border backdrop-blur-sm transition-colors ${
            showCode
              ? "bg-violet-500/25 border-violet-400/45 text-violet-300"
              : "bg-black/40 border-white/12 text-white/40 hover:text-white/70 hover:border-white/25"
          }`}
        >
          {"{ }"}
        </button>
      )}

      {/* ── Bottom controls ── */}
      {loaded && !showCode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          <button
            onClick={() => setFlipped(v => !v)}
            className="text-[11px] font-mono px-3.5 py-1.5 rounded-full border border-violet-500/35 text-violet-300 hover:bg-violet-500/12 bg-black/50 backdrop-blur transition-colors"
          >
            {flipped ? "↺ frente" : "↻ dorso"}
          </button>
          <button
            onClick={() => setXray(v => !v)}
            className={`text-[11px] font-mono px-3.5 py-1.5 rounded-full border transition-colors bg-black/50 backdrop-blur ${
              xray ? "border-cyan-400/45 text-cyan-300 bg-cyan-500/12"
                   : "border-white/12 text-white/45 hover:border-white/25 hover:text-white/65"
            }`}
          >
            ⬡ X-Ray
          </button>
        </div>
      )}

      {loaded && !showCode && (
        <p className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/18 pointer-events-none whitespace-nowrap z-10">
          TROVE · mueve el cursor sobre la carta
        </p>
      )}
    </div>
  );
}
