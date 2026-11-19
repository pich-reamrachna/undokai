"use strict";

// Typhoon Race: step-card scenes and the whole-course top view.
(() => {
  const racing = teams[0].color;
  const waiting = "#fff0a2";
  const nextUp = "#f7e282";

  const steps = [
    {
      title: "Grab the pole and go",
      detail: "Your group of five lines up at the start, all holding the same long pole. Then run together to cone 1.",
      scene: drawHold, duration: 2600, still: 0,
    },
    {
      title: "Spin at cone 1, U-turn at cone 2",
      detail: "Run out together in your lane. Swing the whole group around cone 1 in a full circle. At cone 2, make a U-turn and run back to your team.",
      scene: drawSpin, duration: 5000, still: 0.12,
    },
    {
      title: "Sweep low, then high",
      detail: "Run back across the start line with the pole. The three middle players let go and step away. The two end players sweep the pole low from the front row to the back, and everyone jumps over it. Then they sweep it back to the front held up high, and everyone ducks under it. Finally they drop the pole at the start line for the front row to pick up.",
      scene: drawSweep, duration: 9000, still: 0.36,
    },
    {
      title: "Next group goes",
      detail: "The front row picks up the pole and runs. Keep going until every group on your team has run.",
      scene: drawNext, duration: 2200, still: 0.5,
    },
  ];

  function cone(ctx, x, y) {
    block(ctx, "#a84f37", x - 6, y, 13, 3);
    block(ctx, "#ef844b", x - 4, y - 4, 9, 5);
    block(ctx, "#fff0c3", x - 3, y - 6, 7, 3);
    block(ctx, "#ef844b", x - 2, y - 10, 5, 5);
    block(ctx, "#f5a461", x, y - 12, 2, 2);
  }

  function pole(ctx, x1, y1, x2, y2) {
    ctx.lineCap = "square";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = "#fff0bc";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function track(ctx, startLine) {
    block(ctx, "#9edbdc", 0, 0, W, H);
    block(ctx, "#b1e0a3", 0, 14, W, 12);
    block(ctx, "#a2d492", 0, 15, W, 5);
    for (let i = 0; i < 9; i++) block(ctx, "#87c289", (i * 37 + 6) % W, 20 + (i % 3), 3, 2);
    block(ctx, "#ac6e50", 0, 25, W, H - 25);
    block(ctx, "#e5a16f", 0, 28, W, H - 28);
    if (!startLine) return;
    for (let x = 8; x < 17; x += 3) {
      for (let y = 28; y < H; y += 3) {
        if (((x - 8) / 3 + (y - 28) / 3) % 2 === 0) block(ctx, "#fff0cf", x, y, 3, 3);
      }
    }
  }

  // Five players side by side on one pole, seen at an angle: the row runs diagonally into
  // the distance (x, y is the nearest player's feet), so both the pole and the row show.
  // The pole runs through everyone's leading hand, just ahead of their bodies, so it stays in view.
  function group(ctx, x, y, color, stride) {
    for (let i = 4; i >= 0; i--) runner(ctx, x + i * 10, y - i * 8, color, stride ? (stride + i) % 2 : 0);
    const hand = (i) => [x + i * 10 + 7, y - 12 - i * 8];
    pole(ctx, ...hand(-0.5), ...hand(4.5));
  }

  // Grab the pole at the start, then run together up to cone 1.
  function drawHold(ctx, t) {
    track(ctx, true);
    cone(ctx, 136, 64);
    cone(ctx, 154, 64);
    for (let i = 0; i < 3; i++) runner(ctx, 11, 46 + i * 14, waiting);
    if (t < 0.3) {
      group(ctx, 30, 89 - (Math.floor(t * 14) % 2), racing, 0);
      return;
    }
    const p = ease(Math.min((t - 0.3) / 0.55, 1));
    group(ctx, lerp(30, 78, p), 89, racing, p < 1 ? 1 + (Math.floor(t * 30) % 2) : 0);
  }

  // Full circle around cone 1, run to cone 2, U-turn there, and run all the way back to the team.
  function drawSpin(ctx, t) {
    track(ctx, true);
    const cy = 60;
    const cones = [64, 120];
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      block(ctx, "#f2bd8c", cones[0] + Math.cos(a) * 32, cy + Math.sin(a) * 12, 2, 1);
    }
    for (let k = 0; k <= 12; k++) {
      const a = -Math.PI / 2 + (k / 12) * Math.PI;
      block(ctx, "#f2bd8c", cones[1] + Math.cos(a) * 32, cy + Math.sin(a) * 12, 2, 1);
    }
    for (let i = 0; i < 3; i++) runner(ctx, 11, 46 + i * 14, waiting);
    cones.forEach((x) => cone(ctx, x, cy));
    let x = cones[0];
    let angle = Math.PI / 2;
    let moving = true;
    if (t < 0.38) {
      angle -= (t / 0.38) * Math.PI * 2;
    } else if (t < 0.5) {
      x = lerp(cones[0], cones[1], ease((t - 0.38) / 0.12));
    } else if (t < 0.66) {
      x = cones[1];
      angle -= ((t - 0.5) / 0.16) * Math.PI;
    } else {
      x = lerp(cones[1], 30, ease(Math.min((t - 0.66) / 0.24, 1)));
      angle = -Math.PI / 2;
      moving = t < 0.9;
    }
    const c = Math.cos(angle);
    const s = Math.sin(angle) * 0.38;
    const stride = moving ? Math.floor(t * 46) % 2 : 0;
    const players = [0, 1, 2, 3, 4].map((i) => [x + c * (6 + i * 6), cy + s * (6 + i * 6)]);
    players.sort((a, b) => a[1] - b[1]).forEach(([px, py]) => runner(ctx, px, py, racing, stride));
    pole(ctx, x + c * 2, cy + s * 2 - 13, x + c * 32, cy + s * 32 - 13);
  }

  // Waiting groups stand in rows (one group per row) behind the start line on the right.
  // The racing group runs back in across the start line and the three middle players scatter.
  // The two end players sweep low right to left (jump) and high left to right (duck),
  // then drop the pole at the start line, and the front row walks up and picks it up.
  function drawSweep(ctx, t) {
    track(ctx, false);
    for (let x = 104; x < 113; x += 3) {
      for (let y = 28; y < H; y += 3) {
        if (((x - 104) / 3 + (y - 28) / 3) % 2 === 0) block(ctx, "#fff0cf", x, y, 3, 3);
      }
    }
    const lanes = [36, 50, 64, 78, 92];
    const scatterTo = [null, [166, 30], [178, 64], [166, 98]];
    const rows = [12, 32, 52, 72, 92];
    const sprites = [];
    let cursor = 122;
    let holderX = 122;
    let holders = true;
    let poleTop = 31;
    let low = true;
    let sweeping = false;
    let stride = 0;
    let front = null;
    if (t < 0.15) {
      const p = ease(t / 0.15);
      cursor = holderX = lerp(176, 122, p);
      stride = p < 1 ? Math.floor(t * 70) % 2 : 0;
      poleTop = 25;
      lanes.slice(1, 4).forEach((y) => sprites.push({ x: cursor, y, color: racing, stride }));
    } else if (t < 0.25) {
      const p = ease((t - 0.15) / 0.1);
      poleTop = lerp(25, 31, p);
      for (let k = 1; k < 4; k++) {
        sprites.push({ x: lerp(122, scatterTo[k][0], p), y: lerp(lanes[k], scatterTo[k][1], p), color: racing, stride: Math.floor(t * 70) % 2 });
      }
    } else if (t < 0.81) {
      low = t < 0.53;
      sweeping = true;
      const local = low ? (t - 0.25) / 0.28 : (t - 0.53) / 0.28;
      const p = ease(Math.min(local / 0.88, 1));
      cursor = holderX = low ? 122 - p * 118 : 4 + p * 118;
      poleTop = low ? 31 : 15;
      stride = p < 1 ? Math.floor(t * 50) % 2 : 0;
    } else if (t < 0.89) {
      // Let go: the pole falls flat on the ground and the two end players step away.
      const p = (t - 0.81) / 0.08;
      low = false;
      poleTop = lerp(15, 36, Math.min(p * 2, 1) ** 2);
      const away = ease(Math.max(0, (p - 0.3) / 0.7));
      holderX = lerp(122, 176, away);
      stride = away > 0 && away < 1 ? Math.floor(t * 70) % 2 : 0;
    } else {
      // The front row walks up to the pole and lifts it.
      const p = (t - 0.89) / 0.11;
      holders = false;
      const walk = ease(Math.min(p / 0.6, 1));
      poleTop = lerp(36, 25, ease(Math.max(0, (p - 0.6) / 0.4)));
      front = [48, 60, 72].map((y, k) => ({ x: lerp(92, 122, walk), y: lerp(y, lanes[k + 1], walk), color: waiting, stride: walk < 1 ? Math.floor(t * 60) % 2 : 0 }));
      sprites.push(...front);
    }
    rows.forEach((x) => {
      if (front && x === 92) return;
      const near = sweeping ? Math.max(0, 1 - (Math.abs(x - cursor) / 14) ** 2) : 0;
      [48, 60, 72].forEach((y) => {
        if (low) sprites.push({ x, y: y - Math.round(near * 10), ground: near > 0 ? y : null, color: waiting });
        else sprites.push({ x, y, color: waiting, duck: near > 0.15 });
      });
    });
    if (holders) sprites.push({ x: holderX, y: lanes[0], color: racing, stride });
    sprites.sort((a, b) => a.y - b.y).forEach((sprite) => {
      if (sprite.ground) shadow(ctx, sprite.x, sprite.ground);
      runner(ctx, sprite.x, sprite.y, sprite.color, sprite.stride || 0, sprite.duck);
    });
    pole(ctx, cursor + 1, poleTop, cursor + 1, poleTop + 56);
    if (holders) runner(ctx, holderX, lanes[4], racing, stride);
  }

  function drawNext(ctx, t) {
    track(ctx, true);
    cone(ctx, 136, 64);
    cone(ctx, 154, 64);
    const p = ease(Math.min(t / 0.8, 1));
    group(ctx, lerp(28, 78, p), 89, nextUp, p < 1 ? 1 + (Math.floor(t * 24) % 2) : 0);
  }

  // Course overview: a top view of all three lanes playing one full round on a loop.
  const CW = 320;
  const CH = 246;
  const laneOffsets = [0, 320, 160];
  const START = 126;
  const CONES = [190, 262];
  const ROWS = [108, 96, 84, 72, 60];
  const BACK = 48;
  const coursePhases = [
    { id: "ready", ms: 700, step: 0, caption: "The racing group holds the pole at the start." },
    { id: "run1", ms: 1000, step: 1, caption: "Run to cone 1." },
    { id: "spin1", ms: 1600, step: 1, caption: "Spin a full circle around cone 1." },
    { id: "run2", ms: 800, step: 1, caption: "Run to cone 2." },
    { id: "turn", ms: 900, step: 1, caption: "Make a U-turn at cone 2." },
    { id: "back", ms: 1400, step: 1, caption: "Run back to your team at the start." },
    { id: "low", ms: 1900, step: 2, caption: "Two players sweep the pole low. The waiting rows jump." },
    { id: "high", ms: 1700, step: 2, caption: "They sweep it back high. The waiting rows duck." },
    { id: "drop", ms: 800, step: 2, caption: "They drop the pole at the start line." },
    { id: "hand", ms: 1500, step: 3, caption: "The front row picks up the pole and goes next." },
  ];
  const CYCLE = coursePhases.reduce((total, phase) => total + phase.ms, 0);
  const slot = (x, c, k) => [x, c - 16 + 8 * k];

  function phaseAt(time) {
    let t = ((time % CYCLE) + CYCLE) % CYCLE;
    for (const phase of coursePhases) {
      if (t < phase.ms) return [phase, t / phase.ms];
      t -= phase.ms;
    }
    return [coursePhases[0], 0];
  }

  // side 1 runs on the lower half of the lane, side -1 on the upper half (after the U-turn).
  function formation(x, c, side = 1) {
    return {
      players: [0, 1, 2, 3, 4].map((k) => [x, c + side * (6 + 7 * k)]),
      pole: [[x, c + side * 3], [x, c + side * 37]],
    };
  }

  function circling(x, c, angle) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    return {
      players: [0, 1, 2, 3, 4].map((k) => [x + dx * (6 + 7 * k), c + dy * (6 + 7 * k)]),
      pole: [[x + dx * 3, c + dy * 3], [x + dx * 37, c + dy * 37]],
    };
  }

  function topPole(ctx, [a, b], height) {
    pixelLine(ctx, [a[0] + height, a[1] + height], [b[0] + height, b[1] + height], "rgba(40,42,73,.22)", 3);
    pixelLine(ctx, a, b, ink, 3);
    pixelLine(ctx, a, b, "#fff0bc", 1);
  }

  function topCone(ctx, x, y) {
    block(ctx, "#a84f37", x - 3, y - 3, 7, 7);
    block(ctx, "#ef844b", x - 2, y - 2, 5, 5);
    block(ctx, "#fff0c3", x - 1, y - 1, 3, 3);
    block(ctx, "#ef844b", x, y, 1, 1);
  }

  function drawLane(ctx, lane, time) {
    const c = 52 + lane * 76;
    const color = teams[lane].color;
    const [phase, p] = phaseAt(time - laneOffsets[lane]);
    const e = ease(p);
    const finished = [];
    let frame;
    let height = 2;
    let sweepX = null;
    let shift = 0;
    if (phase.id === "ready") frame = formation(START, c);
    if (phase.id === "run1") frame = formation(lerp(START, CONES[0], e), c);
    if (phase.id === "spin1") frame = circling(CONES[0], c, Math.PI / 2 - p * Math.PI * 2);
    if (phase.id === "run2") frame = formation(lerp(CONES[0], CONES[1], e), c);
    if (phase.id === "turn") frame = circling(CONES[1], c, Math.PI / 2 - p * Math.PI);
    if (phase.id === "back") frame = formation(lerp(CONES[1], 122, e), c, -1);
    if (phase.id === "low") {
      // The two end players take the pole ends, the other three walk to the back.
      const setup = Math.min(p / 0.18, 1);
      const x = lerp(116, 52, ease(Math.max(0, (p - 0.18) / 0.82)));
      const holders = [mix([122, c - 34], [x, c - 22], setup), mix([122, c - 6], [x, c + 22], setup)];
      for (let k = 1; k < 4; k++) {
        const route = [[122, c - 6 - 7 * k], [124 + 7 * k, c - 31], [BACK - 14 + 7 * k, c - 31], slot(BACK, c, k)];
        const leg = Math.min(Math.floor(p * 3), 2);
        finished.push(mix(route[leg], route[leg + 1], p * 3 - leg));
      }
      frame = { players: holders, pole: holders };
      height = 1;
      if (setup === 1) sweepX = x;
    }
    if (phase.id === "high") {
      sweepX = lerp(52, 116, e);
      for (let k = 1; k < 4; k++) finished.push(slot(BACK, c, k));
      frame = { players: [[sweepX, c - 22], [sweepX, c + 22]] };
      frame.pole = frame.players;
      height = 5;
    }
    if (phase.id === "drop") {
      // The end players let the pole fall at the start line and walk to the back.
      finished.push(mix([116, c - 22], slot(BACK, c, 0), e), mix([116, c + 22], slot(BACK, c, 4), e));
      for (let k = 1; k < 4; k++) finished.push(slot(BACK, c, k));
      frame = { players: [], pole: [[116, c - 22], [116, c + 22]] };
      height = 5 * Math.max(0, 1 - p / 0.3);
    }
    if (phase.id === "hand") {
      // The front row walks up, picks the pole off the ground and steps up to the start.
      const reach = ease(Math.min(p / 0.45, 1));
      const go = ease(Math.max(0, (p - 0.45) / 0.55));
      shift = 12 * ease(Math.max(0, (p - 0.2) / 0.8));
      for (let k = 0; k < 5; k++) finished.push(slot(BACK + shift, c, k));
      frame = {
        players: [0, 1, 2, 3, 4].map((k) => mix(mix(slot(ROWS[0], c, k), [116, c - 20 + 10 * k], reach), [START, c + 6 + 7 * k], go)),
        pole: [mix([116, c - 22], [START, c + 3], go), mix([116, c + 22], [START, c + 37], go)],
      };
      height = 2 * go;
    }
    if (phase.id !== "high") topPole(ctx, frame.pole, height);
    (phase.id === "hand" ? ROWS.slice(1) : ROWS).forEach((rowX) => {
      const x = rowX + shift;
      const pose = sweepX !== null && Math.abs(x - sweepX) < 6 ? (phase.id === "low" ? "jump" : "duck") : "stand";
      for (let k = 0; k < 5; k++) topPlayer(ctx, slot(x, c, k), color, pose);
    });
    finished.forEach((at) => topPlayer(ctx, at, color, "stand"));
    frame.players.forEach((at) => topPlayer(ctx, at, color, "stand"));
    if (phase.id === "high") topPole(ctx, frame.pole, height);
  }

  function drawCourse(ctx, time) {
    block(ctx, "#b9e3a8", 0, 0, CW, CH);
    for (let lane = 0; lane < 3; lane++) block(ctx, lane % 2 ? "#a3d693" : "#9bcf8b", 0, 14 + lane * 76, CW, 76);
    for (let i = 0; i < 4; i++) block(ctx, "#fff7e0", 0, 14 + i * 76, CW, 1);
    for (let y = 15; y < 242; y += 2) {
      block(ctx, (y - 15) % 4 ? "#fff7e0" : "#6c8a62", 119, y, 2, 2);
      block(ctx, (y - 15) % 4 ? "#6c8a62" : "#fff7e0", 121, y, 2, 2);
    }
    for (let lane = 0; lane < 3; lane++) {
      const c = 52 + lane * 76;
      // Dotted paths: a full circle around cone 1, a half circle (the U-turn) at cone 2.
      for (let k = 0; k < 30; k++) {
        const a = (k / 30) * Math.PI * 2;
        block(ctx, "#86bd78", CONES[0] + Math.cos(a) * 37, c + Math.sin(a) * 37, 1, 1);
      }
      for (let k = 0; k <= 15; k++) {
        const a = -Math.PI / 2 + (k / 15) * Math.PI;
        block(ctx, "#86bd78", CONES[1] + Math.cos(a) * 37, c + Math.sin(a) * 37, 1, 1);
      }
      CONES.forEach((x) => topCone(ctx, x, c));
      drawLane(ctx, lane, time);
      ctx.fillStyle = ink;
      ctx.font = "bold 8px monospace";
      ctx.fillText(teams[lane].name, 5, c - 24);
    }
  }

  const view = select("typhoon-race-view");
  registerGuide({
    hash: "#typhoon-race",
    title: "Typhoon Race",
    view,
    controllers: [
      createSteps(view, steps),
      createOverview(view, { steps, draw: drawCourse, phaseAt: (time) => phaseAt(time)[0], still: 2400 }),
    ],
  });
})();
