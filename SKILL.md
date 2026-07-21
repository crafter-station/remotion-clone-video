---
name: remotion-clone-video
description: Pixel-perfect clone of any video (promo, product demo, motion-graphics piece, UI walkthrough) as a Remotion project, so the result is regenerable and editable as React code. Use when the user provides a video file and asks to clone, recreate, replicate, or rebuild it "as code", "with Remotion", or "pixel perfect". Covers ffmpeg frame extraction, storyboarding, exact color sampling, asset cropping with alpha, scene component construction, and iterative still-by-still verification against the source.
---

# Remotion Clone Video

Recreate a source video as a Remotion composition that matches it frame-for-frame. The core loop: extract frames → storyboard → sample exact values → build scenes as code → render stills → compare against originals → fix → full render.

**Golden rule: code-first, crop-last.** Everything that CAN be code (text, UI chrome, shapes, icons, cursors, lines, gradients, motion) MUST be code. Only crop raster assets from the source when they cannot be expressed as code (logos, mascots, photos, textures) - cropping from the video itself guarantees pixel fidelity.

## Ethics - "Good artists copy, great artists steal"

Steal the *craft*, not the *work*. Cloning is a powerful way to learn motion design and to iterate on one's own content - apply it with intellectual honesty:

- **Best cases**: the user cloning their own video to make it editable as code, rebuilding their own brand assets, studying techniques for learning, or prototyping in a style before creating something original.
- **Techniques are free; identity is not.** Easings, staggers, wipes, and layout rhythm are craft - internalize them. Logos, mascots, trademarks, soundtracks, and brand look-and-feel belong to their owners; assets cropped from someone else's video stay theirs no matter how the clone is built.
- **Never help pass off someone else's creative work as the user's own** or republish a clone of third-party content commercially. If the source clearly isn't the user's, note it and frame the output as a study/learning artifact.
- **Credit the source.** When the clone draws on someone else's design, say where the inspiration came from - in the report to the user and in code comments where assets were extracted.
- The goal of a clone is to *understand* - the mark of having truly stolen the craft is being able to make the next piece original.

## Phase 0 - Probe the source

```bash
ffprobe -v error -show_entries format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels -of default=noprint_wrappers=1 <video>
```

Record: width×height, fps, duration. The Remotion comp uses the same dimensions, fps=30 (regardless of source fps), and `durationInFrames = ceil(duration * 30)`.

## Phase 1 - Extract a frame survey

Extract at 10fps into the scratchpad - one frame per 0.1s and a trivial index→time mapping (`f_N.png` → `t = N/10` s):

```bash
mkdir -p <scratch>/frames && cd <scratch>/frames
ffmpeg -v error -i <video> -vf fps=10 -start_number 0 f_%03d.png
```

- ffmpeg on long videos can exceed the 120s default timeout - pass a larger `timeout` or run in background.
- Extract audio now too (stream copy, never re-encode): `ffmpeg -v error -y -i <video> -vn -acodec copy public/audio.m4a`

## Phase 2 - Build the storyboard

Read frames with the Read tool in batches of 4. First pass: every ~10–15 frames (every 1–1.5s) to find scene boundaries. Second pass: read frames right around each boundary and each animation to pin down:

- Scene list with start/end times, converted to 30fps frame numbers.
- For each element: position (estimate x/y in source pixels), size, font class (serif/sans, weight), color.
- For each animation: type (fade, blur reveal, typewriter, wipe, slide, spring pop, draw-on, morph, camera zoom, push transition), start/end time, easing feel.
- Transition style between scenes (crossfade with overlap, hard cut, push, morphing shared element).
- Exact text content - transcribe every string character-for-character, including typos in the original.

Ambiguous reveals: if a mid-animation frame shows the END of a text block before its start, suspect a diagonal wipe (gradient mask sweeping bottom-right → top-left), not a typewriter.

## Phase 3 - Sample exact colors

Sample single pixels with ffmpeg. **zsh does not word-split unquoted variables** - use `${=var}` in loops:

```bash
for spec in "f_010.png 50 50 bg" "f_040.png 400 330 accent"; do
  set -- ${=spec}
  c=$(ffmpeg -v error -i $1 -vf "crop=1:1:$2:$3" -frames:v 1 -f rawvideo -pix_fmt rgb24 pipe:1 | od -An -tx1 | tr -d ' \n')
  echo "$4 #$c"
done
```

Sample: background, card/surface colors, every accent color, text inks. Thin text strokes often miss - if a sample returns the background color, either retry inside a thick glyph stroke or fall back to a plausible value (near-black ink `#1e1d18`-style, mid-gray `#8a8a84`-style) - visually indistinguishable.

