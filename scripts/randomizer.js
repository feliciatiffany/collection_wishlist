

(() => {
  const stage = document.querySelector('.floatStage');
  const items = Array.from(document.querySelectorAll('.floatItem'));
  if (!stage || !items.length) return;

  const config = {
    padding: 16,         // min distance from stage edges (px)
    gap: 15,              // min distance between items (px)
    rotateMin: -10,       // degrees
    rotateMax: 10,
    triesMax: 250,       // attempts per item before giving up
    seeded: false,       // set true for deterministic randomness
    seed: 12345          // only used if seeded = true
  };
  function mulberry32(a){ return function(){ let t=a+=0x6D2B79F5;
    t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61);
    return ((t^t>>>14)>>>0)/4294967296; }; }
  const rnd = config.seeded ? mulberry32(config.seed) : Math.random;
  const rand = (min, max) => rnd() * (max - min) + min;

  function getAvailableStageSize() {
    // Distance from the stage's top edge to the bottom of the viewport
    const rect = stage.getBoundingClientRect();
    const viewH = window.innerHeight;
    const viewW = window.innerWidth;
    const availableH = Math.max(0, viewH - rect.top);
    // Width can just be the stage’s actual width
    const availableW = Math.max(stage.clientWidth, Math.min(viewW, stage.clientWidth));
    return { availableW, availableH };
  }

  function placeAll() {
    // Ensure the stage is tall enough to use the full viewport space below it
    const { availableW, availableH } = getAvailableStageSize();
    // Lock a minHeight so absolutely-positioned items can occupy that space
    stage.style.minHeight = availableH + 'px';

    // Reset items and pre-rotate for accurate measurements
    items.forEach(el => {
      el.style.position = 'absolute';
      el.style.visibility = 'hidden';
      el.style.left = '0px';
      el.style.top  = '0px';
      el.style.transform = `rotate(${rand(config.rotateMin, config.rotateMax).toFixed(1)}deg)`;
    });

    const placed = [];
    items.forEach(el => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const pad = config.padding;

      // Compute max X/Y so the whole item stays inside the stage
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
        x = Math.min(maxX, Math.max(pad, x));
        y = Math.min(maxY, Math.max(pad, y));
      }

      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;
      el.style.visibility = 'visible';
      placed.push({ x, y, w, h });
    });
  }

  window.addEventListener('load', placeAll);
  window.addEventListener('resize', placeAll);

  // Manual reshuffle (optional)
  window.randomizeFloatItems = () => {
    if (config.seeded) config.seed++;
    placeAll();
  };
})();
