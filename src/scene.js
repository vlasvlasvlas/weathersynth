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

function createFallbackAtmosphere() {
  return {
    phase: "night",
    storm: false,
    windVector: { x: 0.2, y: -0.12 },
    normalized: {
      wind: 0.22,
      gust: 0.15,
      rain: 0.08,
      humidity: 0.64,
      temperature: 0.48,
      cloud: 0.32,
      darkness: 0.9,
    },
  };
}

const BRUSH_PROFILES = {
  points: {
    id: "points",
    label: "Puntos",
    renderMode: "orb",
    burstFactor: 1,
    trailFactor: 1,
    burstSpeed: [0.6, 2.8],
    trailSpeed: [0.2, 1.5],
    size: [1.8, 4.8],
    decay: [0.007, 0.018],
    motionScale: 2.6,
    gravityBias: 0,
    dragBias: 0,
    stretch: 1,
    soundBias: 1,
  },
  ribbons: {
    id: "ribbons",
    label: "Hilos",
    renderMode: "line",
    burstFactor: 0.78,
    trailFactor: 1.1,
    burstSpeed: [1.2, 3.6],
    trailSpeed: [0.4, 2],
    size: [0.9, 2.1],
    decay: [0.004, 0.01],
    motionScale: 3.3,
    gravityBias: -0.01,
    dragBias: 0.003,
    stretch: 2.1,
    soundBias: 0.94,
  },
  clouds: {
    id: "clouds",
    label: "Bruma",
    renderMode: "cloud",
    burstFactor: 0.88,
    trailFactor: 0.9,
    burstSpeed: [0.3, 1.3],
    trailSpeed: [0.1, 0.7],
    size: [5.8, 12.6],
    decay: [0.0026, 0.0065],
    motionScale: 1.3,
    gravityBias: -0.014,
    dragBias: 0.01,
    stretch: 1.4,
    soundBias: 0.74,
  },
  drops: {
    id: "drops",
    label: "Gotas",
    renderMode: "drop",
    burstFactor: 1.04,
    trailFactor: 0.82,
    burstSpeed: [0.8, 2.2],
    trailSpeed: [0.2, 1.1],
    size: [2.4, 5.4],
    decay: [0.006, 0.014],
    motionScale: 3,
    gravityBias: 0.065,
    dragBias: -0.003,
    stretch: 2.5,
    soundBias: 1.08,
  },
};

export const BRUSH_OPTIONS = Object.values(BRUSH_PROFILES).map(({ id, label }) => ({
  id,
  label,
}));

const BACKGROUND_MODES = {
  atmospheric: { id: "atmospheric", label: "Atmosferico" },
  black: { id: "black", label: "Negro" },
  white: { id: "white", label: "Blanco" },
};

export const BACKGROUND_OPTIONS = Object.values(BACKGROUND_MODES).map(({ id, label }) => ({
  id,
  label,
}));