Put all sampled values in a single `theme.ts` with the two font families.

## Phase 4 - Crop irreplaceable assets

For each element that can't be code (per the golden rule):

1. Find a frame where the element is clean (not overlapped by cursor/particles, not mid-animation, over a flat background).
2. Crop: `ffmpeg -v error -i f_NNN.png -vf "crop=W:H:X:Y" -frames:v 1 public/<name>.png`
3. Read the crop to verify nothing is clipped or contaminated. Re-crop from a different frame if needed (cursor overlap is the common contamination).
4. If the crop will sit on a background different from its own, give it real alpha with the flood-fill script (see below). If it always sits on the identical flat color it was cropped from, skip - the seam is invisible.

**Do NOT rely on `mix-blend-mode: multiply` to hide crop backgrounds** - it renders inconsistently in headless Chromium (fails on transformed images and in some stacking contexts). Real alpha always works:

```bash
npm i -D pngjs --no-audit --no-fund
NODE_PATH=<project>/node_modules node <skill-dir>/scripts/alpha_floodfill.js public/<name>.png 14
```

The script flood-fills from the image borders, so enclosed interior regions matching the background color (e.g. the white inside an outlined hand cursor) are preserved. Tolerance: 10–16 typical; lower it if light UI grays sit near the background color.

Cursor tip: arrow cursors clip badly when cropped (they move between frames and overlap UI) - draw them as an SVG path instead. Crop hand/pointer cursors only from a frame where they sit on a flat surface.

## Phase 5 - Project structure

New project: `package.json` with `remotion`, `@remotion/cli`, `@remotion/google-fonts` (same ^version), `react`/`react-dom`; script `dev: remotion studio`. Existing project: add a second `<Composition>` to Root.

Structure per clone:

```
src/
  Root.tsx            // <Composition id fps={30} width height durationInFrames>
  <Name>.tsx          // assembly: <Audio> + <Sequence from durationInFrames> per scene
  helpers.ts          // fadeInOut, easeOutCubic, easeInOutCubic, clamp01
  <name>/theme.ts     // sampled colors + loadFont() calls, export font families
  <name>/Scene*.tsx   // one component per storyboard scene
```

Rules:

- Fonts via `@remotion/google-fonts/<Font>` - pick the closest Google match to the source's proprietary fonts (a geometric UI sans → Inter; a high-contrast editorial serif → Source Serif 4 or Lora). Note the substitution to the user as a known delta.
- Every scene takes local frame via `useCurrentFrame()`; every `interpolate` gets `extrapolateLeft/Right: 'clamp'`.
- Crossfades: overlap adjacent `<Sequence>` ranges by the fade duration and fade both.
- Elements shared across scenes (a card that persists/morphs) belong to ONE component spanning the whole range, with internal stages - never split a morphing element across two Sequences.
- Absolute-position everything in source-pixel coordinates; it makes still-vs-original comparison directly actionable.

For animation implementations (typewriter, caret, blur reveals, gradient shimmer, draw-on strokes, springs, card morphs, camera zooms, push transitions, particle dissolves, spinners, click dips), read [references/animation-recipes.md](references/animation-recipes.md) - copy-adapt those patterns instead of inventing new ones.

## Phase 6 - Verify with stills (the critical loop)

Render stills at each scene's midpoint and at each tricky animation moment, in parallel:

```bash
for f in 75 150 250 330; do npx remotion still <CompId> out/t$f.png --frame=$f --log=error & done; wait
```

Read each still next to the source frame at the same timestamp (still frame N at 30fps ↔ survey frame N/3 at 10fps). Compare: position, size, color, animation progress. Fix and re-render only the affected stills. Typical fixes:

- Animation lag/lead vs original → shift interpolate ranges by measured frames.
- Text wrapping differently → container width ±40px or fontSize ±1 (font substitution changes metrics).
- Crop showing a box → alpha wasn't applied, or the blend-mode trap above.
- Typewriter pace: count visible characters in the original frame at a known time; solve the interpolate range from that.

Iterate until stills are indistinguishable at a glance.

## Phase 7 - Final render and check

```bash
npx remotion render <CompId> out/<Name>.mp4 --log=error
```

**Invoke the CLI directly** - an `npm run render` script with hardcoded composition args silently renders the wrong comp when extra args are appended.

Verify: `ffprobe` (duration matches source ±0.1s, audio stream present), then extract 3–4 frames from the RENDERED mp4 at key timestamps and compare against the source one last time (transitions look different in motion than component stills suggest).

Report to the user: output path, scene timeline, which assets are crops vs code, and known deltas (font substitutions, simplified effects).
