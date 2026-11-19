"use strict";

// Dondarm Slerk Cher: step cards and example rounds in the same circle.
(() => {
  const center = [80, 52];
  const radius = 36;
  const groupSize = 10;
  const firstNumber = 1;
  const extraNumber = 7;
  const rosters = [2.75, 0.66, 4.85].map((middle) =>
    Array.from({ length: groupSize }, (_, i) => {
      const angle = middle + lerp(-0.82, 0.82, i / (groupSize - 1));
      const distance = radius + 5;
      return [center[0] + distance * Math.cos(angle), center[1] + distance * Math.sin(angle)];
    }),
  );
  const atBranch = [[75, 53], [85, 53], [82, 40]];
  const atStalemate = [[68, 63], [93, 62], [75, 36]];
  const atGoal = [44, 52];

  const progress = (time, from, to) => Math.min(1, Math.max(0, (time - from) / (to - from)));
  const movePlayers = (from, to, amount) => from.map((point, i) => mix(point, to[i], amount));
  const winner = ({ name, color }) => ({ label: `${name.toUpperCase()} WINS`, color });
  const noWinner = { label: "NO WINNER", color: "#ffe079" };

  function drawCircle(ctx, { players = [], holders = [], number = firstNumber, helpers = [], additionalNumber, remaining, result, labelSize = 9 }) {
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

    rosters.forEach((spots, team) => {
      spots.forEach(([x, y], i) => {
        if ((players[team] && i === number - 1) || (helpers[team] && i === additionalNumber - 1)) return;
        block(ctx, ink, x - 2, y - 2, 5, 5);
        block(ctx, teams[team].color, x - 1, y - 1, 3, 3);
      });
    });
    const entrants = [...players, ...helpers];
    entrants.forEach((point, i) => topPlayer(ctx, point, teams[i % teams.length].color, "stand"));
    const [x, y] = holders.length === 2 ? mix(entrants[holders[0]], entrants[holders[1]], 0.5)
      : holders.length === 1 ? [entrants[holders[0]][0], entrants[holders[0]][1] + 4] : center;
    pixelLine(ctx, [x - 4, y + 2], [x + 4, y - 2], "#603c2a", 2);
    block(ctx, "#376437", x + 3, y - 3, 3, 2);

    ctx.fillStyle = ink;
    ctx.font = `bold ${labelSize}px monospace`;
    ctx.textBaseline = "top";
    ctx.fillText("CALL #" + number + (additionalNumber ? " + #" + additionalNumber : ""), 5, 4);
    if (remaining !== undefined) {
      ctx.textAlign = "right";
      const clock = Math.floor(remaining / 60) + ":" + String(remaining % 60).padStart(2, "0");
      ctx.fillText(clock, W - 5, 4);
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
    ctx.restore();
  }

  function approach(t, number = firstNumber, destination = atBranch) {
    const starts = rosters.map((spots) => spots[number - 1]);
    return movePlayers(starts, destination, ease(t));
  }

  function runForEdge(t) {
    return movePlayers(atBranch, [atGoal, [59, 56], [64, 42]], t);
  }

  function stealAndTag(t) {
    return movePlayers(atBranch, [[77, 58], [105, 54], [102, 50]], t);
  }

  const additionalCall = 2800;
  const pickup = 5100;
  const assistedFinish = 6800;
  const exampleDuration = 8000;

  function assistedRound(time) {
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

  const steps = [
    {
      title: "Listen for your number",
      detail: "One player per team enters on each call. If play stalls, the game master can call another number. Teammates may shield the carrier by blocking without pushing.",
      duration: exampleDuration,
      still: 0.53,
      scene: (ctx, t) => drawCircle(ctx, assistedRound(t * exampleDuration)),
    },
    {
      title: "Grab the branch",
      detail: "Reach the center first. Players who grab it together may pull, tug, or let go. Opponents can steal it.",
      duration: 4200,
      still: 0.65,
      scene: (ctx, t) => drawCircle(ctx, {
        players: t < 0.48 ? approach(progress(t, 0, 0.48)) : stealAndTag(progress(t, 0.75, 1) * 0.5),
        holders: t < 0.48 ? [] : t < 0.75 ? [0, 1] : [1],
      }),
    },
    {
      title: "Carry it to the edge",
      detail: "Your team wins if you reach the edge with the branch. Anyone holding the branch can be tagged.",
      duration: 3300,
      still: 0.59,
      scene: (ctx, t) => drawCircle(ctx, {
        players: runForEdge(progress(t, 0, 0.75)), holders: [0], result: t >= 0.75 ? winner(teams[0]) : null,
      }),
    },
    {
      title: "Tag the carrier",
      detail: "Tag a carrier before the edge to win for your team. If nobody wins within 90 seconds, the round has no winner.",
      duration: 3300,
      still: 0.8,
      scene: (ctx, t) => drawCircle(ctx, {
        players: stealAndTag(progress(t, 0, 0.75)), holders: [1], result: t >= 0.75 ? winner(teams[2]) : null,
      }),
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
        { until: 1000, step: 0, caption: `One group of ${groupSize} from each team waits near the circle’s edge. The first call is number 1.` },
        { until: additionalCall, step: 0, caption: "The three number 1 players stop near the branch. Nobody picks it up." },
        { until: pickup, step: 0, caption: "The game master calls number 7. One more player from each team joins the players already inside." },
        { until: assistedFinish, step: 2, caption: `${teams[0].name}’s number 7 takes the branch. Their number 1 blocks an opponent’s path without pushing.` },
        { until: exampleDuration, step: 2, caption: `${teams[0].name} reaches the edge with the branch and wins the round.` },
      ],
      state: assistedRound,
    },
    {
      title: "Reach the edge",
      number: 9,
      end: 5400,
      phases: [
        call,
        { until: 2700, step: 1, caption: `${teams[0].name} gets to the branch first.` },
        { until: 5400, step: 2, caption: "The carrier heads for the edge while the other players follow." },
        { until: exampleDuration, step: 2, caption: `${teams[0].name} reaches the edge with the branch and wins the round.` },
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
      end: 6000,
      phases: [
        call,
        { until: 2500, step: 1, caption: "Two players reach the branch at the same instant." },
        { until: 3700, step: 1, caption: "Both players can hold the branch. Either can be tagged." },
        { until: 6000, step: 3, caption: `${teams[1].name} takes the branch. ${teams[2].name} closes in.` },
        { until: exampleDuration, step: 3, caption: `${teams[2].name} tags the carrier before the edge and wins the round.` },
      ],
      state: (t, number) => ({
        players: t < 3700 ? approach(progress(t, 1000, 2500), number) : stealAndTag(progress(t, 3700, 6000)),
        holders: t < 2500 ? [] : t < 3700 ? [0, 1] : [1],
        result: t >= 6000 ? winner(teams[2]) : null,
      }),
    },
    {
      title: "Time runs out",
      number: 2,
      end: 5700,
      timeout: true,
      phases: [
        call,
        { until: 5700, step: 1, caption: "The branch is still in the center and time is running out." },
        { until: exampleDuration, step: -1, caption: "The 90 seconds are up. No team wins this round." },
      ],
      state: (t, number) => ({ players: approach(progress(t, 1000, 3300) * 0.25, number), result: t >= 5700 ? noWinner : null }),
    },
  ];

  let selectedExample = examples[0];

  function drawExample(ctx, time) {
    const example = selectedExample;
    const elapsed = time % exampleDuration;
    const seconds = example.timeout ? progress(elapsed, 0, example.end) * 90 : Math.min(elapsed, example.end) / 1000;
    ctx.save();
    ctx.scale(ctx.canvas.width / W, ctx.canvas.height / H);
    drawCircle(ctx, { ...example.state(elapsed, example.number), number: example.number, remaining: 90 - Math.floor(seconds), labelSize: 7 });
    ctx.restore();
  }

  function phaseAt(time) {
    return selectedExample.phases.find((phase) => time % exampleDuration < phase.until);
  }

  const view = select("dondarm-slerk-cher-view");
  const overview = createOverview(view, { steps, draw: drawExample, phaseAt, still: selectedExample.still });
  const scenarios = view.querySelector(".course-scenarios");
  examples.forEach((example) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "speed-button";
    button.textContent = example.title;
    button.setAttribute("aria-pressed", String(example === selectedExample));
    button.addEventListener("click", () => {
      scenarios.querySelector('[aria-pressed="true"]').setAttribute("aria-pressed", "false");
      button.setAttribute("aria-pressed", "true");
      selectedExample = example;
      overview.restart(example.still ?? example.end);
    });
    scenarios.append(button);
  });

  registerGuide({
    hash: "#dondarm-slerk-cher",
    title: "Dondarm Slerk Cher",
    view,
    controllers: [createSteps(view, steps), overview],
  });
})();