function buildPalette(atmosphere, backgroundMode = "atmospheric") {
  const { phase, normalized } = atmosphere;
  const hueBase =
    phase === "night"
      ? 222
      : phase === "dusk"
        ? 18
        : phase === "dawn"
          ? 30
          : 196;
  const warmth = normalized.temperature * 24;
  const cloudMute = normalized.cloud * 14;
  const rainCool = normalized.rain * 18;
  const humidityMist = normalized.humidity * 9;
  const topLight =
    phase === "night" ? 14 : phase === "dusk" ? 18 : phase === "dawn" ? 24 : 30;
  const bottomHue = hueBase + (phase === "day" ? -28 : 12) - rainCool * 0.25;
  const bottomLight =
    phase === "night" ? 7 : phase === "dusk" ? 10 : phase === "dawn" ? 12 : 11;
  const atmosphericPalette = {
    top: `hsl(${hueBase + warmth - cloudMute - rainCool} 48% ${topLight}%)`,
    bottom: `hsl(${bottomHue + warmth * 0.55 - cloudMute - humidityMist} 42% ${bottomLight}%)`,
    glow: `hsla(${hueBase + 34 - rainCool} 90% 68% / ${0.16 + normalized.temperature * 0.28})`,
    glowAlt: `hsla(${hueBase - 32 - humidityMist} 86% 60% / ${0.11 + normalized.wind * 0.2})`,
    noiseOpacity: clamp(
      0.58 + normalized.humidity * 0.24 + normalized.cloud * 0.12,
      0.48,
      0.96
    ),
    fadeColor: "5, 7, 12",
    particleBrightnessShift: 0,
    rainLightness: 84,
    emitterLightness: 72,
    emitterRingLightness: 85,
    floatingButtonFill: "hsla(40 38% 90% / 0.12)",
    floatingButtonHover: "hsla(40 38% 90% / 0.18)",
    floatingButtonStroke: "hsla(40 54% 88% / 0.24)",
    floatingButtonColor: "hsl(40 38% 91%)",
  };

  if (backgroundMode === "black") {
    return {
      hueBase,
      backgroundMode,
      top: "hsl(0 0% 4%)",
      bottom: "hsl(0 0% 2%)",
      glow: "hsla(0 0% 0% / 0)",
      glowAlt: "hsla(0 0% 0% / 0)",
      traceHue: hueBase + 44 - rainCool * 0.35,
      noiseOpacity: 0.18,
      fadeColor: "2, 2, 2",
      particleBrightnessShift: -4,
      rainLightness: 80,
      emitterLightness: 74,
      emitterRingLightness: 88,
      floatingButtonFill: "hsla(40 38% 90% / 0.12)",
      floatingButtonHover: "hsla(40 38% 90% / 0.18)",
      floatingButtonStroke: "hsla(40 54% 88% / 0.24)",
      floatingButtonColor: "hsl(40 38% 91%)",
    };
  }

  if (backgroundMode === "white") {
    return {
      hueBase,
      backgroundMode,
      top: "hsl(0 0% 98%)",
      bottom: "hsl(0 0% 94%)",
      glow: "hsla(0 0% 100% / 0)",
      glowAlt: "hsla(0 0% 100% / 0)",
      traceHue: hueBase + 24 - rainCool * 0.25,
      noiseOpacity: 0.04,
      fadeColor: "255, 255, 255",
      particleBrightnessShift: -24,
      rainLightness: 28,
      emitterLightness: 30,
      emitterRingLightness: 18,
      floatingButtonFill: "hsla(220 8% 42% / 0.14)",
      floatingButtonHover: "hsla(220 8% 42% / 0.22)",
      floatingButtonStroke: "hsla(220 10% 34% / 0.26)",
      floatingButtonColor: "hsl(220 14% 30%)",
    };
  }

  return {
    hueBase,
    backgroundMode,
    top: atmosphericPalette.top,
    bottom: atmosphericPalette.bottom,
    glow: atmosphericPalette.glow,
    glowAlt: atmosphericPalette.glowAlt,
    traceHue: hueBase + 44 - rainCool * 0.35,
    noiseOpacity: atmosphericPalette.noiseOpacity,
    fadeColor: atmosphericPalette.fadeColor,
    particleBrightnessShift: atmosphericPalette.particleBrightnessShift,
    rainLightness: atmosphericPalette.rainLightness,
    emitterLightness: atmosphericPalette.emitterLightness,
    emitterRingLightness: atmosphericPalette.emitterRingLightness,
    floatingButtonFill: atmosphericPalette.floatingButtonFill,
    floatingButtonHover: atmosphericPalette.floatingButtonHover,
    floatingButtonStroke: atmosphericPalette.floatingButtonStroke,
    floatingButtonColor: atmosphericPalette.floatingButtonColor,
  };
}

function updateCssPalette(palette) {
  const root = document.documentElement;
  root.style.setProperty("--sky-top", palette.top);
  root.style.setProperty("--sky-bottom", palette.bottom);
  root.style.setProperty("--glow", palette.glow);
  root.style.setProperty("--glow-alt", palette.glowAlt);
  root.style.setProperty("--noise-opacity", String(palette.noiseOpacity));
  root.style.setProperty("--floating-button-fill", palette.floatingButtonFill);
  root.style.setProperty("--floating-button-hover", palette.floatingButtonHover);
  root.style.setProperty("--floating-button-stroke", palette.floatingButtonStroke);
  root.style.setProperty("--floating-button-color", palette.floatingButtonColor);
}

