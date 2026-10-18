---
name: frontend-slides
description: Author a presentation as a single-file HTML/CSS/JS slide deck that runs in a browser - 16:9 viewport, keyboard navigation, named visual style presets, inline animations, and a Chromium-based PDF export. Use when the user asks for slides, a slide deck, pitch deck, or presentation and wants it as a web page (not .pptx, Google Slides, or an artifact slide type). Also use when converting a .pptx into HTML slides via scripts/extract-pptx.py.
---

# frontend-slides

Build a slide deck as one self-contained `index.html` the user opens in a
browser. Not a .pptx, not a Google Slides file, not an artifact Slides
type - a plain HTML page where each slide is a `<section class="slide">`.

## When to use

- "Make slides / a deck / a presentation" with no file format named, and
  the user wants to view or share it as a web page or GitHub Pages site.
- Converting a `.pptx` the user already has into editable HTML slides
  (run `scripts/extract-pptx.py` to pull text + images first).
- Follow-up edits to a deck you built with this skill earlier.

## When NOT to use

- The user said `.pptx`, `.pdf`, Google Slides, or a slide artifact type
  - use the matching skill or artifact type instead.
- A single marketing page, dashboard, or long-form document - those are
  not slides, pick the right skill.

## Workflow

1. **Pick a style preset.** Read `STYLE_PRESETS.md` and choose one that
   matches the topic and audience, or ask the user. The preset defines
   CSS custom properties (colors, fonts, spacing) only - layout is the
   same across all presets.
2. **Scaffold the deck.** Start from `html-template.md`. Paste in
   `viewport-base.css` under `<style>`, then the preset's variables, then
   any animation keyframes you need from `animation-patterns.md`.
3. **Draft slide-by-slide.** One `<section class="slide">` per slide.
   Resist long paragraphs - slide text is prompts for the speaker, not
   the speech itself.
4. **Preview.** Open `index.html` in a browser and tab through with
   arrow keys / space / `g <n>` jump. Verify every slide fits the 16:9
   frame at 1920x1080 and at 1280x720.
5. **Export if asked.** `scripts/export-pdf.sh index.html deck.pdf`
   runs headless Chromium and prints each slide at 16:9.
6. **Deploy if asked.** `scripts/deploy.sh` publishes to the configured
   static host (gh-pages by default).

## Hard constraints

- One file. Inline CSS and JS - no bundler, no build step, no npm. The
  deck must open from `file://` with no server.
- No framework. Vanilla HTML/CSS/JS. The template includes ~60 lines of
  navigation JS; don't swap it for React/Vue/Svelte.
- Fonts: use `system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
  or one Google Font loaded over `https://fonts.googleapis.com`. Never
  more than one web font family per deck.
- Images: inline SVG, data URIs under 50KB, or absolute https URLs.
  Never a local path that won't resolve from `file://`.
- Every slide fits the 16:9 frame without scrolling. If content
  overflows, split into two slides.

## Template packs

The `bold-template-pack/` folder is a complete example: dark background,
accent-colored titles, big typography. Copy it as a starting point when
the user wants a confident, pitch-deck feel. Add more packs under
sibling folders as needed.

## Converting from PowerPoint

`scripts/extract-pptx.py deck.pptx > outline.md` reads a .pptx (a zip
of XML) and prints slide titles, bullets, and image references to
Markdown. Use that outline to seed the HTML slides - don't try to
preserve the exact .pptx visual design, remake it in HTML.
