"use strict";

(() => {
  const audio = document.getElementById("background-music");
  const controls = document.querySelector(".music-controls");
  const menu = controls.closest(".header-menu");
  const toggle = controls.querySelector(".music-toggle");
  const slider = controls.querySelector(".music-volume");
  const storageKey = "undokai-music";
  const settings = { enabled: true, volume: slider.valueAsNumber };

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (typeof stored?.enabled === "boolean") settings.enabled = stored.enabled;
    if (stored?.volume === 0) settings.enabled = false;
    if (Number.isInteger(stored?.volume) && stored.volume > 0 && stored.volume <= 100) {
      settings.volume = stored.volume;
    }
  } catch {
    // Music controls still work when storage is unavailable.
  }

  audio.volume = slider.valueAsNumber / 100;
  const nativeVolume = audio.volume === slider.valueAsNumber / 100;
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  let audioContext;
  let gain;

  function saveSettings() {
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch { /* Storage is optional. */ }
  }

  function updateVolume() {
    const level = settings.enabled ? settings.volume / 100 : 0;
    if (nativeVolume) audio.volume = level;
    else if (gain) gain.gain.value = level;
    audio.muted = level === 0;
  }

  function isPlaying() {
    return settings.enabled && !audio.paused && !audio.error && (!audioContext || audioContext.state === "running");
  }

  function updateControls() {
    const playing = isPlaying();
    menu.dataset.musicPlaying = String(playing);
    toggle.setAttribute("aria-pressed", String(playing));
    toggle.title = translate(playing ? "Turn music off" : "Turn music on");
    const level = playing ? settings.volume : 0;
    slider.value = level;
    slider.setAttribute("aria-valuetext", level + "%");
    if (playing) document.removeEventListener("click", startOnInteraction);
  }

  function startPlayback() {
    // Some mobile browsers reserve the media element's volume for the device controls.
    if (!nativeVolume && AudioContextClass) {
      if (!audioContext) {
        try {
          const context = new AudioContextClass();
          const volume = context.createGain();
          context.createMediaElementSource(audio).connect(volume).connect(context.destination);
          audioContext = context;
          gain = volume;
          audioContext.addEventListener("statechange", updateControls);
          updateVolume();
        } catch {
          // The toggle can still control playback if a volume graph is unavailable.
        }
      }
      audioContext?.resume().catch(updateControls);
    }
    audio.play().then(updateControls, (error) => {
      if (error.name === "NotAllowedError" && settings.enabled) {
        document.addEventListener("click", startOnInteraction);
      }
      updateControls();
    });
  }

  function startOnInteraction(event) {
    if (settings.enabled && !toggle.contains(event.target) && !isPlaying()) startPlayback();
  }

  function setPlayback(enabled) {
    settings.enabled = enabled;
    updateVolume();
    saveSettings();
    if (enabled && !isPlaying()) {
      startPlayback();
    } else {
      if (!enabled) audio.pause();
      updateControls();
    }
  }

  toggle.addEventListener("click", () => setPlayback(!isPlaying()));

  slider.addEventListener("input", () => {
    const level = slider.valueAsNumber;
    if (level > 0) settings.volume = level;
    setPlayback(level > 0);
  });

  for (const event of ["play", "pause", "playing", "error"]) audio.addEventListener(event, updateControls);
  onLanguageChange(updateControls);
  updateVolume();
  updateControls();
  controls.hidden = false;
  if (settings.enabled) {
    document.addEventListener("click", startOnInteraction);
    startPlayback();
  }
})();
