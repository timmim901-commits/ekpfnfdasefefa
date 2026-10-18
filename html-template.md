# HTML template

Copy this scaffold to `index.html` and fill in. Paste `viewport-base.css`
and the chosen preset's `:root` block inside `<style>`.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DECK TITLE</title>
  <style>
    /* 1. Paste viewport-base.css here. */
    /* 2. Paste the preset's :root { ... } block here. */
    /* 3. Paste any animation keyframes you use. */
  </style>
</head>
<body>
  <div class="progress"></div>
  <div class="chrome"><span id="num">1</span> / <span id="total">1</span></div>

  <div id="deck">
    <div class="stage">

      <!-- Slide 1: cover -->
      <section class="slide cover active">
        <div class="kicker">CATEGORY · DATE</div>
        <h1>Deck <span class="accent">title</span></h1>
        <p>Subhead or author line.</p>
      </section>

      <!-- Slide 2: standard -->
      <section class="slide">
        <h2>Section</h2>
        <h1>The point of this slide</h1>
        <ul>
          <li>Supporting beat</li>
          <li>Supporting beat</li>
          <li>Supporting beat</li>
        </ul>
      </section>

      <!-- Slide 3: two columns -->
      <section class="slide cols">
        <div>
          <h1>Problem</h1>
          <p>Short description.</p>
        </div>
        <div>
          <h1 class="accent">Solution</h1>
          <p>Short description.</p>
        </div>
      </section>

    </div>
  </div>

  <script>
    // Scale the 1920x1080 stage into the window and watch for resize.
    const stage = document.querySelector('.stage');
    function fit() {
      const s = Math.min(innerWidth / 1920, innerHeight / 1080);
      stage.style.transform = `scale(${s})`;
    }
    addEventListener('resize', fit); fit();

    // Slide navigation.
    const slides = [...document.querySelectorAll('.slide')];
    const total = slides.length;
    document.getElementById('total').textContent = total;
    const progress = document.querySelector('.progress');
    let i = slides.findIndex(s => s.classList.contains('active'));
    if (i < 0) { i = 0; slides[0].classList.add('active'); }

    function go(n) {
      n = Math.max(0, Math.min(total - 1, n));
      slides[i].classList.remove('active');
      slides[n].classList.add('active');
      i = n;
      document.getElementById('num').textContent = i + 1;
      progress.style.width = ((i + 1) / total * 100) + '%';
      history.replaceState(null, '', '#' + (i + 1));
    }

    // ?p=N or #N on load.
    const start = parseInt(location.hash.slice(1) || new URLSearchParams(location.search).get('p') || '1', 10);
    if (!isNaN(start)) go(start - 1);

    let buf = '';
    addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { go(i + 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp')               { go(i - 1); e.preventDefault(); }
      else if (e.key === 'Home')                                           { go(0); }
      else if (e.key === 'End')                                            { go(total - 1); }
      else if (/^\d$/.test(e.key))                                         { buf += e.key; }
      else if (e.key === 'Enter' && buf)                                   { go(parseInt(buf, 10) - 1); buf = ''; }
      else if (e.key === 'Escape')                                         { buf = ''; }
    });

    // Click right half → next, left half → prev.
    addEventListener('click', e => {
      if (e.target.closest('a, button, input, textarea, select')) return;
      go(e.clientX > innerWidth / 2 ? i + 1 : i - 1);
    });
  </script>
</body>
</html>
```

## Keyboard

- `→` / `Space` / `PageDown` — next
- `←` / `PageUp` — previous
- `Home` / `End` — first / last
- `<n> Enter` — jump to slide `n`
- `?p=N` or `#N` in URL — open at slide N (used by the PDF exporter)
