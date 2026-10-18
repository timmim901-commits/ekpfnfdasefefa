# Animation patterns

Keep motion in a slide deck purposeful - a build that reveals a point,
not decoration. One or two of these per deck, not every slide.

## Fade-up on slide activation

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.slide.active h1,
.slide.active h2,
.slide.active p,
.slide.active li {
  animation: fadeUp 480ms ease both;
}

/* Stagger children. */
.slide.active h2            { animation-delay: 0ms; }
.slide.active h1            { animation-delay: 80ms; }
.slide.active p             { animation-delay: 160ms; }
.slide.active li:nth-child(1) { animation-delay: 200ms; }
.slide.active li:nth-child(2) { animation-delay: 280ms; }
.slide.active li:nth-child(3) { animation-delay: 360ms; }
.slide.active li:nth-child(4) { animation-delay: 440ms; }
```

## Counting number (big stat)

```html
<div class="stat" data-to="42000" data-prefix="$">0</div>
```

```js
function countUp(el) {
  const to = +el.dataset.to;
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const dur = 900;
  const t0 = performance.now();
  function tick(t) {
    const k = Math.min(1, (t - t0) / dur);
    const v = Math.round(to * (1 - Math.pow(1 - k, 3)));
    el.textContent = prefix + v.toLocaleString() + suffix;
    if (k < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Trigger when a slide containing a .stat becomes active.
new MutationObserver(muts => {
  muts.forEach(m => {
    if (m.target.classList.contains('active')) {
      m.target.querySelectorAll('.stat').forEach(countUp);
    }
  });
}).observe(document.querySelector('.stage'), {
  attributes: true, attributeFilter: ['class'], subtree: true,
});
```

## Underline reveal

```css
.slide.active h1 .accent {
  background-image: linear-gradient(var(--accent), var(--accent));
  background-size: 0% 8px;
  background-position: 0 100%;
  background-repeat: no-repeat;
  animation: underline 600ms 320ms ease-out both;
}
@keyframes underline { to { background-size: 100% 8px; } }
```

## Respect reduced-motion

Always wrap decorative animations:

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```
