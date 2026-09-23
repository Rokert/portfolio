"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Environment } from "@react-three/drei";
import * as THREE from "three";

// ─── WebGPU renderer ──────────────────────────────────────────────────────────

const WGSL_VERT = /* wgsl */ `
struct Uniforms {
  time: f32,
  aspect: f32,
  mouseX: f32,
  mouseY: f32,
}
@group(0) @binding(0) var<uniform> u: Uniforms;

struct Out {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
  @location(1) normal: vec3f,
}

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> Out {
  // Full-screen quad
  var positions = array<vec2f, 6>(
    vec2f(-1, -1), vec2f(1, -1), vec2f(-1, 1),
    vec2f(-1,  1), vec2f(1, -1), vec2f( 1, 1),
  );
  var out: Out;
  let p = positions[vi];
  out.pos = vec4f(p, 0.0, 1.0);
  out.uv = (p + 1.0) * 0.5;
  out.normal = vec3f(0.0, 0.0, 1.0);
  return out;
}`;

const WGSL_FRAG = /* wgsl */ `
struct Uniforms {
  time: f32,
  aspect: f32,
  mouseX: f32,
  mouseY: f32,
}
@group(0) @binding(0) var<uniform> u: Uniforms;

fn hash2(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
}

fn noise2(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let s = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash2(i), hash2(i + vec2f(1,0)), s.x),
    mix(hash2(i + vec2f(0,1)), hash2(i + vec2f(1,1)), s.x), s.y
  );
}

@fragment
fn fs(in: Out) -> @location(0) vec4f {
  let uv = in.uv;
  let t = u.time;
  let mx = u.mouseX * 0.5 + 0.5;
  let my = u.mouseY * 0.5 + 0.5;

  // Card rect (rotated slightly by mouse)
  let center = vec2f(0.5, 0.5);
  var p = uv - center;
  let rotX = (my - 0.5) * 0.4;
  let rotY = (mx - 0.5) * 0.6;
  p.x += rotY * (uv.y - 0.5);
  p.y += rotX * (uv.x - 0.5);
  p = p + center;

  let card = step(0.18, p.x) * step(p.x, 0.82) * step(0.08, p.y) * step(p.y, 0.92);

  // Hologram scanlines
  let scanline = sin(p.y * 80.0 + t * 4.0) * 0.03 + 0.97;

  // Fresnel-like edge glow
  let edge = smoothstep(0.18, 0.23, p.x) * smoothstep(0.82, 0.77, p.x)
           * smoothstep(0.08, 0.14, p.y) * smoothstep(0.92, 0.86, p.y);
  let fresnel = 1.0 - edge;

  // Grid pattern
  let gx = step(0.97, sin(p.x * 60.0));
  let gy = step(0.97, sin(p.y * 90.0));
  let grid = clamp(gx + gy, 0.0, 1.0) * 0.35;

  // Hologram noise flicker
  let flicker = noise2(vec2f(p.y * 8.0, t * 1.5)) * 0.08;

  // Color: deep purple → cyan tint on edges
  let holo = mix(vec3f(0.55, 0.0, 1.0), vec3f(0.0, 0.85, 1.0), fresnel * 0.5);
  let col = holo * (scanline + flicker) + vec3f(grid);

  // Rainbow sheen driven by mouse
  let rainbow = vec3f(
    sin(p.x * 6.28 + mx * 3.0 + t) * 0.5 + 0.5,
    sin(p.x * 6.28 + mx * 3.0 + t + 2.09) * 0.5 + 0.5,
    sin(p.x * 6.28 + mx * 3.0 + t + 4.19) * 0.5 + 0.5,
  ) * 0.18 * fresnel * edge;

  let alpha = card * (fresnel * 0.5 + 0.25 + grid * 0.4) * scanline;
  return vec4f(col + rainbow, alpha * 0.9);
}

struct Out {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
  @location(1) normal: vec3f,
}`;

async function initWebGPU(canvas: HTMLCanvasElement, mouseRef: React.MutableRefObject<[number, number]>) {
  const gpu = (navigator as unknown as { gpu?: GPU }).gpu;
  if (!gpu) throw new Error("WebGPU not supported");

  const adapter = await gpu.requestAdapter();
  if (!adapter) throw new Error("No adapter");
  const device = await adapter.requestDevice();

  const context = canvas.getContext("webgpu") as unknown as GPUCanvasContext | null;
  if (!context) throw new Error("No WebGPU context");

  const format = gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: "premultiplied" });

  const shader = device.createShaderModule({ code: WGSL_VERT + "\n" + WGSL_FRAG });

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: shader, entryPoint: "vs" },
    fragment: {
      module: shader,
      entryPoint: "fs",
      targets: [{
        format,
        blend: {
          color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha" },
          alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
        },
      }],
    },
    primitive: { topology: "triangle-list" },
  });

  const uniformBuffer = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  let start = performance.now();
  let raf: number;

  const frame = () => {
    const t = (performance.now() - start) / 1000;
    const [mx, my] = mouseRef.current;
    const uniforms = new Float32Array([t, canvas.width / canvas.height, mx, my]);
    device.queue.writeBuffer(uniformBuffer, 0, uniforms);

    const encoder = device.createCommandEncoder();
    const view = context.getCurrentTexture().createView();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view,
        clearValue: { r: 0.03, g: 0.03, b: 0.05, a: 1 },
        loadOp: "clear",
        storeOp: "store",
      }],
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(6);
    pass.end();
    device.queue.submit([encoder.finish()]);
    raf = requestAnimationFrame(frame);
  };
  frame();
  return () => cancelAnimationFrame(raf);
}

