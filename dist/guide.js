"use strict";

const games = [
  { number: "01", title: "Game 1" },
  { number: "02", title: "Typhoon Race", href: "#typhoon-race" },
  { number: "03", title: "Game 3" },
  { number: "04", title: "Game 4" },
];

// Add a relative MP4 path or a YouTube embed URL when the recording is ready.
const raceVideo = { src: "", kind: "mp4", captions: "" };

const steps = [
  {
    name: "Hold", short: "5 players, 1 pole", field: "AT THE START",
    title: "Hold the pole together",
    detail: "Form a group of five. All five players hold the same long pole before they start running.",
  },
  {
    name: "Run", short: "Around the course", field: "AROUND THE COURSE",
    title: "Run together and return",
    detail: "Keep holding the pole as your group runs around the course in your team’s lane and returns to the start.",
  },
  {
    name: "Sweep", short: "Jump, then duck", field: "LOW FIRST, THEN HIGH",
    title: "Sweep low, then high",
    detail: "Two players sweep the pole low along the waiting line so everyone jumps. Sweep it back high so everyone ducks.",
  },
  {
    name: "Repeat", short: "Next group goes", field: "NEXT GROUP UP",
    title: "Send the next group",
    detail: "The front row takes the pole and runs next. Keep the relay going until every group has completed the course.",
  },
];

const select = (id) => document.getElementById(id);
const home = select("home-view");
const race = select("race-view");
const pending = select("pending-game");
const stepGrid = select("steps");
const canvas = select("race-canvas");
const ctx = canvas.getContext("2d");
const playButton = select("demo-play");
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
  lines.forEach((line, lineIndex) => {
    const inset = Math.floor((width - (line.length * 6 - 1) * unit) / 2) + 2;
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

games.forEach((game) => {
  const card = document.createElement(game.href ? "a" : "button");
  card.className = game.href ? "game-card active" : "game-card";
  if (game.href) {
    card.href = game.href;
  } else {
    card.type = "button";
    card.setAttribute("aria-haspopup", "dialog");
    card.addEventListener("click", () => {
      select("pending-title").textContent = game.title;
      pending.showModal();
    });
  }
  const number = document.createElement("span");
  number.className = "card-number";
  number.setAttribute("aria-hidden", "true");
  number.textContent = game.number;
  const text = document.createElement("span");
  const name = document.createElement("strong");
  name.className = "card-title";
  name.textContent = game.title;
  const description = document.createElement("span");
  description.className = "card-caption";
  description.textContent = game.href ? "View game rules" : "Coming soon";
  text.append(name, description);
  const arrow = document.createElement("span");
  arrow.className = "card-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = game.href ? "→" : "·";
  card.append(number, text, arrow);
  select("game-grid").append(card);
});

const icons = [
  ["  ##   ##  ","  ##   ##  "," #### #### "," # ## ## # ","   # # #   ","   # # #   "],
  ["     #     ","    #o#    ","    ###    ","   #ooo#   ","   #####   ","  #######  "],
  ["       #   "," ######### ","       #   ","   #       "," ######### ","   #       "],
  ["   #####   ","  #     #  ","         # ","  #     ## "," ###  ###  ","  #        "],
];

const stepButtons = steps.map((step, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "step-button";
  const icon = document.createElement("canvas");
  icon.width = 13;
  icon.height = 12;
  icon.setAttribute("aria-hidden", "true");
  const brush = icon.getContext("2d");
  icons[index].forEach((row, y) => [...row].forEach((cell, x) => {
    if (cell === " ") return;
    brush.fillStyle = cell === "o" ? "#db7640" : "#272747";
    brush.fillRect(x + 1, y + 3, 1, 1);
  }));
  const name = document.createElement("span");
  name.className = "step-name";
  name.textContent = (index + 1) + ". " + step.name;
  const description = document.createElement("span");
  description.className = "step-short";
  description.textContent = step.short;
  button.append(icon, name, description);
  button.addEventListener("click", () => {
    stopWalkthrough();
    showStep(index);
  });
  stepGrid.append(button);
  return button;
});

function block(color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), width, height);
}

