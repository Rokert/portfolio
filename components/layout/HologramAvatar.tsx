"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import {
  Fn,
  instanceIndex,
  instancedArray,
  storage,
  uniform,
  time,
  mx_noise_vec3,
  length,
  smoothstep,
  normalize,
  mix,
  vec2,
  vec3,
  float,
} from "three/tsl";

const AVATAR_SRC = "/avatar.png";
const MAX_PARTICLES = 16000;
const ALPHA_THRESHOLD = 40;
const SHAPE_SCALE = 1.2;
const PARTICLE_SIZE = 0.004;
const PARTICLE_COLOR = "#9a9a9a";

interface ParticleData {
  positions: Float32Array;
  /** 0 = deep in the silhouette, 1 = right at the boundary — used to fade/scatter edges. */
  edgeFactors: Float32Array;
  count: number;
}

const EDGE_RADIUS = 3;

function edgeScoreAt(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number
): number {
  let total = 0;
  let inside = 0;
  for (let dy = -EDGE_RADIUS; dy <= EDGE_RADIUS; dy++) {
    for (let dx = -EDGE_RADIUS; dx <= EDGE_RADIUS; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      total++;
      if (data[(ny * width + nx) * 4 + 3] > ALPHA_THRESHOLD) inside++;
    }
  }
  return total === 0 ? 1 : 1 - inside / total;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Samples the avatar photo's alpha mask (never the photo's actual colors)
 * into a flat list of normalized target positions — one per particle.
 */
async function buildTargetPositions(): Promise<ParticleData> {
  const img = await loadImage(AVATAR_SRC);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const aspect = width / height;

  // Luminance-weighted stippling: brighter areas of the photo (forehead,
  // cheekbones, highlights) get denser particles, darker areas sparser —
  // like a black-and-white stippled portrait, so the dot pattern itself
  // carries the person's actual features instead of a flat silhouette.
  //
  // Raw photo luminance is fairly flat, so it's smoothed (removes
  // skin-texture/compression grain) then contrast-boosted (spreads values
  // away from the midpoint, so highlight/shadow areas actually read as
  // different densities instead of a uniform blob) before use as weight.
  const luminance = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      luminance[y * width + x] =
        (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255;
    }
  }

  const SMOOTH_RADIUS = 1;
  const smoothed = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -SMOOTH_RADIUS; dy <= SMOOTH_RADIUS; dy++) {
        for (let dx = -SMOOTH_RADIUS; dx <= SMOOTH_RADIUS; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          sum += luminance[ny * width + nx];
          n++;
        }
      }
      smoothed[y * width + x] = sum / n;
    }
  }

  const CONTRAST = 0.6;
  const LUMINANCE_FLOOR = 0.08;
  const contrast = (l: number) => Math.min(1, Math.max(0, (l - 0.5) * (1 + CONTRAST) + 0.5));

  const valid: { x: number; y: number; weight: number }[] = [];
  let weightSum = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] <= ALPHA_THRESHOLD) continue;
      const weight = Math.max(contrast(smoothed[y * width + x]), LUMINANCE_FLOOR);
      valid.push({ x, y, weight });
      weightSum += weight;
    }
  }

  const scale = MAX_PARTICLES / weightSum;

  const positions: number[] = [];
  const edgeFactors: number[] = [];
  for (const p of valid) {
    if (Math.random() > Math.min(1, p.weight * scale)) continue;

    const nx = (p.x / width - 0.5) * 2 * aspect * SHAPE_SCALE;
    const ny = -(p.y / height - 0.5) * 2 * SHAPE_SCALE;
    positions.push(nx, ny, (Math.random() - 0.5) * 0.02);
    edgeFactors.push(edgeScoreAt(data, width, height, p.x, p.y));
  }

  return {
    positions: new Float32Array(positions),
    edgeFactors: new Float32Array(edgeFactors),
    count: positions.length / 3,
  };
}

