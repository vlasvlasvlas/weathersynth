import { WeatherAudioEngine } from "./audio.js";
import { BACKGROUND_OPTIONS, BRUSH_OPTIONS, WeatherScene } from "./scene.js";
import { loadSoundConfig } from "./sound-config.js";
import { loadAtmosphere } from "./weather.js";

const appShell = document.querySelector("#app-shell");
const canvas = document.querySelector("#sky-canvas");
const settingsButton = document.querySelector("#settings-button");
const infoButton = document.querySelector("#info-button");
const settingsPanel = document.querySelector("#settings-panel");
const settingsBackdrop = document.querySelector("#settings-backdrop");
const closeSettingsButton = document.querySelector("#close-settings-button");
const infoModal = document.querySelector("#info-modal");
const closeInfoButton = document.querySelector("#close-info-button");
const presetSelect = document.querySelector("#preset-select");
const voiceSelect = document.querySelector("#voice-select");
const refreshButton = document.querySelector("#refresh-button");

const masterVolumeControl = document.querySelector("#master-volume-control");
const masterVolumeOutput = document.querySelector("#master-volume-output");
const transientControl = document.querySelector("#transient-control");
const transientOutput = document.querySelector("#transient-output");
const droneControl = document.querySelector("#drone-control");
const droneOutput = document.querySelector("#drone-output");

const filterTypeSelect = document.querySelector("#filter-type-select");
const filterCutoffControl = document.querySelector("#filter-cutoff-control");
const filterCutoffOutput = document.querySelector("#filter-cutoff-output");
const filterResonanceControl = document.querySelector("#filter-resonance-control");
const filterResonanceOutput = document.querySelector("#filter-resonance-output");
const filterEnvControl = document.querySelector("#filter-env-control");
const filterEnvOutput = document.querySelector("#filter-env-output");

const delayMixControl = document.querySelector("#delay-mix-control");
const delayMixOutput = document.querySelector("#delay-mix-output");
const delayTimeControl = document.querySelector("#delay-time-control");
const delayTimeOutput = document.querySelector("#delay-time-output");
const delayFeedbackControl = document.querySelector("#delay-feedback-control");
const delayFeedbackOutput = document.querySelector("#delay-feedback-output");
const delayToneControl = document.querySelector("#delay-tone-control");
const delayToneOutput = document.querySelector("#delay-tone-output");

const reverbMixControl = document.querySelector("#reverb-mix-control");
const reverbMixOutput = document.querySelector("#reverb-mix-output");
const reverbDecayControl = document.querySelector("#reverb-decay-control");
const reverbDecayOutput = document.querySelector("#reverb-decay-output");
const reverbPredelayControl = document.querySelector("#reverb-predelay-control");
const reverbPredelayOutput = document.querySelector("#reverb-predelay-output");
const reverbToneControl = document.querySelector("#reverb-tone-control");
const reverbToneOutput = document.querySelector("#reverb-tone-output");

const lfoTargetSelect = document.querySelector("#lfo-target-select");
const lfoWaveSelect = document.querySelector("#lfo-wave-select");
const lfoRateControl = document.querySelector("#lfo-rate-control");
const lfoRateOutput = document.querySelector("#lfo-rate-output");
const lfoDepthControl = document.querySelector("#lfo-depth-control");
const lfoDepthOutput = document.querySelector("#lfo-depth-output");

const lifeControl = document.querySelector("#life-control");
const lifeOutput = document.querySelector("#life-output");
const densityControl = document.querySelector("#density-control");
const densityOutput = document.querySelector("#density-output");
const backgroundModeSelect = document.querySelector("#background-mode-select");

const emitterModeButton = document.querySelector("#emitter-mode-button");
const emitterDeleteButton = document.querySelector("#emitter-delete-button");
const emitterStatus = document.querySelector("#emitter-status");
const emitterList = document.querySelector("#emitter-list");
const emitterRateControl = document.querySelector("#emitter-rate-control");
const emitterRateOutput = document.querySelector("#emitter-rate-output");
const emitterBurstControl = document.querySelector("#emitter-burst-control");
const emitterBurstOutput = document.querySelector("#emitter-burst-output");