function cone(x, y) {
  block("#a84f37", x - 6, y, 13, 3);
  block("#ef844b", x - 4, y - 4, 9, 5);
  block("#fff0c3", x - 3, y - 6, 7, 3);
  block("#ef844b", x - 2, y - 10, 5, 5);
  block("#f5a461", x, y - 12, 2, 2);
}

function runner(x, y, color, stride = 0, duck = false) {
  const ink = "#282a49";
  const skin = "#f4c39a";
  const shirt = duck ? y - 11 : y - 16;
  block(ink, x - 4, shirt - 8, 9, 8);
  block(skin, x - 2, shirt - 6, 6, 5);
  block(color, x - 5, shirt - 9, 11, 3);
  block(ink, x - 6, shirt, 13, 9);
  block(color, x - 4, shirt + 1, 9, 7);
  block(skin, x - 7, shirt + 2, 3, 4);
  block(skin, x + 5, shirt + 2, 3, 4);
  block(ink, x - 4 - stride, y - 6, 4, 6);
  block(ink, x + 1 + stride, y - 6, 4, 6);
  block("#fff7d5", x - 5 - stride, y - 1, 5, 2);
  block("#fff7d5", x + 1 + stride, y - 1, 5, 2);
}

function pole(x, y, width) {
  block("#272747", x, y, width, 5);
  block("#fff0bc", x + 1, y + 1, width - 2, 2);
}

function field() {
  block("#9edbdc", 0, 0, 320, 128);
  block("#b1e0a3", 0, 31, 320, 97);
  block("#a2d492", 0, 32, 320, 18);
  for (let i = 0; i < 34; i++) {
    const x = (i * 47 + 6) % 320;
    const y = i % 2 ? 35 + (i * 3) % 12 : 115 + i % 9;
    block("#87c289", x, y, 3, 2);
    block("#91c883", x + 2, y + 2, 5, 1);
  }
  block("#ac6e50", 0, 50, 320, 63);
  block("#e5a16f", 0, 53, 320, 57);
  for (let x = 0; x < 320; x += 23) {
    block("#ffe3ac", x, 70, 12, 1);
    block("#ffe3ac", x, 91, 12, 1);
  }
  for (let x = 20; x < 29; x += 3) {
    for (let y = 53; y < 110; y += 3) {
      if (((x - 20) / 3 + (y - 53) / 3) % 2 === 0) block("#fff0cf", x, y, 3, 3);
    }
  }
  cone(259, 66);
  cone(273, 88);
  cone(259, 108);
}

function drawPhase(step, progress = 0) {
  field();
  if (step === 2) {
    const returning = progress >= 0.5;
    const pass = returning ? (1 - progress) * 2 : progress * 2;
    const cursor = 49 + Math.round(pass * 160);
    for (let i = 0; i < 5; i++) {
      const x = 57 + i * 31;
      const near = Math.abs(x - cursor) < 22;
      runner(x, near && !returning ? 77 : 88, "#fff0a2", 0, returning && near);
    }
    runner(cursor, 65, "#f47748");
    runner(cursor, 106, "#f47748");
    ctx.strokeStyle = "#282a49";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cursor + 2, returning ? 49 : 61);
    ctx.lineTo(cursor + 2, returning ? 85 : 101);
    ctx.stroke();
    ctx.strokeStyle = "#fff0bc";
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }
  let x = 42;
  let y = 87;
  if (step === 1) {
    x += (1 - Math.abs(2 * progress - 1)) * 170;
    y += progress > 0.5 ? 9 : -7;
  }
  if (step === 3) x += progress * 94;
  const color = step === 3 ? "#f7e282" : "#f47748";
  const stride = step % 2 ? Math.floor(progress * 28) % 2 : 0;
  for (let i = 0; i < 5; i++) runner(x + i * 13, y + i % 2 * 3, color, stride);
  pole(x - 8, y - 13, 69);
}

