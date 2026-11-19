"use strict";

// Centipede Race: step-card scenes, the page illustration and the whole-field top view.
(() => {
  const team = teams[0].color;
  const nextUp = "#fff0a2";
  const red = "#e8503a";
  const SPACING = 12;
  const STEP = 8;
  const PLANK = 56;

  const steps = [
    {
      title: "Step on the planks",
      detail: "Your group of 4 lines up behind the start line. Everyone puts one foot on each of the 2 planks.",
      scene: drawStart, duration: 4200,
    },
    {
      title: "Walk in step",
      detail: "Lift the same plank together, then the other one. Walk straight to the next handoff point.",
      scene: drawWalk, duration: 4800,
    },
    {
      title: "Hand over the planks",
      detail: "Step off at the handoff point. Your next group gets on and keeps going in the same direction. Group 6 crosses the finish line.",
      scene: drawHand, duration: 6400,
    },
    {
      title: "Fell off? Get back on",
      detail: "If someone falls or the planks come apart, put them back on and carry on from the same spot. No penalty.",
      scene: drawFall, duration: 5600,
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

  // Four players in file on two planks. `cycle` counts half-steps: on even half-steps the far
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
    const body = x0 + (far + near) / 2;
    const apart = opts.apart || 0;
    plank(ctx, x0 + far, y - 5 - liftFar);
    for (let i = 0; i < 4; i++) {
      const px = body + (i - 1.5) * SPACING;
      if (opts.fallen === i) continue;
      runner(ctx, px, y - Math.max(liftFar, liftNear) * 0.6, color, moving ? (n % 2 ? 1 : -1) : 0);
    }
    plank(ctx, x0 + near - apart, y - 1 - liftNear + apart * 0.3);
    if (opts.fallen !== undefined) {
      const px = body + (opts.fallen - 1.5) * SPACING;
      runner(ctx, px + 5, y + 8, color, 0, true);
      stars(ctx, px + 4, y - 20);
    }
  }

  // Step 1: the planks lie behind the start line; the players hop on one by one, then set off.
  function drawStart(ctx, t) {
    const x0 = 44;
    const y = 86;
    field(ctx, [x0 + PLANK / 2]);
    if (t < 0.55) {
      plank(ctx, x0, y - 5);
      for (let i = 0; i < 4; i++) {
        const from = 0.08 + i * 0.1;
        const p = Math.min(Math.max((t - from) / 0.12, 0), 1);
        const px = x0 + (i - 1.5) * SPACING;
        runner(ctx, px, lerp(60, y, ease(p)) - Math.sin(Math.PI * p) * 8, team, p > 0 && p < 1 ? 1 : 0);
      }
      plank(ctx, x0, y - 1);
      return;
    }
    centipede(ctx, x0, y, team, ((t - 0.55) / 0.45) * 8);
  }

  // Step 2: walking across the field, the two planks lifting in turn.
  function drawWalk(ctx, t) {
    field(ctx, [148]);
    centipede(ctx, 26, 84, team, t * 22);
  }

  // Step 3: the arriving group steps aside and the next group continues down the field.
  function drawHand(ctx, t) {
    const y = 80;
    const x0 = 32;
    const stop = x0 + 48;
    field(ctx, [stop]);
    if (t < 0.34) {
      centipede(ctx, x0, y, team, (t / 0.34) * 12);
      for (let i = 0; i < 4; i++) runner(ctx, stop + (i - 1.5) * SPACING, 58, nextUp);
    } else if (t < 0.62) {
      plank(ctx, stop, y - 5);
      for (let i = 0; i < 4; i++) {
        const off = ease(Math.min(Math.max((t - 0.34 - (3 - i) * 0.02) / 0.14, 0), 1));
        const px = stop + (i - 1.5) * SPACING + off * 8;
        runner(ctx, px, y + off * 14, team);
      }
      for (let i = 0; i < 4; i++) {
        const p = ease(Math.min(Math.max((t - 0.44 - i * 0.03) / 0.1, 0), 1));
        runner(ctx, stop + (i - 1.5) * SPACING, lerp(58, y, p) - Math.sin(Math.PI * p) * 6, nextUp);
      }
      plank(ctx, stop, y - 1);
    } else {
      centipede(ctx, stop, y, nextUp, ((t - 0.62) / 0.38) * 12);
    }
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

  // Top view: six consecutive legs across the field, with a camera that follows the lead group.
  const VW = 320;
  const VH = 206;
  const LANES = [56, 116, 176];
  const GROUPS = 6;
  const START = 36;
  const LEG_LENGTH = 112;
  const FINISH = START + GROUPS * LEG_LENGTH;
  const FIELD_WIDTH = FINISH + 60;
  const READY = 1400;
  const HAND = 700;
  const WALK = [2300, 2450, 2200];
  const STUMBLE = { team: 1, leg: 2, at: 0.4, ms: 1400 };
  const station = (index) => START + index * LEG_LENGTH;

  // When each team's legs start and finish (time in ms from the start of the loop).
  const schedules = WALK.map((walk, teamIndex) => {
    const legs = [];
    let time = READY;
    for (let k = 0; k < GROUPS; k++) {
      const extra = teamIndex === STUMBLE.team && k === STUMBLE.leg ? STUMBLE.ms : 0;
      const leg = { start: time, walk, extra, arrive: time + walk + extra };
      if (extra) leg.stumble = time + walk * STUMBLE.at;
      legs.push(leg);
      time = leg.arrive + HAND;
    }
    return legs;
  });
  const finishes = schedules.map((legs) => legs[GROUPS - 1].arrive);
  const ranks = finishes.map((f) => [...finishes].sort((a, b) => a - b).indexOf(f));
  const firstTeam = ranks.indexOf(0);
  const stumble = schedules[STUMBLE.team][STUMBLE.leg];
  const CYCLE = Math.max(...finishes) + 3600;
  const events = [
    { time: 0, step: 0, caption: "Each team’s first group steps onto its planks behind the line." },
    { time: READY, step: 1, caption: "Go! Group 1 walks to the first handoff point, one lane per team." },
    { time: schedules[firstTeam][0].arrive, step: 2, caption: "Group 1 steps aside. Group 2 takes the planks and continues toward the finish." },
    { time: schedules[firstTeam][1].start + 400, step: 1, caption: "Every group walks the same distance in the same direction." },
    { time: stumble.stumble, step: 3, caption: `${teams[STUMBLE.team].name}’s planks came apart. Put them back on and carry on from the same spot. No penalty.` },
    { time: stumble.stumble + STUMBLE.ms, step: 1, caption: "The waiting groups take over at the next handoff points down the field." },
    { time: schedules[firstTeam][GROUPS - 1].start, step: 1, caption: "Group 6 takes the planks for the final leg to the finish line." },
    { time: finishes[firstTeam], step: -1, caption: `${teams[firstTeam].name}’s 6th group finishes first.` },
    { time: Math.max(...finishes), step: -1, caption: "Ranked by finish order: 1st gets 50 points, 2nd 40, 3rd 20. No stopwatch." },
  ].sort((a, b) => a.time - b.time);
  const local = (time) => ((time % CYCLE) + CYCLE) % CYCLE;

  function phaseAt(time) {
    const t = local(time);
    return events.filter((e) => e.time <= t).pop() || events[0];
  }

  function lanePosition(legs, time) {
    const group = legs.findIndex((leg) => time < leg.arrive);
    if (group === -1) return { group, x: FINISH, stalled: 0 };
    const leg = legs[group];
    const stalled = leg.extra ? Math.max(0, time - leg.stumble) : 0;
    const walking = Math.max(0, time - leg.start - Math.min(stalled, leg.extra));
    return { group, x: station(group) + (walking / leg.walk) * LEG_LENGTH, stalled };
  }

  function topPlanks(ctx, x, c, wiggle, apart) {
    [[c - 4, wiggle], [c + 4 + apart, -wiggle - apart]].forEach(([y, dx]) => {
      block(ctx, ink, x - 15 + dx, y - 1, 30, 3);
      block(ctx, "#e3a866", x - 14 + dx, y, 28, 1);
    });
  }

  function topGroup(ctx, x, c, color, fallen) {
    for (let i = 0; i < 4; i++) {
      if (fallen && i === 2) topPlayer(ctx, [x + (i - 1.5) * 7, c + 11], color, "duck");
      else topPlayer(ctx, [x + (i - 1.5) * 7, c], color, "stand");
    }
  }

  function drawLane(ctx, teamIndex, t, { group, x, stalled }) {
    const c = LANES[teamIndex];
    const color = teams[teamIndex].color;
    const legs = schedules[teamIndex];
    for (let g = 0; g < GROUPS; g++) {
      const leg = legs[g];
      if (g === group) continue;
      if (t < leg.start) {
        topGroup(ctx, station(g), c - 16, color, false);
      } else {
        const off = ease(Math.min((t - leg.arrive) / HAND, 1));
        ctx.globalAlpha = lerp(1, 0.45, off);
        topGroup(ctx, station(g + 1) + (g === GROUPS - 1 ? 30 : 8) * off, c + 16 * off, color, false);
        ctx.globalAlpha = 1;
      }
    }
    if (group === -1) {
      topPlanks(ctx, FINISH, c, 0, 0);
      const label = ["1ST", "2ND", "3RD"][ranks[teamIndex]];
      ctx.font = "bold 9px monospace";
      block(ctx, ink, FINISH + 22, c - 19, 22, 12);
      block(ctx, ranks[teamIndex] === 0 ? "#ffe079" : "#fffaf0", FINISH + 23, c - 18, 20, 10);
      ctx.fillStyle = ink;
      ctx.fillText(label, FINISH + 24, c - 10);
      return;
    }

    const leg = legs[group];
    const boarding = group === 0 ? t / READY : (t - legs[group - 1].arrive) / HAND;
    const onPlanks = ease(Math.max(0, (Math.min(boarding, 1) - 0.4) / 0.6));
    const fallen = stalled > 0 && stalled < leg.extra * 0.75;
    const apart = stalled > 0 ? 5 * Math.min(1, Math.max(0, (leg.extra - stalled) / (leg.extra * 0.25))) : 0;
    const wiggle = t > leg.start && !apart ? Math.sin(t / 90) * 1.5 : 0;
    topPlanks(ctx, x, c, wiggle, apart);
    topGroup(ctx, x, lerp(c - 16, c, onPlanks), color, fallen);
    if (fallen) {
      block(ctx, ink, x - 2, c - 17, 5, 9);
      block(ctx, "#fffaf0", x - 1, c - 16, 3, 7);
      block(ctx, red, x - 1, c - 15, 3, 3);
      block(ctx, red, x - 1, c - 11, 3, 1);
    }
  }

  // The strip maps all six legs and shows which part of the field is in the camera view.
  function drawFieldMap(ctx, camera, positions) {
    const scale = (VW - 20) / FIELD_WIDTH;
    const mapX = (x) => 10 + x * scale;
    block(ctx, "#b9e3a8", 0, 0, VW, 26);
    block(ctx, "#7db475", 10, 13, VW - 20, 10);
    block(ctx, "#e7f4cc", mapX(camera), 13, VW * scale, 10);
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i <= GROUPS; i++) {
      const x = mapX(station(i));
      block(ctx, ink, x, 13, 1, 10);
      ctx.fillStyle = ink;
      ctx.fillText(i === 0 ? "START" : i === GROUPS ? "FINISH" : String(i + 1), x, 10);
    }
    positions.forEach(({ x }, teamIndex) => {
      block(ctx, ink, mapX(x) - 2, 14 + teamIndex * 3, 5, 3);
      block(ctx, teams[teamIndex].color, mapX(x) - 1, 15 + teamIndex * 3, 3, 1);
    });
    ctx.textAlign = "start";
  }

  function drawField(ctx, time) {
    const t = local(time);
    const positions = schedules.map((legs) => lanePosition(legs, t));
    const lead = Math.max(...positions.map(({ x }) => x));
    const camera = Math.round(Math.min(FIELD_WIDTH - VW, Math.max(0, lead - VW * 0.42)));
    ctx.save();
    ctx.translate(-camera, 0);
    block(ctx, "#9fd18c", 0, 26, FIELD_WIDTH, VH - 26);
    for (let x = 0; x < FIELD_WIDTH; x += 32) block(ctx, "#a9d898", x, 26, 16, VH - 26);
    [26, 86, 146, VH - 1].forEach((y) => block(ctx, "#fffaf0", 0, y, FIELD_WIDTH, 1));
    for (let i = 0; i < GROUPS; i++) {
      block(ctx, "#fffaf0", station(i) + (i ? 0 : 15), 26, i ? 1 : 3, VH - 26);
    }
    for (let y = 26; y < VH; y += 4) {
      block(ctx, "#fffaf0", FINISH - 4, y, 8, 4);
      block(ctx, ink, FINISH - 4 + ((y - 26) % 8 ? 4 : 0), y, 4, 4);
    }
    positions.forEach((position, teamIndex) => drawLane(ctx, teamIndex, t, position));
    ctx.restore();
    drawFieldMap(ctx, camera, positions);
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
    const key = done.join() + finished.join();
    if (key === shown) return;
    shown = key;
    done.forEach((count, i) => {
      scoreCells[i].textContent = count + "/" + GROUPS;
      rankCells[i].textContent = finished[i] ? ["1st", "2nd", "3rd"][ranks[i]] : "";
    });
  }

  drawWalk(view.querySelector(".centipede-art").getContext("2d"), 0.36);
  registerGuide({
    hash: "#centipede-race",
    title: "Centipede Race",
    view,
    controllers: [
      createSteps(view, steps),
      createOverview(view, { steps, draw: drawField, phaseAt, onRender: updateReadouts }),
    ],
  });
})();