const brushButtons = document.querySelector("#brush-buttons");
const sidebarSummary = document.querySelector("#sidebar-summary");
const sidebarSource = document.querySelector("#sidebar-source");
const windValue = document.querySelector("#wind-value");
const rainValue = document.querySelector("#rain-value");
const humidityValue = document.querySelector("#humidity-value");
const tempValue = document.querySelector("#temp-value");
const cloudValue = document.querySelector("#cloud-value");
const phaseValue = document.querySelector("#phase-value");
const accordionItems = Array.from(document.querySelectorAll("[data-accordion-item]"));

const SYNTH_RANGE_CONTROLS = {
  master_volume: {
    input: masterVolumeControl,
    output: masterVolumeOutput,
    format: (value) => `${Math.round(value)}%`,
  },
  transient_level: {
    input: transientControl,
    output: transientOutput,
    format: (value) => `${Math.round(value)}%`,
  },
  drone_level: {
    input: droneControl,
    output: droneOutput,
    format: (value) => `${Math.round(value)}%`,
  },
  filter_cutoff: {
    input: filterCutoffControl,
    output: filterCutoffOutput,
    format: (value) => `${Math.round(value)} Hz`,
  },
  filter_resonance: {
    input: filterResonanceControl,
    output: filterResonanceOutput,
    format: (value) => Number(value).toFixed(1),
  },
  filter_env_amount: {
    input: filterEnvControl,
    output: filterEnvOutput,
    format: (value) => `${Math.round(value)} Hz`,
  },
  delay_mix: {
    input: delayMixControl,
    output: delayMixOutput,
    format: (value) => `${Math.round(value)}%`,
  },
  delay_time_ms: {
    input: delayTimeControl,
    output: delayTimeOutput,
    format: (value) => `${Math.round(value)} ms`,
  },
  delay_feedback: {
    input: delayFeedbackControl,
    output: delayFeedbackOutput,
    format: (value) => `${Math.round(value)}%`,
  },
  delay_tone: {
    input: delayToneControl,
    output: delayToneOutput,
    format: (value) => `${Math.round(value)} Hz`,
  },
  reverb_mix: {
    input: reverbMixControl,
    output: reverbMixOutput,
    format: (value) => `${Math.round(value)}%`,
  },
  reverb_decay: {
    input: reverbDecayControl,
    output: reverbDecayOutput,
    format: (value) => `${Number(value).toFixed(1)} s`,
  },
  reverb_predelay_ms: {
    input: reverbPredelayControl,
    output: reverbPredelayOutput,
    format: (value) => `${Math.round(value)} ms`,
  },
  reverb_tone: {
    input: reverbToneControl,
    output: reverbToneOutput,
    format: (value) => `${Math.round(value)} Hz`,
  },
  lfo_rate: {
    input: lfoRateControl,
    output: lfoRateOutput,
    format: (value) => `${Number(value).toFixed(2)} Hz`,
  },
  lfo_depth: {
    input: lfoDepthControl,
    output: lfoDepthOutput,
    format: (value) => `${Math.round(value)}%`,
  },
};

const PARTICLE_RANGE_CONTROLS = {
  life: {
    input: lifeControl,
    output: lifeOutput,
    format: (value) => `${Math.round(value)}%`,
  },
  density: {
    input: densityControl,
    output: densityOutput,
    format: (value) => `${Math.round(value)}%`,
  },
};

