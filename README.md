# remotion-clone-video

```
 ╭─◻──◻──◻──◻──◻──◻──◻──◻──◻──◻──◻──◻──◻──◻──◻─╮
                        __  _
    _______ __ _  ___  / /_(_)__  ___
   / __/ -_)  ' \/ _ \/ __/ / _ \/ _ \
  /_/  \__/_/_/_/\___/\__/_/\___/_//_/
        __                       _    __
   ____/ /__  ___  ___ _____  __(_)__/ /__ ___
  / __/ / _ \/ _ \/ -_)___/ |/ / / _  / -_) _ \
  \__/_/\___/_//_/\__/    |___/_/\_,_/\__/\___/
 ╰─◻──◻──◻──◻──◻──◻──◻──◻──◻──◻──◻──◻──◻──◻──◻─╯
          video in  ▷  ░░ ▒▒ ▓▓  ▷  react out
```

An agent skill that clones any video - promo, product demo, motion-graphics piece, UI walkthrough - as a **Remotion project**, so the result is regenerable and editable as React code.

Works with any agent that supports the open [`SKILL.md` format](https://skills.sh): Claude Code, Cursor, Codex, Gemini CLI, opencode, Amp, and more.

Give your agent a video file and say *"clone this, pixel perfect"*. The skill drives an 8-phase workflow:

1. **Probe** the source with ffprobe (dimensions, fps, duration)
2. **Extract** a 10fps frame survey + the audio track with ffmpeg
3. **Storyboard** every scene, element, animation, and transition from the frames
4. **Sample** exact colors pixel-by-pixel
5. **Crop** only irreplaceable raster assets (logos, mascots, photos) with real alpha via border flood-fill - everything else becomes code
6. **Build** one Remotion component per scene from a library of proven animation recipes
7. **Verify** by rendering stills and comparing them against the source frames, iterating until indistinguishable
8. **Render** the final mp4 and spot-check it against the original

## Install

With the [skills CLI](https://skills.sh) - it auto-detects your installed agents:

```bash
npx skills add crafter-station/remotion-clone-video
```

Target a specific agent:

```bash
npx skills add crafter-station/remotion-clone-video -a claude-code
npx skills add crafter-station/remotion-clone-video -a cursor
npx skills add crafter-station/remotion-clone-video -a codex
```

Or copy this folder into your agent's skills directory manually, e.g. for Claude Code:

```bash
git clone https://github.com/crafter-station/remotion-clone-video.git ~/.claude/skills/remotion-clone-video
```

## Contents

- `SKILL.md` - the workflow, including the exact ffmpeg/ffprobe commands and the hard-won gotchas (zsh word-splitting, headless-Chromium blend-mode failures, npm-script arg traps)
- `scripts/alpha_floodfill.js` - turns flat-background crops into transparent PNGs while preserving enclosed interior regions
- `references/animation-recipes.md` - 15 copy-adaptable Remotion patterns: typewriter + caret, per-letter blur reveals, gradient shimmer, draw-on strokes, card morphs, camera zooms, push transitions, deterministic particle dissolves, and more

## Ethics - "Good artists copy, great artists steal"

Steal the **craft**, not the **work**. This skill exists for learning motion design, rebuilding your *own* content as code, and prototyping. Techniques - easings, staggers, wipes, rhythm - are free to internalize. Logos, mascots, soundtracks, and brand identity belong to their owners. Credit your inspiration, never pass off someone else's creative work as your own, and treat clones of third-party content as study artifacts. The mark of having truly stolen the craft is being able to make the next piece original.