const stills = [0, 0.42, 0.23, 0.55];
let currentStep = 0;
let frame = 0;
let started = null;
let pausedAt = 0;
let elapsed = 0;
let playing = false;

function showStep(index) {
  currentStep = index;
  const step = steps[index];
  select("demo-counter").textContent = "0" + (index + 1) + " / 04";
  select("field-label").textContent = step.field;
  const title = document.createElement("h3");
  title.textContent = step.title;
  const description = document.createElement("p");
  description.textContent = step.detail;
  select("demo-caption").replaceChildren(title, description);
  stepButtons.forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === index)));
  drawPhase(index, stills[index]);
}

function setPlayLabel(icon, label) {
  playButton.firstElementChild.textContent = icon;
  playButton.lastChild.textContent = " " + label;
}

function stopWalkthrough(finished = false) {
  if (playing) cancelAnimationFrame(frame);
  playing = false;
  pausedAt = 0;
  setPlayLabel("▶︎", finished ? "Replay walkthrough" : "Play walkthrough");
}

function animateWalkthrough(now) {
  if (started === null) started = now - pausedAt;
  elapsed = now - started;
  const duration = 3600;
  const index = Math.floor(elapsed / duration);
  if (index >= steps.length) {
    stopWalkthrough(true);
    drawPhase(currentStep, stills[currentStep]);
    return;
  }
  if (index !== currentStep) showStep(index);
  if (!reducedMotion.matches) drawPhase(index, (elapsed % duration) / duration);
  frame = requestAnimationFrame(animateWalkthrough);
}

playButton.addEventListener("click", () => {
  if (playing) {
    cancelAnimationFrame(frame);
    pausedAt = elapsed;
    playing = false;
    setPlayLabel("▶︎", "Resume walkthrough");
    return;
  }
  started = null;
  if (pausedAt === 0) showStep(0);
  playing = true;
  setPlayLabel("Ⅱ", "Pause walkthrough");
  frame = requestAnimationFrame(animateWalkthrough);
});

function addVideo() {
  if (!raceVideo.src) return;
  const videoSlot = select("video-slot");
  const heading = document.createElement("h2");
  heading.textContent = "Race video";
  const player = document.createElement(raceVideo.kind === "embed" ? "iframe" : "video");
  player.src = raceVideo.src;
  if (raceVideo.kind === "embed") {
    player.title = "Typhoon Race demonstration";
    player.loading = "lazy";
    player.allowFullscreen = true;
  } else {
    player.controls = true;
    player.preload = "metadata";
    if (raceVideo.captions) {
      const captions = document.createElement("track");
      captions.kind = "captions";
      captions.src = raceVideo.captions;
      captions.srclang = "en";
      captions.label = "English";
      player.append(captions);
    }
  }
  videoSlot.append(heading, player);
  videoSlot.hidden = false;
}

function route() {
  const isRace = location.hash === "#typhoon-race";
  const changed = race.hidden === isRace;
  home.hidden = isRace;
  race.hidden = !isRace;
  const headerLink = select("header-link");
  headerLink.href = isRace ? "./#games" : "#games";
  headerLink.lastElementChild.textContent = isRace ? "←" : "↓";
  document.title = (isRace ? "Typhoon Race" : "Game Rules") + " | Undokai 2026";
  if (isRace && changed) {
    window.scrollTo({ top: 0, behavior: "instant" });
    select("race-title").focus({ preventScroll: true });
  } else if (!isRace) {
    stopWalkthrough();
    if (location.hash === "#games") select("games").scrollIntoView();
  }
}

document.querySelector(".skip").addEventListener("click", (event) => {
  event.preventDefault();
  select("main").focus();
  select("main").scrollIntoView();
});

showStep(0);
addVideo();
route();
window.addEventListener("hashchange", route);
