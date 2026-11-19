"use strict";

// Dondarm Slerk Cher: step cards and example sets in the same circle.
(() => {
  const center = [80, 50];
  const radius = 36;
  const waitingRadius = radius + 7;
  const exampleGroupSize = 10;
  const firstNumber = 1;
  const extraNumber = 7;
  const rosters = [2.75, 0.66, 4.85].map((middle) =>
    Array.from({ length: exampleGroupSize }, (_, i) => {
      const angle = middle + lerp(-0.82, 0.82, i / (exampleGroupSize - 1));
      return [center[0] + waitingRadius * Math.cos(angle), center[1] + waitingRadius * Math.sin(angle)];
    }),
  );
  const atBranch = [[75, 51], [85, 51], [82, 38]];
  const atStalemate = [[68, 63], [93, 62], [75, 36]];
  const nearLeaf = [[69, 51], [91, 52], [82, 39]];
  const atGoal = [center[0] - radius - 4, center[1]];

  const progress = (time, from, to) => Math.min(1, Math.max(0, (time - from) / (to - from)));
  const movePlayers = (from, to, amount) => from.map((point, i) => mix(point, to[i], amount));
  const winner = ({ name, color }) => ({ label: `${name.toUpperCase()} WINS`, color });
  const noPoints = { label: "NO POINTS", color: "#ffe079" };
  const tagContact = [2, 1];

  function forEachWaitingPlayer({ players = [], helpers = [], number = firstNumber, additionalNumber }, draw) {
    rosters.forEach((spots, team) => {
      spots.forEach((position, i) => {
        if ((players[team] && i === number - 1) || (helpers[team] && i === additionalNumber - 1)) return;
        draw(position, teams[team].color);
      });
    });
  }

  function leafPosition(entrants, holders) {
    if (holders.length === 2) return mix(entrants[holders[0]], entrants[holders[1]], 0.5);
    if (holders.length === 1) return entrants[holders[0]];
    return center;
  }

  function drawLeaf(ctx, x, y) {
    pixelLine(ctx, [x - 4, y + 2], [x + 4, y - 2], "#603c2a", 2);
    block(ctx, "#376437", x + 3, y - 3, 3, 2);
  }

  function drawTag(ctx, [taggerX, taggerY], [carrierX, carrierY], side = false) {
    const direction = Math.sign(carrierX - taggerX);
    const height = side ? 10 : 0;
    const arm = [taggerX + direction * (side ? 4 : 2), taggerY - height];
    const hand = [carrierX - direction * (side ? 5 : 3), carrierY - height];
    pixelLine(ctx, arm, hand, ink, 3);
    pixelLine(ctx, arm, hand, "#f4c39a", 1);
    const [x, y] = hand;
    block(ctx, "#fffaf0", x - 1, y - 5, 2, 2);
    block(ctx, "#fffaf0", x + 3, y - 3, 2, 2);
    block(ctx, "#fffaf0", x + 3, y + 2, 2, 2);

    const labelY = carrierY - (side ? 33 : 22);
    block(ctx, ink, x - 14, labelY, 29, 12);
    block(ctx, "#ffe079", x - 13, labelY + 1, 27, 10);
    ctx.fillStyle = ink;
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("TAG!", x + 0.5, labelY + 2);
  }

  function drawCircle(ctx, state) {
    const { players = [], holders = [], helpers = [], tag } = state;
    ctx.save();
    block(ctx, "#b9e3a8", 0, 0, W, H);
    for (let x = 0; x < W; x += 24) block(ctx, "#b0dba0", x, 13, 12, H - 13);

    ctx.beginPath();
    ctx.arc(...center, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#92c680";
    ctx.fill();
    ctx.strokeStyle = "#fffaf0";
    ctx.lineWidth = 2;
    ctx.stroke();
    block(ctx, "#6da960", center[0] - 1, center[1] - 1, 3, 3);

    forEachWaitingPlayer(state, ([x, y], color) => {
      block(ctx, ink, x - 2, y - 2, 5, 5);
      block(ctx, color, x - 1, y - 1, 3, 3);
    });
    const entrants = [...players, ...helpers];
    entrants.forEach((point, i) => topPlayer(ctx, point, teams[i % teams.length].color, "stand"));
    const [x, y] = leafPosition(entrants, holders);
    drawLeaf(ctx, x, y + (holders.length === 1 ? 4 : 0));
    if (tag) drawTag(ctx, entrants[tag[0]], entrants[tag[1]]);
    drawLabels(ctx, state, 7);
    ctx.restore();
  }

  function drawLabels(ctx, { number = firstNumber, additionalNumber, remaining, result }, labelSize) {
    ctx.fillStyle = ink;
    ctx.font = `bold ${labelSize}px monospace`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText("CALL #" + number + (additionalNumber ? " + #" + additionalNumber : ""), 5, 2);
    if (remaining !== undefined) {
      ctx.textAlign = "right";
      const clock = Math.floor(remaining / 60) + ":" + String(remaining % 60).padStart(2, "0");
      ctx.fillText(clock, W - 5, 2);
    }
    if (result) {
      const badgeWidth = Math.ceil(ctx.measureText(result.label).width) + 8;
      const badgeHeight = labelSize + 4;
      const badgeX = W - 4 - badgeWidth;
      const badgeY = H - 1 - badgeHeight;
      block(ctx, ink, badgeX, badgeY, badgeWidth, badgeHeight);
      block(ctx, result.color, badgeX + 1, badgeY + 1, badgeWidth - 2, badgeHeight - 2);
      ctx.fillStyle = "#080812";
      ctx.textAlign = "right";
      ctx.fillText(result.label, W - 8, badgeY + 2);
    }
  }

  const sideDepth = 0.42;
  const sideCenterY = 62;
  const projectSide = ([x, y]) => [x, sideCenterY + (y - center[1]) * sideDepth];

  function drawSideField(ctx) {
    block(ctx, "#9edbdc", 0, 0, W, H);
    block(ctx, "#a2d492", 0, 15, W, H - 15);
    for (let y = 20; y < H; y += 14) block(ctx, "#aadb9b", 0, y, W, 7);
    for (let k = 0; k < 16; k++) block(ctx, "#86bd78", (k * 37 + 3) % W, 26 + (k * 19) % 63, 2, 1);
    for (let k = 0; k < 42; k++) {
      const angle = k / 42 * Math.PI * 2;
      const x = center[0] + radius * Math.cos(angle);
      const y = sideCenterY + radius * sideDepth * Math.sin(angle);
      block(ctx, "#fffaf0", x - 1, y, 3, 1);
    }
  }

  function sideScene(stateAt) {
    return (ctx, t) => {
      const state = stateAt(t);
      const { players = [], helpers = [], holders = [], tag } = state;
      const before = stateAt(Math.max(0, t - 0.015));
      const entrants = [...players, ...helpers];
      const previousEntrants = [...(before.players ?? []), ...(before.helpers ?? [])];
      const sprites = [];
      forEachWaitingPlayer(state, (position, color) => {
        sprites.push({ position: projectSide(position), color, scale: 0.54, stride: 0 });
      });
      entrants.forEach((position, index) => {
        const previous = previousEntrants[index] ?? position;
        const moving = Math.hypot(position[0] - previous[0], position[1] - previous[1]) > 0.2;
        sprites.push({ position: projectSide(position), color: teams[index % teams.length].color, scale: 0.94,
          stride: moving ? Math.floor(t * 52) % 2 : 0 });
      });
      ctx.save();
      drawSideField(ctx);
      sprites.sort((a, b) => a.position[1] - b.position[1]).forEach(({ position: [x, y], color, scale, stride }) => {
        block(ctx, "#7bba7b", x - 4 * scale, y, 8 * scale, 1);
        ctx.save();
        ctx.translate(Math.round(x), Math.round(y));
        ctx.scale(scale, scale);
        runner(ctx, 0, 0, color, stride);
        ctx.restore();
      });
      const [x, y] = projectSide(leafPosition(entrants, holders));
      drawLeaf(ctx, x, y - (holders.length ? 9 : 0));
      if (tag) drawTag(ctx, projectSide(entrants[tag[0]]), projectSide(entrants[tag[1]]), true);
      drawLabels(ctx, state, 9);
      ctx.restore();
    };
  }

  function approach(t, number = firstNumber, destination = atBranch) {
    const starts = rosters.map((spots) => spots[number - 1]);
    return movePlayers(starts, destination, ease(t));
  }

  function runForEdge(t) {
    return movePlayers(atBranch, [atGoal, [59, 56], [64, 42]], t);
  }

  function stealAndTag(t) {
    return movePlayers(atBranch, [[77, 58], [101, 54], [88, 54]], t);
  }

  const additionalCall = 2800;
  const pickup = 5100;
  const assistedFinish = 6800;
  const tagEnd = 5250;
  const cardTagEnd = 0.62;
  const timeoutEntry = 2150;
  const timeoutEnd = 5700;
  const exampleDuration = 8000;

  function assistedSet(time) {
    const state = { players: time >= 1000 ? approach(progress(time, 1000, 1900), firstNumber, atStalemate) : [] };
    if (time < additionalCall) return state;
    const escape = progress(time, pickup, assistedFinish);
    state.players[0] = mix(atStalemate[0], [62, 57], ease(escape));
    return {
      ...state,
      additionalNumber: extraNumber,
      helpers: time < pickup ? approach(progress(time, additionalCall, pickup), extraNumber)
        : movePlayers(atBranch, [atGoal, [71, 58], [70, 42]], escape),
      holders: time >= pickup ? [teams.length] : [],
      result: time >= assistedFinish ? winner(teams[0]) : null,
    };
  }

  function timeoutSet(time, number) {
    if (time < 1000) return {};
    if (time < timeoutEntry) {
      return { players: approach(progress(time, 1000, timeoutEntry), number, atStalemate) };
    }
    return {
      players: atStalemate.map((position, index) => {
        const effort = progress(time, timeoutEntry + index * 180, timeoutEnd);
        const reach = (1 - Math.cos(effort * 5 * Math.PI)) / 2;
        return mix(position, nearLeaf[index], reach);
      }),
      result: time >= timeoutEnd ? noPoints : null,
    };
  }

  const steps = [
    {
      title: "Listen for your number",
      detail: "One player per team enters on each call. If play stalls, the game master can call another number. Only players inside may block someone’s exit.",
      duration: exampleDuration,
      scene: sideScene((t) => assistedSet(t * exampleDuration)),
    },
    {
      title: "Grab the leaf",
      detail: "Reach the center first. Players who grab it together may pull, tug, or let go. Opponents can steal it.",
      duration: 4200,
      scene: sideScene((t) => ({
        players: t < 0.48 ? approach(progress(t, 0, 0.48)) : stealAndTag(progress(t, 0.75, 1) * 0.5),
        holders: t < 0.48 ? [] : t < 0.75 ? [0, 1] : [1],
      })),
    },
    {
      title: "Carry it past the edge",
      detail: "Carry the leaf past any point on the circle to win for your team.",
      duration: 3300,
      scene: sideScene((t) => ({
        players: runForEdge(progress(t, 0, 0.75)), holders: [0], result: t >= 0.75 ? winner(teams[0]) : null,
      })),
    },
    {
      title: "Make a valid tag",
      detail: "Touch an opponent still inside who has touched the leaf or is holding it. A valid tag wins the set for your team.",
      duration: 3300,
      scene: sideScene((t) => ({
        players: stealAndTag(progress(t, 0, cardTagEnd)), holders: [1],
        tag: t >= cardTagEnd ? tagContact : null, result: t >= cardTagEnd ? winner(teams[2]) : null,
      })),
    },
  ];

  const call = { until: 1000, step: 0, caption: "The game master calls a number. One player from each team enters." };
  const examples = [
    {
      title: "Stalemate",
      number: firstNumber,
      end: assistedFinish,
      still: 4100,
      phases: [
        { until: 1000, step: 0, caption: "Players wait outside the circle until the game master calls a number." },
        { until: additionalCall, step: 0, caption: "The three number 1 players stop near the leaf. Nobody picks it up." },
        { until: pickup, step: 0, caption: "The game master calls number 7. One more player from each team joins the players already inside." },
        { until: assistedFinish, step: 2, caption: `${teams[0].name}’s number 7 takes the leaf. Their number 1 blocks an opponent’s path from inside the circle without pushing.` },
        { until: exampleDuration, step: 2, caption: `${teams[0].name} crosses the circle line with the leaf and wins the set.` },
      ],
      state: assistedSet,
    },
    {
      title: "Reach the edge",
      number: 9,
      end: 5400,
      phases: [
        call,
        { until: 2700, step: 1, caption: `${teams[0].name} gets to the leaf first.` },
        { until: 5400, step: 2, caption: "The carrier heads for the edge while the other players follow." },
        { until: exampleDuration, step: 2, caption: `${teams[0].name} crosses the circle line with the leaf and wins the set.` },
      ],
      state: (t, number) => ({
        players: t < 2700 ? approach(progress(t, 1000, 2700), number) : runForEdge(progress(t, 2700, 5400)),
        holders: t >= 2700 ? [0] : [],
        result: t >= 5400 ? winner(teams[0]) : null,
      }),
    },
    {
      title: "Steal and tag",
      number: 4,
      end: tagEnd,
      phases: [
        call,
        { until: 2500, step: 1, caption: "Two players reach the leaf at the same instant." },
        { until: 3700, step: 1, caption: "Both players touch the leaf. Either can be tagged while still inside the circle, even after letting go." },
        { until: tagEnd, step: 3, caption: `${teams[1].name} takes the leaf. ${teams[2].name} closes in.` },
        { until: exampleDuration, step: 3, caption: `${teams[2].name} touches ${teams[1].name}’s leaf carrier inside the circle and wins the set.` },
      ],
      state: (t, number) => ({
        players: t < 3700 ? approach(progress(t, 1000, 2500), number) : stealAndTag(progress(t, 3700, tagEnd)),
        holders: t < 2500 ? [] : t < 3700 ? [0, 1] : [1],
        tag: t >= tagEnd ? tagContact : null,
        result: t >= tagEnd ? winner(teams[2]) : null,
      }),
    },
    {
      title: "Time runs out",
      number: 2,
      end: timeoutEnd,
      timeout: true,
      phases: [
        call,
        { until: timeoutEnd, step: 1, caption: "Players move toward the leaf inside the circle, but nobody retrieves it." },
        { until: exampleDuration, step: -1, caption: "The 90 seconds are up. Nobody retrieved the leaf, so no team earns a point." },
      ],
      state: timeoutSet,
    },
  ];

  let selectedExample = examples[0];

  function drawExample(ctx, time) {
    const example = selectedExample;
    const elapsed = time % exampleDuration;
    const seconds = example.timeout ? progress(elapsed, 0, example.end) * 90 : Math.min(elapsed, example.end) / 1000;
    ctx.save();
    ctx.scale(ctx.canvas.width / W, ctx.canvas.height / H);
    drawCircle(ctx, { ...example.state(elapsed, example.number), number: example.number, remaining: 90 - Math.floor(seconds) });
    ctx.restore();
  }

  function phaseAt(time) {
    return selectedExample.phases.find((phase) => time % exampleDuration < phase.until);
  }

  const view = select("dondarm-slerk-cher-view");
  const overview = createOverview(view, { steps, draw: drawExample, phaseAt });
  const scenarios = view.querySelector(".course-scenarios");
  const scenarioButtons = examples.map((example) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "speed-button";
    button.textContent = example.title;
    button.setAttribute("aria-pressed", String(example === selectedExample));
    button.addEventListener("click", () => {
      selectExample(example);
      overview.restart(example.still ?? example.end);
    });
    scenarios.append(button);
    return button;
  });

  function selectExample(example) {
    selectedExample = example;
    scenarioButtons.forEach((button, index) => button.setAttribute("aria-pressed", String(examples[index] === example)));
  }

  registerGuide({
    hash: "#dondarm-slerk-cher",
    title: "Dondarm Slerk Cher",
    view,
    controllers: [createSteps(view, steps), {
      start: overview.start,
      reset() {
        selectExample(examples[0]);
        overview.reset();
      },
    }],
  });
})();
