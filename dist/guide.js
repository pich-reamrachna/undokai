"use strict";

// Shared parts of the guide: the home page, pixel-art helpers, step cards, the top-view
// panel and page switching. Each game's scenes live in their own file and register
// themselves with registerGuide().

const games = [
  { title: "Typhoon Race", href: "#typhoon-race" },
  { title: "Centipede Race", href: "#centipede-race" },
  { title: "Beanbag Toss", href: "#beanbag-toss" },
  { title: "Dondarm Slerk Cher", href: "#dondarm-slerk-cher" },
];

const select = (id) => document.getElementById(id);
const home = select("home-view");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const phoneLayout = window.matchMedia("(max-width: 650px)");

function setupHeaderMenus() {
  const triggers = document.querySelectorAll(".header-menu-toggle");
  const languageLabel = document.querySelector(".language-menu-label");
  const musicVolume = document.querySelector(".music-volume");
  let openTrigger = null;

  function closeMenu(restoreFocus = false) {
    if (!openTrigger) return;
    const trigger = openTrigger;
    openTrigger = null;
    trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus) trigger.focus();
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const wasOpen = openTrigger === trigger;
      closeMenu();
      if (!wasOpen) {
        openTrigger = trigger;
        trigger.setAttribute("aria-expanded", "true");
      }
    });
    trigger.parentElement.addEventListener("focusout", (event) => {
      if (openTrigger === trigger && event.relatedTarget && !trigger.parentElement.contains(event.relatedTarget)) {
        closeMenu();
      }
    });
    trigger.hidden = false;
  });

  document.addEventListener("click", (event) => {
    if (!openTrigger) return;
    if (!openTrigger.parentElement.contains(event.target)) closeMenu();
    else if (event.target.closest("[data-language]")) closeMenu(true);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && openTrigger) closeMenu(true);
  });
  function updateLayout() {
    closeMenu();
    musicVolume.setAttribute("aria-orientation", phoneLayout.matches ? "vertical" : "horizontal");
  }
  updateLayout();
  phoneLayout.addEventListener("change", updateLayout);

  function updateLanguageLabel() {
    languageLabel.textContent = language === "ja" ? "日本語" : "EN";
  }
  updateLanguageLabel();
  onLanguageChange(updateLanguageLabel);
}

setupHeaderMenus();

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

function drawTitle(title, alignment = title.dataset.pixelAlign) {
  const words = title.dataset.pixel.split("|");
  const unit = 8;
  const columns = Number(title.dataset.pixelColumns) || Math.max(...words.map((line) => line.length));
  const width = (columns * 6 - 1) * unit;
  const lines = words.map((text) => {
    const lineWidth = (text.length * 6 - 1) * unit;
    return { text, width: lineWidth, scale: Math.min(1, width / lineWidth) };
  });
  const lettering = title.querySelector("canvas") ?? document.createElement("canvas");
  lettering.width = width + 8;
  const lineHeight = 9 * unit;
  const height = lines.reduce((total, line) => total + lineHeight * line.scale, 0);
  lettering.height = Math.ceil(height - 4 * lines.at(-1).scale);
  lettering.setAttribute("aria-hidden", "true");
  const brush = lettering.getContext("2d");
  let top = 0;
  lines.forEach(({ text, width: lineWidth, scale }, lineIndex) => {
    const extraWidth = Math.round(width - lineWidth * scale);
    let inset = 2;
    if (alignment === "right") inset += extraWidth;
    if (!alignment) inset += Math.floor(extraWidth / 2);
    const pixels = [];
    [...text].forEach((letter, letterIndex) => {
      if (letter === " ") return;
      glyphs[letter].forEach((row, y) => {
        [...row].forEach((cell, x) => {
          if (cell === "1") pixels.push([(letterIndex * 6 + x) * unit, 3 + y * unit]);
        });
      });
    });
    const fillPixel = (x, y, w, h) => {
      const left = Math.round(x * scale);
      const upper = Math.round(top + y * scale);
      brush.fillRect(inset + left, upper, Math.round((x + w) * scale) - left, Math.round(top + (y + h) * scale) - upper);
    };
    brush.fillStyle = "#332d72";
    pixels.forEach(([x, y]) => fillPixel(x + 2, y + 5, unit + 1, unit + 2));
    brush.fillStyle = "#e7783a";
    pixels.forEach(([x, y]) => fillPixel(x - 2, y - 2, unit + 4, unit + 4));
    pixels.forEach(([x, y]) => {
      brush.fillStyle = lineIndex === 0 ? "#ffca56" : "#ffe08a";
      fillPixel(x, y, unit - 1, unit - 1);
      brush.fillStyle = lineIndex === 0 ? "#ffdb78" : "#ffedab";
      fillPixel(x, y, unit - 1, 1);
    });
    top += lineHeight * scale;
  });
  if (!lettering.parentElement) title.append(lettering);
  title.classList.add("pixel-ready");
}

