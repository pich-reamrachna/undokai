"use strict";

// Beanbag Toss: step-card scenes, the page illustration and the whole-field top view.
(() => {
  const team = teams[0].color;
  const volunteerColor = "#4fae63";
  const ballColors = ["#e8503a", "#fffaf0"];
  const skin = "#f4c39a";
  const red = "#e8503a";

  // Side view: the basket's circle line is an ellipse on the ground around the basket holder.
  const CX = 80;
  const CY = 66;
  const RX = 52;
  const RY = 16;
  const MOUTH = [82, 19];
  const LINE = Array.from({ length: 16 }, (_, k) => {
    const a = (k / 16) * Math.PI * 2 + 0.2;
    return [CX + Math.cos(a) * RX, CY + Math.sin(a) * RY];
  });
  // Spots just outside the circle line where players stand.
  const SPOTS = [[22, 60], [42, 86], [118, 86], [138, 60], [58, 44], [102, 44]];
  // Where the 3 volunteers wait inside the circle.
  const HELPERS = [[46, 64], [114, 64], [68, 78]];

  const steps = [
    {
      title: "Wait for the whistle",
      detail: "Your team's balls are laid on the circle line around your basket. Stand outside the circle. A whistle starts the match.",
      scene: drawReady, duration: 3200, still: 0.2,
    },
    {
      title: "Pick up and throw",
      detail: "Pick up balls from the line and throw them into your basket. If a ball falls inside the circle, a volunteer picks it up and throws it back out to you.",
      scene: drawThrow, duration: 5600, still: 0.24,
    },
    {
      title: "Stay outside the circle",
      detail: "Only volunteers go inside the circle. Leave fallen balls to them. If you step in, you'll be told to go back out and throw from there.",
      scene: drawInside, duration: 5600, still: 0.52,
    },
    {
      title: "Stop at the end signal",
      detail: "Everyone stops at the end signal. Only balls inside the basket count. A ball thrown after the signal doesn't count.",
      scene: drawStop, duration: 5000, still: 0.85,
    },
  ];

  function field(ctx) {
    block(ctx, "#9edbdc", 0, 0, W, H);
    block(ctx, "#a2d492", 0, 14, W, H - 14);
    for (let y = 24; y < H; y += 14) block(ctx, "#aadb9b", 0, y, W, 7);
    for (let i = 0; i < 12; i++) block(ctx, "#87c289", (i * 41 + 9) % W, 30 + ((i * 23) % 60), 3, 2);
  }

  function ring(ctx, color) {
    for (let k = 0; k < 56; k += 2) {
      const a = (k / 56) * Math.PI * 2;
      block(ctx, color, CX + Math.cos(a) * RX - 1, CY + Math.sin(a) * RY, 3, 1);
    }
  }

  function ball(ctx, x, y, index) {
    block(ctx, ink, x - 2, y - 2, 4, 4);
    block(ctx, ballColors[index % 2], x - 1, y - 1, 2, 2);
  }

  // A volunteer holds the basket up on a pole in the middle of the circle.
  function basket(ctx, count, glow) {
    runner(ctx, 86, 70, volunteerColor);
    block(ctx, "#8a5a3a", 81, 24, 2, 34);
    if (glow) block(ctx, "#ffe079", 71, 14, 22, 16);
    for (let i = 0; i < Math.min(count, 5); i++) ball(ctx, 76 + i * 3, 19 - (i % 2), i);
    block(ctx, ink, 73, 20, 18, 2);
    block(ctx, "#e9c27a", 74, 22, 16, 5);
    for (let x = 76; x < 90; x += 3) block(ctx, "#c99a52", x, 22, 1, 5);
    block(ctx, ink, 75, 27, 14, 1);
  }

  function player(ctx, [x, y], pose, stride, color = team) {
    runner(ctx, x, y, color, stride, pose === "pick");
    // Throwing arm raised on the side facing the basket.
    if (pose === "throw") block(ctx, skin, x + (x < CX ? 3 : -5), y - 30, 3, 6);
  }

  function whistle(ctx, x, y, t) {
    block(ctx, ink, x, y, 11, 7);
    block(ctx, "#ffd25a", x + 1, y + 1, 9, 5);
    block(ctx, ink, x + 11, y + 1, 5, 3);
    block(ctx, "#ffd25a", x + 11, y + 2, 4, 1);
    if (Math.floor(t * 40) % 2 === 0) {
      block(ctx, ink, x - 4, y - 1, 2, 1);
      block(ctx, ink, x - 5, y + 3, 3, 1);
      block(ctx, ink, x - 4, y + 7, 2, 1);
    }
  }

  function mark(ctx, x, y, points, color) {
    points.forEach(([dx, dy]) => block(ctx, ink, x + dx - 1, y + dy - 1, 4, 4));
    points.forEach(([dx, dy]) => block(ctx, color, x + dx, y + dy, 2, 2));
  }

  const TICK = [[0, 3], [1, 4], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1], [7, 0]];
  const CROSS = [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [0, 4], [1, 3], [3, 1], [4, 0]];

  // A "!" speech bubble above a player who stepped inside the circle.
  function warning(ctx, x, y) {
    block(ctx, ink, x - 4, y - 44, 9, 13);
    block(ctx, "#fffaf0", x - 3, y - 43, 7, 11);
    block(ctx, red, x - 1, y - 41, 3, 5);
    block(ctx, red, x - 1, y - 35, 3, 2);
  }

  // Scripted scene: players and volunteers follow keyframed paths, pick balls off the ground
  // and throw them. Actors with `helper: true` are the volunteers inside the circle.
  // throws: { by, pick: [from, to], start, end, result: "in" | "miss" | "late" | "toss", to, peak }
  function stage(ctx, t, { actors, throws, ringColor = "#fff7e0", glow = false, after }) {
    field(ctx);
    ring(ctx, ringColor);
    const at = (actor, time) => {
      const path = actor.path;
      if (time <= path[0][0]) return path[0][1];
      for (let i = 0; i < path.length - 1; i++) {
        const [t0, p0] = path[i];
        const [t1, p1] = path[i + 1];
        if (time <= t1) return mix(p0, p1, ease((time - t0) / (t1 - t0 || 1)));
      }
      return path[path.length - 1][1];
    };
    // Replay picks and landings in order to know which balls are still on the ground.
    let ground = LINE.map((spot, index) => ({ spot, index }));
    let count = 0;
    const events = [];
    throws.forEach((th, n) => {
      if (th.pick) events.push({ time: (th.pick[0] + th.pick[1]) / 2, pick: th });
      events.push({ time: th.end, land: th, n });
    });
    events.sort((a, b) => a.time - b.time).forEach((event) => {
      if (event.time > t) return;
      if (event.pick) {
        const [px, py] = at(actors[event.pick.by], event.time);
        const nearest = ground.reduce((best, g) => (!best || Math.hypot(g.spot[0] - px, g.spot[1] - py) < Math.hypot(best.spot[0] - px, best.spot[1] - py) ? g : best), null);
        ground = ground.filter((g) => g !== nearest);
      } else if (event.land.result === "in") {
        count += 1;
      } else {
        ground.push({ spot: event.land.rest || event.land.to, index: event.n });
      }
    });
    const sprites = ground.map((g) => ({ y: g.spot[1], draw: () => ball(ctx, g.spot[0], g.spot[1], g.index) }));
    actors.forEach((actor, index) => {
      const pos = at(actor, t);
      const before = at(actor, t - 0.01);
      const moving = Math.hypot(pos[0] - before[0], pos[1] - before[1]) > 0.05;
      let pose = "stand";
      throws.forEach((th) => {
        if (th.by !== index) return;
        if (th.pick && t >= th.pick[0] && t < th.pick[1]) pose = "pick";
        if (t >= th.start - 0.04 && t < th.start + 0.05) pose = "throw";
      });
      sprites.push({ y: pos[1], draw: () => player(ctx, pos, pose, moving ? Math.floor(t * 60) % 2 : 0, actor.helper ? volunteerColor : team) });
    });
    sprites.push({ y: 70, draw: () => basket(ctx, count, glow) });
    sprites.sort((a, b) => a.y - b.y).forEach((sprite) => sprite.draw());
    throws.forEach((th, n) => {
      if (t < th.start || t >= th.end) return;
      const from = at(actors[th.by], th.start);
      const hand = [from[0] + (from[0] < CX ? 4 : -4), from[1] - 28];
      const to = th.to || MOUTH;
      const p = (t - th.start) / (th.end - th.start);
      const x = lerp(hand[0], to[0], p);
      const y = lerp(hand[1], to[1], p) - (th.peak || 34) * 4 * p * (1 - p);
      ball(ctx, x, y, n);
      if (th.result === "late") mark(ctx, x + 4, y - 9, CROSS, red);
    });
    if (after) after(ctx, t, at);
  }

  const still = (spot) => ({ path: [[0, spot]] });
  const helpers = () => HELPERS.map((spot) => ({ path: [[0, spot]], helper: true }));

  // Step 1: balls lie on the circle line; the whistle blows and players move up to the line.
  function drawReady(ctx, t) {
    const actors = [...SPOTS.map((spot) => ({ path: [[0.6, spot], [0.82, mix(spot, [CX, CY], 0.18)]] })), ...helpers()];
    const throws = SPOTS.map((_, by) => ({ by, pick: [0.86, 1.1], start: 2, end: 2 }));
    stage(ctx, t, {
      actors,
      throws,
      after: (c) => {
        if (t >= 0.45 && t < 0.8) whistle(c, 60, 4, t);
      },
    });
  }

  // Step 2: pick up and throw. A miss drops inside the circle; a volunteer picks it up and
  // tosses it back out, and a player throws it again.
  function drawThrow(ctx, t) {
    const [helper, ...otherHelpers] = helpers();
    helper.path = [[0.42, HELPERS[0]], [0.5, [58, 64]], [0.58, [58, 64]], [0.7, HELPERS[0]]];
    const actors = [
      { path: [[0, SPOTS[0]], [0.7, SPOTS[0]], [0.8, [26, 84]]] },
      still(SPOTS[1]),
      still(SPOTS[3]),
      still(SPOTS[4]),
      still(SPOTS[5]),
      helper,
      ...otherHelpers,
    ];
    const throws = [
      { by: 0, pick: [0, 0.08], start: 0.1, end: 0.32, result: "in" },
      { by: 2, pick: [0.04, 0.12], start: 0.14, end: 0.4, result: "miss", to: [62, 62], peak: 26 },
      { by: 4, pick: [0.2, 0.28], start: 0.3, end: 0.52, result: "in" },
      { by: 1, pick: [0.4, 0.48], start: 0.5, end: 0.72, result: "in" },
      { by: 5, pick: [0.5, 0.56], start: 0.6, end: 0.72, result: "toss", to: [20, 82], peak: 16 },
      { by: 3, pick: [0.62, 0.7], start: 0.72, end: 0.94, result: "in" },
      { by: 0, pick: [0.8, 0.86], start: 0.88, end: 0.99, result: "in" },
    ];
    stage(ctx, t, { actors, throws });
  }

  // Step 3: a ball drops inside the circle. A player steps in to get it and is told to go back;
  // a volunteer throws it out to them instead, and they throw from outside.
  function drawInside(ctx, t) {
    const inside = t >= 0.44 && t < 0.62;
    const [helper, ...otherHelpers] = helpers();
    helper.path = [[0.6, HELPERS[0]], [0.68, [54, 68]], [0.76, [54, 68]], [0.86, HELPERS[0]]];
    const actors = [
      { path: [[0.3, [24, 76]], [0.44, [42, 74]], [0.62, [42, 74]], [0.76, [22, 80]]] },
      still(SPOTS[3]),
      still(SPOTS[5]),
      helper,
      ...otherHelpers,
    ];
    const throws = [
      { by: 1, pick: [0.02, 0.08], start: 0.1, end: 0.28, result: "miss", to: [57, 71], peak: 24 },
      { by: 2, pick: [0.2, 0.28], start: 0.3, end: 0.52, result: "in" },
      { by: 3, pick: [0.68, 0.74], start: 0.76, end: 0.86, result: "toss", to: [26, 88], peak: 14 },
      { by: 0, pick: [0.86, 0.9], start: 0.91, end: 0.99, result: "in" },
    ];
    stage(ctx, t, {
      actors,
      throws,
      ringColor: inside && Math.floor(t * 30) % 2 === 0 ? red : "#fff7e0",
      after: (c, time, at) => {
        if (inside) {
          const [x, y] = at(actors[0], time);
          warning(c, x, y);
        }
      },
    });
  }

  // Step 4: the end signal stops play; a late throw doesn't count, then the basket is counted.
  function drawStop(ctx, t) {
    const actors = [still(SPOTS[0]), still(SPOTS[1]), still(SPOTS[3]), still(SPOTS[5]), ...helpers()];
    const throws = [
      { by: 0, pick: [0, 0.06], start: 0.08, end: 0.3, result: "in" },
      { by: 1, pick: [0.06, 0.12], start: 0.14, end: 0.34, result: "in" },
      { by: 2, pick: [0.3, 0.38], start: 0.44, end: 0.64, result: "late", rest: [98, 62] },
    ];
    stage(ctx, t, {
      actors,
      throws,
      glow: t >= 0.76,
      after: (c) => {
        if (t >= 0.36 && t < 0.58) whistle(c, 60, 4, t);
        if (t >= 0.64 && t < 0.74) mark(c, 94, 12, CROSS, red);
        if (t >= 0.76) mark(c, 96, 8, TICK, "#3e9e5a");
      },
    });
  }

  // Illustration beside the title: a volunteer holding the basket while balls fly in.
  function drawArt(canvas) {
    const ctx = canvas.getContext("2d");
    for (let y = 46; y < 96; y++) {
      const half = 78 * Math.sqrt(Math.max(0, 1 - ((y - 70) / 25) ** 2));
      block(ctx, y % 6 < 3 ? "#a2d492" : "#aadb9b", 80 - half, y, half * 2, 1);
    }
    ring(ctx, "#fff7e0");
    LINE.filter((_, k) => k % 3).forEach((spot, k) => ball(ctx, spot[0], spot[1], k));
    basket(ctx, 3, false);
    player(ctx, [52, 74], "stand", 0, volunteerColor);
    player(ctx, [24, 76], "throw", 0);
    player(ctx, [136, 78], "throw", 0);
    [[46, 18], [60, 8], [108, 12], [118, 26]].forEach(([x, y], k) => ball(ctx, x, y, k));
  }

  // Top view: three teams' circles side by side, playing one compressed 2-minute match.
  const VW = 320;
  const VH = 196;
  const CENTERS = [58, 160, 262].map((x) => [x, 106]);
  const R_LINE = 34;
  const R_PLAYER = 44;
  const fieldPhases = [
    { id: "ready", ms: 1400, step: 0, caption: "Balls are laid on each circle line. Players wait outside, and 3 volunteers wait inside." },
    { id: "whistle", ms: 700, step: 0, caption: "The whistle starts the match." },
    { id: "throw", ms: 5200, step: 1, caption: "Pick up balls from the line and throw them into your basket from outside the circle." },
    { id: "inside", ms: 2400, step: 2, caption: "A player steps inside the circle and is told to go back out. Only the volunteers go inside." },
    { id: "throw2", ms: 3000, step: 1, caption: "Balls that fall inside are thrown back out by the volunteers. Keep throwing." },
    { id: "stop", ms: 1600, step: 3, caption: "End signal: everyone stops. A ball thrown after it doesn't count." },
    { id: "count", ms: 2600, step: 3, caption: "Only balls inside the basket count. Totals over all 4 matches decide the winner." },
  ];
  const CYCLE = fieldPhases.reduce((total, phase) => total + phase.ms, 0);
  const PLAY_START = 2100;
  const PLAY_END = 12700;
  const INSIDE = [PLAY_START + 5200, PLAY_START + 7600];
  const RATES = [0.58, 0.5, 0.64];
  const FLIGHT = 700;
  const hash = (a, b, c) => {
    const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
    return v - Math.floor(v);
  };
  const local = (time) => ((time % CYCLE) + CYCLE) % CYCLE;
  // The 3 volunteers' spots inside each circle.
  const helperHomes = CENTERS.map(([cx, cy], teamIndex) => [0.5, 7 / 6, 11 / 6].map((turn) => {
    const a = turn * Math.PI + teamIndex * 0.5;
    return [cx + Math.cos(a) * 18, cy + Math.sin(a) * 18];
  }));
  const nearestIndex = (spots, [x, y]) => spots.reduce((best, s, i) => (Math.hypot(s[0] - x, s[1] - y) < Math.hypot(spots[best][0] - x, spots[best][1] - y) ? i : best), 0);

  function phaseAt(time) {
    let t = local(time);
    for (const phase of fieldPhases) {
      if (t < phase.ms) return phase;
      t -= phase.ms;
    }
    return fieldPhases[0];
  }

  // Every team's throws for one match, worked out once: who throws when, and whether it goes in.
  const schedules = CENTERS.map(([cx, cy], teamIndex) => {
    const throws = [];
    for (let k = 0; k < 10; k++) {
      const angle = (k / 10) * Math.PI * 2 + teamIndex * 0.3 + Math.PI / 10;
      const offset = hash(teamIndex, k, 0) * 1200;
      const period = 1500 + hash(teamIndex, k, 1) * 900;
      for (let n = 0; ; n++) {
        const pick = PLAY_START + 200 + offset + n * period;
        const start = pick + 350;
        if (start + FLIGHT > PLAY_END) break;
        if (teamIndex === 1 && k === 2 && pick + 400 > INSIDE[0] && pick < INSIDE[1]) continue;
        const scored = hash(teamIndex, k, n + 7) < RATES[teamIndex];
        // A miss drops inside the circle; a volunteer throws it back out past the line.
        const missAngle = angle + Math.PI + (hash(teamIndex, k, n + 3) - 0.5) * 1.2;
        const missRadius = 10 + hash(teamIndex, k, n + 5) * 18;
        const outRadius = R_LINE + 7 + hash(teamIndex, k, n + 9) * 5;
        const miss = [cx + Math.cos(missAngle) * missRadius, cy + Math.sin(missAngle) * missRadius];
        const out = [cx + Math.cos(missAngle) * outRadius, cy + Math.sin(missAngle) * outRadius];
        throws.push({ k, angle, pick, start, scored, miss, out, helper: nearestIndex(helperHomes[teamIndex], miss) });
      }
    }
    // White Team demonstrates a throw after the end signal, which doesn't count.
    if (teamIndex === 0) {
      const angle = (4 / 10) * Math.PI * 2 + Math.PI / 10;
      throws.push({ k: 4, angle, pick: PLAY_END + 100, start: PLAY_END + 300, late: true, rest: [cx + 12, cy - 10] });
    }
    return throws.sort((a, b) => a.pick - b.pick);
  });

  // Replays one team's match up to `time`: balls players can pick up (outside the circle),
  // valid throws, balls a volunteer returns from inside the circle, and the score.
  function simulate(teamIndex, time) {
    const [cx, cy] = CENTERS[teamIndex];
    let ground = Array.from({ length: 40 }, (_, j) => {
      const a = (j / 40) * Math.PI * 2 + teamIndex;
      return [cx + Math.cos(a) * R_LINE, cy + Math.sin(a) * R_LINE];
    });
    const valid = [];
    const returns = [];
    let score = 0;
    // A returned ball becomes pickable once the volunteer's toss lands outside the line.
    const settle = (until) => returns.forEach((r) => {
      if (!r.settled && r.tossEnd <= until) {
        ground.push(r.out);
        r.settled = true;
      }
    });
    schedules[teamIndex].forEach((th) => {
      if (th.pick > time) return;
      settle(th.pick);
      const reach = [cx + Math.cos(th.angle) * R_PLAYER, cy + Math.sin(th.angle) * R_PLAYER];
      if (!ground.length) return;
      const nearest = ground[nearestIndex(ground, reach)];
      ground = ground.filter((g) => g !== nearest);
      valid.push(th);
      const end = th.start + FLIGHT;
      if (th.late) {
        // Thrown after the signal: it bounces off and stays inside the circle.
        returns.push({ land: end + 250, inside: th.rest, pickup: Infinity, tossEnd: Infinity });
      } else if (th.scored) {
        if (end <= time) score += 1;
      } else if (end + 800 < PLAY_END) {
        returns.push({ land: end, inside: th.miss, out: th.out, helper: th.helper, pickup: end + 700, tossStart: end + 800, tossEnd: end + 1300 });
      } else {
        returns.push({ land: end, inside: th.miss, pickup: Infinity, tossEnd: Infinity });
      }
    });
    settle(time);
    return { ground, valid, returns, score };
  }

  function topBall(ctx, [x, y], index, height = 0) {
    if (height > 0) block(ctx, "rgba(40,42,73,.25)", x - 1, y - 1, 3, 3);
    block(ctx, ink, x - 2, y - 2 - height, 4, 4);
    block(ctx, ballColors[index % 2], x - 1, y - 1 - height, 2, 2);
  }

  function topBasket(ctx, [x, y], glow) {
    if (glow) block(ctx, "#ffe079", x - 8, y - 8, 17, 17);
    block(ctx, ink, x - 5, y - 5, 11, 11);
    block(ctx, "#e9c27a", x - 4, y - 4, 9, 9);
    block(ctx, "#c99a52", x - 2, y - 2, 5, 5);
    topPlayer(ctx, [x + 9, y + 7], volunteerColor, "stand");
  }

  function drawField(ctx, time) {
    const t = local(time);
    const phase = phaseAt(time);
    block(ctx, "#b9e3a8", 0, 0, VW, VH);
    for (let y = 14; y < VH; y += 24) block(ctx, "#a3d693", 0, y, VW, 12);
    block(ctx, "#fff7e0", 0, 14, VW, 1);
    CENTERS.forEach((center, teamIndex) => {
      const [cx, cy] = center;
      const color = teams[teamIndex].color;
      const { ground, valid, returns } = simulate(teamIndex, t);
      const someoneInside = teamIndex === 1 && t >= INSIDE[0] + 600 && t < INSIDE[0] + 1500;
      const lineColor = someoneInside && Math.floor(t / 120) % 2 === 0 ? red : "#fff7e0";
      for (let k = 0; k < 48; k += 2) {
        const a = (k / 48) * Math.PI * 2;
        block(ctx, lineColor, cx + Math.cos(a) * R_LINE - 1, cy + Math.sin(a) * R_LINE - 1, 2, 2);
      }
      ground.forEach((spot, index) => topBall(ctx, spot, index));
      // Balls lying inside the circle until a volunteer picks them up.
      returns.forEach((r, index) => {
        if (t >= r.land && t < r.pickup) topBall(ctx, r.inside, index + 1);
      });
      topBasket(ctx, center, phase.id === "count");
      // Volunteers walk to a fallen ball, pick it up, and walk back while tossing it out.
      helperHomes[teamIndex].forEach((home, v) => {
        const job = returns.filter((r) => r.helper === v && t >= r.land && t < r.tossEnd).pop();
        let at = home;
        let pose = "stand";
        if (job) {
          const beside = mix(job.inside, home, 4 / Math.max(4, Math.hypot(home[0] - job.inside[0], home[1] - job.inside[1])));
          at = t < job.pickup ? mix(home, beside, ease((t - job.land) / 700)) : mix(beside, home, ease(Math.min(1, (t - job.pickup) / 600)));
          if (Math.abs(t - job.pickup) < 120) pose = "duck";
        }
        topPlayer(ctx, at, volunteerColor, pose);
      });
      // Players stand outside the line and step up to it to pick up a ball.
      for (let k = 0; k < 10; k++) {
        const angle = (k / 10) * Math.PI * 2 + teamIndex * 0.3 + Math.PI / 10;
        let radius = R_PLAYER;
        const pick = valid.find((th) => th.k === k && t >= th.pick && t < th.start + 150);
        if (pick) radius = R_PLAYER - 5 * Math.sin(Math.min(1, (t - pick.pick) / 500) * Math.PI);
        if (teamIndex === 1 && k === 2 && t >= INSIDE[0] && t < INSIDE[1]) {
          const p = (t - INSIDE[0]) / (INSIDE[1] - INSIDE[0]);
          radius = p < 0.25 ? lerp(R_PLAYER, 20, ease(p / 0.25)) : p < 0.62 ? 20 : lerp(20, R_PLAYER, ease(Math.min((p - 0.62) / 0.3, 1)));
        }
        const at = [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
        topPlayer(ctx, at, color, "stand");
        if (teamIndex === 1 && k === 2 && radius < R_LINE) {
          block(ctx, ink, at[0] - 3, at[1] - 16, 7, 10);
          block(ctx, "#fffaf0", at[0] - 2, at[1] - 15, 5, 8);
          block(ctx, red, at[0] - 1, at[1] - 14, 2, 4);
          block(ctx, red, at[0] - 1, at[1] - 9, 2, 2);
        }
      }
      // Balls in the air: a shadow on the ground and the ball lifted above it.
      valid.forEach((th, index) => {
        const p = (t - th.start) / FLIGHT;
        if (p < 0 || p >= 1) return;
        const hand = [cx + Math.cos(th.angle) * (R_PLAYER - 4), cy + Math.sin(th.angle) * (R_PLAYER - 4)];
        const target = th.scored || th.late ? center : th.miss;
        const at = mix(hand, target, p);
        topBall(ctx, at, index, Math.round(4 * p * (1 - p) * 16));
        if (th.late) mark(ctx, at[0] + 4, at[1] - 22 * 4 * p * (1 - p) - 8, CROSS, red);
      });
      // Volunteers' low tosses back out over the line.
      returns.forEach((r, index) => {
        if (!(t >= r.tossStart && t < r.tossEnd)) return;
        const p = (t - r.tossStart) / (r.tossEnd - r.tossStart);
        topBall(ctx, mix(r.inside, r.out, p), index + 1, Math.round(4 * p * (1 - p) * 8));
      });
    });
    if (phase.id === "whistle" || (phase.id === "stop" && t < PLAY_END + 700)) whistle(ctx, 8, 4, t / 4000);
  }

  // Live readouts beside the top view: the match clock and each basket's count.
  const view = select("beanbag-toss-view");
  const clock = view.querySelector(".course-clock");
  const scoreCells = [...view.querySelectorAll(".team-score")];
  const rankCells = [...view.querySelectorAll(".team-rank")];
  let shownClock = "";
  let shownScores = "";

  function updateReadouts(time) {
    const t = local(time);
    const left = Math.ceil(120 * (1 - Math.min(Math.max((t - PLAY_START) / (PLAY_END - PLAY_START), 0), 1)));
    const label = "MATCH " + Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
    if (label !== shownClock) clock.textContent = shownClock = label;
    const scores = CENTERS.map((_, teamIndex) => simulate(teamIndex, t).score);
    const final = phaseAt(time).id === "count";
    const key = scores.join() + final;
    if (key === shownScores) return;
    shownScores = key;
    const order = [...scores].sort((a, b) => b - a);
    scores.forEach((score, index) => {
      scoreCells[index].textContent = score;
      rankCells[index].textContent = final ? ["1st", "2nd", "3rd"][order.indexOf(score)] : "";
    });
  }

  drawArt(view.querySelector(".beanbag-art"));
  registerGuide({
    hash: "#beanbag-toss",
    title: "Beanbag Toss",
    view,
    controllers: [
      createSteps(view, steps),
      createOverview(view, { steps, draw: drawField, phaseAt, still: 6000, onRender: updateReadouts }),
    ],
  });
})();
