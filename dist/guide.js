"use strict";

// Shared parts of the guide: the home page, pixel-art helpers, step cards, the top-view
// panel and page switching. Each game's scenes live in their own file and register
// themselves with registerGuide().

const games = [
  { title: "Typhoon Race", href: "#typhoon-race" },
  { title: "Beanbag Toss", href: "#beanbag-toss" },
  { title: "Centipede Race", href: "#centipede-race" },
  { title: "Dondarm Slerk Cher", href: "#dondarm-slerk-cher" },
];

const select = (id) => document.getElementById(id);
const home = select("home-view");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const glyphs = {
  A: ["01110","11011","10001","11111","11011","11011","11011"],
  B: ["11110","11011","11011","11110","11011","11011","11110"],
  C: ["01111","11000","11000","11000","11000","11000","01111"],
  D: ["11110","11011","11011","11011","11011","11011","11110"],
  E: ["11111","11000","11000","11110","11000","11000","11111"],
  G: ["01110","11011","11000","11000","11011","11011","01110"],
  H: ["11011","11011","11011","11111","11011","11011","11011"],
  I: ["11111","01110","01110","01110","01110","01110","11111"],
  K: ["11001","11010","11100","11000","11100","11010","11001"],
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
      if (letter === " ") return;
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

// The flag cat: its flag is cut into a few wide columns that jump between set heights in turn
// (a chunky 8-bit wave rolling right), and the
// whole drawing slides along with the track so the running cat seems to pass it.
function setupFlagCat() {
  const flagCat = select("flag-cat");
  const strips = 12;
  const left = 41;
  const right = 98;
  for (let i = 0; i < strips; i++) {
    const strip = document.createElement("img");
    strip.className = "flag-strip";
    strip.src = "assets/cat-flag-cloth.png";
    strip.alt = "";
    const from = left + ((right - left) * i) / strips;
    const to = left + ((right - left) * (i + 1)) / strips;
    // Columns overlap a hair so no gaps open up between them mid-wave.
    strip.style.clipPath = "inset(0 " + (100 - to - 0.3) + "% 0 " + (i ? from - 0.3 : 0) + "%)";
    // Still at the pole, swinging more towards the free end; each column lags the one before it.
    strip.style.setProperty("--amp", (3 * (i + 1)) / strips + "%");
    strip.style.animationDelay = -(strips - i) * 0.1 + "s";
    flagCat.append(strip);
  }

  if (reducedMotion.matches) {
    flagCat.style.transform = "translateX(24vw)";
    return;
  }
  const track = select("track");
  let start = null;
  function slide(now) {
    if (start === null) start = now;
    if (!home.hidden) {
      // Same speed as the track tiles: one tile (4/3 of the track height) every 0.8 s.
      const speed = (track.offsetHeight * 4) / 3 / 0.8;
      const width = flagCat.offsetWidth;
      // A short gap off-screen before it comes round again.
      const loop = window.innerWidth * 1.15 + width;
      // Starts a quarter of the way across, so it is already in view when the page opens.
      const x = ((((now - start) / 1000) * speed + window.innerWidth * 0.25 + width) % loop) - width;
      flagCat.style.transform = "translateX(" + x + "px)";
    }
    requestAnimationFrame(slide);
  }
  requestAnimationFrame(slide);
}

setupFlagCat();

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

// Shared pixel-art helpers. Step scenes are drawn on a 160 × 96 canvas.
const W = 160;
const H = 96;
const ink = "#282a49";
const teams = [
  { name: "White Team", color: "#fffdf5" },
  { name: "Red Team", color: "#e04848" },
  { name: "Blue Team", color: "#4a7fd4" },
];
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const lerp = (a, b, p) => a + (b - a) * p;
const mix = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];

function block(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), width, height);
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

