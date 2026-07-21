# Animation Recipes for Video Clones

Proven Remotion/CSS patterns for the effects that appear in almost every motion-graphics or product-demo video. Copy-adapt; keep `extrapolateLeft/Right: 'clamp'` on every `interpolate`. All snippets assume `frame` is the scene-local frame.

## Contents

- [Helpers](#helpers)
- [Fades and scene transitions](#fades-and-scene-transitions)
- [Typewriter + caret](#typewriter--caret)
- [Per-letter blur/stagger reveal](#per-letter-blurstagger-reveal)
- [Gradient text: shimmer and sweep reveal](#gradient-text-shimmer-and-sweep-reveal)
- [Diagonal wipe reveal](#diagonal-wipe-reveal)
- [Draw-on strokes (underlines, arrows, connector lines)](#draw-on-strokes)
- [Spring pop entrance](#spring-pop-entrance)
- [Cursor and click](#cursor-and-click)
- [Card morph (shared element across stages)](#card-morph)
- [Camera zoom and push transition](#camera-zoom-and-push-transition)
- [Scrolling a tall panel](#scrolling-a-tall-panel)
- [Toggle switch](#toggle-switch)
- [Pixel-dissolve particles](#pixel-dissolve-particles)
- [Breathing spark spinner](#breathing-spark-spinner)

## Helpers

```ts
// helpers.ts
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOutCubic = (t: number) =>
  clamp01(t) < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const fadeInOut = (f: number, in0: number, in1: number, out0: number, out1: number) =>
  interpolate(f, [in0, in1, out0, out1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
```

## Fades and scene transitions

- Scene opacity: `fadeInOut(frame, 0, 12, N-14, N)`; overlap adjacent `<Sequence>`s by the fade length for a crossfade.
- Add a subtle settle on entrances: `transform: scale(${interpolate(op, [0,1],[0.985,1])})`.

## Typewriter + caret

```ts
const chars = Math.round(interpolate(frame, [START, END], [0, TEXT.length], {clamp...}));
const typed = TEXT.slice(0, chars);
// caret: blinks while idle (≈15 frames on/off at 30fps), solid while typing, hidden after send
const caretOn = frame < START ? Math.floor(frame / 15) % 2 === 0 : frame < SEND;
```

Caret as an inline block `4px × ~1.2em`, background = ink color, `backgroundColor: caretOn ? ink : 'transparent'` (keeps layout stable). Calibrate START/END by counting visible characters in a source frame at a known time. Placeholder text (gray) renders when `chars === 0`, replaced the moment typing starts.

## Per-letter blur/stagger reveal

```tsx
{TITLE.split('').map((ch, i) => {
  const start = BASE + i * 2.5;                       // stagger 2–3.5 frames/char
  const p = interpolate(frame, [start, start + 14], [0, 1], {clamp...});
  return <span key={i} style={{opacity: p, filter: `blur(${(1 - p) * 12}px)`, whiteSpace: 'pre'}}>{ch}</span>;
})}
```

Variant seen in many brand intros: letters appear pale gray first, then darken to ink — map `p` through gray at ~0.45 before reaching the ink color.

## Gradient text: shimmer and sweep reveal

Both use gradient-clipped text:

```tsx
<span style={{
  backgroundImage: `linear-gradient(100deg, ${dim} 0%, ${dim} ${pos - 22}%, ${bright} ${pos}%, ${dim} ${pos + 22}%, ${dim} 100%)`,
  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
}}>{word}</span>
```

- **Looping shimmer** (e.g. "Thinking"): `pos = ((frame % 45) / 45) * 160 - 30`.
- **One-shot reveal** (wordmark brightening left→right): `pos = reveal * 130 - 30` with `reveal` a clamped 0→1 interpolate; gradient from bright (revealed side) to dim.

## Diagonal wipe reveal

When the source shows the bottom/right end of a text block before its start, it's a masked diagonal wipe:

```tsx
const p = interpolate(frame, [0, 26], [-15, 115], {clamp...});
const mask = `linear-gradient(300deg, #000 ${p}%, transparent ${p + 12}%)`;
<div style={{WebkitMaskImage: mask, maskImage: mask}}>{textBlock}</div>
```

Tune the angle (300deg ≈ reveal from bottom-right toward top-left); pair with a small settling `translateX`.

## Draw-on strokes

Underlines, arrows, connector lines — SVG path + dash offset:

```tsx
<path d={WOBBLY_PATH} fill="none" stroke={accent} strokeWidth={11} strokeLinecap="round"
  strokeDasharray={LEN} strokeDashoffset={LEN * (1 - t)} />
```

`t` = eased 0→1. For hand-drawn feel give the path gentle C-curve wobble (±8px in y). Vertical connector lines are simpler as a div with animated `height`. Arrowheads: animate the head path's points along with `t` and fade it in.

## Spring pop entrance

```ts
const pop = spring({frame: frame - START, fps, config: {damping: 15, mass: 0.85, stiffness: 95}});
// scale(pop), optionally rotate(interpolate(pop, [0,1], [-160, 0]) + 'deg') for a spin-in
```

## Cursor and click

Arrow cursor as SVG (never crop it — it clips):

```tsx
<path d="M 3 2 L 3 34 L 11 26.5 L 16.2 38.5 L 22 36 L 16.8 24.3 L 27 24.3 Z"
  fill="#0b0b0b" stroke="#fff" strokeWidth={2.6} strokeLinejoin="round" />
```

Movement: two chained eased segments (enter from off-screen bottom-right → hover point → target). Click = scale dip `interpolate(frame, [c, c+3, c+6], [1, 0.85, 1])` with `transformOrigin` at the tip; dip the clicked button's scale to ~0.94 in sync. Keep `x/y` as the tip/fingertip coordinates. For a cropped hand-cursor PNG, put the scale transform on a wrapper div, not the `<Img>`.

## Card morph

One element persisting across stages (input box → big panel → input box): keep it in ONE component and lerp the rect between keyframe rects:

```ts
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const m1 = easeInOutCubic(interpolate(frame, [S1, E1], [0, 1], {clamp...}));
const m2 = easeInOutCubic(interpolate(frame, [S2, E2], [0, 1], {clamp...}));
const r = {
  x: lerp(lerp(A.x, B.x, m1), C.x, m2),
  // …same for y, w, h
};
```

Stage content (typed text, spinner tree, closing hero) fades out before/in after each morph; gate each stage's render on its opacity > 0 to avoid overdraw.

## Camera zoom and push transition

- **Zoom-out intro / push-in**: wrap the whole scene in `<div style={{transform: \`scale(${s})\`, transformOrigin: 'Xpx Ypx'}}>`. Choose the origin so the featured element stays put; verify with stills that world→screen positions match the source (screen = (world − origin) × s + origin).
- **Push transition** between scenes: outgoing scene `translateX(exit * -1.02 * width)`, incoming scene drifts in from +~300px; add `filter: blur(5px)` only while `0.02 < exit < 0.98` (motion-blur feel without blurring resting frames).

## Scrolling a tall panel

Build the panel at full content height (taller than the viewport) and animate its `top` from rest to `-(contentH - viewportH)` with easeInOut. Combine with a mild push-in scale (~1.25) during the scroll and pull back out at the end, origin at the panel's center.

## Toggle switch

Track div (color crossfades off→on at the click frame) + knob div with `left: pad + t * travel`, `t` eased over ~8 frames. Sync with a cursor click dip.

## Pixel-dissolve particles

Character/logo dissolving into drifting squares. Deterministic pseudo-random (NEVER `Math.random()` — breaks frame coherence):

```ts
const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
```

~30 squares: each born at `B + rnd(i,1)*18`, life = clamped 0→1 over ~22 frames, position = spawn region + `(dx, -dy) * life`, size 10–26px, mix of filled and outlined squares in 4–5 palette tints, opacity ramps 0→1→0. Fade the source image out during the particle burst.

## Breathing spark spinner

A "thinking" indicator that morphs between a dotted ring and a starburst while rotating: 12 SVG lines from radius `r1` to `r2` around a center, per-ray phase:

```ts
const angle = ((i * 30 + frame * 2.1) * Math.PI) / 180;
const g = 0.5 + 0.5 * Math.sin(frame * 0.24 + i * 0.85);
const r1 = size * (0.72 - 0.55 * g);   // g→1: rays reach inward (burst)
const r2 = size * (0.98 - 0.12 * (1 - g));
```

Stroke ~11px, round caps, accent color.