document.querySelectorAll(".hero-title[data-pixel]").forEach((title) => drawTitle(title));
const gameTitles = document.querySelectorAll(".race-title[data-pixel]");
function drawGameTitles() {
  gameTitles.forEach((title) => drawTitle(title, phoneLayout.matches ? "right" : title.dataset.pixelAlign));
}
drawGameTitles();
phoneLayout.addEventListener("change", drawGameTitles);

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
games.forEach((game, index) => {
  const card = document.createElement(game.href ? "a" : "div");
  card.className = game.href ? "game-card active" : "game-card soon";
  card.style.setProperty("--card-index", index);
  if (game.href) card.href = game.href;
  const text = document.createElement("span");
  const name = document.createElement("strong");
  name.className = "card-title";
  const description = game.href ? null : document.createElement("span");
  text.append(name);
  if (description) {
    description.className = "card-caption";
    text.append(description);
  }
  function updateCopy() {
    name.textContent = translate(game.title);
    if (description) description.textContent = translate("Coming soon");
  }
  updateCopy();
  onLanguageChange(updateCopy);
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

const introRoot = document.documentElement;
if (introRoot.classList.contains("home-intro-pending") && !location.hash && !reducedMotion.matches) {
  const header = document.querySelector(".site-header");
  header.addEventListener("animationend", () => introRoot.classList.remove("home-intro"), { once: true });
  header.addEventListener("animationcancel", () => introRoot.classList.remove("home-intro"), { once: true });
  introRoot.style.setProperty("--last-card-index", Math.max(0, games.length - 1));
  introRoot.classList.replace("home-intro-pending", "home-intro");
}

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

// Step cards play one at a time and keep their progress until the player leaves the guide.
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
    play.textContent = "▶";
    card.addEventListener("click", () => toggle(index));
    media.append(scene, play);
    const text = document.createElement("div");
    text.className = "step-text";
    const number = document.createElement("span");
    number.className = "step-number";
    const title = document.createElement("h3");
    const detail = document.createElement("p");
    text.append(number, title, detail);
    card.append(media, text);
    view.querySelector(".step-list").append(card);
    return { card, play, number, title, detail };
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

  function updateControls() {
    cards.forEach(({ card, play }, cardIndex) => {
      const active = cardIndex === playing;
      card.classList.toggle("current", active);
      play.setAttribute("aria-pressed", String(active));
      play.setAttribute("aria-label", translate(active ? "Pause step {number} animation" : "Play step {number} animation", { number: cardIndex + 1 }));
      play.textContent = active ? "Ⅱ" : "▶";
    });
  }

  function toggle(index) {
    playing = playing === index ? -1 : index;
    updateControls();
    start();
  }

  function reset() {
    playing = -1;
    times.fill(0);
    updateControls();
    start();
    steps.forEach((step, index) => step.scene(contexts[index], 0));
  }

  function updateCopy() {
    cards.forEach(({ number, title, detail }, index) => {
      const step = steps[index];
      number.textContent = translate("STEP {number}", { number: index + 1 });
      title.textContent = translate(step.title);
      detail.textContent = translate(step.detail);
      if (!view.hidden) step.scene(contexts[index], times[index] / step.duration);
    });
    updateControls();
  }
  updateCopy();
  onLanguageChange(updateCopy);

  return { start, reset };
}

const speeds = [0.25, 0.5, 1, 1.5, 2, 3];

// Top-view panel: playback stops while offscreen and resumes if still enabled.
// draw(ctx, time) paints a frame; phaseAt(time) returns { step, caption } for the side list;
// onRender(time) lets a game update extra readouts such as a clock or scores.
function createOverview(view, { steps, draw, phaseAt, duration, onRender }) {
  const field = view.querySelector(".course-field");
  const canvas = field.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const phaseList = view.querySelector(".course-phases");
  const caption = view.querySelector(".course-caption");
  const controls = select("course-playback").content.firstElementChild.cloneNode(true);
  const timeline = controls.querySelector(".course-timeline");
  const timeLabel = controls.querySelector(".course-time");
  const play = controls.querySelector(".course-play");
  const rewind = controls.querySelector(".course-rewind");
  const rate = controls.querySelector(".course-rate");
  timeline.max = duration;
  rate.append(...speeds.map((speed) => new Option(speed + "×", speed)));
  field.append(controls);
  const phaseItems = steps.map((step) => {
    const item = document.createElement("li");
    item.textContent = translate(step.title);
    phaseList.append(item);
    return item;
  });

  let current = null;
  let clock = 0;
  let last = null;
  let frame = 0;
  let visible = false;
  let playing = !reducedMotion.matches;
  let seekingPointer = null;

  function formatTime(time) {
    const seconds = Math.floor(time / 1000);
    return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  }

  const total = formatTime(duration);

  function updateTimelineLabel() {
    const elapsed = formatTime(clock);
    const label = elapsed + " / " + total;
    if (timeLabel.textContent !== label) timeLabel.textContent = label;
    const description = translate("{elapsed} of {total}", { elapsed, total });
    if (timeline.getAttribute("aria-valuetext") !== description) {
      timeline.setAttribute("aria-valuetext", description);
    }
  }

  function render() {
    // The game scenes wrap at exactly one cycle. Show the final frame at the slider's endpoint.
    const time = clock === duration ? duration - 1 : clock;
    draw(ctx, time);
    if (onRender) onRender(time);
    timeline.value = clock;
    timeline.style.setProperty("--played", (clock / duration * 100) + "%");
    updateTimelineLabel();
    const phase = phaseAt(time);
    if (phase !== current) {
      current = phase;
      caption.textContent = translate(phase.caption, phase.values);
      phaseItems.forEach((item, index) => item.classList.toggle("current", index === phase.step));
    }
  }

  function labelControl(control, label) {
    const text = translate(label);
    control.setAttribute("aria-label", text);
    control.title = text;
  }

  function updatePlayButton() {
    labelControl(play, playing ? "Pause animation" : "Play animation");
    play.textContent = playing ? "Ⅱ" : "▶";
  }

  function togglePlayback() {
    playing = !playing;
    updatePlayButton();
    start();
  }

  play.addEventListener("click", togglePlayback);
  field.addEventListener("click", (event) => {
    if (!controls.contains(event.target)) togglePlayback();
  });
  rewind.addEventListener("click", () => restart());

  timeline.addEventListener("pointerdown", (event) => {
    if (seekingPointer !== null || event.button !== 0) return;
    seekingPointer = event.pointerId;
    start();
  });
  timeline.addEventListener("input", () => {
    clock = timeline.valueAsNumber;
    render();
    start();
  });

  function finishSeeking(event) {
    if (seekingPointer !== event.pointerId) return;
    seekingPointer = null;
    start();
  }
  window.addEventListener("pointerup", finishSeeking);
  window.addEventListener("pointercancel", finishSeeking);

  function tick(now) {
    if (last !== null) clock = (clock + (now - last) * Number(rate.value)) % duration;
    last = now;
    render();
    frame = requestAnimationFrame(tick);
  }

  function start() {
    cancelAnimationFrame(frame);
    last = null;
    if (visible && !view.hidden && playing && seekingPointer === null) frame = requestAnimationFrame(tick);
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    start();
  }).observe(canvas);

  function restart(stillTime = 0) {
    clock = reducedMotion.matches && !playing ? stillTime : 0;
    render();
    start();
  }

  function reset() {
    rate.value = "1";
    playing = !reducedMotion.matches;
    seekingPointer = null;
    updatePlayButton();
    restart();
  }

  function updateControlCopy() {
    controls.setAttribute("aria-label", translate("Animation playback"));
    labelControl(rewind, "Rewind to start");
    labelControl(rate, "Animation speed");
    labelControl(timeline, "Animation timeline");
    updatePlayButton();
  }

  updateControlCopy();
  onLanguageChange(() => {
    updateControlCopy();
    phaseItems.forEach((item, index) => { item.textContent = translate(steps[index].title); });
    current = null;
    if (!view.hidden) render();
  });

  return { start, restart, reset };
}

