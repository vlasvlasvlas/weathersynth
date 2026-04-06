const DEFAULT_CONTROLS = {
  master_volume: 82,
  transient_level: 78,
  drone_level: 64,
  filter_type: "lowpass",
  filter_cutoff: 1900,
  filter_resonance: 0.7,
  filter_env_amount: 960,
  delay_mix: 14,
  delay_time_ms: 260,
  delay_feedback: 28,
  delay_tone: 2900,
  reverb_mix: 18,
  reverb_decay: 2.8,
  reverb_predelay_ms: 30,
  reverb_tone: 3200,
  lfo_target: "filter",
  lfo_wave: "sine",
  lfo_rate: 0.12,
  lfo_depth: 36,
};

const DEFAULT_VOICE = {
  label: "Analog Pad",
  osc1_type: "sawtooth",
  osc1_gain: 0.82,
  osc2_type: "triangle",
  osc2_gain: 0.5,
  osc2_interval: 0,
  osc2_detune: 7,
  sub_type: "sine",
  sub_gain: 0.16,
  sub_interval: -12,
  noise_mix: 0.04,
  attack: 0.012,
  release: 0.42,
  filter_env: 0.56,
  stereo_spread: 0.14,
  fm_ratio: 0,
  fm_index: 0,
  fm_wave: "sine",
  edge_level: 1,
  burst_level: 1.12,
  burst_pitch: 62,
};

const DEFAULT_PRESET = {
  label: "Aire abierto",
  voice: "analog_pad",
  drone_frequencies: [98, 147],
  drone_types: ["sine", "triangle"],
  drone_gains: [0.03, 0.018],
  filter_min: 540,
  filter_max: 2800,
  drone_day: 0.024,
  drone_dawn: 0.032,
  drone_dusk: 0.04,
  drone_night: 0.05,
  attack_scale: 1,
  release_scale: 1,
  edge_level: 0.12,
  burst_level: 0.18,
  wind_pitch: 40,
  temperature_pitch: 10,
  controls: {},
};

