"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ExternalLink } from "lucide-react";

// ── Purple node-graph background (unchanged from before) ──────────────────

function rng(s: number) { const x = Math.sin(s + 1) * 43758.5453; return x - Math.floor(x); }

function useAnimCanvas(ref: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    let raf = 0, t = 0;
    const W = cvs.width, H = cvs.height;
    const nodes = Array.from({ length: 28 }, (_, i) => ({
      x: rng(i * 3.1) * W, y: rng(i * 7.3) * H,
      vx: (rng(i * 2.7) - 0.5) * 0.28, vy: (rng(i * 5.1) - 0.5) * 0.22,
      r: rng(i * 4.3) * 2.2 + 0.8,
    }));
    const tick = () => {
      raf = requestAnimationFrame(tick);
      t++;
      ctx.fillStyle = "rgba(8,6,22,0.28)";
      ctx.fillRect(0, 0, W, H);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(220,160,255,${(1 - dist / 130) * 0.18})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      nodes.forEach((n, i) => {
        const pulse = Math.sin(t * 0.025 + i) * 0.3 + 0.7;
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3);
        g.addColorStop(0, `rgba(200,120,255,${0.7 * pulse})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(230,180,255,${0.85 * pulse})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      });
      const scanY = ((t * 0.6) % (H + 20)) - 10;
      const sg = ctx.createLinearGradient(0, scanY - 6, 0, scanY + 6);
      sg.addColorStop(0, "transparent");
      sg.addColorStop(0.5, "rgba(200,120,255,0.06)");
      sg.addColorStop(1, "transparent");
      ctx.fillStyle = sg; ctx.fillRect(0, scanY - 6, W, 12);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [ref]);
}

// ── TV screen texture ─────────────────────────────────────────────────────

const SW = 512, SH = 360;

function paintNormal(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, SW, SH);

  const bg = ctx.createLinearGradient(0, 0, 0, SH);
  bg.addColorStop(0, "#06040f");
  bg.addColorStop(1, "#0e0622");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SW, SH);

  // Scanlines
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  for (let y = 0; y < SH; y += 4) ctx.fillRect(0, y, SW, 2);

  // Purple glow behind text
  const glow = ctx.createRadialGradient(SW / 2, SH / 2, 0, SW / 2, SH / 2, 140);
  glow.addColorStop(0, "rgba(180,80,255,0.13)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SW, SH);

  // "makata" — white with purple shadow
  ctx.save();
  ctx.font = "bold 72px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(180,80,255,0.75)";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#f0e0ff";
  ctx.fillText("makata", SW / 2 - 38, SH / 2 - 10);
  ctx.restore();

  // ".tv" — orange accent
  ctx.save();
  ctx.font = "bold 40px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(255,106,0,0.75)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#ff6a00";
  ctx.fillText(".tv", SW / 2 + 118, SH / 2 - 10);
  ctx.restore();

  // Tagline
  ctx.save();
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillText("C R E A T I V E   S T U D I O", SW / 2, SH / 2 + 38);
  ctx.restore();

  // Corner brackets
  ctx.strokeStyle = "rgba(255,106,0,0.5)";
  ctx.lineWidth = 2;
  const L = 20;
  const corners: [number, number, number, number][] = [
    [20, 20, 1, 1], [SW - 20, 20, -1, 1],
    [20, SH - 20, 1, -1], [SW - 20, SH - 20, -1, -1],
  ];
  corners.forEach(([x, y, sx, sy]) => {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + sy * L); ctx.stroke();
  });

  // Status bar
  ctx.fillStyle = "rgba(255,106,0,0.09)";
  ctx.fillRect(20, SH - 46, SW - 40, 20);
  ctx.fillStyle = "rgba(255,106,0,0.65)";
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("● LIVE  ·  R3F  ·  GSAP  ·  FRAMER  ·  VERCEL", 30, SH - 36);
}

function paintGlitch(ctx: CanvasRenderingContext2D, progress: number) {
  if (progress > 0.62) {
    // Bright flash
    const alpha = ((progress - 0.62) / 0.38) * 0.95;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(0, 0, SW, SH);
  } else {
    paintNormal(ctx);
    // Jitter bands
    const nBands = 5 + Math.floor(progress * 8);
    const palette = ["#ff6a00", "#b450ff", "#3a7bfd", "#ff3d00", "#00ffe0"];
    for (let i = 0; i < nBands; i++) {
      const seed = i * 73.1 + progress * 211.7;
      const y = (seed % SH + SH) % SH;
      const h = 6 + (i * 17.3 % 24);
      ctx.globalAlpha = 0.28 + (i % 3) * 0.12;
      ctx.fillStyle = palette[i % palette.length];
      ctx.fillRect(0, y, SW, h);
    }
    ctx.globalAlpha = 1;
  }
}

// ── Particle burst ─────────────────────────────────────────────────────────
// Fresh implementation — palette taken from makata-tv repo:
//   hot #fff3b0 (yellow-white) → orange #ff7a1a → blue #3a7bfd

const BURST_N = 130;
const _cA = new THREE.Color("#fff3b0");
const _cB = new THREE.Color("#ff7a1a");
const _cC = new THREE.Color("#3a7bfd");

function Burst({ trigger }: { trigger: number }) {
  const ref = useRef<THREE.Points>(null);
  const alive = useRef(false);
  const elapsed = useRef(0);
  const vels = useRef(new Float32Array(BURST_N * 3));

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(BURST_N * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(BURST_N * 3), 3));
    return g;
  }, []);

  useEffect(() => {
    if (trigger === 0) return;
    alive.current = true;
    elapsed.current = 0;

    const pos = geo.attributes.position.array as Float32Array;
    const vel = vels.current;
    for (let i = 0; i < BURST_N; i++) {
      const i3 = i * 3;
      pos[i3] = 0; pos[i3 + 1] = 0; pos[i3 + 2] = 0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const spd = 1.0 + Math.random() * 3.5;
      vel[i3]     = Math.sin(phi) * Math.cos(theta) * spd;
      vel[i3 + 1] = Math.abs(Math.sin(phi) * Math.sin(theta)) * spd + 0.5;
      vel[i3 + 2] = Math.cos(phi) * spd * 0.45;
    }
    geo.attributes.position.needsUpdate = true;
  }, [trigger, geo]);

  useFrame((_, dt) => {
    if (!alive.current || !ref.current) return;
    elapsed.current += dt;
    const t = elapsed.current;

    const pos = geo.attributes.position.array as Float32Array;
    const col = geo.attributes.color.array as Float32Array;
    const vel = vels.current;

    for (let i = 0; i < BURST_N; i++) {
      const i3 = i * 3;
      vel[i3 + 1] -= 2.8 * dt;
      vel[i3] *= 0.968; vel[i3 + 1] *= 0.968; vel[i3 + 2] *= 0.968;
      pos[i3] += vel[i3] * dt;
      pos[i3 + 1] += vel[i3 + 1] * dt;
      pos[i3 + 2] += vel[i3 + 2] * dt;

      // hot white-yellow → orange (0–0.3s) → blue (0.3–0.9s)
      const tn = Math.min(t / 0.9, 1);
      const c = tn < 0.33
        ? _cA.clone().lerp(_cB, tn / 0.33)
        : _cB.clone().lerp(_cC, (tn - 0.33) / 0.67);
      col[i3] = c.r; col[i3 + 1] = c.g; col[i3 + 2] = c.b;
    }

    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;

    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, 1 - t / 0.85);
    mat.size = 0.038 + t * 0.022;

    if (t > 0.9) {
      alive.current = false;
      mat.opacity = 0;
    }
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        vertexColors
        size={0.038}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// ── TV mesh ────────────────────────────────────────────────────────────────

interface TVProps {
  burstTrigger: number;
  onDoubleClick: () => void;
  mouseRef:   React.MutableRefObject<[number, number]>;
  orbitingRef: React.MutableRefObject<boolean>;
}

function TV({ burstTrigger, onDoubleClick, mouseRef, orbitingRef }: TVProps) {
  const groupRef = useRef<THREE.Group>(null);
  const texRef   = useRef<THREE.CanvasTexture | null>(null);
  const cvsRef   = useRef<HTMLCanvasElement | null>(null);
  const glitch   = useRef(0);
  const shake    = useRef(0);
  const rimRef   = useRef<THREE.MeshStandardMaterial>(null);
  const [screenTex, setScreenTex] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const cvs = document.createElement("canvas");
    cvs.width = SW; cvs.height = SH;
    cvsRef.current = cvs;
    paintNormal(cvs.getContext("2d")!);
    const tex = new THREE.CanvasTexture(cvs);
    texRef.current = tex;
    setScreenTex(tex);
  }, []);

  useEffect(() => {
    if (burstTrigger === 0) return;
    glitch.current = 1.0;
    shake.current  = 0.24;
  }, [burstTrigger]);

  useFrame(({ clock }, dt) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Idle float
    groupRef.current.position.y = Math.sin(t * 0.62) * 0.05;

    // Shake on explosion
    if (shake.current > 0.002) {
      groupRef.current.position.x = shake.current * Math.sin(t * 38);
      shake.current *= 0.84;
    } else {
      groupRef.current.position.x = 0;
      shake.current = 0;
    }

    // Tilt: follows mouse when NOT orbiting; lerps to neutral when orbiting
    const [mx, my] = mouseRef.current;
    const targetX = orbitingRef.current ? 0 : my * -0.18;
    const targetY = orbitingRef.current ? 0 : mx * 0.26;
    groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.055;
    groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.055;

    // Rim pulse
    if (rimRef.current) {
      rimRef.current.emissiveIntensity = 0.06 + Math.sin(t * 1.4) * 0.02;
    }

    // Glitch screen update
    if (glitch.current > 0 && cvsRef.current && texRef.current) {
      glitch.current -= dt * 2.8;
      const ctx = cvsRef.current.getContext("2d");
      if (ctx) {
        if (glitch.current > 0) paintGlitch(ctx, glitch.current);
        else paintNormal(ctx);
        texRef.current.needsUpdate = true;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.25, 0]} onDoubleClick={onDoubleClick}>

      {/* ── Body ── */}
      <RoundedBox args={[2.6, 1.95, 0.42]} radius={0.055} smoothness={4}>
        <meshStandardMaterial color="#14102a" roughness={0.38} metalness={0.6} />
      </RoundedBox>

      {/* Rim glow — back-face overlay */}
      <RoundedBox args={[2.64, 1.99, 0.45]} radius={0.06} smoothness={4}>
        <meshStandardMaterial
          ref={rimRef}
          color="#b450ff"
          emissive="#b450ff"
          emissiveIntensity={0.06}
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </RoundedBox>

      {/* ── Screen bezel ── */}
      <mesh position={[0, 0.05, 0.214]}>
        <boxGeometry args={[2.22, 1.56, 0.005]} />
        <meshStandardMaterial color="#09060f" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* ── Screen ── */}
      {screenTex && (
        <mesh position={[0, 0.05, 0.22]}>
          <planeGeometry args={[2.08, 1.46]} />
          <meshBasicMaterial map={screenTex} />
        </mesh>
      )}

      {/* Screen CRT gloss (slight reflection) */}
      <mesh position={[0, 0.05, 0.225]}>
        <planeGeometry args={[2.08, 1.46]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.03}
          roughness={0}
          metalness={1}
        />
      </mesh>

      {/* ── Antenna left ── */}
      <group position={[-0.52, 0.975, 0]} rotation={[0, 0, -0.38]}>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.84, 6]} />
          <meshStandardMaterial color="#221d38" metalness={0.88} roughness={0.22} />
        </mesh>
        {/* Tip sphere — orange glow */}
        <mesh position={[0, 0.84, 0]}>
          <sphereGeometry args={[0.036, 7, 7]} />
          <meshStandardMaterial color="#ff6a00" emissive="#ff4400" emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* ── Antenna right ── */}
      <group position={[0.52, 0.975, 0]} rotation={[0, 0, 0.38]}>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.84, 6]} />
          <meshStandardMaterial color="#221d38" metalness={0.88} roughness={0.22} />
        </mesh>
        {/* Tip sphere — purple glow */}
        <mesh position={[0, 0.84, 0]}>
          <sphereGeometry args={[0.036, 7, 7]} />
          <meshStandardMaterial color="#b450ff" emissive="#9030ee" emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* ── Legs ── */}
      <mesh position={[-0.68, -1.09, 0.04]}>
        <cylinderGeometry args={[0.055, 0.085, 0.24, 7]} />
        <meshStandardMaterial color="#0c0a1a" metalness={0.92} roughness={0.18} />
      </mesh>
      <mesh position={[0.68, -1.09, 0.04]}>
        <cylinderGeometry args={[0.055, 0.085, 0.24, 7]} />
        <meshStandardMaterial color="#0c0a1a" metalness={0.92} roughness={0.18} />
      </mesh>

      {/* ── Speaker grille (right side) ── */}
      {([-0.1, 0, 0.1] as const).map((oy, k) => (
        <mesh key={k} position={[1.32, oy, 0.1]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.024, 0.024, 0.06, 6]} />
          <meshStandardMaterial color="#07050f" roughness={0.95} />
        </mesh>
      ))}

      {/* ── Control knob (right side) ── */}
      <mesh position={[1.3, -0.38, 0.15]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.052, 0.052, 0.05, 10]} />
        <meshStandardMaterial color="#1a1630" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[1.3, -0.52, 0.15]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.038, 0.038, 0.05, 10]} />
        <meshStandardMaterial color="#1a1630" metalness={0.7} roughness={0.3} />
      </mesh>

    </group>
  );
}

// ── FBM shader (website view background) ──────────────────────────────────

const VERT_WEB = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;

const FRAG_WEB = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uGlitch;

  float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p) {
    vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }
  float fbm(vec2 p) {
    float v=0.0,a=0.5;
    for(int i=0;i<6;i++){v+=a*noise(p);p=p*2.1+vec2(1.7,9.2);a*=0.5;}
    return v;
  }
  void main() {
    vec2 uv = vUv;
    float t  = uTime * 0.22;

    // Mouse ripple
    vec2 m01 = uMouse*0.5+0.5;
    vec2 toM = uv - m01;
    uv += normalize(toM+0.001)*exp(-length(toM)*2.8)*0.07;

    // Glitch bands
    if(uGlitch>0.0){
      float by=floor(uv.y*18.0)/18.0;
      uv.x += (hash(vec2(by,floor(uTime*40.0)))-0.5)*uGlitch*0.18;
      uv.y += sin(uv.y*30.0+uTime*12.0)*uGlitch*0.012;
    }

    float n =fbm(uv*3.2+vec2(t*.5,t));
    float n2=fbm(uv*2.0-vec2(t*.3,t*.8)+n*.5);
    float n3=fbm(uv*5.0+vec2(t*.8,-t*.4)+n2*.3);

    vec3 cD=vec3(.03,.01,.10),cB=vec3(.02,.04,.88),cM=vec3(.94,.0,.55),cP=vec3(1.,.4,.9);
    vec3 col=mix(cD,cB,n2); col=mix(col,cM,n*.68);
    col+=cP*smoothstep(.52,.80,n2)*.55+cP*smoothstep(.60,.90,n3)*.22;

    // RGB glitch split
    if(uGlitch>0.02){
      float sh=(hash(vec2(floor(uv.y*14.),floor(uTime*25.)))-.5)*uGlitch*.06;
      col.r=mix(col.r,mix(cD.r,cM.r,fbm((uv+vec2(sh,0.))*3.2+vec2(t*.5,t))*.68),uGlitch*.7);
      col.b=mix(col.b,mix(cD.b,cB.b,fbm((uv-vec2(sh,0.))*3.2+vec2(t*.5,t))),uGlitch*.7);
    }

    vec2 vig=uv*(1.0-uv); col*=pow(vig.x*vig.y*13.0,0.18);
    gl_FragColor=vec4(col,1.0);
  }
`;

interface WebPlaneProps {
  mouseRef:  React.MutableRefObject<[number, number]>;
  glitchRef: React.MutableRefObject<number>;
}

function WebShaderPlane({ mouseRef, glitchRef }: WebPlaneProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }, dt) => {
    const mat = matRef.current; if (!mat) return;
    mat.uniforms.uTime.value = clock.getElapsedTime();
    const [mx, my] = mouseRef.current;
    const u = mat.uniforms.uMouse.value as THREE.Vector2;
    u.x += (mx - u.x) * 0.07; u.y += (-my - u.y) * 0.07;
    if (glitchRef.current > 0) {
      glitchRef.current -= dt * 3.2;
      mat.uniforms.uGlitch.value = Math.max(0, glitchRef.current);
    } else { mat.uniforms.uGlitch.value = 0; }
  });
  return (
    <mesh>
      <planeGeometry args={[4, 3]} />
      <shaderMaterial ref={matRef} vertexShader={VERT_WEB} fragmentShader={FRAG_WEB}
        uniforms={{ uTime:{value:0}, uMouse:{value:new THREE.Vector2()}, uGlitch:{value:0} }} />
    </mesh>
  );
}

// Work cards (website view)
function WorkCard({ title, tag, accent }: { title: string; tag: string; accent: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="rounded-md overflow-hidden cursor-pointer transition-all duration-200"
      style={{
        background: hov ? `${accent}18` : "rgba(255,255,255,0.04)",
        border: `1px solid ${hov ? accent + "55" : "rgba(255,255,255,0.08)"}`,
        transform: hov ? "scale(1.04)" : "scale(1)",
        boxShadow: hov ? `0 0 14px ${accent}30` : "none",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div className="h-[46px] flex flex-col justify-between p-2">
        <div className="w-3 h-3 rounded-sm" style={{ background: `${accent}44` }} />
        <div>
          <p className="text-[9px] font-mono leading-tight"
            style={{ color: hov ? "#fff" : "rgba(255,255,255,0.55)" }}>{title}</p>
          <p className="text-[8px] font-mono" style={{ color: `${accent}88` }}>{tag}</p>
        </div>
      </div>
    </div>
  );
}

const WORK_CARDS = [
  { title: "makata.tv",    tag: "R3F · GLSL",        accent: "#ec4899" },
  { title: "Brand System", tag: "Motion · Identity",  accent: "#a855f7" },
  { title: "3D Showreel",  tag: "Three.js · GSAP",    accent: "#3b82f6" },
  { title: "Web App",      tag: "Next.js · API",      accent: "#10b981" },
];

// ── Camera default state ───────────────────────────────────────────────────

type Phase = "tv" | "web";

const CAM_DEFAULT  = new THREE.Vector3(0, 0, 5.2);
const CAM_TARGET   = new THREE.Vector3(0, 0.25, 0);
const IDLE_TIMEOUT = 3.5; // seconds before auto-reset

type OCtrl = { enabled: boolean; target: THREE.Vector3; update(): void };

// ── Scene ──────────────────────────────────────────────────────────────────

interface SceneProps {
  mouseRef:  React.MutableRefObject<[number, number]>;
  phaseRef:  React.MutableRefObject<Phase>;
}

function Scene({ mouseRef, phaseRef }: SceneProps) {
  const [burstTrigger, setBurstTrigger] = useState(0);
  const ctrlRef  = useRef<any>(null);
  const orbiting = useRef(false);
  const idle     = useRef(0);

  useFrame(({ camera }, dt) => {
    // reset idle while in web phase so auto-reset doesn't fire on return
    if (phaseRef.current !== "tv") { idle.current = 0; return; }
    if (orbiting.current) return;
    idle.current += dt;

    if (idle.current > IDLE_TIMEOUT && ctrlRef.current) {
      ctrlRef.current.enabled = false;
      camera.position.lerp(CAM_DEFAULT, 0.055);
      ctrlRef.current.target.lerp(CAM_TARGET, 0.055);
      ctrlRef.current.update();

      if (camera.position.distanceTo(CAM_DEFAULT) < 0.018) {
        camera.position.copy(CAM_DEFAULT);
        ctrlRef.current.target.copy(CAM_TARGET);
        ctrlRef.current.update();
        ctrlRef.current.enabled = true;
        idle.current = 0;
      }
    }
  });

  return (
    <>
      <OrbitControls
        ref={ctrlRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.09}
        minDistance={2.8}
        maxDistance={9}
        maxPolarAngle={Math.PI * 0.82}
        onStart={() => { orbiting.current = true;  idle.current = 0; }}
        onEnd={()   => { orbiting.current = false; idle.current = 0; }}
      />
      <ambientLight intensity={0.52} />
      <pointLight position={[0, 0.5, 4.5]} intensity={2.4} color="#ffffff" />
      <pointLight position={[-2.5, 1.5, 2.5]} intensity={0.55} color="#c080ff" />
      <pointLight position={[2.5, -1, 3]} intensity={0.38} color="#ff7a1a" />
      <TV
        burstTrigger={burstTrigger}
        onDoubleClick={() => setBurstTrigger(v => v + 1)}
        mouseRef={mouseRef}
        orbitingRef={orbiting}
      />
      <Burst trigger={burstTrigger} />
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function MakatatvDemo() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const mouseRef   = useRef<[number, number]>([0, 0]);
  const glitchRef  = useRef(0);
  const phaseRef   = useRef<Phase>("tv");
  const [phase, setPhase] = useState<Phase>("tv");
  const [webMounted, setWebMounted] = useState(false);
  const [hint, setHint]   = useState(true);
  useAnimCanvas(canvasRef);

  const toWeb = () => {
    phaseRef.current = "web";
    setWebMounted(true);
    requestAnimationFrame(() => setPhase("web"));
  };
  const toTv = () => {
    phaseRef.current = "tv";
    setPhase("tv");
    setTimeout(() => setWebMounted(false), 550);
  };

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const stack = ["Next.js 14", "R3F", "GSAP", "Framer Motion", "TypeScript", "Vercel"];
  const facts = [
    { label: "Tipo",   value: "Agencia creativa" },
    { label: "Ciudad", value: "Medellín, CO"      },
    { label: "Año",    value: "2023 – 2025"       },
    { label: "Rol",    value: "Full-Stack Dev"     },
  ];

  const trackMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mouseRef.current = [
      (e.clientX - r.left) / r.width  * 2 - 1,
      (e.clientY - r.top)  / r.height * 2 - 1,
    ];
  };

  return (
    <div
      className="relative w-full h-full min-h-[320px] overflow-hidden bg-[#08061a]"
      onMouseMove={trackMouse}
      onMouseLeave={() => { mouseRef.current = [0, 0]; }}
    >
      {/* ══════════════ TV PHASE ══════════════ */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: phase === "tv" ? 1 : 0, pointerEvents: phase === "tv" ? "auto" : "none", zIndex: 1 }}
      >
        {/* Node-graph bg */}
        <canvas
          ref={canvasRef}
          width={800} height={500}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.75 }}
        />

        {/* R3F TV */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <Canvas
            camera={{ position: [0, 0, 5.2], fov: 40 }}
            gl={{ alpha: true, antialias: true }}
            style={{ background: "transparent" }}
          >
            <Scene mouseRef={mouseRef} phaseRef={phaseRef} />
          </Canvas>
        </div>

        {/* Orbit hint */}
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono px-3 py-1 rounded-full border transition-opacity duration-700 pointer-events-none"
          style={{
            opacity: hint ? 1 : 0, zIndex: 10,
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.28)",
          }}
        >
          arrastrar · zoom · doble click
        </div>

        {/* Bottom brand overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4" style={{ zIndex: 20, pointerEvents: "auto" }}>
          <div className="grid grid-cols-4 gap-x-3 mb-2">
            {facts.map(({ label, value }) => (
              <div key={label} className="flex flex-col">
                <span className="text-[8px] font-mono text-white/22 uppercase tracking-widest leading-tight">{label}</span>
                <span className="text-[10px] font-mono text-white/50 leading-tight">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mb-2.5">
            {stack.map(s => (
              <span key={s} className="text-[8px] font-mono px-1.5 py-0.5 rounded-full border"
                style={{ background:"rgba(180,80,255,0.08)", borderColor:"rgba(180,80,255,0.22)", color:"rgba(210,150,255,0.7)" }}>
                {s}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <a
              href="https://makata.tv" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 rounded-full transition-all"
              style={{ background:"rgba(160,60,255,0.18)", border:"1px solid rgba(180,80,255,0.40)", color:"#d080ff" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(160,60,255,0.28)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(160,60,255,0.18)")}
            >
              <ExternalLink size={9} /> Abrir makata.tv
            </a>

            {/* Switch to website view */}
            <button
              type="button"
              onClick={() => toWeb()}
              className="flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 rounded-full transition-all"
              style={{ background:"rgba(236,72,153,0.12)", border:"1px solid rgba(236,72,153,0.30)", color:"rgba(244,114,182,0.8)", cursor:"pointer", pointerEvents:"auto" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,72,153,0.22)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(236,72,153,0.12)")}
            >
              ↓ sitio web
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════ WEBSITE PHASE ══════════════ */}
      {webMounted && (
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: phase === "web" ? 1 : 0, pointerEvents: phase === "web" ? "auto" : "none",
          zIndex: 2, background: "#030109", cursor: "crosshair" }}
        onClick={() => { glitchRef.current = 1.0; }}
      >
        {/* FBM shader bg */}
        <div className="absolute inset-0">
          <Canvas
            camera={{ position: [0, 0, 1.52], fov: 60 }}
            gl={{ antialias: true }}
            style={{ background: "transparent" }}
          >
            <WebShaderPlane mouseRef={mouseRef} glitchRef={glitchRef} />
          </Canvas>
        </div>

        {/* Website UI overlay */}
        <div className="absolute inset-0 flex flex-col pointer-events-none" style={{ zIndex: 10 }}>

          {/* Nav */}
          <div className="flex items-center justify-between px-4 py-2 shrink-0 pointer-events-auto"
            style={{ background: "linear-gradient(180deg,rgba(3,1,9,.82) 0%,transparent 100%)" }}>
            {/* Back button embedded in nav */}
            <button
              type="button"
              className="flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1 rounded-full transition-all"
              style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.14)", color:"rgba(255,255,255,0.65)", cursor:"pointer" }}
              onClick={e => { e.stopPropagation(); toTv(); }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
            >
              ← TV
            </button>
            <span className="text-[11px] font-bold tracking-[0.22em] text-white/85">MAKATA</span>
            <div className="flex gap-4 text-[9px] font-mono text-white/30">
              <span>Work</span><span>About</span><span>Contact</span>
              <span className="text-pink-400/45">↗</span>
            </div>
          </div>

          {/* Hero */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-2">
            <div className="w-5 h-5 rounded-full mb-1"
              style={{ background:"radial-gradient(circle,rgba(240,0,140,.5) 0%,transparent 70%)", boxShadow:"0 0 14px rgba(240,0,140,.4)" }} />
            <h1 className="text-center font-black leading-[1.12] tracking-tight"
              style={{ fontSize:"clamp(22px,5vw,34px)", color:"#fff", textShadow:"0 0 40px rgba(240,0,140,.45)" }}>
              Creative<br />Development
            </h1>
            <h1 className="text-center font-black leading-[1.12] tracking-tight -mt-0.5"
              style={{ fontSize:"clamp(22px,5vw,34px)", color:"rgba(255,255,255,0.22)" }}>
              Studio.
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[9px] font-mono text-pink-400/50">Medellín, CO</span>
              <span className="w-1 h-1 rounded-full bg-white/15" />
              <span className="text-[9px] font-mono text-white/28">2023 – 2024</span>
            </div>
            <a
              href="https://makata.tv" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[9px] font-mono px-3 py-1.5 rounded-full mt-1 transition-all pointer-events-auto"
              style={{ background:"rgba(236,72,153,.15)", border:"1px solid rgba(236,72,153,.38)", color:"#f472b6" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,72,153,.25)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(236,72,153,.15)")}
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={8} /> makata.tv
            </a>
          </div>

          {/* Work grid */}
          <div className="shrink-0 px-5 pb-4 pointer-events-auto" onClick={e => e.stopPropagation()}>
            <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1.5">Selected Work</p>
            <div className="grid grid-cols-4 gap-1.5">
              {WORK_CARDS.map(w => <WorkCard key={w.title} {...w} />)}
            </div>
          </div>

          {/* Tech hint */}
          <div className="absolute bottom-2 right-4 text-[8px] font-mono text-white/18 pointer-events-none">
            click → glitch · hover → distort
          </div>
        </div>

      </div>
      )}
    </div>
  );
}
