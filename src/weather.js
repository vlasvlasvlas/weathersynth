const OPEN_METEO_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

const DEFAULT_COORDS = {
  latitude: -34.6037,
  longitude: -58.3816,
  label: "Buenos Aires",
  source: "fallback",
};

const CURRENT_FIELDS = [
  "temperature_2m",
  "relative_humidity_2m",
  "precipitation",
  "rain",
  "cloud_cover",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "is_day",
  "weather_code",
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeTemperature(value) {
  return clamp((value + 5) / 40, 0, 1);
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function describeCode(code) {
  if (code === 0) return "despejado";
  if (code >= 1 && code <= 3) return "nubes variables";
  if (code === 45 || code === 48) return "niebla";
  if (code >= 51 && code <= 57) return "llovizna";
  if (code >= 61 && code <= 67) return "lluvia";
  if (code >= 71 && code <= 77) return "nieve";
  if (code >= 80 && code <= 82) return "chaparrones";
  if (code >= 85 && code <= 86) return "nieve intermitente";
  if (code >= 95) return "tormenta";
  return "atmósfera inestable";
}

function getPhase(now, sunrise, sunset, isDay) {
  if (!sunrise || !sunset) {
    return isDay ? "day" : "night";
  }

  const dawnWindow = 45 * 60 * 1000;
  const duskWindow = 60 * 60 * 1000;

  if (now >= sunrise && now <= new Date(sunrise.getTime() + dawnWindow)) {
    return "dawn";
  }

  if (now >= new Date(sunset.getTime() - duskWindow) && now <= sunset) {
    return "dusk";
  }

  return isDay ? "day" : "night";
}

function formatSourceLabel(source) {
  if (source === "geolocation") {
    return "Open-Meteo + tu ubicación";
  }

  if (source === "fallback") {
    return "Open-Meteo + modo demo";
  }

  return "Atmósfera offline";
}

function buildSummary(current, phase) {
  const sky = describeCode(current.weather_code ?? -1);

  if (phase === "dawn") return `${sky}, amaneciendo`;
  if (phase === "dusk") return `${sky}, en atardecer`;
  if (phase === "night") return `${sky}, de noche`;
  return `${sky}, con luz de día`;
}

function normalizeWeather(payload, coords) {
  const current = payload.current ?? {};
  const daily = payload.daily ?? {};
  const sunriseValue = daily.sunrise?.[0] ? new Date(daily.sunrise[0]) : null;
  const sunsetValue = daily.sunset?.[0] ? new Date(daily.sunset[0]) : null;
  const now = payload.current?.time ? new Date(payload.current.time) : new Date();
  const isDay = Boolean(current.is_day);
  const phase = getPhase(now, sunriseValue, sunsetValue, isDay);
  const windDirection = current.wind_direction_10m ?? 0;
  const windDirectionRadians = toRadians(windDirection);
  const windSpeed = current.wind_speed_10m ?? 0;
  const windStrength = clamp(windSpeed / 45, 0, 1);
  const precipitation = current.precipitation ?? current.rain ?? 0;
  const rain = current.rain ?? precipitation ?? 0;
  const cloudCover = current.cloud_cover ?? 0;
  const humidity = current.relative_humidity_2m ?? 0;
  const temperature = current.temperature_2m ?? 18;
  const gusts = current.wind_gusts_10m ?? windSpeed;
  const storm =
    current.weather_code === 95 ||
    current.weather_code === 96 ||
    current.weather_code === 99;

  return {
    provider: "Open-Meteo",
    latitude: payload.latitude ?? coords.latitude,
    longitude: payload.longitude ?? coords.longitude,
    source: coords.source,
    sourceLabel: formatSourceLabel(coords.source),
    locationLabel: coords.label,
    currentTime: now,
    sunrise: sunriseValue,
    sunset: sunsetValue,
    phase,
    summary: buildSummary(current, phase),
    isDay,
    weatherCode: current.weather_code ?? -1,
    storm,
    temperatureC: temperature,
    humidity,
    cloudCover,
    precipitationMm: precipitation,
    rainMm: rain,
    windSpeedKmh: windSpeed,
    windDirectionDeg: windDirection,
    windGustsKmh: gusts,
    windVector: {
      x: Math.sin(windDirectionRadians),
      y: -Math.cos(windDirectionRadians) * 0.35,
    },
    normalized: {
      wind: windStrength,
      gust: clamp(gusts / 70, 0, 1),
      rain: clamp(precipitation / 6, 0, 1),
      humidity: clamp(humidity / 100, 0, 1),
      temperature: normalizeTemperature(temperature),
      cloud: clamp(cloudCover / 100, 0, 1),
      darkness:
        phase === "night" ? 1 : phase === "dusk" ? 0.66 : phase === "dawn" ? 0.42 : 0.12,
    },
  };
}

function buildOfflineAtmosphere(coords) {
  const now = new Date();
  const hour = now.getHours();
  const isDay = hour >= 7 && hour < 20;
  const phase = hour < 6 ? "night" : hour < 8 ? "dawn" : hour < 18 ? "day" : hour < 20 ? "dusk" : "night";
  const windDirection = 140;

  return {
    provider: "Offline",
    latitude: coords.latitude,
    longitude: coords.longitude,
    source: "offline",
    sourceLabel: "Atmósfera offline",
    locationLabel: coords.label,
    currentTime: now,
    sunrise: null,
    sunset: null,
    phase,
    summary: "atmósfera simulada",
    isDay,
    weatherCode: -1,
    storm: false,
    temperatureC: 18,
    humidity: 62,
    cloudCover: 38,
    precipitationMm: 0.2,
    rainMm: 0,
    windSpeedKmh: 12,
    windDirectionDeg: windDirection,
    windGustsKmh: 18,
    windVector: {
      x: Math.sin(toRadians(windDirection)),
      y: -Math.cos(toRadians(windDirection)) * 0.35,
    },
    normalized: {
      wind: 0.28,
      gust: 0.2,
      rain: 0.06,
      humidity: 0.62,
      temperature: normalizeTemperature(18),
      cloud: 0.38,
      darkness:
        phase === "night" ? 1 : phase === "dusk" ? 0.66 : phase === "dawn" ? 0.42 : 0.12,
    },
  };
}

function buildForecastUrl(coords) {
  const params = new URLSearchParams({
    latitude: String(coords.latitude),
    longitude: String(coords.longitude),
    current: CURRENT_FIELDS.join(","),
    daily: "sunrise,sunset",
    forecast_days: "1",
    timezone: "auto",
  });

  return `${OPEN_METEO_ENDPOINT}?${params.toString()}`;
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocalización no soportada"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 15 * 60 * 1000,
    });
  });
}

async function resolveCoordinates() {
  try {
    const position = await getCurrentPosition();

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      label: "Tu cielo local",
      source: "geolocation",
    };
  } catch (_error) {
    return { ...DEFAULT_COORDS };
  }
}

async function fetchForecast(coords) {
  const response = await fetch(buildForecastUrl(coords), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo respondió ${response.status}`);
  }

  const payload = await response.json();
  return normalizeWeather(payload, coords);
}

export async function loadAtmosphere() {
  const coords = await resolveCoordinates();

  try {
    return await fetchForecast(coords);
  } catch (_error) {
    if (coords.source !== "fallback") {
      try {
        return await fetchForecast(DEFAULT_COORDS);
      } catch (_fallbackError) {
        return buildOfflineAtmosphere(DEFAULT_COORDS);
      }
    }

    return buildOfflineAtmosphere(coords);
  }
}