export class WeatherScene {
  constructor(canvas, audio, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.audio = audio;
    this.callbacks = callbacks;
    this.atmosphere = createFallbackAtmosphere();
    this.backgroundMode = "atmospheric";
    this.palette = buildPalette(this.atmosphere, this.backgroundMode);
    this.brushMode = "points";
    this.particleControls = {
      life: 62,
      density: 70,
    };
    this.emitterDefaults = {
      rateMs: 1400,
      burst: 7,
    };
    this.emitters = [];
    this.nextEmitterId = 1;
    this.selectedEmitterId = null;
    this.dragEmitterId = null;
    this.interactionMode = "draw";
    this.particles = [];
    this.raindrops = [];
    this.pointerActive = false;
    this.lastPointer = null;
    this.animationFrame = null;
    this.running = false;
    this.lastTick = 0;
    this.rainAccumulator = 0;
    this.flashLevel = 0;
    this.maxParticles = 900;
    this.edgeSoundBudget = 3;
    this.burstSoundBudget = 4;
    this.resize();
    updateCssPalette(this.palette);
    this.bindEvents();
    this.notifyEmitterStateChange();
  }

  bindEvents() {
    const down = (event) => {
      const point = this.getPoint(event);
      const emitterHit = this.findEmitterAt(point.x, point.y);

      if (emitterHit) {
        this.selectedEmitterId = emitterHit.id;
        this.dragEmitterId = emitterHit.id;
        this.notifyEmitterStateChange();
        return;
      }

      if (this.interactionMode === "emitter") {
        const emitter = this.addEmitter(point.x, point.y);
        this.dragEmitterId = emitter.id;
        return;
      }

      this.pointerActive = true;
      this.lastPointer = point;
      this.spawnBurst(point.x, point.y, event.pressure || 0.5);
    };

    const move = (event) => {
      const point = this.getPoint(event);

      if (this.dragEmitterId !== null) {
        const emitter = this.emitters.find((item) => item.id === this.dragEmitterId);
        if (emitter) {
          emitter.x = point.x;
          emitter.y = point.y;
        }
        return;
      }

      if (!this.pointerActive) {
        return;
      }

      const distance = this.lastPointer
        ? Math.hypot(point.x - this.lastPointer.x, point.y - this.lastPointer.y)
        : 0;
      const steps = Math.max(1, Math.floor(distance / 16));

      for (let index = 0; index < steps; index += 1) {
        const ratio = index / steps;
        const x = this.lastPointer
          ? this.lastPointer.x + (point.x - this.lastPointer.x) * ratio
          : point.x;
        const y = this.lastPointer
          ? this.lastPointer.y + (point.y - this.lastPointer.y) * ratio
          : point.y;
        this.spawnTrail(x, y, event.pressure || 0.5);
      }

      this.lastPointer = point;
    };

    const up = () => {
      if (this.dragEmitterId !== null) {
        this.dragEmitterId = null;
        this.notifyEmitterStateChange();
      }

      this.pointerActive = false;
      this.lastPointer = null;
    };

    this.canvas.addEventListener("pointerdown", down);
    this.canvas.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("resize", () => this.resize());
  }

  getPoint(event) {
    const bounds = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  }

  getBrushMode() {
    return this.brushMode;
  }

  getBackgroundMode() {
    return this.backgroundMode;
  }

  setBackgroundMode(mode) {
    this.backgroundMode = BACKGROUND_MODES[mode] ? mode : "atmospheric";
    this.palette = buildPalette(this.atmosphere, this.backgroundMode);
    updateCssPalette(this.palette);
  }

  setBrushMode(mode) {
    if (BRUSH_PROFILES[mode]) {
      this.brushMode = mode;
    }
  }

  getParticleControlState() {
    return { ...this.particleControls };
  }

  setParticleControls(partialControls) {
    this.particleControls = {
      ...this.particleControls,
      ...partialControls,
    };
  }

