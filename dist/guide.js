"use strict";

const games = [
  { title: "Typhoon Race", href: "#typhoon-race" },
  { title: "Game 2" },
  { title: "Game 3" },
  { title: "Game 4" },
];

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

const select = (id) => document.getElementById(id);
const home = select("home-view");
const race = select("race-view");
const video = select("race-video");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const glyphs = {
  A: ["01110","11011","10001","11111","11011","11011","11011"],
  C: ["01111","11000","11000","11000","11000","11000","01111"],
  E: ["11111","11000","11000","11110","11000","11000","11111"],
  G: ["01110","11011","11000","11000","11011","11011","01110"],
  H: ["11011","11011","11011","11111","11011","11011","11011"],
  L: ["11000","11000","11000","11000","11000","11000","11111"],
  M: ["10001","11011","11111","10101","10001","10001","10001"],
  N: ["10001","11001","11001","10101","10011","10011","10001"],
  O: ["01110","11011","11011","11011","11011","11011","01110"],
  P: ["11110","11011","11011","11110","11000","11000","11000"],
  R: ["11110","11011","11011","11110","11100","11010","11011"],
  S: ["01111","11000","11000","01110","00011","00011","11110"],
  T: ["11111","00100","00100","00100","00100","00100","00100"],
  U: ["11011","11011","11011","11011","11011","11011","01110"],
  Y: ["10001","11011","01010","00100","00100","00100","00100"],
};

function drawTitle(title) {
  const lines = title.dataset.pixel.split("|");
  const unit = 8;
  const width = Math.max(...lines.map((line) => line.length * 6 - 1)) * unit;
  const lettering = document.createElement("canvas");
  lettering.width = width + 8;
  lettering.height = (lines.length * 9 - 2) * unit + 12;
  lettering.setAttribute("aria-hidden", "true");
  const brush = lettering.getContext("2d");
  const pixels = [];
  const alignLeft = title.dataset.pixelAlign === "left";
  lines.forEach((line, lineIndex) => {
    const inset = alignLeft ? 2 : Math.floor((width - (line.length * 6 - 1) * unit) / 2) + 2;
    [...line].forEach((letter, letterIndex) => {
      glyphs[letter].forEach((row, y) => {
        [...row].forEach((cell, x) => {
          if (cell === "1") pixels.push([inset + (letterIndex * 6 + x) * unit, 3 + (lineIndex * 9 + y) * unit, lineIndex]);
        });
      });
    });
  });
  brush.fillStyle = "#332d72";
  pixels.forEach(([x, y]) => brush.fillRect(x + 2, y + 5, unit + 1, unit + 2));
  brush.fillStyle = "#e7783a";
  pixels.forEach(([x, y]) => brush.fillRect(x - 2, y - 2, unit + 4, unit + 4));
  pixels.forEach(([x, y, line]) => {
    brush.fillStyle = line === 0 ? "#ffca56" : "#ffe08a";
    brush.fillRect(x, y, unit - 1, unit - 1);
    brush.fillStyle = line === 0 ? "#ffdb78" : "#ffedab";
    brush.fillRect(x, y, unit - 1, 1);
  });
  title.append(lettering);
  title.classList.add("pixel-ready");
}

document.querySelectorAll("[data-pixel]").forEach(drawTitle);

// Pixel-art running track along the bottom of the home page, drawn once as a repeating tile.
function drawTrack() {
  const tile = document.createElement("canvas");
  tile.width = 48;
  tile.height = 36;
  const ctx = tile.getContext("2d");
  const fill = (color, x, y, width, height) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  };
  fill("#8fca6a", 0, 0, 48, 3);
  fill("#a4d77c", 0, 0, 48, 1);
  for (let x = 0; x < 48; x += 8) fill("#79b45a", x + 3, 1, 2, 1);
  for (let x = 0; x < 48; x += 12) {
    fill("#fff7e6", x, 3, 6, 2);
    fill("#e35d3a", x + 6, 3, 6, 2);
  }
  fill("#d9673f", 0, 5, 48, 31);
  for (let i = 0; i < 70; i++) fill(i % 2 ? "#c95a35" : "#e5784d", (i * 29 + 7) % 48, 6 + ((i * 17) % 29), 1, 1);
  [13, 21, 29].forEach((y) => fill("#fff1d6", 0, y, 48, 1));
  fill("#b9512f", 0, 35, 48, 1);
  select("track").style.backgroundImage = "url(" + tile.toDataURL() + ")";
}

drawTrack();

// Games without a guide yet are shown as plain cards, not buttons.
games.forEach((game) => {
  const card = document.createElement(game.href ? "a" : "div");
  card.className = game.href ? "game-card active" : "game-card soon";
  if (game.href) card.href = game.href;
  const text = document.createElement("span");
  const name = document.createElement("strong");
  name.className = "card-title";
  name.textContent = game.title;
  const description = document.createElement("span");
  description.className = "card-caption";
  description.textContent = game.href ? "View game rules" : "Coming soon";
  text.append(name, description);
  card.append(text);
  if (game.href) {
    const arrow = document.createElement("span");
    arrow.className = "card-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    card.append(arrow);
  }
  select("game-grid").append(card);
});

