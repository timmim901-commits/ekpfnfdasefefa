# Style presets

Each preset is a block of CSS custom properties to paste on `:root`
after `viewport-base.css`. Layout stays constant across presets - only
color, type, and surface treatment change.

## bold-dark (default pitch deck)

```css
:root {
  --bg: #0b0b10;
  --surface: #15151d;
  --fg: #f4f4f6;
  --muted: #a0a0ad;
  --accent: #ff5a3c;
  --accent-2: #ffd166;
  --font-display: "Inter", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --title-size: clamp(2.5rem, 5vw, 4.5rem);
  --body-size: clamp(1.1rem, 1.6vw, 1.5rem);
}
```

Use for: pitch decks, launch decks, keynote-style talks.

## editorial-light

```css
:root {
  --bg: #faf8f3;
  --surface: #ffffff;
  --fg: #1a1a1a;
  --muted: #666666;
  --accent: #d64545;
  --accent-2: #2a6b7c;
  --font-display: "Playfair Display", Georgia, serif;
  --font-body: "Source Sans 3", system-ui, sans-serif;
  --title-size: clamp(2.5rem, 5vw, 4.5rem);
  --body-size: clamp(1.1rem, 1.6vw, 1.5rem);
}
```

Use for: research talks, long-form arguments, book-launch decks.

## tech-mono

```css
:root {
  --bg: #0d1117;
  --surface: #161b22;
  --fg: #c9d1d9;
  --muted: #8b949e;
  --accent: #58a6ff;
  --accent-2: #3fb950;
  --font-display: "JetBrains Mono", "SF Mono", Menlo, monospace;
  --font-body: "Inter", system-ui, sans-serif;
  --title-size: clamp(2rem, 4vw, 3.5rem);
  --body-size: clamp(1rem, 1.4vw, 1.3rem);
}
```

Use for: engineering talks, release notes, incident reviews.

## soft-pastel

```css
:root {
  --bg: #fff5f7;
  --surface: #ffffff;
  --fg: #2d2d44;
  --muted: #7a7a9a;
  --accent: #ff8ba7;
  --accent-2: #70d6ff;
  --font-display: "Fraunces", Georgia, serif;
  --font-body: "Inter", system-ui, sans-serif;
  --title-size: clamp(2.5rem, 5vw, 4.5rem);
  --body-size: clamp(1.1rem, 1.6vw, 1.5rem);
}
```

Use for: workshops, education, product onboarding.

## Picking a preset

- Audience of execs / investors → `bold-dark`.
- Academic / long-form prose → `editorial-light`.
- Engineers / internal tech reviews → `tech-mono`.
- Students / creators / warm topics → `soft-pastel`.

If none fit, derive a new one by changing only the vars above. Don't
alter `viewport-base.css` for a one-off palette change.
