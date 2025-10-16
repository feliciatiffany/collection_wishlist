(() => {
  'use strict';

  const stage = document.querySelector('.floatStage');
  const items = Array.from(document.querySelectorAll('.floatItem'));
  if (!stage || !items.length) return;

  const config = {
    padding: 16,       // min distance from stage edges (px)
    gap: 15,           // min distance between items (px)
    rotateMin: -10,    // degrees
    rotateMax: 10,
    triesMax: 250,     // attempts per item before giving up
    seeded: false,     // true for deterministic randomness
    seed: 12345
  };

  // RNG with optional seeding
  function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let rng = config.seeded ? mulberry32(config.seed) : Math.random;
  const rand = (min, max) => rng() * (max - min) + min;

  // --- Layout helpers ---
  function computeDesiredHeight() {
    // Fill at least the viewport below the stage's current top edge.
    const rect = stage.getBoundingClientRect();
    const viewportH = window.innerHeight;

    // Remaining space in viewport from stage top:
    const remaining = Math.max(0, viewportH - rect.top);

    // Natural content height (in case content is taller)
    const naturalH = Math.max(stage.scrollHeight, stage.clientHeight || 0);

    // Final desired height
    return Math.max(remaining, naturalH, 320); // 320px guard so it's never tiny
  }

  function placeAll() {
    // Force an explicit height so CSS `height:100%` can't shrink it.
    const desiredH = computeDesiredHeight();
    stage.style.height = desiredH + 'px';

    // Prepare, measure, and place items
    const placed = [];

    items.forEach(el => {
      // Pre-rotate before measuring (offsetWidth/Height uses layout box)
      el.style.position = 'absolute';
      el.style.visibility = 'hidden';
      el.style.left = '0px';
      el.style.top  = '0px';
      el.style.transform = `rotate(${rand(config.rotateMin, config.rotateMax).toFixed(1)}deg)`;
    });

    // Stage usable area
    const stageW = stage.clientWidth || document.documentElement.clientWidth;
    const stageH = desiredH;

    items.forEach(el => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const pad = config.padding;

      const maxX = Math.max(pad, stageW - w - pad);
      const maxY = Math.max(pad, stageH - h - pad);

      let ok = false, tries = 0, x = pad, y = pad;

      while (!ok && tries++ < config.triesMax) {
        x = rand(pad, maxX);
        y = rand(pad, maxY);
        ok = placed.every(p =>
          (x + w + config.gap <= p.x) || (p.x + p.w + config.gap <= x) ||
          (y + h + config.gap <= p.y) || (p.y + p.h + config.gap <= y)
        );
      }

      if (!ok) {
        x = Math.min(maxX, Math.max(pad, x));
        y = Math.min(maxY, Math.max(pad, y));
      }

      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;
      el.style.visibility = 'visible';

      placed.push({ x, y, w, h });
    });
  }

  // Debounce helper
  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), ms);
    };
  }

  // Initialize after images are ready (so sizes are correct)
  function init() {
    const imgs = Array.from(stage.querySelectorAll('img'));
    if (!imgs.length) {
      placeAll();
      return;
    }
    let loaded = 0;
    const done = () => { if (++loaded === imgs.length) placeAll(); };
    imgs.forEach(img => {
      if (img.complete) {
        requestAnimationFrame(done);
      } else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('resize', debounce(placeAll, 120));

  // Optional: manual reshuffle
  window.randomizeFloatItems = () => {
    if (config.seeded) {
      config.seed++;
      rng = mulberry32(config.seed);
    }
    placeAll();
  };
})();