// Pixel scenes for the step cards, drawn on a 160 × 96 canvas.
const W = 160;
const H = 96;
const ink = "#282a49";
const racing = "#f47748";
const waiting = "#fff0a2";
const nextUp = "#f7e282";
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const lerp = (a, b, p) => a + (b - a) * p;

function block(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), width, height);
}

function cone(ctx, x, y) {
  block(ctx, "#a84f37", x - 6, y, 13, 3);
  block(ctx, "#ef844b", x - 4, y - 4, 9, 5);
  block(ctx, "#fff0c3", x - 3, y - 6, 7, 3);
  block(ctx, "#ef844b", x - 2, y - 10, 5, 5);
  block(ctx, "#f5a461", x, y - 12, 2, 2);
}

function runner(ctx, x, y, color, stride = 0, duck = false) {
  const skin = "#f4c39a";
  const shirt = duck ? y - 11 : y - 16;
  block(ctx, ink, x - 4, shirt - 8, 9, 8);
  block(ctx, skin, x - 2, shirt - 6, 6, 5);
  block(ctx, color, x - 5, shirt - 9, 11, 3);
  block(ctx, ink, x - 6, shirt, 13, 9);
  block(ctx, color, x - 4, shirt + 1, 9, 7);
  block(ctx, skin, x - 7, shirt + 2, 3, 4);
  block(ctx, skin, x + 5, shirt + 2, 3, 4);
  block(ctx, ink, x - 4 - stride, y - 6, 4, 6);
  block(ctx, ink, x + 1 + stride, y - 6, 4, 6);
  block(ctx, "#fff7d5", x - 5 - stride, y - 1, 5, 2);
  block(ctx, "#fff7d5", x + 1 + stride, y - 1, 5, 2);
}