export const DEFAULT_SOUND_CONFIG = {
  master: {
    gain: 0.55,
    filter_q: 0.6,
  },
  defaults: DEFAULT_CONTROLS,
  voices: {
    analog_pad: {
      ...DEFAULT_VOICE,
      label: "Analog Pad",
    },
    juno_pluck: {
      ...DEFAULT_VOICE,
      label: "Juno Pluck",
      osc1_type: "sawtooth",
      osc2_type: "square",
      osc2_gain: 0.34,
      osc2_detune: 12,
      sub_gain: 0.08,
      noise_mix: 0.02,
      attack: 0.006,
      release: 0.24,
      filter_env: 0.92,
      stereo_spread: 0.08,
      edge_level: 1.1,
      burst_level: 1.2,
    },
    fm_bell: {
      ...DEFAULT_VOICE,
      label: "FM Bell",
      osc1_type: "sine",
      osc2_type: "none",
      osc2_gain: 0,
      sub_type: "none",
      sub_gain: 0,
      noise_mix: 0,
      attack: 0.004,
      release: 1.2,
      filter_env: 0.3,
      stereo_spread: 0.2,
      fm_ratio: 3.2,
      fm_index: 0.9,
      fm_wave: "sine",
      edge_level: 0.9,
      burst_level: 1.18,
      burst_pitch: 74,
    },
    hollow_reed: {
      ...DEFAULT_VOICE,
      label: "Hollow Reed",
      osc1_type: "triangle",
      osc2_type: "square",
      osc2_gain: 0.28,
      osc2_interval: 12,
      osc2_detune: 3,
      sub_gain: 0.05,
      noise_mix: 0.08,
      attack: 0.018,
      release: 0.5,
      filter_env: 0.44,
      stereo_spread: 0.1,
      edge_level: 0.92,
      burst_level: 1.06,
    },
    glass_organ: {
      ...DEFAULT_VOICE,
      label: "Glass Organ",
      osc1_type: "triangle",
      osc2_type: "sine",
      osc2_gain: 0.4,
      osc2_interval: 12,
      sub_gain: 0.1,
      noise_mix: 0.01,
      attack: 0.015,
      release: 0.86,
      filter_env: 0.38,
      stereo_spread: 0.18,
      fm_ratio: 1.5,
      fm_index: 0.24,
      edge_level: 0.88,
      burst_level: 1.04,
    },
  },
  presets: {
    open_air: {
      ...DEFAULT_PRESET,
      label: "Aire abierto",
      voice: "analog_pad",
      controls: {
        ...DEFAULT_CONTROLS,
        master_volume: 82,
        transient_level: 76,
        drone_level: 64,
        filter_type: "lowpass",
        filter_cutoff: 2100,
        filter_resonance: 0.8,
        filter_env_amount: 1040,
        delay_mix: 14,
        delay_time_ms: 260,
        delay_feedback: 28,
        delay_tone: 2900,
        reverb_mix: 18,
        reverb_decay: 2.8,
        reverb_predelay_ms: 30,
        reverb_tone: 3200,
        lfo_target: "filter",
        lfo_wave: "sine",
        lfo_rate: 0.12,
        lfo_depth: 38,
      },
    },
    mist: {
      ...DEFAULT_PRESET,
      label: "Bruma",
      voice: "glass_organ",
      drone_frequencies: [82, 123],
      drone_types: ["sine", "sine"],
      drone_gains: [0.026, 0.014],
      filter_min: 420,
      filter_max: 1800,
      drone_day: 0.03,
      drone_dawn: 0.036,
      drone_dusk: 0.044,
      drone_night: 0.056,
      attack_scale: 1.08,
      release_scale: 1.24,
      edge_level: 0.1,
      burst_level: 0.16,
      wind_pitch: 24,
      temperature_pitch: 7,
      controls: {
        ...DEFAULT_CONTROLS,
        master_volume: 78,
        transient_level: 62,
        drone_level: 72,
        filter_type: "lowpass",
        filter_cutoff: 1320,
        filter_resonance: 0.6,
        filter_env_amount: 620,
        delay_mix: 20,
        delay_time_ms: 340,
        delay_feedback: 38,
        delay_tone: 1800,
        reverb_mix: 30,
        reverb_decay: 4.6,
        reverb_predelay_ms: 44,
        reverb_tone: 2200,
        lfo_target: "filter",
        lfo_wave: "triangle",
        lfo_rate: 0.08,
        lfo_depth: 44,
      },
    },
    bronze: {
      ...DEFAULT_PRESET,
      label: "Bronce",
      voice: "juno_pluck",
      drone_frequencies: [110, 165],
      drone_types: ["triangle", "square"],
      drone_gains: [0.028, 0.014],
      filter_min: 620,
      filter_max: 3200,
      drone_day: 0.02,
      drone_dawn: 0.027,
      drone_dusk: 0.04,
      drone_night: 0.045,
      attack_scale: 0.9,
      release_scale: 0.86,
      edge_level: 0.13,
      burst_level: 0.19,
      wind_pitch: 48,
      temperature_pitch: 12,
      controls: {
        ...DEFAULT_CONTROLS,
        master_volume: 84,
        transient_level: 84,
        drone_level: 52,
        filter_type: "bandpass",
        filter_cutoff: 2400,
        filter_resonance: 2.8,
        filter_env_amount: 1280,
        delay_mix: 18,
        delay_time_ms: 220,
        delay_feedback: 32,
        delay_tone: 3600,
        reverb_mix: 12,
        reverb_decay: 2.2,
        reverb_predelay_ms: 20,
        reverb_tone: 4200,
        lfo_target: "drone",
        lfo_wave: "sawtooth",
        lfo_rate: 0.18,
        lfo_depth: 26,
      },
    },
    nocturne: {
      ...DEFAULT_PRESET,
      label: "Nocturno",
      voice: "hollow_reed",
      drone_frequencies: [73, 110],
      drone_types: ["sine", "triangle"],
      drone_gains: [0.03, 0.012],
      filter_min: 380,
      filter_max: 1500,
      drone_day: 0.018,
      drone_dawn: 0.024,
      drone_dusk: 0.034,
      drone_night: 0.062,
      attack_scale: 1.2,
      release_scale: 1.34,
      edge_level: 0.11,
      burst_level: 0.14,
      wind_pitch: 18,
      temperature_pitch: 6,
      controls: {
        ...DEFAULT_CONTROLS,
        master_volume: 76,
        transient_level: 54,
        drone_level: 78,
        filter_type: "lowpass",
        filter_cutoff: 980,
        filter_resonance: 1.3,
        filter_env_amount: 540,
        delay_mix: 24,
        delay_time_ms: 420,
        delay_feedback: 44,
        delay_tone: 1500,
        reverb_mix: 34,
        reverb_decay: 5.6,
        reverb_predelay_ms: 50,
        reverb_tone: 1800,
        lfo_target: "filter",
        lfo_wave: "sine",
        lfo_rate: 0.07,
        lfo_depth: 52,
      },
    },
  },
};