  getInteractionMode() {
    return this.interactionMode;
  }

  setInteractionMode(mode) {
    this.interactionMode = mode === "emitter" ? "emitter" : "draw";
    this.notifyEmitterStateChange();
  }

  getEmitterState() {
    const selectedEmitter = this.emitters.find((item) => item.id === this.selectedEmitterId) ?? null;

    return {
      interactionMode: this.interactionMode,
      count: this.emitters.length,
      defaults: { ...this.emitterDefaults },
      selectedEmitter: selectedEmitter
        ? {
            id: selectedEmitter.id,
            label: `E${selectedEmitter.id}`,
            rateMs: selectedEmitter.rateMs,
            burst: selectedEmitter.burst,
          }
        : null,
      emitters: this.emitters.map((emitter) => ({
        id: emitter.id,
        label: `E${emitter.id}`,
        rateMs: emitter.rateMs,
        burst: emitter.burst,
      })),
    };
  }

  notifyEmitterStateChange() {
    if (typeof this.callbacks.onEmitterStateChange === "function") {
      this.callbacks.onEmitterStateChange(this.getEmitterState());
    }
  }

  setEmitterDefaults(partialDefaults) {
    this.emitterDefaults = {
      ...this.emitterDefaults,
      ...partialDefaults,
    };

    if (!this.selectedEmitterId) {
      this.notifyEmitterStateChange();
    }
  }

  updateSelectedEmitter(partial) {
    const emitter = this.emitters.find((item) => item.id === this.selectedEmitterId);

    if (!emitter) {
      this.setEmitterDefaults(partial);
      return;
    }

    Object.assign(emitter, partial);
    this.notifyEmitterStateChange();
  }

  selectEmitter(id) {
    if (!this.emitters.some((item) => item.id === id)) {
      return;
    }

    this.selectedEmitterId = id;
    this.notifyEmitterStateChange();
  }

  addEmitter(x, y) {
    const emitter = {
      id: this.nextEmitterId,
      x,
      y,
      rateMs: this.emitterDefaults.rateMs,
      burst: this.emitterDefaults.burst,
      accumulator: 0,
      pulse: 0,
    };

    this.nextEmitterId += 1;
    this.emitters.push(emitter);
    this.selectedEmitterId = emitter.id;
    this.notifyEmitterStateChange();
    return emitter;
  }

  removeSelectedEmitter() {
    if (!this.selectedEmitterId) {
      return;
    }

    this.emitters = this.emitters.filter((item) => item.id !== this.selectedEmitterId);
    this.selectedEmitterId = this.emitters[0]?.id ?? null;
    this.notifyEmitterStateChange();
  }

