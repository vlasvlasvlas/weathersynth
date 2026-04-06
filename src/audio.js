import { DEFAULT_SOUND_CONFIG, normalizeSoundConfig } from "./sound-config.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mapRange(value, inMin, inMax, outMin, outMax) {
  const amount = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + (outMax - outMin) * amount;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function semitoneToRatio(semitones) {
  return 2 ** (semitones / 12);
}

const FALLBACK_ATMOSPHERE = {
  phase: "day",
  temperatureC: 18,
  normalized: {
    rain: 0,
    wind: 0,
    cloud: 0,
    humidity: 0.5,
    temperature: 0.55,
  },
};

export class WeatherAudioEngine {
  constructor(soundConfig = DEFAULT_SOUND_CONFIG) {
    this.context = null;
    this.inputBus = null;
    this.master = null;
    this.filter = null;
    this.dryGain = null;
    this.compressor = null;
    this.delaySend = null;
    this.delayNode = null;
    this.delayFeedback = null;
    this.delayTone = null;
    this.delayWet = null;
    this.reverbSend = null;
    this.reverbPreDelay = null;
    this.reverbConvolver = null;
    this.reverbTone = null;
    this.reverbWet = null;
    this.droneGain = null;
    this.droneNodes = [];
    this.lfoOsc = null;
    this.lfoGain = null;
    this.noiseBuffer = null;
    this.atmosphere = null;
    this.ready = false;
    this.lastReverbSignature = "";
    this.activeTransientVoices = new Set();
    this.maxTransientVoices = 10;
    this.lastTriggerTimes = {
      burst: -Infinity,
      edge: -Infinity,
      collision: -Infinity,
    };
    this.transientBudget = 7;
    this.transientBudgetCapacity = 7;
    this.transientBudgetRefillPerSecond = 8;
    this.lastBudgetTime = 0;
    this.config = normalizeSoundConfig(soundConfig);
    this.currentPresetId = Object.keys(this.config.presets)[0];
    this.currentVoiceId = this.config.presets[this.currentPresetId].voice;
    this.controls = this.getDefaultControlsForPreset(this.currentPresetId);
  }

