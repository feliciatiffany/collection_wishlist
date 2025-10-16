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

  // --- RNG (supports seeding) ---
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
  function getAvailableStageSize() {
    const headerH = document.querySelector('.topBar')?.offsetHeight || 0;

    // Target height: viewport minus header (not dependent on stage's current top)
    const targetH = Math.max(window.innerHeight - headerH, 0);

    // Never go below the content's natural height (protect against shrinking)
    const naturalH = Math.max(stage.scrollHeight, stage.clientHeight || 0);
    const availableH = Math.max(targetH, naturalH);

    // Width: prefer stage width; fallback to viewport width
    const viewW = document.documentElement.clientWidth || window.innerWidth;
    const availableW = stage.clientWidth || viewW;

    return { availableW, availableH };
  }

  function placeAll() {
    const { availableW, availableH } = getAvailableStageSize();

    // Only ever INCREASE min-height; do not shrink below existing CSS
    const currentMin = parseFloat(getComputedStyle(stage).minHeight) || 0;
    if (availableH > currentMin) {
      stage.style.minHeight = availableH + 'px';
    }

    // Reset + measure + place
    const placed = [];

    items.forEach(el => {
      // Prepare for accurate measurements with rotation applied
      el.style.position = 'absolute';
      el.style.visibility = 'hidden';
      el.style.left = '0px';
      el.style.top  = '0px';
      el.style.transform = `rotate(${rand(config.rotateMin, config.rotateMax).toFixed(1)}deg)`;

      const w = el.offsetWidth;   // includes padding/border
      const h = el.offsetHeight;

      const pad = config.padding;
      const maxX = Math.max(pad, availableW - w - pad);
      const maxY = Math.max(pad, availableH - h - pad);

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
        // Clamp into bounds if we ran out of tries
        x = Math.min(maxX, Math.max(pad, x));
        y = Math.min(maxY, Math.max(pad, y));
      }

      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;
      el.style.visibility = 'visible';

      placed.push({ x, y, w, h });
    });
  }

  // --- Debounce for resize ---
  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), ms);
    };
  }

  // --- Initialize after images are ready ---
  function onReady() {
    const imgs = Array.from(stage.querySelectorAll('img'));
    if (!imgs.length) {
      placeAll();
      return;
    }

    let loaded = 0;
    const done = () => { if (++loaded === imgs.length) placeAll(); };

    imgs.forEach(img => {
      if (img.complete) {
        // Ensure layout has accounted for the image
        requestAnimationFrame(done);
      } else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true }); // don't block if an image fails
      }
    });
  }

  document.addEventListener('DOMContentLoaded', onReady);
  window.addEventListener('resize', debounce(placeAll, 120));

  // Optional: manual reshuffle hook
  window.randomizeFloatItems = () => {
    if (config.seeded) {
      config.seed++;
      rng = mulberry32(config.seed);
    }
    placeAll();
  };
})();