"use strict";

// Beanbag Toss: step-card scenes and the whole-field top view.
(() => {
  const team = teams[0].color;
  const volunteerColor = "#4fae63";
  const coneColor = "#ee8a42";
  const ballColors = ["#e8503a", "#fffaf0"];
  const skin = "#f4c39a";
  const red = "#e8503a";

  const MOUTH = [82, 19];
  const SPOTS = [[22, 60], [42, 86], [118, 86], [138, 60], [58, 44], [102, 44]];
  const SIDE_BAGS = [[27, 67], [46, 87], [114, 90], [133, 66], [64, 50], [104, 49],
    [18, 81], [38, 53], [52, 75], [69, 67], [76, 84], [99, 64], [121, 73], [145, 83]];

  const steps = [
    {
      title: "Wait for the whistle",
      detail: "Wait in your team’s section. One volunteer holds your basket. Start on the whistle.",
      scene: drawReady, duration: 3200,
    },
    {
      title: "Pick up and throw",
      detail: "Pick up a beanbag and throw it into your basket from anywhere in your team’s section. You can pick up beanbags that miss and try again.",
      scene: drawThrow, duration: 5600,
    },
    {
      title: "Stay in your team’s section",
      detail: "Small cones separate the teams. Stay on your side of the cones when moving, picking up beanbags, or throwing.",
      scene: drawSection, duration: 5600,
    },
    {
      title: "Stop at the end signal",
      detail: "Everyone stops at the end signal. Only beanbags inside the basket count. A beanbag thrown after the signal doesn't count.",
      scene: drawStop, duration: 5000,
    },
  ];

  function field(ctx) {
    block(ctx, "#9edbdc", 0, 0, W, H);
    block(ctx, "#a2d492", 0, 14, W, H - 14);
    for (let y = 24; y < H; y += 14) block(ctx, "#aadb9b", 0, y, W, 7);
    for (let i = 0; i < 12; i++) block(ctx, "#87c289", (i * 41 + 9) % W, 30 + ((i * 23) % 60), 3, 2);
  }

  function cone(ctx, x, y) {
    block(ctx, ink, x - 4, y - 2, 9, 3);
    block(ctx, coneColor, x - 3, y - 5, 7, 4);
    block(ctx, coneColor, x - 2, y - 8, 5, 4);
    block(ctx, "#fff4ce", x - 2, y - 5, 5, 1);
  }

  function ball(ctx, x, y, index) {
    block(ctx, ink, x - 2, y - 2, 4, 4);
    block(ctx, ballColors[index % 2], x - 1, y - 1, 2, 2);
  }

  // The volunteer in green holds the basket.
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

  function player(ctx, [x, y], pose, stride, direction, color) {
    runner(ctx, x, y, color, stride, pose === "pick");
    if (pose === "throw") block(ctx, skin, x + (direction > 0 ? 3 : -5), y - 30, 3, 6);
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

  // Throwers follow keyframed paths, picking up beanbags and aiming for their basket.
  function stage(ctx, t, { actors, throws = [], bags = SIDE_BAGS, cones = [], glow = false, after }) {
    field(ctx);
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
    let ground = bags.map((spot, index) => ({ spot, index }));
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
      let direction = Math.sign(MOUTH[0] - pos[0]);
      throws.forEach((th) => {
        if (th.by !== index) return;
        if (th.pick && t >= th.pick[0] && t < th.pick[1]) pose = "pick";
        if (t >= th.start - 0.04 && t < th.start + 0.05) {
          pose = "throw";
          direction = Math.sign((th.to || MOUTH)[0] - pos[0]);
        }
      });
      sprites.push({ y: pos[1], draw: () => player(ctx, pos, pose, moving ? Math.floor(t * 60) % 2 : 0, direction, actor.color || team) });
    });
    sprites.push({ y: 70, draw: () => basket(ctx, count, glow) });
    cones.forEach(([x, y]) => sprites.push({ y, draw: () => cone(ctx, x, y) }));
    sprites.sort((a, b) => a.y - b.y).forEach((sprite) => sprite.draw());
    throws.forEach((th, n) => {
      if (t < th.start || t >= th.end) return;
      const from = at(actors[th.by], th.start);
      const to = th.to || MOUTH;
      const hand = [from[0] + Math.sign(to[0] - from[0]) * 4, from[1] - 28];
      const p = (t - th.start) / (th.end - th.start);
      const x = lerp(hand[0], to[0], p);
      const y = lerp(hand[1], to[1], p) - (th.peak || 34) * 4 * p * (1 - p);
      ball(ctx, x, y, n);
      if (th.result === "late") mark(ctx, x + 4, y - 9, CROSS, red);
    });
    if (after) after(ctx, t, at);
  }

  const still = (spot, color) => ({ path: [[0, spot]], color });

  function drawReady(ctx, t) {
    const actors = SPOTS.map((spot, i) => ({ path: [[0.6, spot], [0.86, SIDE_BAGS[i]]] }));
    stage(ctx, t, {
      actors,
      after: (c) => {
        if (t >= 0.45 && t < 0.8) whistle(c, 60, 4, t);
      },
    });
  }

  // Players throw from different distances and can pick up a beanbag that missed.
  function drawThrow(ctx, t) {
    const actors = [
      { path: [[0, SPOTS[0]], [0.48, SPOTS[0]], [0.69, [62, 72]]] },
      ...SPOTS.slice(1).map((spot) => still(spot)),
    ];
    const throws = [
      { by: 0, pick: [0, 0.08], start: 0.1, end: 0.34, result: "in" },
      { by: 3, pick: [0.04, 0.12], start: 0.14, end: 0.4, result: "miss", to: [62, 72], peak: 26 },
      { by: 4, pick: [0.2, 0.28], start: 0.3, end: 0.52, result: "in" },
      { by: 1, pick: [0.4, 0.48], start: 0.5, end: 0.72, result: "in" },
      { by: 0, pick: [0.7, 0.76], start: 0.78, end: 0.99, result: "in" },
    ];
    stage(ctx, t, { actors, throws });
  }

  function drawSection(ctx, t) {
    const actors = [
      { path: [[0, [104, 89]], [0.35, [112, 85]], [0.58, [112, 85]], [0.86, [100, 81]]] },
      still([37, 74]),
      still([62, 55]),
      still([145, 83], teams[1].color),
      still([138, 57], teams[1].color),
    ];
    const cones = [[115, 40], [120, 54], [125, 70], [130, 91]];
    const throws = [{ by: 0, pick: [0.38, 0.49], start: 0.56, end: 0.81, result: "in" }];
    stage(ctx, t, { actors, throws, cones, bags: [[34, 76], [59, 55], [112, 85], [141, 76]] });
  }

  // The end signal stops play; the late throw is marked and excluded from the count.
  function drawStop(ctx, t) {
    const actors = SPOTS.map((spot) => still(spot));
    const throws = [
      { by: 0, pick: [0, 0.06], start: 0.08, end: 0.3, result: "in" },
      { by: 1, pick: [0.06, 0.12], start: 0.14, end: 0.34, result: "in" },
      { by: 3, pick: [0.3, 0.38], start: 0.44, end: 0.64, result: "late", rest: [98, 62] },
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

  // Top view: three sections side by side, playing one compressed two-minute match.
  const VW = 320;
  const VH = 196;
  const CENTERS = [58, 160, 262].map((x) => [x, 106]);
  const DIVIDERS = CENTERS.slice(1).map(([x], i) => (x + CENTERS[i][0]) / 2);
  const fieldPhases = [
    { id: "ready", ms: 1400, step: 0, caption: "Each team has its own section and one volunteer holding its basket." },
    { id: "whistle", ms: 700, step: 0, caption: "The whistle starts the match." },
    { id: "throw", ms: 5200, step: 1, caption: "Pick up a beanbag and throw from anywhere in your team’s section." },
    { id: "sections", ms: 2400, step: 2, caption: "Stay on your side of the small cones to avoid running into another team." },
    { id: "throw2", ms: 3000, step: 1, caption: "Pick up beanbags that miss and try again within your section." },
    { id: "stop", ms: 1600, step: 3, caption: "End signal: everyone stops. A beanbag thrown after it doesn't count." },
    { id: "count", ms: 2600, step: 3, caption: "Each beanbag that counts adds 1 to the match score. Rank teams by their total across all 4 matches." },
  ];
  const CYCLE = fieldPhases.reduce((total, phase) => total + phase.ms, 0);
  const PLAY_START = fieldPhases.slice(0, 2).reduce((total, phase) => total + phase.ms, 0);
  const PLAY_END = fieldPhases.slice(0, 5).reduce((total, phase) => total + phase.ms, 0);
  const RATES = [0.58, 0.5, 0.64];
  const APPROACH = 480;
  const PICKUP = 260;
  const RETURN = 420;
  const FLIGHT = 700;
  const homes = CENTERS.map(([x, y]) => Array.from({ length: 10 }, (_, i) => {
    const angle = i * Math.PI / 5 - Math.PI / 2;
    return [x + Math.cos(angle) * 39, y + Math.sin(angle) * 54];
  }));
  const hash = (a, b, c) => {
    const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
    return v - Math.floor(v);
  };
  const local = (time) => ((time % CYCLE) + CYCLE) % CYCLE;
  const distance = ([x, y], [u, v]) => Math.hypot(x - u, y - v);

  function phaseAt(time) {
    let t = local(time);
    for (const phase of fieldPhases) {
      if (t < phase.ms) return phase;
      t -= phase.ms;
    }
    return fieldPhases[0];
  }

  // Resolve pickups in order so a missed beanbag can become available to another thrower.
  const matches = CENTERS.map(([cx, cy], teamIndex) => {
    const ground = Array.from({ length: 40 }, (_, i) => ({
      spot: [cx - 39 + (i % 8) * 11 + hash(teamIndex, i, 1) * 4,
        49 + Math.floor(i / 8) * 27 + hash(teamIndex, i, 2) * 15],
      from: 0, until: Infinity,
    }));
    const attempts = homes[teamIndex].flatMap((home, k) => {
      const throws = [];
      const offset = hash(teamIndex, k, 3) * 1100;
      const period = 1700 + hash(teamIndex, k, 4) * 900;
      for (let n = 0; ; n++) {
        const pick = PLAY_START + APPROACH + offset + n * period;
        const start = pick + PICKUP;
        if (start + FLIGHT > PLAY_END) break;
        const search = n % 3 === 1 ? mix(home, [cx, cy], 0.45) : home;
        const scored = hash(teamIndex, k, n + 7) < RATES[teamIndex];
        const miss = [cx - 35 + hash(teamIndex, k, n + 37) * 70,
          cy - 43 + hash(teamIndex, k, n + 57) * 90];
        throws.push({ k, pick, start, search, scored, miss });
      }
      return throws;
    });
    if (teamIndex === 0) {
      attempts.push({ k: 4, pick: PLAY_END + 100, start: PLAY_END + 300,
        search: homes[teamIndex][4], late: true, scored: false, miss: [cx + 12, cy - 10] });
    }

    const throws = [];
    attempts.sort((a, b) => a.pick - b.pick).forEach((attempt) => {
      let nearest;
      for (const bag of ground) {
        if (bag.from <= attempt.pick && attempt.pick < bag.until
          && (!nearest || distance(bag.spot, attempt.search) < distance(nearest.spot, attempt.search))) nearest = bag;
      }
      if (!nearest) return;
      nearest.until = attempt.pick;
      const end = attempt.start + FLIGHT;
      throws.push({ ...attempt, end, spot: nearest.spot });
      if (!attempt.scored) ground.push({ spot: attempt.miss, from: end, until: Infinity });
    });
    return { ground, throws };
  });

  function topBall(ctx, [x, y], index, height = 0) {
    const airborne = height > 0;
    if (airborne) block(ctx, "rgba(40,42,73,.25)", x - 1, y - 1, 2, 2);
    const size = airborne ? 3 : 2;
    block(ctx, "#8e5935", x - 1, y - 1 - height, size, size);
    block(ctx, index % 2 ? "#ee9658" : "#f3c765", x - 1, y - 1 - height, size - 1, size - 1);
  }

  function topBasket(ctx, [x, y], glow) {
    if (glow) block(ctx, "#ffe079", x - 8, y - 8, 17, 17);
    block(ctx, ink, x - 5, y - 5, 11, 11);
    block(ctx, "#e9c27a", x - 4, y - 4, 9, 9);
    block(ctx, "#c99a52", x - 2, y - 2, 5, 5);
    topPlayer(ctx, [x + 9, y + 7], volunteerColor, "stand");
  }

  function throwerPose(teamIndex, k, time) {
    const home = homes[teamIndex][k];
    const t = Math.min(time, PLAY_END);
    const job = matches[teamIndex].throws.find((th) => !th.late && th.k === k
      && t >= th.pick - APPROACH && t < th.start + RETURN);
    if (!job) return [home, "stand"];
    if (t < job.pick) return [mix(home, job.spot, ease((t - job.pick + APPROACH) / APPROACH)), "stand"];
    if (t < job.start) return [job.spot, "duck"];
    if (t < job.start + 100) return [job.spot, "jump"];
    return [mix(job.spot, home, ease((t - job.start - 100) / (RETURN - 100))), "stand"];
  }

  function drawField(ctx, time) {
    const t = local(time);
    const phase = phaseAt(time);
    block(ctx, "#b9e3a8", 0, 0, VW, VH);
    for (let y = 14; y < VH; y += 24) block(ctx, "#a3d693", 0, y, VW, 12);
    DIVIDERS.forEach((x) => {
      for (let y = 26; y < VH; y += 17) cone(ctx, x, y);
    });
    CENTERS.forEach((center, teamIndex) => {
      const color = teams[teamIndex].color;
      const { ground, throws } = matches[teamIndex];
      ground.forEach(({ spot, from, until }, index) => {
        if (t >= from && t < until) topBall(ctx, spot, index);
      });
      topBasket(ctx, center, phase.id === "count");
      homes[teamIndex].forEach((_, k) => {
        const [at, pose] = throwerPose(teamIndex, k, t);
        topPlayer(ctx, at, color, pose);
      });
      throws.forEach((th, index) => {
        const p = (t - th.start) / FLIGHT;
        if (p < 0 || p >= 1) return;
        const target = th.scored || th.late ? center : th.miss;
        const hand = th.late ? homes[teamIndex][th.k] : th.spot;
        const [x, y] = mix(hand, target, p);
        const height = Math.round(4 * p * (1 - p) * 16);
        topBall(ctx, [x, y], index, height);
        if (th.late) mark(ctx, x + 4, y - height - 8, CROSS, red);
      });
    });
    if (phase.id === "whistle" || (phase.id === "stop" && t < PLAY_END + 700)) whistle(ctx, 8, 4, t / 4000);
  }

  // Live readouts for the field timer and each basket's count.
  const view = select("beanbag-toss-view");
  const clockValue = view.querySelector(".beanbag-clock-value");
  const clockDigits = [...view.querySelectorAll(".beanbag-clock-digit")];
  const scoreCells = [...view.querySelectorAll(".team-score")];
  const rankCells = [...view.querySelectorAll(".team-rank")];
  let shownClock = "";
  let shownScores = "";

  function updateReadouts(time) {
    const t = local(time);
    const left = Math.ceil(120 * (1 - Math.min(Math.max((t - PLAY_START) / (PLAY_END - PLAY_START), 0), 1)));
    const minutes = String(Math.floor(left / 60)).padStart(2, "0");
    const seconds = String(left % 60).padStart(2, "0");
    const label = `${minutes}:${seconds}`;
    if (label !== shownClock) {
      shownClock = label;
      clockValue.textContent = label;
      const digits = minutes + seconds;
      clockDigits.forEach((digit, index) => { digit.dataset.digit = digits[index]; });
    }
    const scores = matches.map(({ throws }) => throws.filter(({ scored, end }) => scored && end <= t).length);
    const final = phaseAt(time).id === "count";
    const key = language + scores.join() + final;
    if (key === shownScores) return;
    shownScores = key;
    const order = [...scores].sort((a, b) => b - a);
    scores.forEach((score, index) => {
      scoreCells[index].textContent = score;
      rankCells[index].textContent = final ? translate(["1st", "2nd", "3rd"][order.indexOf(score)]) : "";
    });
  }

  registerGuide({
    hash: "#beanbag-toss",
    title: "Beanbag Toss",
    view,
    controllers: [
      createSteps(view, steps),
      createOverview(view, { steps, draw: drawField, phaseAt, duration: CYCLE, onRender: updateReadouts }),
    ],
  });
})();