function copyVoice(voice) {
  return {
    ...voice,
  };
}

function copyPreset(preset) {
  return {
    ...preset,
    drone_frequencies: [...preset.drone_frequencies],
    drone_types: [...preset.drone_types],
    drone_gains: [...preset.drone_gains],
    controls: { ...preset.controls },
  };
}

function cloneConfig(config) {
  const voices = Object.fromEntries(
    Object.entries(config.voices).map(([id, voice]) => [id, copyVoice(voice)])
  );
  const presets = Object.fromEntries(
    Object.entries(config.presets).map(([id, preset]) => [id, copyPreset(preset)])
  );

  return {
    master: { ...config.master },
    defaults: { ...config.defaults },
    voices,
    presets,
  };
}

function parseScalar(rawValue) {
  const value = rawValue.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();

    if (!inner) {
      return [];
    }

    return inner.split(",").map((item) => parseScalar(item));
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  return value;
}

function parseSimpleYaml(text) {
  const root = {};
  const stack = [{ indent: -1, container: root }];
  const lines = text.split(/\r?\n/);

  for (const originalLine of lines) {
    const line = originalLine.replace(/\t/g, "  ");
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const indent = line.match(/^ */)?.[0].length ?? 0;

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].container;
    const separatorIndex = trimmed.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (!rawValue) {
      parent[key] = {};
      stack.push({ indent, container: parent[key] });
      continue;
    }

    parent[key] = parseScalar(rawValue);
  }

  return root;
}

export function normalizeSoundConfig(candidate) {
  const defaults = cloneConfig(DEFAULT_SOUND_CONFIG);
  const config = candidate && typeof candidate === "object" ? candidate : {};
  const defaultsInput =
    config.defaults && typeof config.defaults === "object" ? config.defaults : {};
  const voicesInput = config.voices && typeof config.voices === "object" ? config.voices : {};
  const presetsInput = config.presets && typeof config.presets === "object" ? config.presets : {};
  const voiceIds = new Set([...Object.keys(defaults.voices), ...Object.keys(voicesInput)]);
  const presetIds = new Set([...Object.keys(defaults.presets), ...Object.keys(presetsInput)]);
  const voices = {};
  const presets = {};

  for (const voiceId of voiceIds) {
    const baseVoice = defaults.voices[voiceId] ?? copyVoice(DEFAULT_VOICE);
    const inputVoice =
      voicesInput[voiceId] && typeof voicesInput[voiceId] === "object"
        ? voicesInput[voiceId]
        : {};

    voices[voiceId] = {
      ...copyVoice(baseVoice),
      ...inputVoice,
    };
  }

  for (const presetId of presetIds) {
    const basePreset = defaults.presets[presetId] ?? copyPreset(DEFAULT_PRESET);
    const inputPreset =
      presetsInput[presetId] && typeof presetsInput[presetId] === "object"
        ? presetsInput[presetId]
        : {};

    presets[presetId] = {
      ...copyPreset(basePreset),
      ...inputPreset,
      drone_frequencies: [
        ...(inputPreset.drone_frequencies ?? basePreset.drone_frequencies),
      ],
      drone_types: [...(inputPreset.drone_types ?? basePreset.drone_types)],
      drone_gains: [...(inputPreset.drone_gains ?? basePreset.drone_gains)],
      controls: {
        ...defaults.defaults,
        ...basePreset.controls,
        ...(inputPreset.controls ?? {}),
      },
    };
  }

  return {
    master: {
      ...defaults.master,
      ...(config.master ?? {}),
    },
    defaults: {
      ...defaults.defaults,
      ...defaultsInput,
    },
    voices,
    presets,
  };
}

export async function loadSoundConfig(url) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/plain, text/yaml, application/x-yaml",
      },
    });

    if (!response.ok) {
      throw new Error(`No pude leer ${url}`);
    }

    const text = await response.text();
    const parsed = parseSimpleYaml(text);
    return normalizeSoundConfig(parsed);
  } catch (_error) {
    return cloneConfig(DEFAULT_SOUND_CONFIG);
  }
}