  findEmitterAt(x, y) {
    const radius = 18;

    return this.emitters.find((emitter) => {
      return Math.hypot(emitter.x - x, emitter.y - y) <= radius;
    });
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.viewport = { width, height };
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setAtmosphere(atmosphere) {
    this.atmosphere = atmosphere;
    this.palette = buildPalette(atmosphere, this.backgroundMode);
    updateCssPalette(this.palette);
  }

  start() {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastTick = performance.now();
    this.animationFrame = requestAnimationFrame((time) => this.tick(time));
  }

  tick(time) {
    const delta = Math.min(32, time - this.lastTick || 16.67);
    this.lastTick = time;
    this.update(delta / 16.67);
    this.draw();
    this.animationFrame = requestAnimationFrame((nextTime) => this.tick(nextTime));
  }

  spawnBurst(x, y, pressure) {
    this.spawnBurstInternal(x, y, pressure, null, "pointer");
  }

  spawnBurstInternal(x, y, pressure, countOverride = null, source = "pointer") {
    const brush = BRUSH_PROFILES[this.brushMode];
    const densityFactor = mapRange(this.particleControls.density, 0, 100, 0.45, 2.7);
    const count =
      countOverride !== null
        ? Math.max(1, Math.round(countOverride * densityFactor))
        : Math.max(
            1,
            Math.round(
              (7 + pressure * 8 + this.atmosphere.normalized.rain * 6) *
                brush.burstFactor *
                densityFactor
            )
          );

    for (let index = 0; index < count; index += 1) {
      this.spawnParticle(x, y, pressure, true);
    }

    const allowBurstSound =
      source === "pointer" ||
      source === "system" ||
      (source === "emitter" && this.burstSoundBudget >= 1);

    if (allowBurstSound) {
      if (source === "emitter") {
        this.burstSoundBudget -= 1;
      }

      this.audio?.triggerParticle(
        {
          x,
          y,
          energy: clamp(0.45 + pressure * 0.5, 0, 1),
          soundBias: brush.soundBias,
          eventSource: source,
        },
        this.viewport,
        "burst"
      );
    }
  }

  spawnTrail(x, y, pressure) {
    const brush = BRUSH_PROFILES[this.brushMode];
    const densityFactor = mapRange(this.particleControls.density, 0, 100, 0.45, 2.7);
    const count = Math.max(1, Math.round((2 + pressure * 3) * brush.trailFactor * densityFactor));

    for (let index = 0; index < count; index += 1) {
      this.spawnParticle(x, y, pressure, false);
    }
  }

  spawnParticle(x, y, pressure, burst) {
    const brush = BRUSH_PROFILES[this.brushMode];
    const { normalized, windVector, phase } = this.atmosphere;
    const lifeFactor = mapRange(this.particleControls.life, 0, 100, 0.55, 3.2);
    const directionJitter = randomBetween(-1.3, 1.3);
    const verticalLift = phase === "night" ? -0.35 : -0.18;
    const windPush = normalized.wind * 1.3;
    const speedRange = burst ? brush.burstSpeed : brush.trailSpeed;
    const speed = randomBetween(speedRange[0], speedRange[1]);
    const hueShift = randomBetween(-18, 22);
    const decay = clamp(
      randomBetween(brush.decay[0], brush.decay[1]) / lifeFactor -
        normalized.humidity * 0.0016,
      0.0015,
      0.03
    );
    const size = randomBetween(brush.size[0], brush.size[1]) + normalized.rain * 1.5;

    const particle = {
      x,
      y,
      prevX: x,
      prevY: y,
      vx: directionJitter + windVector.x * windPush + randomBetween(-0.2, 0.2),
      vy:
        randomBetween(verticalLift - speed, 0.8) +
        windVector.y * windPush +
        brush.gravityBias * 4,
      size,
      energy: clamp(speed / 3.1 + pressure * 0.4, 0.16, 1),
      hue: this.palette.traceHue + hueShift,
      brightness: clamp(
        58 +
          normalized.temperature * 26 -
          normalized.cloud * 10 +
          this.palette.particleBrightnessShift,
        18,
        88
      ),
      alpha: randomBetween(0.36, 0.9),
      life: 1,
      decay,
      elasticity: clamp(
        randomBetween(0.52, 0.86) + mapRange(this.particleControls.life, 0, 100, -0.08, 0.14),
        0.35,
        0.97
      ),
      windBias: randomBetween(0.5, 1.4),
      renderMode: brush.renderMode,
      motionScale: brush.motionScale,
      gravityBias: brush.gravityBias,
      dragBias: brush.dragBias,
      stretch: brush.stretch,
      soundBias: brush.soundBias,
    };

    this.particles.push(particle);

    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
  }

  spawnRainDrop() {
    const { width } = this.viewport;
    const { normalized, windVector } = this.atmosphere;

    this.raindrops.push({
      x: Math.random() * width,
      y: -randomBetween(10, 80),
      length: randomBetween(8, 22) + normalized.rain * 20,
      speed: randomBetween(4.5, 8) + normalized.rain * 8,
      drift: windVector.x * (2.5 + normalized.wind * 7),
      alpha: randomBetween(0.2, 0.6),
    });
  }

  update(frameScale) {
    const { normalized, windVector, storm } = this.atmosphere;
    const { width, height } = this.viewport;
    const densityFactor = mapRange(this.particleControls.density, 0, 100, 0.5, 2.7);

    this.maxParticles = Math.round(220 + densityFactor * 320);

    this.rainAccumulator += (normalized.rain * 12 + (storm ? 1.5 : 0)) * frameScale;
    while (this.rainAccumulator >= 1) {
      this.spawnRainDrop();
      this.rainAccumulator -= 1;
    }

    if (storm && Math.random() < 0.01 * frameScale) {
      this.flashLevel = 0.85;
    }

    this.flashLevel *= 0.9;
    this.edgeSoundBudget = clamp(this.edgeSoundBudget + frameScale * 0.12, 0, 3);
    this.burstSoundBudget = clamp(this.burstSoundBudget + frameScale * 0.08, 0, 3);

    for (const emitter of this.emitters) {
      emitter.accumulator += frameScale * 16.67;
      emitter.pulse *= 0.88;

      while (emitter.accumulator >= emitter.rateMs) {
        emitter.accumulator -= emitter.rateMs;
        emitter.pulse = 1;
        this.spawnBurstInternal(emitter.x, emitter.y, 0.42, emitter.burst, "emitter");
      }
    }

    for (const drop of this.raindrops) {
      drop.x += drop.drift * frameScale;
      drop.y += drop.speed * frameScale;
    }

    this.raindrops = this.raindrops.filter(
      (drop) => drop.y < height + 40 && drop.x > -40 && drop.x < width + 40
    );

    const dragBase = 0.992 - normalized.humidity * 0.022;
    const gravity = 0.014 + normalized.rain * 0.12;
    const gust = normalized.gust * 0.055;
    const bounceCandidates = [];

    for (const particle of this.particles) {
      particle.prevX = particle.x;
      particle.prevY = particle.y;

      particle.vx +=
        windVector.x * 0.06 * particle.windBias * (0.25 + normalized.wind) * frameScale;
      particle.vy +=
        windVector.y * 0.04 * particle.windBias * (0.12 + normalized.wind) * frameScale;
      particle.vy += (gravity + particle.gravityBias) * frameScale;
      particle.vx += randomBetween(-gust, gust) * frameScale;
      particle.vy += randomBetween(-gust * 0.5, gust * 0.8) * frameScale;

      const drag = clamp(dragBase + particle.dragBias, 0.88, 0.999);
      particle.vx *= drag;
      particle.vy *= drag;
      particle.x += particle.vx * particle.motionScale * frameScale;
      particle.y += particle.vy * particle.motionScale * frameScale;
      particle.life -= particle.decay * frameScale;
      particle.edgeAudioCooldown = Math.max(0, (particle.edgeAudioCooldown ?? 0) - frameScale);

      let bounced = false;

      if (particle.x <= 0 || particle.x >= width) {
        particle.x = clamp(particle.x, 0, width);
        particle.vx *= -particle.elasticity;
        bounced = true;
      }

      if (particle.y <= 0 || particle.y >= height) {
        particle.y = clamp(particle.y, 0, height);
        particle.vy *= -particle.elasticity;
        bounced = true;
      }

      if (bounced && particle.energy > 0.18) {
        if ((particle.edgeAudioCooldown ?? 0) <= 0) {
          bounceCandidates.push(particle);
          particle.edgeAudioCooldown = 6;
        }
        particle.energy *= 0.82;
      }
    }

    bounceCandidates.sort((left, right) => (right.energy ?? 0) - (left.energy ?? 0));

    for (const particle of bounceCandidates) {
      if (this.edgeSoundBudget < 1) {
        break;
      }

      this.edgeSoundBudget -= 1;
      this.audio?.triggerParticle(particle, this.viewport, "edge");
    }

    this.particles = this.particles.filter((particle) => particle.life > 0.02);
  }

  draw() {
    const { width, height } = this.viewport;
    const { normalized } = this.atmosphere;
    const fadeAlpha = clamp(
      0.08 - normalized.humidity * 0.04 + normalized.cloud * 0.03,
      0.02,
      0.12
    );

    this.ctx.fillStyle = `rgba(${this.palette.fadeColor}, ${fadeAlpha})`;
    this.ctx.fillRect(0, 0, width, height);

    if (this.backgroundMode === "atmospheric") {
      const glowGradient = this.ctx.createRadialGradient(
        width * 0.22,
        height * 0.18,
        0,
        width * 0.22,
        height * 0.18,
        Math.max(width, height) * 0.62
      );
      glowGradient.addColorStop(0, this.palette.glow);
      glowGradient.addColorStop(1, "transparent");
      this.ctx.fillStyle = glowGradient;
      this.ctx.fillRect(0, 0, width, height);

      const secondaryGlow = this.ctx.createRadialGradient(
        width * 0.78,
        height * 0.28,
        0,
        width * 0.78,
        height * 0.28,
        Math.max(width, height) * 0.4
      );
      secondaryGlow.addColorStop(0, this.palette.glowAlt);
      secondaryGlow.addColorStop(1, "transparent");
      this.ctx.fillStyle = secondaryGlow;
      this.ctx.fillRect(0, 0, width, height);
    }

    this.ctx.lineCap = "round";

    for (const drop of this.raindrops) {
      this.ctx.strokeStyle = `hsla(${this.palette.hueBase + 12} 100% ${this.palette.rainLightness}% / ${drop.alpha})`;
      this.ctx.lineWidth = 1.2;
      this.ctx.beginPath();
      this.ctx.moveTo(drop.x, drop.y);
      this.ctx.lineTo(drop.x - drop.drift * 0.8, drop.y - drop.length);
      this.ctx.stroke();
    }

    for (const particle of this.particles) {
      const lifeAlpha = particle.alpha * particle.life;
      const strokeColor = `hsla(${particle.hue} 100% ${particle.brightness}% / ${lifeAlpha * 0.34})`;
      const fillColor = `hsla(${particle.hue} 100% ${particle.brightness}% / ${lifeAlpha})`;

      if (particle.renderMode === "line") {
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = particle.size * 0.9;
        this.ctx.beginPath();
        this.ctx.moveTo(
          particle.prevX - particle.vx * particle.stretch,
          particle.prevY - particle.vy * particle.stretch
        );
        this.ctx.lineTo(particle.x, particle.y);
        this.ctx.stroke();
        continue;
      }

      if (particle.renderMode === "cloud") {
        this.ctx.fillStyle = `hsla(${particle.hue} 100% ${particle.brightness}% / ${lifeAlpha * 0.26})`;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        continue;
      }

      if (particle.renderMode === "drop") {
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = particle.size * 0.58;
        this.ctx.beginPath();
        this.ctx.moveTo(particle.x, particle.y - particle.size * particle.stretch);
        this.ctx.lineTo(particle.x, particle.y + particle.size * 0.45);
        this.ctx.stroke();
        this.ctx.fillStyle = fillColor;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size * 0.42, 0, Math.PI * 2);
        this.ctx.fill();
        continue;
      }

      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = particle.size * 0.75;
      this.ctx.beginPath();
      this.ctx.moveTo(particle.prevX, particle.prevY);
      this.ctx.lineTo(particle.x, particle.y);
      this.ctx.stroke();

      this.ctx.fillStyle = fillColor;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    for (const emitter of this.emitters) {
      const isSelected = emitter.id === this.selectedEmitterId;
      const pulseScale = 1 + emitter.pulse * 0.55;
      const outerRadius = 9 + pulseScale * 4;

      this.ctx.strokeStyle = `hsla(${this.palette.hueBase + 28} 100% ${this.palette.emitterRingLightness}% / ${
        isSelected ? 0.95 : 0.55
      })`;
      this.ctx.lineWidth = isSelected ? 2.4 : 1.4;
      this.ctx.beginPath();
      this.ctx.arc(emitter.x, emitter.y, outerRadius, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.fillStyle = `hsla(${this.palette.hueBase + 34} 100% ${this.palette.emitterLightness}% / ${
        isSelected ? 0.95 : 0.72
      })`;
      this.ctx.beginPath();
      this.ctx.arc(emitter.x, emitter.y, isSelected ? 5.8 : 4.4, 0, Math.PI * 2);
      this.ctx.fill();
    }

    if (this.flashLevel > 0.02) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashLevel * 0.18})`;
      this.ctx.fillRect(0, 0, width, height);
    }
  }
}