// Game pages register here; the router shows the page that matches the URL hash.
const guides = [];

function registerGuide(guide) {
  guides.push(guide);
}

function updatePageTitle(active = guides.find((guide) => guide.hash === location.hash)) {
  document.title = `${translate(active ? active.title : "Game Rules")} | ${translate("Undokai 2026")}`;
}
onLanguageChange(() => updatePageTitle());

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement;
}

function exitDocumentFullscreen() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  exit?.call(document)?.catch(() => {});
}

function exitNativeVideoFullscreen(clip) {
  if (clip.webkitDisplayingFullscreen) clip.webkitExitFullscreen?.();
}

function unloadGuideMedia(view) {
  const fullscreen = fullscreenElement();
  if (fullscreen && view.contains(fullscreen)) exitDocumentFullscreen();
  view.querySelectorAll("video[src]").forEach((clip) => {
    exitNativeVideoFullscreen(clip);
    clip.pause();
    // Clear the playback position and release the native player when leaving the guide.
    clip.removeAttribute("src");
    clip.load();
  });
  view.querySelectorAll("iframe[data-src]").forEach((embed) => {
    if (embed.hasAttribute("src")) embed.removeAttribute("src");
  });
}

function loadGuideMedia(view) {
  view.querySelectorAll("video[data-src], iframe[data-src]").forEach((media) => {
    media.src = media.dataset.src;
  });
}

