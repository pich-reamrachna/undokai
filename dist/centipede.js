"use strict";

// Centipede Race: step-card scenes, the page illustration and the whole-field top view.
(() => {
  const team = teams[0].color;
  const red = "#e8503a";
  const PLAYERS = 5;
  const MIDDLE_PLAYER = (PLAYERS - 1) / 2;
  const SPACING = 12;
  const STEP = 8;
  const PLANK = 64;

  const steps = [
    {
      title: "Step on the planks",
      detail: "Group 1 lines up in a row of five and puts one foot on each plank. Group 2 waits at the far end.",
      scene: drawStart, duration: 7600,
    },
    {
      title: "Walk in step",
      detail: "Lift one plank together, then the other. Keep walking until all five players on the planks are fully past the line.",
      scene: drawWalk, duration: 11000,
    },
    {
      title: "Pass the planks to the next group",
      detail: "Wait until all five players walking the plank in Group 2 are fully past the line. Group 2 steps off, then Group 3 gets onto the same planks and walks back.",
      scene: drawHand, duration: 14500,
    },
    {
      title: "Fell off? Get back on",
      detail: "If someone falls or the planks come apart, put them back on and carry on from the same spot. No penalty.",
      scene: drawFall, duration: 9800,
    },
    {
      title: "Finish with the sash",
      detail: "All five players in Group 6 wear team sashes while waiting and through the finish. The first team to get all five players walking on the planks fully past the starting line wins.",
      scene: drawFinish, duration: 9800,
    },
  ];

  // A football field seen from the side, with white lines at the given x positions.
  function field(ctx, lines = []) {
    block(ctx, "#9edbdc", 0, 0, W, H);
    block(ctx, "#a2d492", 0, 14, W, H - 14);
    for (let x = 0; x < W; x += 24) block(ctx, "#aadb9b", x, 15, 12, H - 15);
    for (let i = 0; i < 10; i++) block(ctx, "#87c289", (i * 41 + 9) % W, 30 + ((i * 23) % 56), 3, 2);
    lines.forEach((x) => block(ctx, "#fffaf0", x - 1, 22, 3, H - 22));
  }

  function plank(ctx, x, y) {
    block(ctx, ink, x - PLANK / 2, y, PLANK, 4);
    block(ctx, "#e3a866", x - PLANK / 2 + 1, y + 1, PLANK - 2, 1);
    block(ctx, "#c4834a", x - PLANK / 2 + 1, y + 2, PLANK - 2, 1);
  }

  function stars(ctx, x, y) {
    [[0, 0], [7, -4], [-6, -3]].forEach(([dx, dy]) => {
      block(ctx, ink, x + dx - 1, y + dy - 1, 5, 5);
      block(ctx, "#ffe079", x + dx, y + dy, 3, 3);
    });
  }

  // Five players in file on two planks. `cycle` counts half-steps: on even half-steps the far
  // plank lifts and moves forward, on odd ones the near plank does.
  function centipede(ctx, x0, y, color, cycle, opts = {}) {
    const n = Math.max(0, Math.floor(cycle));
    const c = cycle - n;
    const e = ease(c);
    const moving = cycle > 0 && !opts.still;
    const far = STEP * (Math.ceil(n / 2) + (n % 2 === 0 ? e : 0));
    const near = STEP * (Math.floor(n / 2) + (n % 2 === 1 ? e : 0));
    const liftFar = moving && n % 2 === 0 ? Math.sin(Math.PI * c) * 4 : 0;
    const liftNear = moving && n % 2 === 1 ? Math.sin(Math.PI * c) * 4 : 0;
    const advance = (far + near) / 2;
    const base = opts.centered ? x0 - advance : x0;
    const body = base + advance;
    const apart = opts.apart || 0;
    plank(ctx, base + far, y - 5 - liftFar);
    for (let i = 0; i < PLAYERS; i++) {
      const px = body + (i - MIDDLE_PLAYER) * SPACING;
      if (opts.fallen === i) continue;
      const py = y - Math.max(liftFar, liftNear) * 0.6;
      runner(ctx, px, py, color, moving ? (n % 2 ? 1 : -1) : 0);
      if (opts.sash) {
        pixelLine(ctx, [px - 3, py - 15], [px + 3, py - 8], ink, 3);
        pixelLine(ctx, [px - 3, py - 15], [px + 3, py - 8], "#ffdc55", 2);
      }
    }
    plank(ctx, base + near - apart, y - 1 - liftNear + apart * 0.3);
    if (opts.fallen !== undefined) {
      const px = body + (opts.fallen - MIDDLE_PLAYER) * SPACING;
      runner(ctx, px + 5, y + 8, color, 0, true);
      stars(ctx, px + 4, y - 20);
    }
  }

  // Step 1: the planks lie behind the start line; the players hop on one by one, then set off.
  function drawStart(ctx, t) {
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    const x0 = 44;
    const y = 86;
    field(ctx, [x0 + PLANK / 2]);
    if (t < 0.55) {
      plank(ctx, x0, y - 5);
      for (let i = 0; i < PLAYERS; i++) {
        const from = 0.08 + i * 0.08;
        const p = Math.min(Math.max((t - from) / 0.12, 0), 1);
        const px = x0 + (i - MIDDLE_PLAYER) * SPACING;
        runner(ctx, px, lerp(60, y, ease(p)) - Math.sin(Math.PI * p) * 8, team, p > 0 && p < 1 ? 1 : 0);
      }
      plank(ctx, x0, y - 1);
    } else {
      centipede(ctx, x0, y, team, ((t - 0.55) / 0.45) * 8);
    }
    ctx.restore();
  }

  // Step 2: the first crossing, moving right to left as in the top view.
  function drawWalk(ctx, t) {
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    field(ctx, [80]);
    centipede(ctx, 32, 84, team, t * 22);
    ctx.restore();
  }

  function drawSideCrossing(ctx, x, y, progress, { size, direction = 1, sash = false }) {
    ctx.save();
    ctx.translate(Math.round(x), y);
    ctx.scale(size * direction, size);
    centipede(ctx, 0, 0, team, progress * 24, { centered: true, still: progress === 1, sash });
    ctx.restore();
  }

  // Step 3: Group 2 hands its planks to Group 3 at the starting end.
  function drawHand(ctx, t) {
    const [, second, third] = schedules[0];
    const elapsed = lerp(-2200, HANDOFF + 2000, t);
    const far = 26;
    const start = W - far;
    const size = 0.625;
    const arrivalY = 49;
    const departureY = 84;
    const { slide, boarding } = handoffProgress(elapsed);
    field(ctx, [111]);

    if (elapsed < 0) {
      const approach = progressAt(elapsed, -second.walk, second.walk);
      drawSideCrossing(ctx, lerp(far, start, approach), arrivalY, approach, { size });
    } else {
      ctx.save();
      ctx.translate(start, arrivalY);
      ctx.scale(size, size);
      for (let i = 0; i < PLAYERS; i++) {
        const step = dismountProgress(elapsed, i);
        runner(ctx, (i - MIDDLE_PLAYER) * SPACING, -step * 6 - Math.sin(Math.PI * step) * 5, team);
      }
      ctx.restore();
    }

    if (elapsed < HANDOFF) {
      if (elapsed >= 0) {
        ctx.save();
        ctx.translate(start, Math.round(lerp(arrivalY, departureY, slide)));
        ctx.scale(size, size);
        plank(ctx, 0, -5);
        plank(ctx, 0, -1);
        ctx.restore();
      }
      ctx.save();
      ctx.translate(start, departureY);
      ctx.scale(size, size);
      for (let i = 0; i < PLAYERS; i++) {
        const step = boardingStep(boarding, i);
        const boardingY = lerp(-10, 0, ease(step)) - Math.sin(Math.PI * step) * 5;
        runner(ctx, (i - MIDDLE_PLAYER) * SPACING, boardingY, team);
      }
      ctx.restore();
      if (boarding === 1) drawReadyLabel(ctx, start - 38, departureY - 12);
    } else {
      const crossing = progressAt(elapsed, HANDOFF, third.walk);
      drawSideCrossing(ctx, lerp(start, far, crossing), departureY, crossing, { size, direction: -1 });
    }
  }

  function drawFinish(ctx, t) {
    const finishLine = 103;
    field(ctx);
    for (let y = 22; y < H; y += 4) {
      block(ctx, "#fffaf0", finishLine - 2, y, 4, 4);
      block(ctx, ink, finishLine - 2 + ((y - 22) % 8 ? 2 : 0), y, 2, 4);
    }
    ctx.save();
    ctx.font = language === "ja" ? 'bold 8px "Yu Gothic", Meiryo, sans-serif' : "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = ink;
    ctx.fillText(translate("START/FINISH"), finishLine, 12);
    ctx.restore();
    const crossing = progressAt(t, 0.18, 0.64);
    drawSideCrossing(ctx, lerp(29, 132, crossing), 80, crossing, { size: 0.82, sash: true });
  }

  // Step 4: a player slips off and the near plank slides away; they put it back and carry on.
  function drawFall(ctx, t) {
    field(ctx);
    const x0 = 26;
    const y = 84;
    if (t < 0.3) {
      centipede(ctx, x0, y, team, (t / 0.3) * 8);
    } else if (t < 0.74) {
      const fallen = t < 0.64;
      const apart = t < 0.64 ? 10 * ease(Math.min((t - 0.3) / 0.06, 1)) : 10 * (1 - ease((t - 0.64) / 0.1));
      centipede(ctx, x0, y, team, 8, { still: true, fallen: fallen ? 2 : undefined, apart });
    } else {
      centipede(ctx, x0, y, team, 8 + ((t - 0.74) / 0.26) * 8);
    }
  }

  // Top view: odd groups leave from the right, even groups return to the same line.
  const VW = 320;
  const VH = 206;
  const LANES = [56, 116, 176];
  const GROUPS = 6;
  const START_LINE = 256;
  const FAR_LINE = 64;
  const OPENING_BOARD = 1000;
  const READY = 2200;
  const WALK = [7100, 7350, 6900];
  const STEP_OFF = 650;
  const PASS_PLANKS = 420;
  const BOARD = 750;
  const PREPARED = 500;
  const HANDOFF = STEP_OFF + PASS_PLANKS + BOARD + PREPARED;
  const STUMBLE = { team: 1, leg: 2, at: 0.4, ms: 1750 };
  const station = (index) => index % 2 === 0 ? 281 : 39;
  const crossingY = (c, group) => c + (group % 2 === 0 ? -7 : 7);
  const progressAt = (elapsed, start, duration) => Math.max(0, Math.min(1, (elapsed - start) / duration));
  const dismountProgress = (elapsed, player) => progressAt(elapsed, player * 55, STEP_OFF - 220);
  const boardingStep = (progress, player) => progressAt(progress, (player / (PLAYERS - 1)) * 0.5, 0.5);
  function handoffProgress(elapsed) {
    return {
      slide: ease(progressAt(elapsed, STEP_OFF, PASS_PLANKS)),
      boarding: progressAt(elapsed, STEP_OFF + PASS_PLANKS, BOARD),
    };
  }

  // When each team's legs start and finish (time in ms from the start of the loop).
  const schedules = WALK.map((walk, teamIndex) => {
    const legs = [];
    let time = READY;
    for (let k = 0; k < GROUPS; k++) {
      const extra = teamIndex === STUMBLE.team && k === STUMBLE.leg ? STUMBLE.ms : 0;
      const leg = { start: time, walk, extra, arrive: time + walk + extra };
      if (extra) leg.stumble = time + walk * STUMBLE.at;
      legs.push(leg);
      time = leg.arrive + HANDOFF;
    }
    return legs;
  });
  const finishes = schedules.map((legs) => legs[GROUPS - 1].arrive);
  const ranks = finishes.map((f) => [...finishes].sort((a, b) => a - b).indexOf(f));
  const firstTeam = ranks.indexOf(0);
  const stumble = schedules[STUMBLE.team][STUMBLE.leg];
  const CYCLE = Math.max(...finishes) + 3600;
  const events = [
    { time: 0, step: 0, caption: "Group 1 gets onto the planks. Group 2 waits at the far end." },
    { time: READY, step: 1, caption: "Go! Each team’s Group 1 walks straight to the far end." },
    { time: schedules[firstTeam][0].arrive, step: 2, caption: "Group 1 is fully past the line. They step off, then Group 2 gets onto the same planks." },
    { time: schedules[firstTeam][1].start, step: 1, caption: "Group 2 walks back on the same planks. Group 3 waits behind the starting line." },
    { time: schedules[firstTeam][1].arrive, step: 2, caption: "All five players walking the plank in Group 2 are fully past the line. Group 2 steps off and Group 3 takes the planks." },
    { time: stumble.stumble, step: 3, caption: "{team}’s planks came apart. Put them back on and carry on from the same spot. No penalty.", values: { team: teams[STUMBLE.team].name } },
    { time: stumble.stumble + STUMBLE.ms, step: 2, caption: "Pass the same planks to the next group at each end. Groups 1 to 6 use them in order." },
    { time: schedules[firstTeam][GROUPS - 1].start, step: 4, caption: "All five players in Group 6 wear team sashes. They finish when all five are fully past the starting line on the planks." },
    { time: finishes[firstTeam], step: -1, caption: "{team}’s 6th group finishes first.", values: { team: teams[firstTeam].name } },
    { time: Math.max(...finishes), step: -1, caption: "Ranked by finish order: 1st gets 50 points, 2nd 40, 3rd 20. No stopwatch." },
  ].sort((a, b) => a.time - b.time);
  const local = (time) => ((time % CYCLE) + CYCLE) % CYCLE;

  function phaseAt(time) {
    const t = local(time);
    return events.filter((e) => e.time <= t).pop() || events[0];
  }

  function lanePosition(legs, time) {
    const group = legs.findIndex((leg) => time < leg.arrive);
    if (group === -1) return { group, x: station(GROUPS), stalled: 0 };
    const leg = legs[group];
    const stalled = leg.extra ? Math.max(0, time - leg.stumble) : 0;
    const walking = Math.max(0, time - leg.start - Math.min(stalled, leg.extra));
    return { group, x: lerp(station(group), station(group + 1), walking / leg.walk), stalled };
  }

  function topPlanks(ctx, x, c, wiggle, apart) {
    [[c - 4, wiggle], [c + 4 + apart, -wiggle - apart]].forEach(([y, dx]) => {
      block(ctx, ink, x - 18 + dx, y - 1, 36, 3);
      block(ctx, "#e3a866", x - 17 + dx, y, 34, 1);
    });
  }

  function topGroup(ctx, x, c, color, fallen, sash, boarding = 1, queueY = c - 10) {
    for (let i = 0; i < PLAYERS; i++) {
      const px = x + (i - MIDDLE_PLAYER) * 7;
      const playerFell = fallen && i === MIDDLE_PLAYER;
      const step = boardingStep(boarding, i);
      const py = playerFell ? c + 10 : lerp(queueY, c, ease(step));
      topPlayer(ctx, [px, py], color, playerFell ? "duck" : "stand");
      if (sash) {
        pixelLine(ctx, [px - 2, py - 2], [px + 2, py + 2], ink, 3);
        pixelLine(ctx, [px - 2, py - 2], [px + 2, py + 2], "#ffdc55", 2);
      }
    }
  }

  function drawReadyLabel(ctx, x, y) {
    const label = translate("READY");
    ctx.save();
    ctx.font = language === "ja" ? 'bold 8px "Yu Gothic", Meiryo, sans-serif' : "bold 8px sans-serif";
    ctx.textAlign = "center";
    const width = Math.ceil(ctx.measureText(label).width) + 8;
    const left = Math.round(x - width / 2);
    block(ctx, ink, left, y, width, 11);
    block(ctx, "#fffaf0", left + 1, y + 1, width - 2, 9);
    ctx.fillStyle = ink;
    ctx.fillText(label, x, y + 8);
    ctx.restore();
  }

  function drawDismount(ctx, group, c, color, elapsed) {
    const x = station(group + 1);
    const y = crossingY(c, group);
    const parkingY = c + 13 + Math.floor(group / 2) * 7;
    for (let i = 0; i < PLAYERS; i++) {
      const progress = dismountProgress(elapsed, i);
      ctx.globalAlpha = lerp(1, 0.4, progress);
      const hop = Math.sin(Math.PI * progress) * 4;
      const px = x + (i - MIDDLE_PLAYER) * 7 + hop;
      topPlayer(ctx, [px, lerp(y, parkingY, ease(progress))], color, progress > 0 && progress < 1 ? "jump" : "stand");
    }
    ctx.globalAlpha = 1;
  }

  function drawLane(ctx, teamIndex, t, { group, x, stalled }) {
    const c = LANES[teamIndex];
    const color = teams[teamIndex].color;
    const legs = schedules[teamIndex];
    for (let g = 0; g < GROUPS; g++) {
      const leg = legs[g];
      if (g > group && t < leg.start) {
        const row = Math.floor((g - group - 1) / 2);
        topGroup(ctx, station(g), c - 15 - row * 6, color, false, g === GROUPS - 1);
      }
      if (t < leg.arrive || (group === -1 && g === GROUPS - 1)) continue;
      drawDismount(ctx, g, c, color, t - leg.arrive);
    }
    if (group === -1) {
      topPlanks(ctx, x, crossingY(c, GROUPS - 1), 0, 0);
      topGroup(ctx, x, crossingY(c, GROUPS - 1), color, false, true);
      const label = translate(["1ST", "2ND", "3RD"][ranks[teamIndex]]);
      ctx.font = language === "ja" ? 'bold 9px "Yu Gothic", Meiryo, sans-serif' : "bold 9px monospace";
      block(ctx, ink, x - 11, c - 22, 22, 12);
      block(ctx, ranks[teamIndex] === 0 ? "#ffe079" : "#fffaf0", x - 10, c - 21, 20, 10);
      ctx.fillStyle = ink;
      ctx.fillText(label, x - 9, c - 13);
      return;
    }

    const leg = legs[group];
    const y = crossingY(c, group);
    const fallen = stalled > 0 && stalled < leg.extra * 0.75;
    const apart = stalled > 0 ? 5 * Math.min(1, Math.max(0, (leg.extra - stalled) / (leg.extra * 0.25))) : 0;
    const wiggle = t > leg.start && !apart ? Math.sin(t / 220) * 1.5 : 0;
    const { slide, boarding } = group === 0
      ? { slide: 1, boarding: progressAt(t, 0, OPENING_BOARD) }
      : handoffProgress(t - legs[group - 1].arrive);
    const plankY = group === 0 ? y : lerp(crossingY(c, group - 1), y, slide);
    topPlanks(ctx, x, plankY, wiggle, apart);
    topGroup(ctx, x, y, color, fallen, group === GROUPS - 1, boarding, c - 15);
    if (t < leg.start && boarding === 1) {
      const labelX = x + (group % 2 === 0 ? -44 : 44);
      drawReadyLabel(ctx, labelX, c - 23);
    }
    if (fallen) {
      block(ctx, ink, x - 2, y - 17, 5, 9);
      block(ctx, "#fffaf0", x - 1, y - 16, 3, 7);
      block(ctx, red, x - 1, y - 15, 3, 3);
      block(ctx, red, x - 1, y - 11, 3, 1);
    }
  }

  function drawCourse(ctx, bottom) {
    block(ctx, "#b9e3a8", 0, 0, VW, 26);
    block(ctx, "#9fd18c", 0, 26, VW, bottom - 26);
    for (let x = 0; x < VW; x += 32) block(ctx, "#a9d898", x, 26, 16, bottom - 26);
    block(ctx, "#fffaf0", FAR_LINE - 1, 26, 3, bottom - 26);
    for (let y = 26; y < bottom; y += 4) {
      block(ctx, "#fffaf0", START_LINE - 4, y, 8, 4);
      block(ctx, ink, START_LINE - 4 + ((y - 26) % 8 ? 4 : 0), y, 4, 4);
    }
    ctx.font = language === "ja" ? 'bold 11px "Yu Gothic", Meiryo, sans-serif' : "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = ink;
    ctx.fillText(translate("FAR END"), FAR_LINE, 17);
    ctx.fillText(translate("START/FINISH"), START_LINE, 17);
    ctx.textAlign = "start";
  }

  function drawField(ctx, time) {
    const t = local(time);
    drawCourse(ctx, VH);
    [26, 86, 146, VH - 1].forEach((y) => block(ctx, "#fffaf0", 0, y, VW, 1));
    schedules.forEach((legs, teamIndex) => drawLane(ctx, teamIndex, t, lanePosition(legs, t)));
  }

  // Readouts beside the top view: how many groups each team has finished, then the ranking.
  const view = select("centipede-race-view");
  const scoreCells = [...view.querySelectorAll(".team-score")];
  const rankCells = [...view.querySelectorAll(".team-rank")];
  let shown = "";

  function updateReadouts(time) {
    const t = local(time);
    const done = schedules.map((legs) => legs.filter((leg) => leg.arrive <= t).length);
    const finished = finishes.map((f) => t >= f);
    const key = language + done.join() + finished.join();
    if (key === shown) return;
    shown = key;
    done.forEach((count, i) => {
      scoreCells[i].textContent = count + "/" + GROUPS;
      rankCells[i].textContent = finished[i] ? translate(["1st", "2nd", "3rd"][ranks[i]]) : "";
    });
  }

  registerGuide({
    hash: "#centipede-race",
    title: "Centipede Race",
    view,
    controllers: [
      createSteps(view, steps),
      createOverview(view, { steps, draw: drawField, phaseAt, duration: CYCLE, onRender: updateReadouts }),
    ],
  });
})();
