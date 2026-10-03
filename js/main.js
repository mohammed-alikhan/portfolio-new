(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2;
  const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));

  /* ---------------- achievements ---------------- */
  const unlocked = new Set();
  const toasts = document.getElementById("toasts");
  function unlock(id, title, icon) {
    if (unlocked.has(id)) return;
    unlocked.add(id);
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<span class="toast-icon" aria-hidden="true">${icon}</span><span><small>Achievement unlocked</small><b></b></span>`;
    t.querySelector("b").textContent = title;
    toasts.append(t);
    setTimeout(() => t.remove(), 4300);
  }

  /* ---------------- sky: an Earth made of stars, morphing into a shape per section ---------------- */
  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, mobile = false;

  function sprite(color) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, color);
    grad.addColorStop(0.18, color);
    grad.addColorStop(0.35, color + "55");
    grad.addColorStop(1, color + "00");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return c;
  }
  function flare() {
    const c = sprite("#ffffff"), g = c.getContext("2d");
    g.globalCompositeOperation = "lighter";
    const line = g.createLinearGradient(0, 32, 64, 32);
    line.addColorStop(0, "#cfe4ff00"); line.addColorStop(0.5, "#cfe4ffcc"); line.addColorStop(1, "#cfe4ff00");
    g.fillStyle = line; g.fillRect(0, 31, 64, 2);
    g.translate(32, 32); g.rotate(Math.PI / 2); g.translate(-32, -32); g.fillRect(0, 31, 64, 2);
    return c;
  }
  function bloom() {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.12, "rgba(220,235,255,0.45)");
    grad.addColorStop(0.4, "rgba(150,180,230,0.12)");
    grad.addColorStop(1, "rgba(150,180,230,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    return c;
  }
  const SPRITES = {
    cool: sprite("#cfe4ff"), blue: sprite("#8fbfff"), warm: sprite("#ffb58a"), white: sprite("#ffffff"),
    orange: sprite("#ff9b52"), sky: sprite("#7cc4ff"), flare: flare(),
  };
  const pickSprite = () => {
    const r = Math.random();
    return r < 0.45 ? SPRITES.cool : r < 0.7 ? SPRITES.blue : r < 0.9 ? SPRITES.warm : SPRITES.white;
  };

  // Each shape is drawn white on a 400x400 canvas, then sampled into points in [-1, 1].
  const pent = (g, cx, cy, r, rot) => {
    g.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = rot + (k * TAU) / 5 - Math.PI / 2;
      g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    g.closePath();
  };
  const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); };
  const circle = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); };
  const cut = (g, on) => { g.globalCompositeOperation = on ? "destination-out" : "source-over"; };

  const DRAW = {
    ball(g) {
      // A real truncated icosahedron (the classic 32-panel ball), turned slightly and projected flat.
      const phi = (1 + Math.sqrt(5)) / 2;
      const seeds = [[0, 1, 3 * phi], [1, 2 + phi, 2 * phi], [phi, 2, phi ** 3]];
      const V = [];
      for (const [a, b, c] of seeds) {
        for (const [x, y, z] of [[a, b, c], [b, c, a], [c, a, b]]) {
          for (const sx of x ? [1, -1] : [1]) for (const sy of y ? [1, -1] : [1]) for (const sz of z ? [1, -1] : [1]) V.push([x * sx, y * sy, z * sz]);
        }
      }
      // Rotate so a pentagon faces the viewer, then tip it a little for depth.
      const rot = ([x, y, z]) => {
        const k = Math.hypot(1, phi), cy = phi / k, sy = 1 / k;          // (0,1,phi) -> +z
        [y, z] = [y * cy - z * sy, y * sy + z * cy];
        const t = 0.32, u = 0.22;
        [y, z] = [y * Math.cos(t) - z * Math.sin(t), y * Math.sin(t) + z * Math.cos(t)];
        [x, z] = [x * Math.cos(u) + z * Math.sin(u), -x * Math.sin(u) + z * Math.cos(u)];
        return [x, y, z];
      };
      const P = V.map(rot), Rv = Math.hypot(...V[0]), R = 172, C = 200;
      const xy = ([x, y]) => [C + (x / Rv) * R, C - (y / Rv) * R];
      g.lineWidth = 7;
      circle(g, C, C, R + 4); g.stroke();
      // pentagons: the five vertices nearest each icosahedron direction
      const ico = [];
      for (const [a, b] of [[1, phi]]) for (const s of [1, -1]) for (const t of [1, -1]) ico.push([0, a * s, b * t], [a * s, b * t, 0], [b * t, 0, a * s]);
      for (const d of ico.map(rot)) {
        if (d[2] < 0) continue;
        const five = P.map((p, i) => [p[0] * d[0] + p[1] * d[1] + p[2] * d[2], i]).sort((a, b) => b[0] - a[0]).slice(0, 5).map(([, i]) => P[i]);
        const cx = five.reduce((s, p) => s + p[0], 0) / 5, cy2 = five.reduce((s, p) => s + p[1], 0) / 5;
        five.sort((a, b) => Math.atan2(a[1] - cy2, a[0] - cx) - Math.atan2(b[1] - cy2, b[0] - cx));
        poly(g, five.map(xy)); g.fill();
      }
      // seams: every edge (length 2) on the visible side
      g.lineWidth = 4; g.lineCap = "round";
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
        if (Math.abs(Math.hypot(V[i][0] - V[j][0], V[i][1] - V[j][1], V[i][2] - V[j][2]) - 2) > 1e-6) continue;
        if (P[i][2] < -0.4 || P[j][2] < -0.4) continue;
        g.beginPath(); g.moveTo(...xy(P[i])); g.lineTo(...xy(P[j])); g.stroke();
      }
    },
    car(g) {
      // Low, long, cab-forward supercar in profile (McLaren-style): canopy glass, door intake, ducktail.
      g.beginPath();
      g.moveTo(22, 238);
      g.lineTo(16, 206);                                                // vertical tail
      g.lineTo(24, 196); g.lineTo(78, 192);                             // ducktail spoiler
      g.quadraticCurveTo(126, 190, 158, 178);                           // flat rear deck
      g.bezierCurveTo(186, 158, 214, 150, 248, 151);                    // canopy roof
      g.bezierCurveTo(276, 153, 298, 166, 322, 184);                    // long raked windscreen
      g.quadraticCurveTo(358, 194, 394, 210);                           // low nose
      g.lineTo(398, 222); g.lineTo(374, 236);                           // splitter
      g.lineTo(350, 236);
      g.arc(310, 236, 40, 0, Math.PI, true);                            // front arch
      g.lineTo(136, 238);
      g.arc(96, 236, 40, 0, Math.PI, true);                             // rear arch
      g.lineTo(40, 240);
      g.closePath(); g.fill();
      cut(g, true);
      g.beginPath();                                                    // canopy glass
      g.moveTo(176, 180); g.bezierCurveTo(204, 160, 252, 154, 312, 186);
      g.quadraticCurveTo(244, 190, 176, 180); g.fill();
      g.beginPath();                                                    // teardrop door intake
      g.moveTo(140, 206); g.bezierCurveTo(168, 186, 214, 188, 236, 200);
      g.bezierCurveTo(208, 204, 190, 214, 178, 230);
      g.quadraticCurveTo(156, 226, 140, 206); g.fill();
      poly(g, [[340, 196], [386, 211], [380, 216], [338, 202]]); g.fill(); // headlight slash
      poly(g, [[18, 208], [32, 207], [32, 213], [18, 214]]); g.fill();     // tail light
      g.lineWidth = 3;
      g.beginPath(); g.moveTo(244, 206); g.quadraticCurveTo(282, 200, 330, 206); g.stroke(); // body crease
      cut(g, false);
      for (const x of [96, 310]) {
        circle(g, x, 236, 34); g.fill();
        cut(g, true); circle(g, x, 236, 26); g.fill(); cut(g, false);
        g.lineWidth = 3.5;
        for (let k = 0; k < 10; k++) {
          const a = (k * TAU) / 10;
          g.beginPath(); g.moveTo(x + Math.cos(a) * 7, 236 + Math.sin(a) * 7); g.lineTo(x + Math.cos(a) * 25, 236 + Math.sin(a) * 25); g.stroke();
        }
        circle(g, x, 236, 7); g.fill();
      }
    },
    devices(g) {
      // Open laptop at a three-quarter angle.
      const quad = (q, u0, v0, u1, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => [
        q[0][0] * (1 - u) * (1 - v) + q[1][0] * u * (1 - v) + q[2][0] * (1 - u) * v + q[3][0] * u * v,
        q[0][1] * (1 - u) * (1 - v) + q[1][1] * u * (1 - v) + q[2][1] * (1 - u) * v + q[3][1] * u * v,
      ]);
      const line = (q, u0, u1, v) => { const [[x0, y0], [x1, y1]] = quad(q, u0, v, u1, v); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
      // corners: [near-left, near-right, far-left, far-right]
      const screen = [[118, 236], [366, 262], [146, 70], [388, 100]];
      const deck = [[34, 300], [298, 334], [118, 236], [366, 262]];
      poly(g, quad(screen, 0, 0, 1, 1)); g.fill();
      cut(g, true); poly(g, quad(screen, 0.05, 0.07, 0.95, 0.93)); g.fill(); cut(g, false);
      g.lineWidth = 4; g.lineCap = "round";
      [[0.12, 0.5], [0.18, 0.62], [0.18, 0.44], [0.12, 0.7], [0.24, 0.5], [0.12, 0.36]].forEach(([u, len], k) => line(screen, u, u + len * 0.75, 0.82 - k * 0.11));
      poly(g, quad(deck, 0, 0, 1, 1)); g.fill();
      poly(g, [[34, 300], [298, 334], [298, 342], [34, 307]]); g.fill();   // front edge thickness
      cut(g, true);
      poly(g, quad(deck, 0.08, 0.46, 0.92, 0.9)); g.fill();                // keyboard well
      poly(g, quad(deck, 0.36, 0.1, 0.64, 0.36)); g.fill();                // trackpad
      cut(g, false);
      g.lineWidth = 3;
      for (const v of [0.56, 0.68, 0.8]) line(deck, 0.12, 0.88, v);
    },
    robot(g) {
      g.fillRect(196, 40, 8, 34);
      circle(g, 200, 36, 12); g.fill();
      g.beginPath(); g.roundRect(118, 72, 164, 118, 28); g.fill();
      g.fillRect(184, 190, 32, 16);
      g.beginPath(); g.roundRect(112, 206, 176, 130, 26); g.fill();
      g.fillRect(146, 336, 30, 40);
      g.fillRect(224, 336, 30, 40);
      g.lineWidth = 20; g.lineCap = "round";
      g.beginPath(); g.moveTo(112, 230); g.lineTo(64, 296); g.moveTo(288, 230); g.lineTo(336, 296); g.stroke();
      circle(g, 60, 304, 16); g.fill();
      circle(g, 340, 304, 16); g.fill();
      cut(g, true);
      circle(g, 165, 128, 16); g.fill();
      circle(g, 235, 128, 16); g.fill();
      g.beginPath(); g.roundRect(170, 160, 60, 10, 5); g.fill();
      circle(g, 200, 262, 24); g.fill();
      g.beginPath(); g.roundRect(160, 302, 80, 8, 4); g.fill();
    },
    controller(g) {
      g.beginPath(); g.roundRect(40, 140, 320, 120, 60); g.fill();
      circle(g, 110, 262, 58); g.fill();
      circle(g, 290, 262, 58); g.fill();
      cut(g, true);
      g.fillRect(76, 180, 66, 22);
      g.fillRect(98, 158, 22, 66);
      [[290, 166], [318, 194], [262, 194], [290, 222]].forEach(([x, y]) => { circle(g, x, y, 13); g.fill(); });
      circle(g, 158, 254, 22); g.fill();
      circle(g, 242, 254, 22); g.fill();
      g.beginPath(); g.roundRect(182, 170, 36, 10, 5); g.fill();
    },
  };

  // Share of stars placed on outlines vs. inside filled areas, per shape.
  const EDGE_SHARE = { ball: 0.45, car: 0.7 };

  function sampleShape(draw, n, edgeShare = 0.82) {
    const c = document.createElement("canvas");
    c.width = c.height = 400;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.fillStyle = g.strokeStyle = "#fff";
    draw(g);
    const d = g.getImageData(0, 0, 400, 400).data;
    const on = (x, y) => x >= 0 && y >= 0 && x < 400 && y < 400 && d[(y * 400 + x) * 4 + 3] > 128;
    const fill = [], edge = [];
    for (let y = 0; y < 400; y += 2) {
      for (let x = 0; x < 400; x += 2) {
        if (!on(x, y)) continue;
        const isEdge = !on(x + 2, y) || !on(x - 2, y) || !on(x, y + 2) || !on(x, y - 2);
        (isEdge ? edge : fill).push([x / 200 - 1, y / 200 - 1]);
      }
    }
    const pts = [];
    for (let i = 0; i < n; i++) {
      const src = (Math.random() < edgeShare && edge.length) || !fill.length ? edge : fill;
      const [x, y] = src[(Math.random() * src.length) | 0];
      pts.push([x + rand(-0.005, 0.005), y + rand(-0.005, 0.005)]);
    }
    return pts;
  }

  let particles = [], stars = [], shapes = {};
  let shape = "galaxy", turbo = false, t0 = performance.now();
  const pointer = { x: -1e4, y: -1e4 };

  /* Hero: a slowly turning spiral galaxy, Astra-style. */
  const GALAXY_BRIGHTNESS = 0.7; // overall dimmer for the hero galaxy; 1 = full glow
  const GALAXY_TURNS = 9.4; // radians the arms wind through, centre to rim (~1.5 turns)
  // Bright knots along each arm, as fractions of the radius; stars cluster around them.
  const KNOTS = [0, 1].map(() => Array.from({ length: 34 }, () => rand(0.18, 1)));
  let spin = 0, last = t0;
  const glow = bloom();

  // Galaxy placement and look for one star: a bright core, clumpy arms, faint dust between.
  function galaxyStar(f) {
    const arm = Math.random() < 0.5 ? 0 : 1;
    if (f < 0.12) {
      return { arm, core: true, t: Math.pow(Math.random(), 1.6) * 0.12, ja: rand(TAU), jr: gauss(),
        img: SPRITES.white, hsize: Math.random() < 0.25 ? rand(2, 3.4) : rand(0.8, 1.6), halpha: rand(0.7, 1) };
    }
    const knot = Math.random() < 0.45;
    const t = knot ? KNOTS[arm][(Math.random() * KNOTS[arm].length) | 0] + gauss() * 0.018 : 0.16 + 0.86 * Math.pow(Math.random(), 0.8);
    const big = Math.random() < (knot ? 0.18 : 0.06);
    const r = Math.random();
    // Astra palette: mostly white-blue, with vivid blue and orange accents that stay bright.
    const img = big
      ? r < 0.04 ? SPRITES.flare : r < 0.42 ? SPRITES.white : r < 0.5 ? SPRITES.cool : r < 0.72 ? SPRITES.sky : SPRITES.orange
      : r < 0.3 ? SPRITES.white : r < 0.48 ? SPRITES.cool : r < 0.72 ? SPRITES.sky : SPRITES.orange;
    return {
      arm, t: Math.min(1.02, t), ja: gauss(), jr: gauss(), img,
      accent: img === SPRITES.sky || img === SPRITES.orange || img === SPRITES.flare,
      hsize: big ? rand(2.4, 4) : rand(0.7, 1.6),
      halpha: big ? rand(0.85, 1) : rand(0.5, 0.95),
    };
  }
  const gauss = () => rand() + rand() + rand() - 1.5;

  function init() {
    resize();
    // ponytail: count scales with viewport area; lower the 8000 cap if low-end laptops stutter.
    const n = Math.round(Math.min(8000, Math.max(2500, (W * H) / 160)));
    const nStars = Math.round(n * 0.25), nShape = n - nStars;
    for (const k in DRAW) shapes[k] = sampleShape(DRAW[k], nShape, EDGE_SHARE[k]);
    const keepRatio = Math.min(1, Math.min(1900, Math.max(800, (W * H) / 700)) / nShape);
    particles = Array.from({ length: nShape }, (_, i) => ({
      x: rand(W), y: rand(H), vx: 0, vy: 0,
      ...galaxyStar(i / nShape),
      // Section shapes use only a dim subset (~1,800 stars); the galaxy uses everyone.
      keep: Math.random() < keepRatio, f: 1,
      size: Math.random() < 0.06 ? rand(1.6, 2.4) : rand(0.6, 1.4),
      img: pickSprite(),
      alpha: rand(0.45, 0.85),
      phase: rand(TAU),
      ease: rand(0.03, 0.08),
    }));
    stars = Array.from({ length: nStars }, () => {
      const bright = Math.random() < 0.04;
      return {
        u: rand(), v: rand(), depth: rand(0.2, 1), phase: rand(TAU),
        size: bright ? rand(1.4, 2.4) : rand(0.4, 1.1),
        alpha: bright ? rand(0.6, 1) : rand(0.15, 0.6),
        img: bright ? SPRITES.flare : Math.random() < 0.8 ? SPRITES.cool : SPRITES.warm,
      };
    });
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; mobile = W <= 820;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const galaxyR = () => (mobile ? Math.min(W * 0.5, H * 0.32) : Math.min(W * 0.36, H * 0.47));

  function target(p, i, time) {
    if (shape === "galaxy") {
      const R = galaxyR();
      const r = p.t * R + p.jr * R * 0.03 * (0.3 + 1.5 * p.t);
      const a = p.core ? p.ja + spin * 1.6 : p.arm * Math.PI + p.t * GALAXY_TURNS + p.ja * (0.05 + p.t * 0.13) + spin;
      return [W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r * 0.96];
    }
    const s = mobile ? Math.min(W * 0.4, H * 0.28) : Math.min(W * 0.19, H * 0.34);
    const cx = mobile ? W / 2 : W * 0.77;
    const cy = H * 0.52 + Math.sin(time * 0.8) * 6;
    let [nx, ny] = shapes[shape][i];
    if (turbo) { const a = time * 1.5, c = Math.cos(a), n = Math.sin(a); [nx, ny] = [nx * c - ny * n, nx * n + ny * c]; }
    return [cx + nx * s + Math.sin(time * 0.9 + p.phase) * 1.5, cy + ny * s + Math.cos(time * 0.7 + p.phase) * 1.5];
  }

  function frame(now) {
    const time = (now - t0) / 1000;
    spin += Math.min(0.05, (now - last) / 1000) * (turbo ? 0.6 : 0.035);
    last = now;
    draw(time, false);
    if (!reduced) requestAnimationFrame(frame);
  }

  function draw(time, snap) {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#05060a";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    const sy = scrollY;
    for (const s of stars) {
      const y = (((s.v * H - sy * 0.04 * s.depth) % H) + H) % H;
      const size = s.size * 4;
      ctx.globalAlpha = s.alpha * (0.6 + 0.4 * Math.sin(time * 1.5 + s.phase));
      ctx.drawImage(s.img, s.u * W - size / 2, y - size / 2, size, size);
    }

    const hero = shape === "galaxy";
    const dim = mobile && !hero ? 0.4 : 1;
    if (hero) {
      // Soft bloom behind the core, like the haze around Astra's centre.
      const g = galaxyR() * 0.55;
      ctx.globalAlpha = 0.55 * GALAXY_BRIGHTNESS * GALAXY_BRIGHTNESS;
      ctx.drawImage(glow, W / 2 - g, H / 2 - g, g * 2, g * 2);
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let [tx, ty] = target(p, i, time);
      const dx = tx - pointer.x, dy = ty - pointer.y, d2 = dx * dx + dy * dy;
      if (d2 < 8100) { const d = Math.sqrt(d2) + 0.01, f = (90 - d) * 0.7; tx += (dx / d) * f; ty += (dy / d) * f; }
      if (snap) { p.x = tx; p.y = ty; } else {
        p.x += (tx - p.x) * p.ease + p.vx;
        p.y += (ty - p.y) * p.ease + p.vy;
        p.vx *= 0.9; p.vy *= 0.9;
      }
      const show = hero || p.keep ? 1 : 0;
      p.f = snap ? show : p.f + (show - p.f) * 0.06;
      if (p.f < 0.01) continue;
      const size = (hero ? p.hsize * (mobile ? 0.7 : 1) : p.size) * 4;
      ctx.globalAlpha = p.f * (hero ? p.halpha * (p.accent ? 1 : GALAXY_BRIGHTNESS) : p.alpha * dim) * (0.8 + 0.2 * Math.sin(time * 2 + p.phase));
      ctx.drawImage(p.img, p.x - size / 2, p.y - size / 2, size, size);
    }
  }

  function setShape(name) {
    if ((!shapes[name] && name !== "galaxy") || name === shape) return;
    shape = name;
    for (const p of particles) p.ease = rand(0.025, 0.075);
    if (reduced) draw(0, true);
  }

  function burst(x, y) {
    if (reduced) return;
    for (const p of particles) {
      const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy) + 1;
      const v = rand(6, 22) / (1 + d / 400);
      p.vx += (dx / d) * v + rand(-2, 2);
      p.vy += (dy / d) * v + rand(-2, 2);
    }
  }

  init();
  if (reduced) draw(0, true); else requestAnimationFrame(frame);
  addEventListener("resize", () => { resize(); if (reduced) draw(0, true); });
  addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { pointer.x = e.clientX; pointer.y = e.clientY; } });
  document.addEventListener("pointerleave", () => { pointer.x = pointer.y = -1e4; });

  /* ---------------- bursts: click empty space or the replay button ---------------- */
  let bursts = 0;
  function countBurst() { if (++bursts === 3) unlock("hattrick", "Hat trick: three bursts", "⚽"); }
  document.getElementById("replay").addEventListener("click", () => { burst(W / 2, H / 2); countBurst(); });
  document.addEventListener("click", (e) => {
    if (e.target.closest("a, button, input, textarea, label, summary, .panel, .look, .stats, h1, h2, p")) return;
    burst(e.clientX, e.clientY);
    countBurst();
  });

  /* ---------------- konami: turbo ---------------- */
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let pos = 0;
  addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    pos = e.key.toLowerCase() === code[pos].toLowerCase() ? pos + 1 : e.key === code[0] ? 1 : 0;
    if (pos === code.length) {
      pos = 0;
      turbo = !turbo;
      unlock("turbo", "Turbo boost engaged", "🏎️");
    }
  });

  /* ---------------- sections: shape, nav state, XP ---------------- */
  const sections = [...document.querySelectorAll("main > section")];
  const navLinks = [...document.querySelectorAll(".nav-links a")];
  const visited = new Set();
  const xpBar = document.querySelector(".xp i"), xpText = document.getElementById("xp-text");

  function activate(sec) {
    setShape(sec.dataset.shape);
    navLinks.forEach((a) => (a.hash === "#" + sec.id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
    visited.add(sec.id);
    xpBar.style.width = (visited.size / sections.length) * 100 + "%";
    xpText.textContent = `${visited.size}/${sections.length}`;
    if (visited.size === 2) unlock("kickoff", "Kick-off: left the galaxy", "🚀");
    if (visited.size === sections.length) unlock("tour", "Full tour: every section", "🏆");
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => en.isIntersecting && activate(en.target)),
    { rootMargin: "-50% 0px -50% 0px" }
  );
  sections.forEach((s) => io.observe(s));
  // The last section may never reach the viewport midline on tall screens.
  addEventListener("scroll", () => {
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) activate(sections[sections.length - 1]);
  }, { passive: true });

  /* ---------------- mobile nav ---------------- */
  const toggle = document.querySelector(".nav-toggle"), links = document.getElementById("nav-links");
  const setMenu = (open) => { toggle.setAttribute("aria-expanded", open); links.classList.toggle("open", open); };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  links.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && links.classList.contains("open")) { setMenu(false); toggle.focus(); } });

  /* ---------------- holo card tilt ---------------- */
  if (!reduced && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".look").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
        card.style.setProperty("--ry", (px - 0.5) * 8 + "deg");
        card.style.setProperty("--rx", (0.5 - py) * 8 + "deg");
      });
      card.addEventListener("pointerleave", () => { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
    });
  }

  /* ---------------- skill search ---------------- */
  const q = document.getElementById("skill-q"), loadout = document.querySelector(".loadout"), count = document.getElementById("skill-count");
  const chips = [...loadout.querySelectorAll("li")];
  q.addEventListener("input", () => {
    const term = q.value.trim().toLowerCase();
    loadout.classList.toggle("filtering", !!term);
    let hits = 0;
    chips.forEach((li) => { const hit = !!term && li.textContent.toLowerCase().includes(term); li.classList.toggle("hit", hit); hits += hit; });
    count.textContent = !term ? "" : hits ? `${hits} equipped` : "Not in the loadout yet";
  });

  /* ---------------- contact ---------------- */
  const copyBtn = document.getElementById("copy-email");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.email);
      copyBtn.textContent = "Copied!";
      unlock("signed", "Transfer request sent", "📨");
    } catch {
      copyBtn.textContent = "Copy failed";
    }
    setTimeout(() => (copyBtn.textContent = "Copy"), 2000);
  });

  const form = document.getElementById("contact-form"), status = document.getElementById("form-status");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button");
    btn.disabled = true;
    status.className = "mono";
    status.textContent = "Sending…";
    try {
      const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.errors?.map((x) => x.message).join(", ") || `HTTP ${res.status}`);
      }
      form.reset();
      status.classList.add("ok");
      status.textContent = "Message sent. I'll get back to you soon.";
      unlock("signed", "Transfer request sent", "📨");
    } catch (err) {
      status.classList.add("err");
      status.textContent = `Couldn't send (${err.message}). Email me directly instead.`;
    } finally {
      btn.disabled = false;
    }
  });
})();