function pixelLine(ctx, [x1, y1], [x2, y2], color, size) {
  const count = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
  for (let i = 0; i <= count; i++) {
    block(ctx, color, lerp(x1, x2, i / count) - size / 2, lerp(y1, y2, i / count) - size / 2, size, size);
  }
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

// Step cards: all visible; clicking a card plays or pauses its animation, one at a time,
// and each card resumes from where it was paused.
function createSteps(view, steps) {
  const renderScale = 3;
  const contexts = [];
  const cards = steps.map((step, index) => {
    const card = document.createElement("li");
    card.className = "step-card";
    const media = document.createElement("div");
    media.className = "step-media";
    const scene = document.createElement("canvas");
    scene.width = W * renderScale;
    scene.height = H * renderScale;
    scene.setAttribute("aria-hidden", "true");
    const context = scene.getContext("2d");
    context.scale(renderScale, renderScale);
    contexts.push(context);
    // The play badge is the keyboard-reachable control; its clicks bubble up to the card.
    const play = document.createElement("button");
    play.type = "button";
    play.className = "step-play";
    play.setAttribute("aria-pressed", "false");
    play.setAttribute("aria-label", "Play step " + (index + 1) + " animation");
    play.textContent = "▶";
    card.addEventListener("click", () => toggle(index));
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
    view.querySelector(".step-list").append(card);
    step.scene(contexts[index], step.still);
    return card;
  });

  let playing = -1;
  let frame = 0;
  let last = null;
  const times = steps.map(() => 0);

  function animate(now) {
    const step = steps[playing];
    if (last !== null) times[playing] = (times[playing] + now - last) % step.duration;
    last = now;
    step.scene(contexts[playing], times[playing] / step.duration);
    frame = requestAnimationFrame(animate);
  }

  function start() {
    cancelAnimationFrame(frame);
    last = null;
    if (playing >= 0 && !view.hidden) frame = requestAnimationFrame(animate);
  }

  function toggle(index) {
    playing = playing === index ? -1 : index;
    cards.forEach((card, cardIndex) => {
      const active = cardIndex === playing;
      const button = card.querySelector(".step-play");
      card.classList.toggle("current", active);
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", (active ? "Pause" : "Play") + " step " + (cardIndex + 1) + " animation");
      button.textContent = active ? "Ⅱ" : "▶";
    });
    start();
  }

  return { start };
}

const speeds = [0.25, 0.5, 1, 1.5, 2, 3];

// Top-view panel: plays on its own while on screen and pauses when scrolled away.
// draw(ctx, time) paints a frame; phaseAt(time) returns { step, caption } for the side list;
// onRender(time) lets a game update extra readouts such as a clock or scores.
function createOverview(view, { steps, draw, phaseAt, still = 0, onRender }) {
  const canvas = view.querySelector(".course-field canvas");
  const ctx = canvas.getContext("2d");
  const phaseList = view.querySelector(".course-phases");
  const caption = view.querySelector(".course-caption");
  const speedValue = view.querySelector(".speed-value");
  const slower = view.querySelector(".speed-down");
  const faster = view.querySelector(".speed-up");
  steps.forEach((step) => {
    const item = document.createElement("li");
    item.textContent = step.title;
    phaseList.append(item);
  });

  let current = null;
  let clock = 0;
  let last = null;
  let frame = 0;
  let visible = false;
  let speedIndex = 2;

  function render(time) {
    draw(ctx, time);
    if (onRender) onRender(time);
    const phase = phaseAt(time);
    if (phase !== current) {
      current = phase;
      caption.textContent = phase.caption;
      [...phaseList.children].forEach((item, index) => item.classList.toggle("current", index === phase.step));
    }
  }

  function setSpeed(index) {
    speedIndex = Math.max(0, Math.min(speeds.length - 1, index));
    speedValue.textContent = speeds[speedIndex] + "×";
    slower.disabled = speedIndex === 0;
    faster.disabled = speedIndex === speeds.length - 1;
  }

  slower.addEventListener("click", () => setSpeed(speedIndex - 1));
  faster.addEventListener("click", () => setSpeed(speedIndex + 1));

  function tick(now) {
    if (last !== null) clock += (now - last) * speeds[speedIndex];
    last = now;
    render(clock);
    frame = requestAnimationFrame(tick);
  }

  function start() {
    cancelAnimationFrame(frame);
    last = null;
    if (visible && !view.hidden && !reducedMotion.matches) frame = requestAnimationFrame(tick);
  }

  render(reducedMotion.matches ? still : 0);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    start();
  }).observe(canvas);

  function restart(stillTime = still) {
    clock = 0;
    render(reducedMotion.matches ? stillTime : 0);
    start();
  }

  return { start, restart };
}

// Game pages register here; the router shows the page that matches the URL hash.
const guides = [];

function registerGuide(guide) {
  guides.push(guide);
}

function route() {
  const active = guides.find((guide) => guide.hash === location.hash);
  home.hidden = Boolean(active);
  // The home page fills the screen exactly, so the footer only shows on game pages.
  select("site-footer").hidden = !active;
  document.title = (active ? active.title : "Game Rules") + " | Undokai 2026";
  guides.forEach((guide) => {
    const show = guide === active;
    const changed = guide.view.hidden === show;
    guide.view.hidden = !show;
    const embed = guide.view.querySelector("iframe[data-src]");
    if (embed && show && embed.src !== embed.dataset.src) embed.src = embed.dataset.src;
    if (embed && !show && embed.src && embed.src !== "about:blank") embed.src = "about:blank";
    guide.view.querySelectorAll("video").forEach((clip) => {
      if (show && clip.dataset.src && !clip.hasAttribute("src")) clip.src = clip.dataset.src;
      if (!show) clip.pause();
    });
    if (show && changed) {
      window.scrollTo({ top: 0, behavior: "instant" });
      guide.view.querySelector(".race-title").focus({ preventScroll: true });
    }
    guide.controllers.forEach((controller) => controller.start());
  });
  if (!active && location.hash === "#games") select("games").scrollIntoView();
}

document.querySelector(".skip").addEventListener("click", (event) => {
  event.preventDefault();
  select("main").focus();
  select("main").scrollIntoView();
});

// Deferred game scripts run before DOMContentLoaded, so every guide is registered by now.
document.addEventListener("DOMContentLoaded", () => {
  route();
  window.addEventListener("hashchange", route);
});
