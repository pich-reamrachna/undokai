"use strict";

(() => {
  const audio = document.getElementById("background-music");
  const controls = document.querySelector(".music-controls");
  const menu = controls.closest(".header-menu");
  const toggle = controls.querySelector(".music-toggle");
  const slider = controls.querySelector(".music-volume");
  const storageKey = "undokai-music";
  const settings = { volume: slider.valueAsNumber };
  let enabled = false;

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
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
    const level = enabled ? settings.volume / 100 : 0;
    if (nativeVolume) audio.volume = level;
    else if (gain) gain.gain.value = level;
    audio.muted = level === 0;
  }

  function isPlaying() {
    return enabled && !audio.paused && !audio.error && (!audioContext || audioContext.state === "running");
  }

  function updateControls() {
    const playing = isPlaying();
    menu.dataset.musicPlaying = String(playing);
    toggle.setAttribute("aria-pressed", String(playing));
    toggle.title = translate(playing ? "Turn music off" : "Turn music on");
    const level = playing ? settings.volume : 0;
    slider.value = level;
    slider.disabled = !playing;
    slider.setAttribute("aria-valuetext", level + "%");
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
    audio.play().then(updateControls, updateControls);
  }

  function setPlayback(shouldPlay) {
    enabled = shouldPlay;
    updateVolume();
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
    if (level === 0) {
      setPlayback(false);
      return;
    }
    settings.volume = level;
    updateVolume();
    updateControls();
    saveSettings();
  });

  for (const event of ["play", "pause", "playing", "error"]) audio.addEventListener(event, updateControls);
  onLanguageChange(updateControls);
  updateVolume();
  updateControls();
  controls.hidden = false;
})();