// ─── WebGL fallback (Three.js) ────────────────────────────────────────────────

const hologramVert = /* glsl */ `
  varying vec2 vUv; varying vec3 vNormal;
  uniform float uTime;
  void main() {
    vUv = uv; vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;
    pos.z += sin(pos.y * 8.0 + uTime * 2.0) * 0.004;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }`;

const hologramFrag = /* glsl */ `
  varying vec2 vUv; varying vec3 vNormal;
  uniform float uTime; uniform vec3 uColor; uniform vec2 uMouse;
  void main() {
    float scanline = sin(vUv.y * 120.0 + uTime * 3.0) * 0.04 + 0.96;
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0,0,1))), 2.0);
    float grid = step(0.97, sin(vUv.x * 40.0)) + step(0.97, sin(vUv.y * 60.0));
    grid = clamp(grid, 0.0, 1.0) * 0.3;
    vec3 rainbow = vec3(sin(vUv.x*6.28+uMouse.x*3.0+uTime)*0.5+0.5,
                        sin(vUv.x*6.28+uMouse.x*3.0+uTime+2.09)*0.5+0.5,
                        sin(vUv.x*6.28+uMouse.x*3.0+uTime+4.19)*0.5+0.5)*0.15*fresnel;
    float alpha = (fresnel * 0.6 + 0.2 + grid) * scanline;
    gl_FragColor = vec4(uColor*(0.8+fresnel*0.6)+rainbow, alpha*0.85);
  }`;

function HologramCardGL({ mouseRef }: { mouseRef: React.MutableRefObject<[number, number]> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }) => {
    if (!meshRef.current || !matRef.current) return;
    const t = clock.getElapsedTime();
    const [mx, my] = mouseRef.current;
    meshRef.current.rotation.y = mx * 0.6 + Math.sin(t * 0.4) * 0.1;
    meshRef.current.rotation.x = -my * 0.3;
    matRef.current.uniforms.uTime.value = t;
    matRef.current.uniforms.uMouse.value = new THREE.Vector2(mx, my);
  });
  return (
    <mesh ref={meshRef}>
      <RoundedBox args={[1.4, 2, 0.04]} radius={0.06} smoothness={4}>
        <shaderMaterial ref={matRef} vertexShader={hologramVert} fragmentShader={hologramFrag}
          uniforms={{ uTime: { value: 0 }, uColor: { value: new THREE.Color("#a855f7") }, uMouse: { value: new THREE.Vector2(0,0) } }}
          transparent side={THREE.DoubleSide} depthWrite={false} />
      </RoundedBox>
    </mesh>
  );
}

function Particles() {
  const count = 60;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { positions[i*3]=(Math.random()-0.5)*4; positions[i*3+1]=(Math.random()-0.5)*4; positions[i*3+2]=(Math.random()-0.5)*2; }
  const ref = useRef<THREE.Points>(null);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.getElapsedTime()*0.04; });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute args={[positions,3]} attach="attributes-position" /></bufferGeometry>
      <pointsMaterial color="#a855f7" size={0.015} transparent opacity={0.5} />
    </points>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TroveDemo() {
  const [gpuMode, setGpuMode] = useState<"checking" | "webgpu" | "webgl">("checking");
  const gpuCanvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<[number, number]>([0, 0]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasGPU = !!(navigator as unknown as { gpu?: GPU }).gpu;
    if (!hasGPU) { setGpuMode("webgl"); return; }

    let cleanup: (() => void) | undefined;
    initWebGPU(gpuCanvasRef.current!, mouseRef)
      .then((fn) => { cleanup = fn; setGpuMode("webgpu"); })
      .catch(() => setGpuMode("webgl"));

    return () => cleanup?.();
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = [
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    ];
  };

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} className="relative w-full h-full min-h-[300px]">
      {/* Badge */}
      <div className={`absolute top-3 right-3 z-10 flex items-center gap-1.5 text-[9px] font-mono px-2 py-1 rounded-full border ${
        gpuMode === "webgpu"
          ? "bg-violet-500/15 border-violet-500/30 text-violet-300"
          : gpuMode === "webgl"
          ? "bg-white/5 border-white/10 text-white/40"
          : "bg-white/5 border-white/10 text-white/20"
      }`}>
        <div className={`w-1 h-1 rounded-full ${gpuMode === "webgpu" ? "bg-violet-400 animate-pulse" : gpuMode === "webgl" ? "bg-white/30" : "bg-white/20"}`} />
        {gpuMode === "checking" ? "Detectando GPU…" : gpuMode === "webgpu" ? "WebGPU nativo" : "WebGL fallback"}
      </div>

      {/* WebGPU canvas */}
      <canvas
        ref={gpuCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: gpuMode === "webgpu" ? "block" : "none" }}
      />

      {/* WebGL fallback */}
      {gpuMode === "webgl" && (
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[2,2,2]} intensity={0.8} color="#a855f7" />
          <pointLight position={[-2,-1,1]} intensity={0.4} color="#06b6d4" />
          <Environment preset="night" />
          <HologramCardGL mouseRef={mouseRef} />
          <Particles />
        </Canvas>
      )}

      {gpuMode === "checking" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-5 h-5 rounded-full border-2 border-violet-500/40 border-t-violet-500 animate-spin" />
        </div>
      )}

      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/20 whitespace-nowrap">
        TROVE · mueve el cursor · {gpuMode === "webgpu" ? "WGSL shader" : "GLSL shader"}
      </p>
    </div>
  );
}