const EMITTER_RANGE_CONTROLS = {
  rateMs: {
    input: emitterRateControl,
    output: emitterRateOutput,
    format: (value) => (value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value)} ms`),
  },
  burst: {
    input: emitterBurstControl,
    output: emitterBurstOutput,
    format: (value) => `${Math.round(value)}`,
  },
};

const audio = new WeatherAudioEngine();
const scene = new WeatherScene(canvas, audio, {
  onEmitterStateChange: renderEmitterState,
});

let audioStarted = false;
let atmosphereTimer = null;
let atmosphereSyncInFlight = false;
let currentAtmosphere = null;

function formatPhase(phase) {
  if (phase === "dawn") return "Amanecer";
  if (phase === "dusk") return "Atardecer";
  if (phase === "night") return "Noche";
  return "Dia";
}

function formatWindDirection(degrees) {
  const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const index = Math.round((((degrees % 360) + 360) % 360) / 45) % 8;
  return directions[index];
}

function setOutputValue(output, label) {
  output.value = label;
  output.textContent = label;
}

function updateRangeOutput(config, value) {
  setOutputValue(config.output, config.format(Number(value)));
}

function updateBrushButtons() {
  const activeMode = scene.getBrushMode();

  for (const button of brushButtons.querySelectorAll("button")) {
    button.classList.toggle("is-active", button.dataset.mode === activeMode);
  }
}

function buildBrushButtons() {
  const fragment = document.createDocumentFragment();

  for (const option of BRUSH_OPTIONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "segment-button";
    button.dataset.mode = option.id;
    button.textContent = option.label;
    button.addEventListener("click", () => {
      scene.setBrushMode(option.id);
      updateBrushButtons();
    });
    fragment.appendChild(button);
  }

  brushButtons.replaceChildren(fragment);
  updateBrushButtons();
}

function buildBackgroundOptions() {
  const fragment = document.createDocumentFragment();

  for (const option of BACKGROUND_OPTIONS) {
    const node = document.createElement("option");
    node.value = option.id;
    node.textContent = option.label;
    fragment.appendChild(node);
  }

  backgroundModeSelect.replaceChildren(fragment);
  backgroundModeSelect.value = scene.getBackgroundMode();
}

function buildPresetOptions() {
  const fragment = document.createDocumentFragment();

  for (const preset of audio.getPresetEntries()) {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.label;
    fragment.appendChild(option);
  }

  presetSelect.replaceChildren(fragment);
  presetSelect.value = audio.getCurrentPresetId();
  presetSelect.disabled = false;
}

function buildVoiceOptions() {
  const fragment = document.createDocumentFragment();

  for (const voice of audio.getVoiceEntries()) {
    const option = document.createElement("option");
    option.value = voice.id;
    option.textContent = voice.label;
    fragment.appendChild(option);
  }

  voiceSelect.replaceChildren(fragment);
  voiceSelect.value = audio.getCurrentVoiceId();
  voiceSelect.disabled = false;
}

function applySynthControlState(controlState) {
  for (const [key, config] of Object.entries(SYNTH_RANGE_CONTROLS)) {
    config.input.value = String(controlState[key]);
    updateRangeOutput(config, controlState[key]);
  }

  filterTypeSelect.value = controlState.filter_type ?? "lowpass";
  lfoTargetSelect.value = controlState.lfo_target ?? "filter";
  lfoWaveSelect.value = controlState.lfo_wave ?? "sine";
}

function syncSynthControlsFromUI() {
  for (const [key, config] of Object.entries(SYNTH_RANGE_CONTROLS)) {
    const value = Number(config.input.value);
    audio.setControl(key, value);
    updateRangeOutput(config, value);
  }

  audio.setControl("filter_type", filterTypeSelect.value);
  audio.setControl("lfo_target", lfoTargetSelect.value);
  audio.setControl("lfo_wave", lfoWaveSelect.value);
}

function applyParticleControlState(controlState) {
  for (const [key, config] of Object.entries(PARTICLE_RANGE_CONTROLS)) {
    config.input.value = String(controlState[key]);
    updateRangeOutput(config, controlState[key]);
  }
}

function syncParticleControlsFromUI() {
  const particleState = {
    life: Number(lifeControl.value),
    density: Number(densityControl.value),
  };

  for (const [key, config] of Object.entries(PARTICLE_RANGE_CONTROLS)) {
    updateRangeOutput(config, particleState[key]);
  }

  scene.setParticleControls(particleState);
}

function renderEmitterState(state) {
  const usingSelected = Boolean(state.selectedEmitter);
  const source = usingSelected ? state.selectedEmitter : state.defaults;

  emitterRateControl.value = String(source.rateMs);
  emitterBurstControl.value = String(source.burst);
  updateRangeOutput(EMITTER_RANGE_CONTROLS.rateMs, source.rateMs);
  updateRangeOutput(EMITTER_RANGE_CONTROLS.burst, source.burst);

  emitterDeleteButton.disabled = !usingSelected;
  emitterModeButton.classList.toggle("is-active", state.interactionMode === "emitter");
  emitterModeButton.textContent =
    state.interactionMode === "emitter" ? "Salir modo emisor" : "Modo emisor";
  appShell.classList.toggle("is-emitter-mode", state.interactionMode === "emitter");

  if (usingSelected) {
    emitterStatus.textContent = `${state.selectedEmitter.label} seleccionado. Arrastralo para moverlo o ajusta su ritmo y salida.`;
  } else if (state.count > 0) {
    emitterStatus.textContent = `${state.count} emisores activos. Click sobre uno para moverlo o activa modo emisor para crear otro.`;
  } else {
    emitterStatus.textContent = "Sin emisores. Activa modo emisor y hace click en la pantalla.";
  }

  const fragment = document.createDocumentFragment();

  for (const emitter of state.emitters) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "emitter-pill";
    button.classList.toggle("is-active", state.selectedEmitter?.id === emitter.id);
    button.textContent = `${emitter.label} · ${EMITTER_RANGE_CONTROLS.rateMs.format(emitter.rateMs)}`;
    button.addEventListener("click", () => {
      scene.selectEmitter(emitter.id);
    });
    fragment.appendChild(button);
  }

  emitterList.replaceChildren(fragment);
}

function syncEmitterControlsFromUI() {
  const nextValues = {
    rateMs: Number(emitterRateControl.value),
    burst: Number(emitterBurstControl.value),
  };

  if (scene.getEmitterState().selectedEmitter) {
    scene.updateSelectedEmitter(nextValues);
  } else {
    scene.setEmitterDefaults(nextValues);
  }
}

function renderAtmosphere(atmosphere) {
  sidebarSummary.textContent = atmosphere.summary;
  sidebarSource.textContent = `${atmosphere.sourceLabel} · ${atmosphere.locationLabel}`;
  windValue.textContent = `${Math.round(atmosphere.windSpeedKmh)} km/h ${formatWindDirection(
    atmosphere.windDirectionDeg
  )}`;
  rainValue.textContent = `${atmosphere.precipitationMm.toFixed(1)} mm`;
  humidityValue.textContent = `${Math.round(atmosphere.humidity)} %`;
  tempValue.textContent = `${Math.round(atmosphere.temperatureC)} °C`;
  cloudValue.textContent = `${Math.round(atmosphere.cloudCover)} %`;
  phaseValue.textContent = formatPhase(atmosphere.phase);
}

function initAccordion() {
  if (!accordionItems.length) {
    return;
  }

  const initiallyOpen = accordionItems.find((item) => item.open) ?? accordionItems[0];

  for (const item of accordionItems) {
    item.open = item === initiallyOpen;

    item.addEventListener("toggle", () => {
      if (!item.open) {
        return;
      }

      for (const sibling of accordionItems) {
        if (sibling !== item) {
          sibling.open = false;
        }
      }
    });
  }
}

function closeInfo() {
  appShell.classList.remove("is-info-open");
  infoModal.hidden = true;
}

function openInfo() {
  closeSettings();
  appShell.classList.add("is-info-open");
  infoModal.hidden = false;
}

function closeSettings() {
  appShell.classList.remove("is-settings-open");
  settingsBackdrop.hidden = true;
  settingsPanel.setAttribute("aria-hidden", "true");
  settingsButton.setAttribute("aria-expanded", "false");
}

function openSettings() {
  closeInfo();
  appShell.classList.add("is-settings-open");
  settingsBackdrop.hidden = false;
  settingsPanel.setAttribute("aria-hidden", "false");
  settingsButton.setAttribute("aria-expanded", "true");
}

function toggleSettings() {
  if (appShell.classList.contains("is-settings-open")) {
    closeSettings();
    return;
  }

  openSettings();
}

async function syncAtmosphere() {
  if (atmosphereSyncInFlight) {
    return;
  }

  atmosphereSyncInFlight = true;
  refreshButton.disabled = true;

  try {
    const atmosphere = await loadAtmosphere();
    currentAtmosphere = atmosphere;
    scene.setAtmosphere(atmosphere);
    audio.setAtmosphere(atmosphere);
    renderAtmosphere(atmosphere);
  } catch (_error) {
    sidebarSummary.textContent = "No pude releer el cielo.";
    sidebarSource.textContent = "La escena sigue con la ultima atmosfera disponible.";
  } finally {
    atmosphereSyncInFlight = false;
    refreshButton.disabled = false;
  }
}

async function ensureAudioStarted() {
  if (audioStarted) {
    return;
  }

  try {
    await audio.unlock();
    audioStarted = true;

    if (currentAtmosphere) {
      audio.setAtmosphere(currentAtmosphere);
    }
  } catch (_error) {
    audioStarted = false;
  }
}

async function init() {
  initAccordion();
  scene.start();
  buildBrushButtons();
  buildBackgroundOptions();
  renderEmitterState(scene.getEmitterState());
  applyParticleControlState(scene.getParticleControlState());
  syncParticleControlsFromUI();

  const soundConfig = await loadSoundConfig("./config/sound-presets.yaml");
  audio.setSoundConfig(soundConfig);
  buildPresetOptions();
  buildVoiceOptions();
  applySynthControlState(audio.getControlState());
  syncSynthControlsFromUI();
  await syncAtmosphere();

  if (atmosphereTimer) {
    window.clearInterval(atmosphereTimer);
  }

  atmosphereTimer = window.setInterval(() => {
    syncAtmosphere();
  }, 15 * 60 * 1000);
}

settingsButton.addEventListener("click", toggleSettings);
infoButton.addEventListener("click", openInfo);
closeSettingsButton.addEventListener("click", closeSettings);
closeInfoButton.addEventListener("click", closeInfo);
settingsBackdrop.addEventListener("click", closeSettings);
infoModal.addEventListener("click", (event) => {
  if (event.target === infoModal) {
    closeInfo();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSettings();
    closeInfo();
  }
});

canvas.addEventListener(
  "pointerdown",
  () => {
    ensureAudioStarted();
  },
  { passive: true }
);

refreshButton.addEventListener("click", () => {
  syncAtmosphere();
});

presetSelect.addEventListener("change", () => {
  audio.setPreset(presetSelect.value);
  voiceSelect.value = audio.getCurrentVoiceId();
  applySynthControlState(audio.getControlState());
  syncSynthControlsFromUI();

  if (currentAtmosphere) {
    audio.setAtmosphere(currentAtmosphere);
  }
});

voiceSelect.addEventListener("change", () => {
  audio.setVoice(voiceSelect.value);

  if (currentAtmosphere) {
    audio.setAtmosphere(currentAtmosphere);
  }
});

for (const [key, config] of Object.entries(SYNTH_RANGE_CONTROLS)) {
  config.input.addEventListener("input", () => {
    const value = Number(config.input.value);
    audio.setControl(key, value);
    updateRangeOutput(config, value);
  });
}

filterTypeSelect.addEventListener("change", () => {
  audio.setControl("filter_type", filterTypeSelect.value);
});
lfoTargetSelect.addEventListener("change", () => {
  audio.setControl("lfo_target", lfoTargetSelect.value);
});
lfoWaveSelect.addEventListener("change", () => {
  audio.setControl("lfo_wave", lfoWaveSelect.value);
});

for (const [key, config] of Object.entries(PARTICLE_RANGE_CONTROLS)) {
  config.input.addEventListener("input", () => {
    updateRangeOutput(config, Number(config.input.value));
    syncParticleControlsFromUI();
  });
}

backgroundModeSelect.addEventListener("change", () => {
  scene.setBackgroundMode(backgroundModeSelect.value);
});

for (const [key, config] of Object.entries(EMITTER_RANGE_CONTROLS)) {
  config.input.addEventListener("input", () => {
    updateRangeOutput(config, Number(config.input.value));
    syncEmitterControlsFromUI();
  });
}

emitterModeButton.addEventListener("click", () => {
  scene.setInteractionMode(scene.getInteractionMode() === "emitter" ? "draw" : "emitter");
});

emitterDeleteButton.addEventListener("click", () => {
  scene.removeSelectedEmitter();
});

void init();
