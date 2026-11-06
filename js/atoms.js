(() => {
  const CFG = {
    count: { desktop: 2, mobile: 1 }, radius: [50, 90], speed: 0.12,
    orbits: 3, squash: 0.36,
    electron: 'rgba(190,238,255,.95)', orbit: 'rgba(120,210,255,.30)',
    glow: '100,210,255', nucleus: 'rgba(255,179,64,.9)'
  };
  const canvas = document.getElementById('atoms');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const random = (min, max) => min + Math.random() * (max - min);
  let width = 0, height = 0, atoms = [], time = 0, lastFrame = 0;

  function init() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = width < 700 ? CFG.count.mobile : CFG.count.desktop;
    atoms = [];
    for (let i = 0; i < count; i += 1) {
      const atom = {
        x: random(0, width), y: random(0, height),
        vx: random(-CFG.speed, CFG.speed), vy: random(-CFG.speed, CFG.speed),
        radius: random(...CFG.radius), rotation: random(0, 3), phase: random(0, 6)
      };
      let tries = 0;
      while (atoms.some((other) => {
        const dx = atom.x - other.x;
        const dy = atom.y - other.y;
        return Math.hypot(dx, dy) < atom.radius + other.radius + 36;
      }) && tries < 80) {
        atom.x = random(0, width);
        atom.y = random(0, height);
        tries += 1;
      }
      atoms.push(atom);
    }
  }

  function drawAtom(atom, t) {
    ctx.save();
    ctx.translate(atom.x, atom.y);
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, atom.radius);
    halo.addColorStop(0, `rgba(${CFG.glow},.18)`);
    halo.addColorStop(1, `rgba(${CFG.glow},0)`);
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, 0, atom.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = CFG.nucleus;
    ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = CFG.orbit; ctx.lineWidth = 1;
    for (let k = 0; k < CFG.orbits; k += 1) {
      ctx.save();
      ctx.rotate(atom.rotation + k * Math.PI / CFG.orbits);
      ctx.beginPath();
      ctx.ellipse(0, 0, atom.radius, atom.radius * CFG.squash, 0, 0, Math.PI * 2);
      ctx.stroke();
      const angle = t * (0.6 + k * 0.25) + atom.phase + k * 2;
      ctx.fillStyle = CFG.electron;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * atom.radius, Math.sin(angle) * atom.radius * CFG.squash, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function draw(move) {
    ctx.clearRect(0, 0, width, height);
    for (const atom of atoms) {
      if (move) {
        atom.x += atom.vx; atom.y += atom.vy;
        const pad = atom.radius + 8;
        if (atom.x < pad || atom.x > width - pad) atom.vx *= -1;
        if (atom.y < pad || atom.y > height - pad) atom.vy *= -1;
        atom.x = Math.max(pad, Math.min(width - pad, atom.x));
        atom.y = Math.max(pad, Math.min(height - pad, atom.y));
      }
    }

    if (move && atoms.length > 1) {
      for (let i = 0; i < atoms.length; i += 1) {
        for (let j = i + 1; j < atoms.length; j += 1) {
          const a = atoms[i], b = atoms[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const distance = Math.hypot(dx, dy) || 1;
          const minDistance = a.radius + b.radius + 36;
          if (distance < minDistance) {
            const nx = dx / distance, ny = dy / distance;
            const overlap = minDistance - distance;
            a.x -= nx * overlap / 2; a.y -= ny * overlap / 2;
            b.x += nx * overlap / 2; b.y += ny * overlap / 2;
            const av = a.vx * nx + a.vy * ny;
            const bv = b.vx * nx + b.vy * ny;
            a.vx += (bv - av) * nx; a.vy += (bv - av) * ny;
            b.vx += (av - bv) * nx; b.vy += (av - bv) * ny;
          }
        }
      }
    }
    for (const atom of atoms) drawAtom(atom, time);
  }

  function frame(timestamp) {
    time += Math.min(timestamp - lastFrame, 50) / 1000;
    lastFrame = timestamp;
    draw(true);
    window.requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => { init(); draw(false); });
  init(); draw(false);
  if (!reduceMotion) window.requestAnimationFrame((timestamp) => {
    lastFrame = timestamp;
    frame(timestamp);
  });
})();