function route(restored = false) {
  const active = guides.find((guide) => guide.hash === location.hash);
  if (active || restored || location.hash === "#games") introRoot.classList.remove("home-intro");
  const leaving = guides.find((guide) => !guide.view.hidden && (guide !== active || restored));
  if (leaving) unloadGuideMedia(leaving.view);
  home.hidden = Boolean(active);
  // The home page fills the screen exactly, so the footer only shows on game pages.
  select("site-footer").hidden = !active;
  updatePageTitle(active);
  guides.forEach((guide) => {
    const show = guide === active;
    const entering = show && (guide.view.hidden || restored);
    guide.view.hidden = !show;
    if (entering) {
      loadGuideMedia(guide.view);
      window.scrollTo({ top: 0, behavior: "instant" });
      guide.view.querySelector(".race-title").focus({ preventScroll: true });
    }
    guide.controllers.forEach((controller) => {
      if (entering) controller.reset();
      else controller.start();
    });
  });
  if (!active && location.hash === "#games") select("games").scrollIntoView();
}

// A fullscreen request can finish after the user has already navigated away.
function dismissHiddenFullscreen() {
  if (fullscreenElement()?.closest(".race[hidden]")) exitDocumentFullscreen();
}
document.addEventListener("fullscreenchange", dismissHiddenFullscreen);
document.addEventListener("webkitfullscreenchange", dismissHiddenFullscreen);
document.addEventListener("webkitbeginfullscreen", (event) => {
  if (event.target.closest(".race[hidden]")) exitNativeVideoFullscreen(event.target);
}, true);

document.querySelector(".skip").addEventListener("click", (event) => {
  event.preventDefault();
  select("main").focus();
  select("main").scrollIntoView();
});

// Deferred game scripts run before DOMContentLoaded, so every guide is registered by now.
document.addEventListener("DOMContentLoaded", () => {
  route();
  window.addEventListener("hashchange", () => route());
  window.addEventListener("pagehide", () => {
    const visible = guides.find((guide) => !guide.view.hidden);
    if (visible) unloadGuideMedia(visible.view);
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) route(true);
  });
});
