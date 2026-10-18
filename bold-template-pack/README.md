# Bold template pack

Dark background, Inter 800 titles, orange accent. Five slides out of the
box: cover, problem, status-quo-vs-us, why-now, closing.

To use:
1. Copy `index.html` to your deck folder.
2. Replace the slide text. Keep structure identical where you can -
   `.cover`, standard slide, `.cols`, closing - so the rhythm reads.
3. If you add slides, bump the stagger delays in `.slide.active li:nth-child(n)`.

To re-skin without rewriting:
- Change `--accent` and `--accent-2` for a different brand pop.
- Swap `--font-display` + `--font-body` and the matching Google Fonts
  `@import` URL in one place at the top of `<style>`.