function HologramPoints({ positions, edgeFactors, count }: ParticleData) {
  const { gl, viewport } = useThree();
  const initialized = useRef(false);
  const mouseNdc = useRef({ x: 10, y: 10 });

  // The canvas is pointer-events-none (it sits decoratively behind clickable
  // content), so it never receives its own pointer events — track the
  // cursor globally instead and convert to NDC relative to the canvas rect.
  useEffect(() => {
    const canvasEl = gl.domElement;
    const handleMove = (e: PointerEvent) => {
      const rect = canvasEl.getBoundingClientRect();
      mouseNdc.current = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -(((e.clientY - rect.top) / rect.height) * 2 - 1),
      };
    };
    const handleLeave = () => {
      mouseNdc.current = { x: 10, y: 10 };
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerleave", handleLeave);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
    };
  }, [gl]);

  const { points, initCompute, updateCompute, mouseUniform } = useMemo(() => {
    const targetAttribute = new THREE.StorageInstancedBufferAttribute(positions, 3);
    const targetBuffer = storage(targetAttribute, "vec3", count);
    const edgeAttribute = new THREE.StorageInstancedBufferAttribute(edgeFactors, 1);
    const edgeBuffer = storage(edgeAttribute, "float", count);
    const currentBuffer = instancedArray(count, "vec3");
    const mouse = uniform(new THREE.Vector2(10, 10));

    const initCompute = Fn(() => {
      const current = currentBuffer.element(instanceIndex);
      const target = targetBuffer.element(instanceIndex);
      current.assign(target);
    })().compute(count);

    const update = Fn(() => {
      const current = currentBuffer.element(instanceIndex);
      const target = targetBuffer.element(instanceIndex);
      const edge = edgeBuffer.element(instanceIndex);

      // Square the edge factor so only the true boundary (edge close to 1)
      // gets noticeable wobble/fade — the interior stays crisp and stable
      // instead of the whole silhouette shimmering.
      const edgeSharp = edge.mul(edge);
      const wobbleAmount = float(0.004).add(edgeSharp.mul(0.035));
      const wobble = mx_noise_vec3(target.add(time.mul(0.15))).mul(wobbleAmount);
      const idleTarget = target.add(wobble);

      const toMouse = current.xy.sub(mouse);
      const dist = length(toMouse);
      const repulsion = smoothstep(float(0.0), float(0.35), dist).oneMinus();
      const pushDir = normalize(toMouse.add(vec2(0.0001, 0.0001)));
      const scattered = current.xy.add(pushDir.mul(repulsion).mul(0.6));

      const frameTargetXY = mix(idleTarget.xy, scattered, repulsion);
      const frameTarget = vec3(frameTargetXY.x, frameTargetXY.y, idleTarget.z);

      current.assign(mix(current, frameTarget, float(0.08)));
    })().compute(count);

    // A tiny quad per particle — SpriteNodeMaterial billboards it to face the
    // camera automatically. Sized directly in the geometry since sprites are
    // scaled via the mesh/instance transform, which we leave at identity.
    const geometry = new THREE.PlaneGeometry(PARTICLE_SIZE, PARTICLE_SIZE);

    const material = new THREE.SpriteNodeMaterial();
    material.positionNode = currentBuffer.toAttribute();
    material.color = new THREE.Color(PARTICLE_COLOR);
    // Fade opacity toward the silhouette edge so it blends into the
    // background instead of a hard cutoff — squared so only the true
    // boundary fades, keeping the interior solid and orderly.
    const edgeAttrSharp = edgeBuffer.toAttribute().mul(edgeBuffer.toAttribute());
    material.opacityNode = mix(float(0.8), float(0.1), edgeAttrSharp);
    material.transparent = true;
    material.blending = THREE.AdditiveBlending;
    material.depthWrite = false;

    const pointsObject = new THREE.InstancedMesh(geometry, material, count);
    return { points: pointsObject, initCompute, updateCompute: update, mouseUniform: mouse };
  }, [positions, edgeFactors, count]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const renderer = gl as unknown as InstanceType<typeof THREE.WebGPURenderer>;
    renderer.computeAsync(initCompute);
  }, [gl, initCompute]);

  useFrame((state) => {
    mouseUniform.value.set(
      (mouseNdc.current.x * viewport.width) / 2,
      (mouseNdc.current.y * viewport.height) / 2
    );
    const renderer = state.gl as unknown as InstanceType<typeof THREE.WebGPURenderer>;
    renderer.computeAsync(updateCompute);
  });

  return <primitive object={points} />;
}

export function HologramAvatar({ className }: { className?: string }) {
  const [data, setData] = useState<ParticleData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    buildTargetPositions()
      .then((result) => {
        if (cancelled) return;
        console.info(`[HologramAvatar] sampled ${result.count} particles from ${AVATAR_SRC}`);
        setData(result);
      })
      .catch((err) => {
        console.error("[HologramAvatar] failed to build particle positions", err);
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      return (
        <div className={`${className ?? ""} pointer-events-none`}>
          <p className="absolute bottom-2 left-2 text-[10px] font-mono text-red-500/70">
            HologramAvatar error: {error}
          </p>
        </div>
      );
    }
    return null;
  }

  if (!data) return null;

  return (
    <div className={`${className ?? ""} pointer-events-none`}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={async (props) => {
          try {
            const renderer = new THREE.WebGPURenderer({
              canvas: props.canvas as HTMLCanvasElement,
              alpha: true,
              antialias: true,
            });
            await renderer.init();
            console.info(
              "[HologramAvatar] renderer initialized, backend:",
              renderer.backend?.constructor?.name
            );
            return renderer;
          } catch (err) {
            console.error("[HologramAvatar] renderer init failed", err);
            throw err;
          }
        }}
        onCreated={() => console.info("[HologramAvatar] Canvas onCreated fired")}
      >
        <HologramPoints
          positions={data.positions}
          edgeFactors={data.edgeFactors}
          count={data.count}
        />
      </Canvas>
    </div>
  );
}
