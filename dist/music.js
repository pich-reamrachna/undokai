"use strict";

(() => {
  const audio = document.getElementById("background-music");
  const controls = document.querySelector(".music-controls");
  const toggle = controls.querySelector(".music-toggle");
  const slider = controls.querySelector(".music-volume");
  const storageKey = "undokai-music";
  const settings = { enabled: true, volume: slider.valueAsNumber };

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (typeof stored?.enabled === "boolean") settings.enabled = stored.enabled;
    if (Number.isInteger(stored?.volume) && stored.volume >= 0 && stored.volume <= 100) {
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
    const level = settings.volume / 100;
    if (nativeVolume) audio.volume = level;
    else if (gain) gain.gain.value = level;
    audio.muted = level === 0;
    slider.value = settings.volume;
    slider.setAttribute("aria-valuetext", settings.volume + "%");
  }

  function isPlaying() {
    return !audio.paused && !audio.error && (!audioContext || audioContext.state === "running");
  }

  function updateToggle() {
    const playing = isPlaying();
    toggle.setAttribute("aria-pressed", String(playing));
    toggle.title = translate(playing ? "Turn music off" : "Turn music on");
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
          audioContext.addEventListener("statechange", updateToggle);
          updateVolume();
        } catch {
          // The toggle can still control playback if a volume graph is unavailable.
        }
      }
      audioContext?.resume().catch(updateToggle);
    }
    audio.play().then(updateToggle, updateToggle);
  }

  function startOnInteraction(event) {
    if (settings.enabled && !toggle.contains(event.target) && !isPlaying()) startPlayback();
  }

  toggle.addEventListener("click", () => {
    settings.enabled = !isPlaying();
    if (settings.enabled && settings.volume === 0) {
      settings.volume = Number(slider.defaultValue);
      updateVolume();
    }
    saveSettings();
    if (settings.enabled) startPlayback();
    else audio.pause();
  });

  slider.addEventListener("input", () => {
    settings.volume = slider.valueAsNumber;
    updateVolume();
    saveSettings();
  });

  for (const event of ["play", "pause", "playing", "error"]) audio.addEventListener(event, updateToggle);
  onLanguageChange(updateToggle);
  updateVolume();
  updateToggle();
  controls.hidden = false;
  if (settings.enabled) {
    document.addEventListener("click", startOnInteraction);
    startPlayback();
  }
})();
