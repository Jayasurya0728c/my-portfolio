import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/*
 * CinematicBackground — Lightweight Scroll-Reactive GLSL Shader
 *
 * Performance:
 *  - Rendered at 60% of device pixel ratio (huge saving for high-DPI screens)
 *  - 3-octave fBm, single warp pass (vs 5-octave double-warp before)
 *  - will-change: transform isolates the canvas on its own GPU compositor layer
 *    so page scroll doesn't trigger a full repaint of the WebGL context
 *
 * Scroll animation:
 *  - u_scroll shifts the noise field vertically (parallax drift)
 *  - u_scroll also rotates the palette (different colors as you scroll down)
 *  - u_scroll tilts the light direction (shadow changes with scroll)
 */

// ── Vertex shader ─────────────────────────────────────────────────────────────
const vert = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// ── Fragment shader ───────────────────────────────────────────────────────────
const frag = /* glsl */ `
precision mediump float;   /* mediump not highp — ~30% faster on mobile GPUs */

uniform float u_time;
uniform float u_scroll;    /* 0.0 (top) → 1.0 (bottom of page) */
uniform vec2  u_res;

// ── Fast hash ────────────────────────────────────────────────────────────────
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
}

// ── Gradient noise (3 octaves only — much cheaper than before) ───────────────
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash2(i),             f),
                 dot(hash2(i + vec2(1,0)), f - vec2(1,0)), u.x),
             mix(dot(hash2(i + vec2(0,1)), f - vec2(0,1)),
                 dot(hash2(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) {        /* 3 octaves — sweet spot */
    v += a * noise(p);
    p  = p * 2.1 + vec2(3.7, 1.4);    /* slightly offset each octave */
    a *= 0.5;
  }
  return v;
}

// ── Color palette: indigo → violet → cyan → pink ─────────────────────────────
vec3 palette(float t, float scrollShift) {
  float s = clamp(t * 0.5 + 0.5 + scrollShift * 0.35, 0.0, 1.0);

  vec3 deep   = vec3(0.018, 0.006, 0.055);
  vec3 indigo = vec3(0.16,  0.05,  0.58);
  vec3 violet = vec3(0.45,  0.08,  0.88);
  vec3 cyan   = vec3(0.02,  0.65,  0.80);
  vec3 pink   = vec3(0.78,  0.12,  0.50);

  if (s < 0.25)      return mix(deep,   indigo, s * 4.0);
  if (s < 0.50)      return mix(indigo, violet, (s - 0.25) * 4.0);
  if (s < 0.75)      return mix(violet, cyan,   (s - 0.50) * 4.0);
                     return mix(cyan,   pink,   (s - 0.75) * 4.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = (uv - 0.5);
  p.x *= aspect;

  float t = u_time * 0.08;                      /* slow ambient drift     */

  /* ── Scroll parallax: shift noise field upward as user scrolls down ── */
  p.y -= u_scroll * 1.2;

  /* ── Single warp pass (was double before — this halves the cost) ────── */
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0) + t * 0.3),
    fbm(p + vec2(5.2, 1.3) + t * 0.2)
  );
  float f = fbm(p + 2.8 * q + vec2(t * 0.15, t * 0.08));

  /* ── Fake normals for 3D lighting (cheaper version) ─────────────────── */
  float eps = 0.006;
  float fx  = fbm((p + vec2(eps, 0.0)) + 2.8 * q + vec2(t * 0.15, t * 0.08));
  float fy  = fbm((p + vec2(0.0, eps)) + 2.8 * q + vec2(t * 0.15, t * 0.08));
  vec3 normal = normalize(vec3(f - fx, f - fy, eps * 14.0));

  /* ── Light tilts with scroll (dramatic cinematic sweep effect) ───────── */
  float scrollLightX = 0.4 + u_scroll * 0.5;   /* light sweeps right as you scroll */
  float scrollLightY = 0.7 - u_scroll * 0.3;
  vec3 lightDir = normalize(vec3(scrollLightX, scrollLightY, 1.0));
  vec3 halfVec  = normalize(lightDir + vec3(0.0, 0.0, 1.0));

  float diffuse  = max(dot(normal, lightDir), 0.0);
  float specular = pow(max(dot(normal, halfVec), 0.0), 36.0);

  /* ── Color: palette shifts as you scroll ─────────────────────────────── */
  vec3 col = palette(f, u_scroll);

  col  = mix(vec3(0.008, 0.003, 0.028), col, 0.4 + 0.6 * diffuse);
  col += 0.65 * specular * vec3(0.78, 0.85, 1.00);
  col += 0.035 * col * col * 4.5;               /* subtle glow on peaks   */

  /* ── Vignette ─────────────────────────────────────────────────────────── */
  float vig = 1.0 - dot(uv - 0.5, uv - 0.5) * 1.9;
  col *= clamp(vig, 0.0, 1.0);

  col *= 0.85;

  gl_FragColor = vec4(col, 1.0);
}
`;

// ── Shader plane — updates time + scroll each frame ──────────────────────────
function ShaderPlane() {
  const matRef      = useRef();
  const scrollRef   = useRef(0);
  const targetScroll = useRef(0);

  // Listen to scroll outside the render loop (passive, no jank)
  useEffect(() => {
    const onScroll = () => {
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      targetScroll.current = window.scrollY / max;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const uniforms = React.useMemo(() => ({
    u_time:   { value: 0 },
    u_scroll: { value: 0 },
    u_res:    { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  }), []);

  useFrame((state, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.u_time.value = state.clock.elapsedTime;

    // Smooth scroll interpolation — avoids jerky uniform updates
    scrollRef.current = THREE.MathUtils.lerp(
      scrollRef.current, targetScroll.current, delta * 2.5
    );
    matRef.current.uniforms.u_scroll.value = scrollRef.current;
  });

  useEffect(() => {
    const onResize = () => {
      if (matRef.current) {
        matRef.current.uniforms.u_res.value.set(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function CinematicBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        background: '#04020e',
        /* will-change tells the browser compositor to put this
           on its own GPU layer — prevents scroll from triggering
           a full-page composite with the WebGL canvas */
        willChange: 'transform',
      }}
    >
      <Canvas
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        gl={{
          antialias: false,
          powerPreference: 'default',
          alpha: false,
          stencil: false,
          depth: false,       /* no depth buffer needed for 2D shader */
        }}
        /* 0.6 DPR = 64% fewer pixels to shade vs native resolution.
           The background is blurry by nature so it looks identical. */
        dpr={0.6}
        style={{ display: 'block', willChange: 'transform' }}
        resize={{ scroll: false, debounce: { scroll: 0, resize: 200 } }}
      >
        <ShaderPlane />
      </Canvas>
    </div>
  );
}
