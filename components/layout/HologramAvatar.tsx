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
  hash,
  select,
  clamp,
  texture,
  positionLocal,
  max,
} from "three/tsl";

const AVATAR_SRC = "/avatar.png";
const MAX_PARTICLES = 32000;
const ALPHA_THRESHOLD = 40;
// Uniform scale (never stretch X/Y independently — distorts the figure).
// Cropping against the panel edges comes from camera zoom/offset instead.
const SHAPE_SCALE = 1.55;
const PARTICLE_SIZE = 0.0032;
const PARTICLE_COLOR = "#9a9a9a";
// < 1 backs off from a full edge-to-edge cover fit — 1.0 read as too big.
const COVER_FIT_FACTOR = 0.9;
// Matches HeroFrame's `bottom-8` corner bracket inset, in CSS pixels.
const FRAME_CORNER_INSET_PX = 32;
// Fraction of particles that never move for hover OR the click/tap
// explosion (a stable per-particle coin flip) — keeps both effects from
// ever clearing out a clean hole. 0.7 = 70% stay put, 30% react.
const STAYS_PUT_THRESHOLD = 0.7;

interface ParticleData {
  positions: Float32Array;
  /** 0 = deep in the silhouette, 1 = right at the boundary — used to fade/scatter edges. */
  edgeFactors: Float32Array;
  count: number;
  /** Actual bounding half-extents of `positions`, for a cover-fit scale at render time. */
  boundsHalfWidth: number;
  boundsHalfHeight: number;
  /** Source photo's width/height, so the hover-reveal plane matches its proportions exactly. */
  aspect: number;
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

  const CONTRAST = 0.85;
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
  let boundsHalfWidth = 0;
  let boundsHalfHeight = 0;
  for (const p of valid) {
    if (Math.random() > Math.min(1, p.weight * scale)) continue;

    const nx = (p.x / width - 0.5) * 2 * aspect * SHAPE_SCALE;
    const ny = -(p.y / height - 0.5) * 2 * SHAPE_SCALE;
    positions.push(nx, ny, (Math.random() - 0.5) * 0.02);
    edgeFactors.push(edgeScoreAt(data, width, height, p.x, p.y));
    boundsHalfWidth = Math.max(boundsHalfWidth, Math.abs(nx));
    boundsHalfHeight = Math.max(boundsHalfHeight, Math.abs(ny));
  }

  return {
    positions: new Float32Array(positions),
    edgeFactors: new Float32Array(edgeFactors),
    count: positions.length / 3,
    boundsHalfWidth,
    boundsHalfHeight,
    aspect,
  };
}