  async unlock() {
    if (this.ready) {
      if (this.context?.state === "suspended") {
        await this.context.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("Web Audio API no disponible");
    }

    this.context = new AudioContextClass();
    this.inputBus = this.context.createGain();
    this.master = this.context.createGain();
    this.filter = this.context.createBiquadFilter();
    this.dryGain = this.context.createGain();
    this.compressor = this.context.createDynamicsCompressor();
    this.delaySend = this.context.createGain();
    this.delayNode = this.context.createDelay(2.5);
    this.delayFeedback = this.context.createGain();
    this.delayTone = this.context.createBiquadFilter();
    this.delayWet = this.context.createGain();
    this.reverbSend = this.context.createGain();
    this.reverbPreDelay = this.context.createDelay(0.25);
    this.reverbConvolver = this.context.createConvolver();
    this.reverbTone = this.context.createBiquadFilter();
    this.reverbWet = this.context.createGain();
    this.droneGain = this.context.createGain();
    this.lfoOsc = this.context.createOscillator();
    this.lfoGain = this.context.createGain();
    this.noiseBuffer = this.createNoiseBuffer();

    this.filter.type = "lowpass";
    this.filter.frequency.value = 1600;
    this.filter.Q.value = this.config.master.filter_q;
    this.compressor.threshold.value = -22;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 10;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.18;
    this.delayTone.type = "lowpass";
    this.reverbTone.type = "lowpass";
    this.master.gain.value = this.config.master.gain * (this.controls.master_volume / 100);
    this.droneGain.gain.value = 0.0001;
    this.delaySend.gain.value = 0;
    this.delayWet.gain.value = 0;
    this.reverbSend.gain.value = 0;
    this.reverbWet.gain.value = 0;

    this.inputBus.connect(this.filter);
    this.filter.connect(this.dryGain);
    this.dryGain.connect(this.compressor);
    this.filter.connect(this.delaySend);
    this.delaySend.connect(this.delayNode);
    this.delayNode.connect(this.delayTone);
    this.delayTone.connect(this.delayWet);
    this.delayWet.connect(this.compressor);
    this.delayTone.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.filter.connect(this.reverbSend);
    this.reverbSend.connect(this.reverbPreDelay);
    this.reverbPreDelay.connect(this.reverbConvolver);
    this.reverbConvolver.connect(this.reverbTone);
    this.reverbTone.connect(this.reverbWet);
    this.reverbWet.connect(this.compressor);
    this.droneGain.connect(this.inputBus);
    this.compressor.connect(this.master);
    this.master.connect(this.context.destination);
    this.lfoOsc.connect(this.lfoGain);

    this.rebuildDrone();
    this.rebuildReverb();
    this.lfoOsc.start();
    this.ready = true;
    this.lastBudgetTime = this.context.currentTime;
    this.syncEngineState();
    await this.context.resume();

    if (this.atmosphere) {
      this.setAtmosphere(this.atmosphere);
    }
  }

  createNoiseBuffer() {
    const buffer = this.context.createBuffer(
      1,
      this.context.sampleRate * 2,
      this.context.sampleRate
    );
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  getPresetEntries() {
    return Object.entries(this.config.presets).map(([id, preset]) => ({
      id,
      label: preset.label,
    }));
  }

  getVoiceEntries() {
    return Object.entries(this.config.voices).map(([id, voice]) => ({
      id,
      label: voice.label,
    }));
  }

  getCurrentPresetId() {
    return this.currentPresetId;
  }

  getCurrentVoiceId() {
    return this.currentVoiceId;
  }

  getControlState() {
    return { ...this.controls };
  }

  getCurrentPreset() {
    return this.config.presets[this.currentPresetId];
  }

  getCurrentVoice() {
    return this.config.voices[this.currentVoiceId];
  }

  getDefaultControlsForPreset(presetId) {
    return {
      ...this.config.defaults,
      ...this.config.presets[presetId].controls,
    };
  }

  setSoundConfig(soundConfig) {
    const previousControls = { ...this.controls };
    this.config = normalizeSoundConfig(soundConfig);

    if (!this.config.presets[this.currentPresetId]) {
      this.currentPresetId = Object.keys(this.config.presets)[0];
    }

    this.currentVoiceId = this.config.voices[this.currentVoiceId]
      ? this.currentVoiceId
      : this.config.presets[this.currentPresetId].voice;
    this.controls = {
      ...this.getDefaultControlsForPreset(this.currentPresetId),
      ...previousControls,
    };

    if (this.ready) {
      this.filter.Q.value = this.config.master.filter_q;
      this.rebuildDrone();
      this.syncEngineState();
    }
  }

  setPreset(presetId) {
    if (!this.config.presets[presetId]) {
      return;
    }

    this.currentPresetId = presetId;
    this.currentVoiceId = this.config.presets[presetId].voice;
    this.controls = this.getDefaultControlsForPreset(presetId);

    if (this.ready) {
      this.rebuildDrone();
      this.syncEngineState();
    }
  }

  setVoice(voiceId) {
    if (!this.config.voices[voiceId]) {
      return;
    }

    this.currentVoiceId = voiceId;
  }

  setControl(name, value) {
    if (!(name in this.controls)) {
      return;
    }

    this.controls[name] = value;

    if (this.ready) {
      this.syncEngineState();
    }
  }

  setAtmosphere(atmosphere) {
    this.atmosphere = atmosphere;

    if (this.ready) {
      this.syncEngineState();
    }
  }

  syncEngineState() {
    if (!this.ready || !this.context) {
      return;
    }

    const now = this.context.currentTime;
    const preset = this.getCurrentPreset();
    const sky = this.atmosphere ?? FALLBACK_ATMOSPHERE;
    const { normalized, phase, temperatureC } = sky;
    const cloudLift = 1 - normalized.cloud * 0.55;
    const weatherCutoff = mapRange(
      normalized.temperature,
      0,
      1,
      preset.filter_min,
      preset.filter_max
    );
    const filterFrequency =
      (this.controls.filter_cutoff * 0.58 + weatherCutoff * 0.42) * cloudLift;
    const phaseDrone =
      phase === "night"
        ? preset.drone_night
        : phase === "dusk"
          ? preset.drone_dusk
          : phase === "dawn"
            ? preset.drone_dawn
            : preset.drone_day;
    const phaseBase =
      phase === "night" ? 82 : phase === "dusk" ? 110 : phase === "dawn" ? 132 : 164;
    const heatOffset = mapRange(temperatureC, -5, 34, -8, preset.temperature_pitch);
    const droneLevel =
      phaseDrone *
      (0.55 + normalized.humidity * 0.7) *
      (this.controls.drone_level / 100) *
      1.2;
    const delayMix = this.controls.delay_mix / 100;
    const reverbMix = this.controls.reverb_mix / 100;
    const delayTime = this.controls.delay_time_ms / 1000 + normalized.wind * 0.01;
    const delayFeedback = clamp(this.controls.delay_feedback / 100, 0, 0.92);
    const delayTone = clamp(
      this.controls.delay_tone * (1 - normalized.rain * 0.12),
      200,
      12000
    );
    const reverbTone = clamp(
      this.controls.reverb_tone * (1 - normalized.cloud * 0.1),
      200,
      12000
    );

    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(
      this.config.master.gain * (this.controls.master_volume / 100),
      now + 0.18
    );

    this.filter.type = this.controls.filter_type;
    this.filter.Q.cancelScheduledValues(now);
    this.filter.Q.linearRampToValueAtTime(this.controls.filter_resonance, now + 0.18);
    this.filter.frequency.cancelScheduledValues(now);
    this.filter.frequency.linearRampToValueAtTime(
      clamp(filterFrequency, 80, 12000),
      now + 0.8
    );

    this.delaySend.gain.cancelScheduledValues(now);
    this.delaySend.gain.linearRampToValueAtTime(delayMix * 0.78, now + 0.2);
    this.delayWet.gain.cancelScheduledValues(now);
    this.delayWet.gain.linearRampToValueAtTime(delayMix, now + 0.2);
    this.delayFeedback.gain.cancelScheduledValues(now);
    this.delayFeedback.gain.linearRampToValueAtTime(delayFeedback, now + 0.2);
    this.delayNode.delayTime.cancelScheduledValues(now);
    this.delayNode.delayTime.linearRampToValueAtTime(clamp(delayTime, 0.04, 1.2), now + 0.2);
    this.delayTone.frequency.cancelScheduledValues(now);
    this.delayTone.frequency.linearRampToValueAtTime(delayTone, now + 0.2);

    this.reverbSend.gain.cancelScheduledValues(now);
    this.reverbSend.gain.linearRampToValueAtTime(reverbMix * 0.78, now + 0.2);
    this.reverbWet.gain.cancelScheduledValues(now);
    this.reverbWet.gain.linearRampToValueAtTime(reverbMix, now + 0.2);
    this.reverbTone.frequency.cancelScheduledValues(now);
    this.reverbTone.frequency.linearRampToValueAtTime(reverbTone, now + 0.2);
    this.reverbPreDelay.delayTime.cancelScheduledValues(now);
    this.reverbPreDelay.delayTime.linearRampToValueAtTime(
      this.controls.reverb_predelay_ms / 1000,
      now + 0.2
    );
    this.rebuildReverb();

    this.droneGain.gain.cancelScheduledValues(now);
    this.droneGain.gain.linearRampToValueAtTime(droneLevel, now + 1.2);

    this.droneNodes.forEach((node, index) => {
      const base = phaseBase * (index === 0 ? 1 : 1.49);
      const gainBase = preset.drone_gains[index] ?? preset.drone_gains[0] ?? 0.02;
      node.gain.gain.cancelScheduledValues(now);
      node.gain.gain.linearRampToValueAtTime(gainBase, now + 0.3);
      node.oscillator.frequency.cancelScheduledValues(now);
      node.oscillator.frequency.linearRampToValueAtTime(
        base + heatOffset + normalized.wind * preset.wind_pitch,
        now + 1
      );
    });

    this.updateLFORouting();
  }

  rebuildReverb() {
    if (!this.reverbConvolver || !this.context) {
      return;
    }

    const signature = `${this.controls.reverb_decay}:${this.controls.reverb_predelay_ms}`;

    if (signature === this.lastReverbSignature) {
      return;
    }

    const decay = clamp(this.controls.reverb_decay, 0.5, 8);
    const preDelay = clamp(this.controls.reverb_predelay_ms / 1000, 0, 0.2);
    const length = Math.floor(this.context.sampleRate * (decay + preDelay));
    const impulse = this.context.createBuffer(
      2,
      Math.max(length, 1),
      this.context.sampleRate
    );

    for (let channelIndex = 0; channelIndex < impulse.numberOfChannels; channelIndex += 1) {
      const channel = impulse.getChannelData(channelIndex);

      for (let sampleIndex = 0; sampleIndex < length; sampleIndex += 1) {
        const time = sampleIndex / this.context.sampleRate;

        if (time < preDelay) {
          channel[sampleIndex] = 0;
          continue;
        }

        const tailTime = (time - preDelay) / decay;
        const envelope = (1 - tailTime) ** 2.2;
        channel[sampleIndex] = (Math.random() * 2 - 1) * Math.max(envelope, 0);
      }
    }

    this.reverbConvolver.buffer = impulse;
    this.lastReverbSignature = signature;
  }

  updateLFORouting() {
    if (!this.lfoOsc || !this.lfoGain) {
      return;
    }

    this.lfoGain.disconnect();
    this.lfoOsc.type = this.controls.lfo_wave;
    this.lfoOsc.frequency.setValueAtTime(this.controls.lfo_rate, this.context.currentTime);

    if (this.controls.lfo_target === "filter") {
      this.lfoGain.gain.setValueAtTime(
        mapRange(this.controls.lfo_depth, 0, 100, 0, 1800),
        this.context.currentTime
      );
      this.lfoGain.connect(this.filter.frequency);
      return;
    }

    if (this.controls.lfo_target === "delay") {
      this.lfoGain.gain.setValueAtTime(
        mapRange(this.controls.lfo_depth, 0, 100, 0, 0.12),
        this.context.currentTime
      );
      this.lfoGain.connect(this.delayNode.delayTime);
      return;
    }

    if (this.controls.lfo_target === "drone") {
      this.lfoGain.gain.setValueAtTime(
        mapRange(this.controls.lfo_depth, 0, 100, 0, 30),
        this.context.currentTime
      );
      this.droneNodes.forEach((node) => {
        this.lfoGain.connect(node.oscillator.detune);
      });
      return;
    }

    this.lfoGain.gain.setValueAtTime(0, this.context.currentTime);
  }

  triggerLiteParticle(particle, viewport, type, now, energy, eventSource = "pointer") {
    const { normalized } = this.atmosphere ?? FALLBACK_ATMOSPHERE;
    const xRatio = clamp(particle.x / viewport.width, 0, 1);
    const yRatio = clamp(particle.y / viewport.height, 0, 1);
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();
    const voiceToken = Symbol(`lite-${type}`);
    const baseFrequency = mapRange(
      1 - yRatio,
      0,
      1,
      type === "edge" ? 170 : 140,
      type === "edge" ? 620 : 760
    );
    const pitch =
      baseFrequency +
      normalized.wind * 18 +
      normalized.temperature * 10 +
      (type === "burst" ? 14 : 0);
    const attack = type === "edge" ? 0.002 : eventSource === "emitter" ? 0.004 : 0.006;
    const release = type === "edge" ? 0.05 : eventSource === "emitter" ? 0.085 : 0.12;
    const level =
      (type === "edge" ? 0.016 : 0.024) *
      (0.45 + energy * 0.55) *
      (this.controls.transient_level / 100);
    const stopTime = now + attack + release + 0.03;

    oscillator.type = type === "edge" ? "sine" : eventSource === "emitter" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(pitch, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(90, pitch * (type === "edge" ? 0.5 : 0.68)),
      now + attack + release
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);

    panner.pan.value = clamp(xRatio * 2 - 1 + randomBetween(-0.06, 0.06), -1, 1);

    oscillator.connect(gain);
    gain.connect(panner);
    panner.connect(this.compressor);
    this.activeTransientVoices.add(voiceToken);

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      panner.disconnect();
      this.activeTransientVoices.delete(voiceToken);
    };

    oscillator.start(now);
    oscillator.stop(stopTime);
  }

  triggerParticle(particle, viewport, type = "edge") {
    if (!this.ready || !this.context || !this.filter) {
      return;
    }

    const preset = this.getCurrentPreset();
    const voice = this.getCurrentVoice();
    const { normalized } = this.atmosphere ?? FALLBACK_ATMOSPHERE;
    const now = this.context.currentTime;
    const elapsedBudget = Math.max(0, now - this.lastBudgetTime);
    this.lastBudgetTime = now;
    this.transientBudget = clamp(
      this.transientBudget + elapsedBudget * this.transientBudgetRefillPerSecond,
      0,
      this.transientBudgetCapacity
    );
    const xRatio = clamp(particle.x / viewport.width, 0, 1);
    const yRatio = clamp(particle.y / viewport.height, 0, 1);
    const energy = clamp((particle.energy ?? 0.4) * (particle.soundBias ?? 1), 0.1, 1.2);
    const triggerSpacing =
      type === "burst" ? 0.03 : type === "collision" ? 0.04 : 0.05;
    const triggerCost =
      type === "burst" ? 1.15 : type === "collision" ? 1.05 : 0.9;

    if (now - this.lastTriggerTimes[type] < triggerSpacing) {
      return;
    }

    if (this.transientBudget < triggerCost) {
      return;
    }

    if (this.activeTransientVoices.size >= this.maxTransientVoices) {
      if (type === "edge" || energy < 0.92) {
        return;
      }
    }

    this.lastTriggerTimes[type] = now;
    this.transientBudget -= triggerCost;
    const eventSource = particle.eventSource ?? "pointer";
    const loadRatio = clamp(this.activeTransientVoices.size / this.maxTransientVoices, 0, 1);
    const useLiteVoice =
      type === "edge" || eventSource === "emitter" || loadRatio > 0.62;

    if (useLiteVoice) {
      this.triggerLiteParticle(particle, viewport, type, now, energy, eventSource);
      return;
    }

    const noteBus = this.context.createGain();
    const voiceFilter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();
    const denseMode = loadRatio > 0.45;
    const overloadMode = loadRatio > 0.7;
    const baseFrequency = mapRange(1 - yRatio, 0, 1, 110, 880);
    const variation = type === "burst" ? voice.burst_pitch : type === "collision" ? 36 : 0;
    const basePitch =
      baseFrequency +
      variation +
      normalized.wind * preset.wind_pitch +
      normalized.temperature * preset.temperature_pitch;
    const levelBase =
      type === "burst"
        ? voice.burst_level * preset.burst_level
        : voice.edge_level * preset.edge_level;
    const attack = Math.max(0.004, voice.attack * preset.attack_scale);
    const release =
      Math.max(0.08, voice.release * preset.release_scale) *
      (0.76 + normalized.humidity * 0.62 + normalized.rain * 0.24) *
      mapRange(loadRatio, 0, 1, 1, 0.55);
    const level =
      levelBase *
      (0.26 + energy * 0.74) *
      (this.controls.transient_level / 100) *
      0.9;
    const congestionScale = mapRange(
      this.activeTransientVoices.size,
      0,
      this.maxTransientVoices,
      1,
      0.22
    );
    const filterEnvBoost =
      this.controls.filter_env_amount * voice.filter_env * (0.45 + energy * 0.75);
    const filterBase = clamp(
      (this.controls.filter_cutoff * 0.6 + preset.filter_max * 0.2 + preset.filter_min * 0.2) *
        (0.82 + energy * 0.16),
      120,
      14000
    );
    const peakCutoff = clamp(filterBase + filterEnvBoost, 160, 16000);
    const stopTime = now + attack + release + 0.08;
    const voiceToken = Symbol(type);

    voiceFilter.type = "lowpass";
    voiceFilter.Q.value = 0.4 + this.controls.filter_resonance * 0.18;
    voiceFilter.frequency.setValueAtTime(clamp(filterBase * 0.45, 80, 12000), now);
    voiceFilter.frequency.exponentialRampToValueAtTime(
      peakCutoff,
      now + Math.max(0.01, attack * 1.8)
    );
    voiceFilter.frequency.exponentialRampToValueAtTime(
      filterBase,
      now + attack + release * 0.72
    );

    panner.pan.value = clamp(
      xRatio * 2 - 1 + randomBetween(-voice.stereo_spread, voice.stereo_spread),
      -1,
      1
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, level * congestionScale),
      now + attack
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);

    noteBus.connect(voiceFilter);
    voiceFilter.connect(gain);
    gain.connect(panner);
    panner.connect(this.inputBus);
    this.activeTransientVoices.add(voiceToken);

    const createOscillatorVoice = (wave, frequency, gainAmount, detune = 0) => {
      if (!wave || wave === "none" || gainAmount <= 0) {
        return;
      }

      const oscillator = this.context.createOscillator();
      const oscGain = this.context.createGain();
      oscillator.type = wave;
      oscillator.frequency.value = frequency;
      oscillator.detune.value = detune;
      oscGain.gain.value = gainAmount;
      oscillator.connect(oscGain);
      oscGain.connect(noteBus);
      oscillator.start(now);
      oscillator.stop(stopTime);
    };

    if (!denseMode && voice.fm_index > 0 && voice.osc1_type && voice.osc1_type !== "none") {
      const carrier = this.context.createOscillator();
      const carrierGain = this.context.createGain();
      const modulator = this.context.createOscillator();
      const modGain = this.context.createGain();

      carrier.type = voice.osc1_type;
      carrier.frequency.value = basePitch;
      carrierGain.gain.value = voice.osc1_gain * 0.66;
      modulator.type = voice.fm_wave;
      modulator.frequency.value = basePitch * voice.fm_ratio;
      modGain.gain.value = basePitch * voice.fm_index * (0.18 + energy * 0.82);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(carrierGain);
      carrierGain.connect(noteBus);

      modulator.start(now);
      carrier.start(now);
      modulator.stop(stopTime);
      carrier.stop(stopTime);
    } else {
      createOscillatorVoice(voice.osc1_type, basePitch, voice.osc1_gain);
    }

    if (!denseMode) {
      createOscillatorVoice(
        voice.osc2_type,
        basePitch * semitoneToRatio(voice.osc2_interval),
        voice.osc2_gain,
        voice.osc2_detune
      );
    }

    if (!overloadMode && type !== "edge") {
      createOscillatorVoice(
        voice.sub_type,
        basePitch * semitoneToRatio(voice.sub_interval),
        voice.sub_gain
      );
    }

    if (!denseMode && voice.noise_mix > 0 && this.noiseBuffer) {
      const noiseSource = this.context.createBufferSource();
      const noiseGain = this.context.createGain();
      noiseSource.buffer = this.noiseBuffer;
      noiseSource.loop = true;
      noiseGain.gain.value = voice.noise_mix;
      noiseSource.connect(noiseGain);
      noiseGain.connect(noteBus);
      noiseSource.start(now);
      noiseSource.stop(stopTime);
    }

    setTimeout(() => {
      noteBus.disconnect();
      voiceFilter.disconnect();
      gain.disconnect();
      panner.disconnect();
      this.activeTransientVoices.delete(voiceToken);
    }, Math.max(0, (stopTime - now) * 1000 + 50));
  }

  rebuildDrone() {
    if (!this.context || !this.droneGain) {
      return;
    }

    const now = this.context.currentTime;

    this.droneNodes.forEach((node) => {
      node.gain.gain.cancelScheduledValues(now);
      node.gain.gain.linearRampToValueAtTime(0.0001, now + 0.08);
      node.oscillator.stop(now + 0.12);
    });

    this.droneNodes = [];

    const preset = this.getCurrentPreset();

    this.droneNodes = preset.drone_frequencies.map((frequency, index) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = preset.drone_types[index] ?? preset.drone_types[0] ?? "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = preset.drone_gains[index] ?? preset.drone_gains[0] ?? 0.02;
      oscillator.connect(gain);
      gain.connect(this.droneGain);
      oscillator.start();
      return { oscillator, gain };
    });

    this.updateLFORouting();
  }
}