function shadow(ctx, x, y) {
  block(ctx, "#c98a5c", x - 5, y, 11, 2);
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

// Step cards play one at a time and keep their position when paused.
const contexts = [];
const cards = steps.map((step, index) => {
  const card = document.createElement("li");
  card.className = "step-card";
  const media = document.createElement("div");
  media.className = "step-media";
  const scene = document.createElement("canvas");
  scene.width = W;
  scene.height = H;
  scene.setAttribute("aria-hidden", "true");
  contexts.push(scene.getContext("2d"));
  // The play badge is the keyboard-reachable control; its clicks bubble up to the card.
  const play = document.createElement("button");
  play.type = "button";
  play.className = "step-play";
  play.setAttribute("aria-pressed", "false");
  play.setAttribute("aria-label", "Play step " + (index + 1) + " animation");
  play.textContent = "▶";
  card.addEventListener("click", () => toggleStep(index));
  media.append(scene, play);
  const text = document.createElement("div");
  text.className = "step-text";
  const number = document.createElement("span");
  number.className = "step-number";
  number.textContent = "STEP " + (index + 1);
  const title = document.createElement("h3");
  title.textContent = step.title;
  const detail = document.createElement("p");
  detail.textContent = step.detail;
  text.append(number, title, detail);
  card.append(media, text);
  select("steps").append(card);
  step.scene(contexts[index], step.still);
  return card;
});

let playing = -1;
let frame = 0;
let lastStepFrame = null;
const stepTimes = steps.map(() => 0);

function animate(now) {
  const step = steps[playing];
  if (lastStepFrame !== null) {
    stepTimes[playing] = (stepTimes[playing] + now - lastStepFrame) % step.duration;
  }
  lastStepFrame = now;
  step.scene(contexts[playing], stepTimes[playing] / step.duration);
  frame = requestAnimationFrame(animate);
}

function startAnimation() {
  cancelAnimationFrame(frame);
  lastStepFrame = null;
  if (playing >= 0 && !race.hidden) {
    frame = requestAnimationFrame(animate);
  }
}

function toggleStep(index) {
  playing = playing === index ? -1 : index;
  cards.forEach((card, cardIndex) => {
    const active = cardIndex === playing;
    const button = card.querySelector(".step-play");
    card.classList.toggle("current", active);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-label", (active ? "Pause" : "Play") + " step " + (cardIndex + 1) + " animation");
    button.textContent = active ? "Ⅱ" : "▶";
  });
  startAnimation();
}

// Course overview: a top view of all three lanes playing one full round on a loop.
const courseCanvas = select("course-canvas");
const courseCtx = courseCanvas.getContext("2d");
const CW = 320;
const CH = 246;
const teamColors = ["#f47748", "#4a7fd4", "#fffdf5"];
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
const mix = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
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

function pixelLine(ctx, [x1, y1], [x2, y2], color, size) {
  const count = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
  for (let i = 0; i <= count; i++) {
    block(ctx, color, lerp(x1, x2, i / count) - size / 2, lerp(y1, y2, i / count) - size / 2, size, size);
  }
}

function topPole(ctx, [a, b], height) {
  pixelLine(ctx, [a[0] + height, a[1] + height], [b[0] + height, b[1] + height], "rgba(40,42,73,.22)", 3);
  pixelLine(ctx, a, b, ink, 3);
  pixelLine(ctx, a, b, "#fff0bc", 1);
}

function topPlayer(ctx, [x, y], color, pose) {
  if (pose === "jump") {
    block(ctx, "rgba(40,42,73,.25)", x - 2, y - 1, 7, 6);
    block(ctx, ink, x - 4, y - 5, 8, 8);
    block(ctx, color, x - 3, y - 4, 6, 6);
    block(ctx, "#ffffff", x - 3, y - 4, 2, 1);
  } else if (pose === "duck") {
    block(ctx, ink, x - 2, y - 2, 4, 4);
    block(ctx, color, x - 1, y - 1, 2, 2);
  } else {
    block(ctx, ink, x - 3, y - 3, 6, 6);
    block(ctx, color, x - 2, y - 2, 4, 4);
  }
}

function topCone(ctx, x, y) {
  block(ctx, "#a84f37", x - 3, y - 3, 7, 7);
  block(ctx, "#ef844b", x - 2, y - 2, 5, 5);
  block(ctx, "#fff0c3", x - 1, y - 1, 3, 3);
  block(ctx, "#ef844b", x, y, 1, 1);
}

function drawLane(ctx, lane, time) {
  const c = 52 + lane * 76;
  const color = teamColors[lane];
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

let coursePhase = null;

function drawCourse(time) {
  const ctx = courseCtx;
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
  }
  const [phase] = phaseAt(time);
  if (phase !== coursePhase) {
    coursePhase = phase;
    select("course-caption").textContent = phase.caption;
    [...select("course-phases").children].forEach((item, index) => item.classList.toggle("current", index === phase.step));
  }
}

// The top view plays on its own while it is on screen, and pauses when scrolled away.
steps.forEach((step) => {
  const item = document.createElement("li");
  item.textContent = step.title;
  select("course-phases").append(item);
});

let courseFrame = 0;
let courseClock = 0;
let courseLast = null;
let courseVisible = false;

const speeds = [0.25, 0.5, 1, 1.5, 2, 3];
let speedIndex = 2;

function setSpeed(index) {
  speedIndex = Math.max(0, Math.min(speeds.length - 1, index));
  select("speed-value").textContent = speeds[speedIndex] + "×";
  select("speed-down").disabled = speedIndex === 0;
  select("speed-up").disabled = speedIndex === speeds.length - 1;
}

select("speed-down").addEventListener("click", () => setSpeed(speedIndex - 1));
select("speed-up").addEventListener("click", () => setSpeed(speedIndex + 1));

function courseTick(now) {
  if (courseLast !== null) courseClock += (now - courseLast) * speeds[speedIndex];
  courseLast = now;
  drawCourse(courseClock);
  courseFrame = requestAnimationFrame(courseTick);
}

function startCourse() {
  cancelAnimationFrame(courseFrame);
  courseLast = null;
  if (courseVisible && !race.hidden && !reducedMotion.matches) courseFrame = requestAnimationFrame(courseTick);
}

drawCourse(reducedMotion.matches ? 2400 : 0);
new IntersectionObserver(([entry]) => {
  courseVisible = entry.isIntersecting;
  startCourse();
}).observe(courseCanvas);

function route() {
  const isRace = location.hash === "#typhoon-race";
  const changed = race.hidden === isRace;
  home.hidden = isRace;
  race.hidden = !isRace;
  // The home page fills the screen exactly, so the footer only shows on game pages.
  select("site-footer").hidden = !isRace;
  document.title = (isRace ? "Typhoon Race" : "Game Rules") + " | Undokai 2026";
  // Load the video only on the race page, and unload it on leaving so it stops playing.
  if (isRace && video.src !== video.dataset.src) video.src = video.dataset.src;
  if (!isRace && video.src && video.src !== "about:blank") video.src = "about:blank";
  if (isRace && changed) {
    window.scrollTo({ top: 0, behavior: "instant" });
    select("race-title").focus({ preventScroll: true });
  } else if (!isRace && location.hash === "#games") {
    select("games").scrollIntoView();
  }
  startAnimation();
  startCourse();
}

document.querySelector(".skip").addEventListener("click", (event) => {
  event.preventDefault();
  select("main").focus();
  select("main").scrollIntoView();
});

route();
window.addEventListener("hashchange", route);