function HologramPoints({
  positions,
  edgeFactors,
  count,
  boundsHalfWidth,
  boundsHalfHeight,
  aspect,
}: ParticleData) {
  const { gl, viewport, size } = useThree();
  const initialized = useRef(false);
  const mouseNdc = useRef({ x: 10, y: 10 });
  const frameSyncCounter = useRef(0);
  const loggedOnce = useRef(false);
  const explosionClickNdc = useRef<{ x: number; y: number } | null>(null);
  const explosionStartMs = useRef<number | null>(null);

  // The canvas is pointer-events-none (it sits decoratively behind clickable
  // content), so it never receives its own pointer events — track the
  // cursor globally instead and convert to NDC relative to the canvas rect.
  useEffect(() => {
    const canvasEl = gl.domElement;
    const ndcFromEvent = (e: PointerEvent) => {
      const rect = canvasEl.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -(((e.clientY - rect.top) / rect.height) * 2 - 1),
      };
    };
    const setFromEvent = (e: PointerEvent) => {
      mouseNdc.current = ndcFromEvent(e);
    };
    // A click/tap fires a one-off "explosion" impulse on top of the regular
    // hover dissolve, at the exact point touched, decaying over ~1s.
    const triggerExplosion = (e: PointerEvent) => {
      setFromEvent(e);
      explosionClickNdc.current = ndcFromEvent(e);
      explosionStartMs.current = performance.now();
    };
    const reset = () => {
      mouseNdc.current = { x: 10, y: 10 };
    };
    // pointermove/pointerdown cover both mouse hover and a mobile tap (a tap
    // fires pointerdown immediately, before any move); pointerup/pointercancel
    // reset it, so lifting the finger lets the shape reform, matching mouse
    // leaving the area on desktop.
    window.addEventListener("pointermove", setFromEvent);
    window.addEventListener("pointerdown", triggerExplosion);
    window.addEventListener("pointerup", reset);
    window.addEventListener("pointercancel", reset);
    window.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", setFromEvent);
      window.removeEventListener("pointerdown", triggerExplosion);
      window.removeEventListener("pointerup", reset);
      window.removeEventListener("pointercancel", reset);
      window.removeEventListener("pointerleave", reset);
    };
  }, [gl]);

  const { group, initCompute, updateCompute, mouseUniform, explosionUniform } = useMemo(() => {
    const targetAttribute = new THREE.StorageInstancedBufferAttribute(positions, 3);
    const targetBuffer = storage(targetAttribute, "vec3", count);
    const edgeAttribute = new THREE.StorageInstancedBufferAttribute(edgeFactors, 1);
    const edgeBuffer = storage(edgeAttribute, "float", count);
    const currentBuffer = instancedArray(count, "vec3");
    const mouse = uniform(new THREE.Vector2(10, 10));
    // xy = click/tap position (local space), z = seconds since it fired.
    const explosion = uniform(new THREE.Vector3(10, 10, 999));

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
      // Smaller radius + shorter push distance than before, so the cursor
      // leaves a soft dissolve instead of clearing out a hard empty hole.
      // On top of that, a stable per-particle coin flip (STAYS_PUT_THRESHOLD)
      // makes most particles ignore the mouse/explosion entirely, so even
      // right at the touch point most stay put — a partial reveal, never a
      // clean hole.
      const staysPut = hash(instanceIndex).greaterThan(float(STAYS_PUT_THRESHOLD));
      const repulsion = select(
        staysPut,
        float(0),
        smoothstep(float(0.0), float(0.22), dist).oneMinus()
      );
      const pushDir = normalize(toMouse.add(vec2(0.0001, 0.0001)));
      // A little per-particle noise on the push direction so particles don't
      // scatter in a perfectly clean radial ring — some drift stays behind.
      const jitter = mx_noise_vec3(target.mul(4.0).add(time.mul(0.3))).xy.mul(0.7);
      const pushDirJittered = normalize(pushDir.add(jitter));
      const scattered = current.xy.add(pushDirJittered.mul(repulsion).mul(0.28));

      const frameTargetXY = mix(idleTarget.xy, scattered, repulsion);

      // One-off "explosion" burst on click/tap: a strong outward kick right
      // at the touch point that decays over ~1s, layered on top of the
      // regular hover dissolve — then the usual per-frame ease (below)
      // brings it back to rest on its own, like it has a little life to it.
      const toExplosion = current.xy.sub(explosion.xy);
      const explosionFalloff = smoothstep(float(0.0), float(0.5), length(toExplosion)).oneMinus();
      const explosionDecay = clamp(float(1.0).sub(explosion.z), float(0.0), float(1.0));
      const explosionPush = select(
        staysPut,
        vec2(0, 0),
        normalize(toExplosion.add(vec2(0.0001, 0.0001)))
          .mul(explosionFalloff)
          .mul(explosionDecay)
          .mul(0.55)
      );
      const burstTargetXY = frameTargetXY.add(explosionPush);

      const frameTarget = vec3(burstTargetXY.x, burstTargetXY.y, idleTarget.z);

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

    // The real photo, hidden everywhere except a soft spot around the
    // cursor/explosion — same radius, falloff and decay math as the
    // particle dissolve above, so "what reveals" always matches "what
    // scatters". Sized to the photo's real aspect so it lines up exactly
    // with the particle cloud (both use the same SHAPE_SCALE mapping).
    const photoTexture = new THREE.TextureLoader().load(AVATAR_SRC);
    photoTexture.colorSpace = THREE.SRGBColorSpace;
    const photoGeometry = new THREE.PlaneGeometry(2 * aspect * SHAPE_SCALE, 2 * SHAPE_SCALE);
    const photoMaterial = new THREE.MeshBasicNodeMaterial();
    const photoTexNode = texture(photoTexture);
    photoMaterial.colorNode = photoTexNode.rgb;
    const revealMouse = smoothstep(float(0.22), float(0.0), length(positionLocal.xy.sub(mouse)));
    const revealExplosion = smoothstep(
      float(0.5),
      float(0.0),
      length(positionLocal.xy.sub(explosion.xy))
    ).mul(clamp(float(1.0).sub(explosion.z), float(0.0), float(1.0)));
    photoMaterial.opacityNode = photoTexNode.a.mul(max(revealMouse, revealExplosion));
    photoMaterial.transparent = true;
    photoMaterial.depthWrite = false;
    const photoMesh = new THREE.Mesh(photoGeometry, photoMaterial);
    // Sits just behind the particles' own small z-jitter range so it never
    // z-fights with them.
    photoMesh.position.z = -0.03;

    const group = new THREE.Group();
    group.add(photoMesh, pointsObject);

    return {
      group,
      initCompute,
      updateCompute: update,
      mouseUniform: mouse,
      explosionUniform: explosion,
    };
  }, [positions, edgeFactors, count, aspect]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const renderer = gl as unknown as InstanceType<typeof THREE.WebGPURenderer>;
    renderer.computeAsync(initCompute);
  }, [gl, initCompute]);

  useFrame((state) => {
    // "Contain", not "cover": pick whichever dimension is more restrictive
    // so the whole figure is always fully visible, never cropped on any
    // side, regardless of how narrow/wide the panel is (real bounding box
    // vs. the panel's actual world-space size, so it never drifts out of
    // sync on resize either).
    const coverScale =
      COVER_FIT_FACTOR *
      Math.min(viewport.width / (2 * boundsHalfWidth), viewport.height / (2 * boundsHalfHeight));
    group.scale.setScalar(coverScale);

    // Anchor the figure's bottom AND right edges exactly on the HeroFrame
    // corner brackets (bottom-8/right-8 → 32px insets), converting that CSS
    // pixel inset to world units via the actual px-per-world-unit ratio, so
    // it lines up at any viewport size — consistent on both edges instead
    // of the right edge landing wherever cover-fit's math happens to put it.
    const worldPerPixel = viewport.height / size.height;
    const insetWorld = FRAME_CORNER_INSET_PX * worldPerPixel;
    const desiredBottomWorld = -viewport.height / 2 + insetWorld;
    const figureBottomLocal = -boundsHalfHeight * coverScale;
    group.position.setY(desiredBottomWorld - figureBottomLocal);
    const desiredRightWorld = viewport.width / 2 - insetWorld;
    const figureRightLocal = boundsHalfWidth * coverScale;
    group.position.setX(desiredRightWorld - figureRightLocal);

    // Mouse position needs to be in the same pre-scale, pre-offset local
    // space that `current.xy` lives in inside the compute shader.
    mouseUniform.value.set(
      ((mouseNdc.current.x * viewport.width) / 2 - group.position.x) / coverScale,
      ((mouseNdc.current.y * viewport.height) / 2 - group.position.y) / coverScale
    );

    // Explosion burst: same NDC→local conversion, plus how many seconds
    // have elapsed since the click/tap that triggered it (the shader decays
    // it to nothing past ~1s; once it's fully decayed we stop updating it).
    if (explosionStartMs.current !== null && explosionClickNdc.current) {
      const ageSec = (performance.now() - explosionStartMs.current) / 1000;
      if (ageSec > 1.2) {
        explosionStartMs.current = null;
      } else {
        explosionUniform.value.set(
          ((explosionClickNdc.current.x * viewport.width) / 2 - group.position.x) / coverScale,
          ((explosionClickNdc.current.y * viewport.height) / 2 - group.position.y) / coverScale,
          ageSec
        );
      }
    }

    const renderer = state.gl as unknown as InstanceType<typeof THREE.WebGPURenderer>;
    renderer.computeAsync(updateCompute);

    // Publish the figure's real on-screen edges as CSS vars on the <section>
    // so HeroFrame's lines can be positioned exactly on them instead of
    // guessed percentages. getBoundingClientRect forces layout, so this is
    // throttled — the panel only actually moves on resize.
    frameSyncCounter.current += 1;
    if (frameSyncCounter.current % 20 === 0) {
      const halfW = boundsHalfWidth * coverScale;
      const halfH = boundsHalfHeight * coverScale;
      // 0..1 fraction of the canvas's own box (0 = left/bottom, 1 = right/top)
      const leftFrac = 0.5 + (group.position.x - halfW) / viewport.width;
      const rightFrac = 0.5 + (group.position.x + halfW) / viewport.width;
      const topFrac = 0.5 - (group.position.y + halfH) / viewport.height;
      const bottomFrac = 0.5 - (group.position.y - halfH) / viewport.height;

      const canvasEl = state.gl.domElement;
      const sectionEl = canvasEl.closest("section");
      if (sectionEl instanceof HTMLElement) {
        const canvasRect = canvasEl.getBoundingClientRect();
        const sectionRect = sectionEl.getBoundingClientRect();
        const toSectionPctX = (frac: number) =>
          (((canvasRect.left - sectionRect.left) + frac * canvasRect.width) / sectionRect.width) *
          100;
        const toSectionPctY = (frac: number) =>
          (((canvasRect.top - sectionRect.top) + frac * canvasRect.height) / sectionRect.height) *
          100;
        const leftPct = toSectionPctX(leftFrac);
        const rightPct = toSectionPctX(rightFrac);
        const topPct = toSectionPctY(topFrac);
        const bottomPct = toSectionPctY(bottomFrac);
        sectionEl.style.setProperty("--figure-left", `${leftPct.toFixed(2)}%`);
        sectionEl.style.setProperty("--figure-right", `${rightPct.toFixed(2)}%`);
        sectionEl.style.setProperty("--figure-top", `${topPct.toFixed(2)}%`);
        sectionEl.style.setProperty("--figure-bottom", `${bottomPct.toFixed(2)}%`);
        if (!loggedOnce.current) {
          loggedOnce.current = true;
          console.info("[HologramAvatar] figure bounds synced to <section>:", {
            leftPct,
            rightPct,
            topPct,
            bottomPct,
          });
        }
      } else if (!loggedOnce.current) {
        loggedOnce.current = true;
        console.warn("[HologramAvatar] no ancestor <section> found — frame lines won't sync");
      }
    }
  });

  return <primitive object={group} />;
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
          boundsHalfWidth={data.boundsHalfWidth}
          boundsHalfHeight={data.boundsHalfHeight}
          aspect={data.aspect}
        />
      </Canvas>
    </div>
  );
}
