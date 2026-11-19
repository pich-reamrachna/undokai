"use strict";

// Typhoon Race: step-card scenes and the whole-course top view.
(() => {
  const white = teams[0].color;

  const steps = [
    {
      title: "Grab the pole and go",
      detail: "Your group of five lines up at the start, all holding the same long pole. Then run together to cone 1.",
      scene: drawHold, duration: 2600, still: 0,
    },
    {
      title: "Spin at cone 1, U-turn at cone 2",
      detail: "Run from the start and circle cone 1 once. Run diagonally to the left of cone 2, U-turn around it, then run straight back to your team.",
      scene: drawSpin, duration: 6000, still: 0,
    },
    {
      title: "Sweep low, then high",
      detail: "Run back across the start line with the pole. The three middle players let go and step away. The two end players sweep the pole low from the front row to the back, and everyone jumps over it. Then they sweep it back to the front held up high, and everyone ducks under it. Finally they drop the pole at the start line for the front row to pick up.",
      scene: drawSweep, duration: 9000, still: 0.36,
    },
    {
      title: "Next group goes until the last group runs",
      detail: "Pass the pole to the next group. The last group wears sashes. The first sash group across the finish line wins for its team.",
      scene: (ctx, t) => drawHold(ctx, t, true), duration: 2600, still: 0,
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
    if (startLine) checkeredLine(ctx, 8);
  }

  function checkeredLine(ctx, left, columns = 3) {
    for (let column = 0; column < columns; column++) {
      for (let y = 28; y < H; y += 3) {
        if ((column + (y - 28) / 3) % 2 === 0) block(ctx, "#fff0cf", left + column * 3, y, 3, 3);
      }
    }
  }

  function cardPlayer(ctx, x, y, stride = 0, duck = false, sash = false) {
    runner(ctx, x, y, white, stride, duck);
    if (!sash) return;
    const a = [x - 3, y - 15];
    const b = [x + 3, y - 9];
    pixelLine(ctx, a, b, ink, 3);
    pixelLine(ctx, a, b, SASH, 1);
  }

  // Five players side by side on one pole, seen at an angle: the row runs diagonally into
  // the distance (x, y is the nearest player's feet), so both the pole and the row show.
  // The pole runs through everyone's leading hand, just ahead of their bodies, so it stays in view.
  function group(ctx, x, y, stride, sash) {
    for (let i = 4; i >= 0; i--) cardPlayer(ctx, x + i * 10, y - i * 8, stride ? (stride + i) % 2 : 0, false, sash);
    const hand = (i) => [x + i * 10 + 7, y - 12 - i * 8];
    pole(ctx, ...hand(-0.5), ...hand(4.5));
  }

  const cardRows = [36, 50, 64, 78, 92];

  // Grab the pole at the start, then run together up to cone 1.
  function drawHold(ctx, t, sash = false) {
    track(ctx, true);
    cone(ctx, 136, 64);
    cone(ctx, 154, 64);
    cardRows.forEach((y) => cardPlayer(ctx, 11, y));
    if (t < 0.3) {
      group(ctx, 30, 89 - (Math.floor(t * 14) % 2), 0, sash);
      return;
    }
    const p = ease(Math.min((t - 0.3) / 0.55, 1));
    group(ctx, lerp(30, 78, p), 89, p < 1 ? 1 + (Math.floor(t * 30) % 2) : 0, sash);
  }

  function drawSpin(ctx, t) {
    let pose;
    if (t < 0.17) {
      pose = routePose("run1", ease(t / 0.17), 0);
    } else if (t < 0.48) {
      pose = routePose("spin1", (t - 0.17) / 0.31, 0);
    } else if (t < 0.62) {
      pose = routePose("run2", ease((t - 0.48) / 0.14), 0);
    } else if (t < 0.75) {
      pose = routePose("turn", (t - 0.62) / 0.13, 0);
    } else {
      pose = routePose("back", ease(Math.min((t - 0.75) / 0.2, 1)), 0);
    }
    drawRouteCard(ctx, pose, t < 0.95 ? Math.floor(t * 46) % 2 : 0);
  }

  // Project the top-view route onto the step card's angled track.
  function drawRouteCard(ctx, pose, stride) {
    track(ctx, false);
    checkeredLine(ctx, 24, 1);
    const project = ([x, y]) => [26 + (x - RETURN) * 0.7, 62 + y * 0.55];
    drawRoute(0, (x, y) => block(ctx, "#f2bd8c", ...project([x, y]), 2, 1));
    cardRows.forEach((y) => cardPlayer(ctx, 8, y));
    CONES.forEach((x) => cone(ctx, ...project([x, 0])));
    const frame = formation(...pose);
    frame.players.map(project).sort((a, b) => a[1] - b[1])
      .forEach(([x, y]) => cardPlayer(ctx, x, y, stride));
    const [a, b] = frame.pole.map(project);
    pole(ctx, a[0], a[1] - 13, b[0], b[1] - 13);
  }

  // Waiting groups stand in rows (one group per row) behind the start line on the right.
  // The racing group runs back in across the start line and the three middle players scatter.
  // The two end players sweep low right to left (jump) and high left to right (duck),
  // then drop the pole at the start line, and the front row walks up and picks it up.
  function drawSweep(ctx, t) {
    track(ctx, false);
    checkeredLine(ctx, 104);
    const lanes = cardRows;
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
      lanes.slice(1, 4).forEach((y) => sprites.push({ x: cursor, y, stride }));
    } else if (t < 0.25) {
      const p = ease((t - 0.15) / 0.1);
      poleTop = lerp(25, 31, p);
      for (let k = 1; k < 4; k++) {
        sprites.push({ x: lerp(122, scatterTo[k][0], p), y: lerp(lanes[k], scatterTo[k][1], p), stride: Math.floor(t * 70) % 2 });
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
      front = lanes.map((y) => ({ x: lerp(92, 122, walk), y, stride: walk < 1 ? Math.floor(t * 60) % 2 : 0 }));
      sprites.push(...front);
    }
    rows.forEach((x) => {
      if (front && x === 92) return;
      const near = sweeping ? Math.max(0, 1 - (Math.abs(x - cursor) / 14) ** 2) : 0;
      lanes.forEach((y) => {
        if (low) sprites.push({ x, y: y - Math.round(near * 10), ground: near > 0 ? y : null });
        else sprites.push({ x, y, duck: near > 0.15 });
      });
    });
    if (holders) sprites.push({ x: holderX, y: lanes[0], stride });
    sprites.sort((a, b) => a.y - b.y).forEach((sprite) => {
      if (sprite.ground) shadow(ctx, sprite.x, sprite.ground);
      cardPlayer(ctx, sprite.x, sprite.y, sprite.stride, sprite.duck);
    });
    pole(ctx, cursor + 1, poleTop, cursor + 1, poleTop + 56);
    if (holders) cardPlayer(ctx, holderX, lanes[4], stride);
  }

  // Course overview: each lane works through the full queue of groups before finishing.
  const CW = 320;
  const CH = 246;
  const lanePaces = [1.025, 1, 0.98];
  const START = 126;
  const RETURN = 122;
  const FINISH = 116;
  const CONES = [190, 262];
  const TURN_RADIUS = 20;
  const ROWS = [108, 96, 84, 72, 60];
  const BACK = 48;
  const GROUPS = ROWS.length + 1;
  const SASH = "#ffe079";
  const coursePhases = [
    { id: "ready", ms: 700, step: 0, caption: "The racing group holds the pole at the start." },
    { id: "run1", ms: 1000, step: 1, caption: "Run to cone 1." },
    { id: "spin1", ms: 1600, step: 1, caption: "Spin a full circle around cone 1." },
    { id: "run2", ms: 800, step: 1, caption: "Run diagonally to the left of cone 2." },
    { id: "turn", ms: 900, step: 1, caption: "U-turn around cone 2 and come out on the other side." },
    { id: "back", ms: 1400, step: 1, caption: "Run straight back to your team at the start." },
    { id: "low", ms: 1900, step: 2, caption: "Two players sweep the pole low. The waiting rows jump." },
    { id: "high", ms: 1700, step: 2, caption: "They sweep it back high. The waiting rows duck." },
    { id: "drop", ms: 800, step: 2, caption: "They drop the pole at the start line." },
    { id: "hand", ms: 1500, step: 3, caption: "The front row picks up the pole and goes next." },
  ];
  const lapDuration = coursePhases.reduce((total, phase) => total + phase.ms, 0);
  const finalLap = coursePhases.slice(0, coursePhases.findIndex((phase) => phase.id === "low"));
  const finalDuration = finalLap.reduce((total, phase) => total + phase.ms, 0);
  const finishes = lanePaces.map((pace) => ((GROUPS - 1) * lapDuration + finalDuration) * pace);
  const order = finishes.map((_, lane) => lane).sort((a, b) => finishes[a] - finishes[b]);
  const places = ["1st", "2nd", "3rd"];
  const CYCLE = Math.max(...finishes) + 3500;
  const local = (time) => time % CYCLE;
  const slot = (x, c, k) => [x, c - 16 + 8 * k];

  const finalHandoff = { step: 3, caption: "The sash group is last in line. It picks up the pole and starts its lap." };
  const finalReturn = { step: 1, caption: "The group wearing sashes runs straight back across the finish line." };
  const winner = { step: -1, caption: `${teams[order[0]].name} wins. Its sash group crossed the finish line first.` };
  const standings = { step: -1, caption: `${teams[order[0]].name} wins, followed by ${teams[order[1]].name} and ${teams[order[2]].name}.` };

  function relayAt(lane, time) {
    if (time >= finishes[lane]) return { group: GROUPS - 1, phase: null, p: 1 };
    const elapsed = time / lanePaces[lane];
    const group = Math.min(Math.floor(elapsed / lapDuration), GROUPS - 1);
    const phases = group === GROUPS - 1 ? finalLap : coursePhases;
    let progress = elapsed - group * lapDuration;
    for (const phase of phases) {
      if (progress < phase.ms) return { group, phase, p: progress / phase.ms };
      progress -= phase.ms;
    }
    return { group, phase: null, p: 1 };
  }

  function overviewPhaseAt(time) {
    const t = local(time);
    if (t >= finishes[order[2]]) return standings;
    if (t >= finishes[order[0]]) return winner;
    const { group, phase } = relayAt(order[0], t);
    if (group === GROUPS - 2 && phase.id === "hand") return finalHandoff;
    if (group === GROUPS - 1 && phase.id === "back") return finalReturn;
    return phase;
  }

  // The group runs to the right, so its left side is above the cones in the top view.
  // Each pose gives the center and angle of the pole, preserving player order through the turn.
  function routePose(phase, p, c, returnX = RETURN) {
    const [first, second] = CONES;
    const across = Math.PI / 2;
    switch (phase) {
      case "ready": return [START, c + TURN_RADIUS, across];
      case "run1": return [lerp(START, first, p), c + TURN_RADIUS, across];
      case "spin1": {
        const angle = across - p * Math.PI * 2;
        return [first + Math.cos(angle) * TURN_RADIUS, c + Math.sin(angle) * TURN_RADIUS, angle];
      }
      case "run2": return [lerp(first, second, p), lerp(c + TURN_RADIUS, c - TURN_RADIUS, p), across];
      case "turn": {
        const angle = -across + p * Math.PI;
        return [second + Math.cos(angle) * TURN_RADIUS, c + Math.sin(angle) * TURN_RADIUS, angle + Math.PI];
      }
      case "back": return [lerp(second, returnX, p), c + TURN_RADIUS, across + Math.PI];
    }
  }

  function formation(x, y, angle) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const point = (offset) => [x + dx * offset, y + dy * offset];
    return {
      players: [-14, -7, 0, 7, 14].map(point),
      pole: [point(-17), point(17)],
    };
  }

  function drawRoute(c, mark) {
    for (const [phase, dots] of [["spin1", 24], ["run2", 14], ["turn", 12], ["back", 24]]) {
      for (let k = 0; k <= dots; k++) {
        const [x, y] = routePose(phase, k / dots, c);
        mark(x, y);
      }
    }
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

  function relayPlayer(ctx, [x, y], color, pose, sash) {
    topPlayer(ctx, [x, y], color, pose);
    if (!sash) return;
    const dy = pose === "jump" ? -2 : 0;
    const end = pose === "duck" ? 0 : 1;
    pixelLine(ctx, [x - 1, y - 1 + dy], [x + end, y + end + dy], ink, 2);
    pixelLine(ctx, [x - 1, y - 1 + dy], [x + end, y + end + dy], SASH, 1);
  }

  function drawLane(ctx, c, color, { group, phase, p }) {
    const e = ease(p);
    const finished = [];
    const last = group === GROUPS - 1;
    const waitingCount = GROUPS - group - 1;
    const phaseId = phase?.id;
    const handoff = phaseId === "hand";
    let frame;
    let height = 2;
    let sweepX = null;
    let shift = 0;
    const pose = routePose(phaseId ?? "back", phaseId === "spin1" || phaseId === "turn" ? p : e, c, last ? FINISH : RETURN);
    if (pose) frame = formation(...pose);
    if (phaseId === "low") {
      // The two end players take the pole ends, the other three walk to the back.
      const setup = Math.min(p / 0.18, 1);
      const x = lerp(116, 52, ease(Math.max(0, (p - 0.18) / 0.82)));
      const arrival = formation(...routePose("back", 1, c)).players.reverse();
      const holders = [mix(arrival[0], [x, c - 22], setup), mix(arrival[4], [x, c + 22], setup)];
      for (let k = 1; k < 4; k++) {
        const route = [arrival[k], [124 + 7 * k, c + 31], [BACK - 14 + 7 * k, c + 31], slot(BACK, c, k)];
        const leg = Math.min(Math.floor(p * 3), 2);
        finished.push(mix(route[leg], route[leg + 1], p * 3 - leg));
      }
      frame = { players: holders, pole: holders };
      height = 1;
      if (setup === 1) sweepX = x;
    }
    if (phaseId === "high") {
      sweepX = lerp(52, 116, e);
      for (let k = 1; k < 4; k++) finished.push(slot(BACK, c, k));
      frame = { players: [[sweepX, c - 22], [sweepX, c + 22]] };
      frame.pole = frame.players;
      height = 5;
    }
    if (phaseId === "drop") {
      // The end players let the pole fall at the start line and walk to the back.
      finished.push(mix([116, c - 22], slot(BACK, c, 0), e), mix([116, c + 22], slot(BACK, c, 4), e));
      for (let k = 1; k < 4; k++) finished.push(slot(BACK, c, k));
      frame = { players: [], pole: [[116, c - 22], [116, c + 22]] };
      height = 5 * Math.max(0, 1 - p / 0.3);
    }
    if (handoff) {
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
    if (phaseId !== "high") topPole(ctx, frame.pole, height);
    ROWS.forEach((rowX, i) => {
      if (handoff && i === 0) return;
      const x = rowX + shift;
      const pose = sweepX !== null && Math.abs(x - sweepX) < 6 ? (phaseId === "low" ? "jump" : "duck") : "stand";
      ctx.globalAlpha = i < waitingCount ? 1 : 0.5;
      for (let k = 0; k < 5; k++) relayPlayer(ctx, slot(x, c, k), color, pose, i === waitingCount - 1);
    });
    ctx.globalAlpha = 1;
    finished.forEach((at) => topPlayer(ctx, at, color, "stand"));
    frame.players.forEach((at) => relayPlayer(ctx, at, color, "stand", last || (handoff && waitingCount === 1)));
    if (phaseId === "high") topPole(ctx, frame.pole, height);
  }

  function drawCourse(ctx, time) {
    const t = local(time);
    ctx.save();
    ctx.scale(ctx.canvas.width / CW, ctx.canvas.height / CH);
    block(ctx, "#b9e3a8", 0, 0, CW, CH);
    for (let lane = 0; lane < 3; lane++) block(ctx, lane % 2 ? "#a3d693" : "#9bcf8b", 0, 14 + lane * 76, CW, 76);
    for (let i = 0; i < 4; i++) block(ctx, "#fff7e0", 0, 14 + i * 76, CW, 1);
    for (let y = 15; y < 242; y += 2) {
      block(ctx, (y - 15) % 4 ? "#fff7e0" : "#6c8a62", 119, y, 2, 2);
      block(ctx, (y - 15) % 4 ? "#6c8a62" : "#fff7e0", 121, y, 2, 2);
    }
    ctx.font = "bold 9px monospace";
    for (let lane = 0; lane < 3; lane++) {
      const c = 52 + lane * 76;
      drawRoute(c, (x, y) => block(ctx, "#6eaa6d", x, y, 1, 1));
      CONES.forEach((x) => topCone(ctx, x, c));
      const relay = relayAt(lane, t);
      drawLane(ctx, c, teams[lane].color, relay);
      ctx.fillStyle = ink;
      ctx.fillText(teams[lane].name, 5, c - 24);
      const completed = relay.phase ? relay.group + Number(relay.phase.id === "hand") : GROUPS;
      ctx.fillText(`${completed}/${GROUPS} groups`, 5, c + 30);
      if (!relay.phase) {
        const rank = order.indexOf(lane);
        block(ctx, ink, 284, c - 29, 28, 14);
        block(ctx, rank === 0 ? SASH : "#fffaf0", 285, c - 28, 26, 12);
        ctx.fillStyle = ink;
        ctx.fillText(places[rank], 290, c - 19);
      }
    }
    ctx.restore();
  }

  const view = select("typhoon-race-view");
  registerGuide({
    hash: "#typhoon-race",
    title: "Typhoon Race",
    view,
    controllers: [
      createSteps(view, steps),
      createOverview(view, { steps, draw: drawCourse, phaseAt: overviewPhaseAt, still: 2400 }),
    ],
  });
})();
