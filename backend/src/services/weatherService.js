const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const OPEN_METEO_AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

const weatherCodeMap = {
  0: "clear",
  1: "partlyCloudy",
  2: "partlyCloudy",
  3: "cloudy",
  45: "fog",
  48: "fog",
  51: "drizzle",
  53: "drizzle",
  55: "drizzle",
  56: "drizzle",
  57: "drizzle",
  61: "rainy",
  63: "rainy",
  65: "rainy",
  66: "rainy",
  67: "rainy",
  71: "snow",
  73: "snow",
  75: "snow",
  77: "snow",
  80: "rainy",
  81: "rainy",
  82: "rainy",
  85: "snow",
  86: "snow",
  95: "stormy",
  96: "stormy",
  99: "stormy",
};

const resolveCondition = (weatherCode) => weatherCodeMap[weatherCode] || "unknown";

export const geocodeInIndia = async ({ state, district }) => {
  const searchName = [district, state, "India"].filter(Boolean).join(", ");
  if (!searchName) {
    throw new Error("Location is required for weather lookup");
  }

  const url = new URL(OPEN_METEO_GEOCODE_URL);
  url.searchParams.set("name", searchName);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  url.searchParams.set("countryCode", "IN");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Geocoding request failed");
  }

  const payload = await response.json();
  const best = Array.isArray(payload?.results) ? payload.results[0] : null;
  if (!best?.latitude || !best?.longitude) {
    throw new Error("Could not geocode the given location");
  }

  return {
    latitude: best.latitude,
    longitude: best.longitude,
    resolvedName: [best.name, best.admin1, best.country].filter(Boolean).join(", "),
  };
};

export const fetchWeatherSnapshot = async ({ latitude, longitude, timezone = "Asia/Kolkata" }) => {
  const url = new URL(OPEN_METEO_FORECAST_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation"
  );
  url.searchParams.set(
    "hourly",
    "temperature_2m,relative_humidity_2m,precipitation_probability"
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max"
  );
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("timezone", timezone);

  const airQualityUrl = new URL(OPEN_METEO_AIR_QUALITY_URL);
  airQualityUrl.searchParams.set("latitude", String(latitude));
  airQualityUrl.searchParams.set("longitude", String(longitude));
  airQualityUrl.searchParams.set("current", "us_aqi");
  airQualityUrl.searchParams.set("timezone", timezone);

  const [weatherResponse, airQualityResponse] = await Promise.all([
    fetch(url.toString()),
    fetch(airQualityUrl.toString()),
  ]);

  if (!weatherResponse.ok) {
    throw new Error("Weather request failed");
  }

  const payload = await weatherResponse.json();

  let aqi = null;
  if (airQualityResponse.ok) {
    const airQualityPayload = await airQualityResponse.json();
    const parsedAqi = Number(airQualityPayload?.current?.us_aqi);
    aqi = Number.isFinite(parsedAqi) ? parsedAqi : null;
  }

  const current = payload?.current || {};
  const hourly = payload?.hourly || {};
  const daily = payload?.daily || {};

  const hourlyRows = (hourly.time || []).slice(0, 24).map((time, idx) => ({
    time,
    temperature: hourly.temperature_2m?.[idx] ?? null,
    humidity: hourly.relative_humidity_2m?.[idx] ?? null,
    precipitationProbability: hourly.precipitation_probability?.[idx] ?? null,
  }));

  const dailyRows = (daily.time || []).map((date, idx) => {
    const weatherCode = daily.weather_code?.[idx] ?? -1;
    return {
      date,
      weatherCode,
      condition: resolveCondition(weatherCode),
      min: daily.temperature_2m_min?.[idx] ?? null,
      max: daily.temperature_2m_max?.[idx] ?? null,
      precipitationProbabilityMax: daily.precipitation_probability_max?.[idx] ?? null,
      sunrise: daily.sunrise?.[idx] ?? null,
      sunset: daily.sunset?.[idx] ?? null,
    };
  });

  return {
    timezone: payload?.timezone || timezone,
    latitude: payload?.latitude ?? latitude,
    longitude: payload?.longitude ?? longitude,
    current: {
      temperature: current.temperature_2m ?? null,
      humidity: current.relative_humidity_2m ?? null,
      windSpeed: current.wind_speed_10m ?? null,
      aqi,
      precipitation: current.precipitation ?? null,
      weatherCode: current.weather_code ?? -1,
      condition: resolveCondition(current.weather_code ?? -1),
      observedAt: current.time ?? null,
    },
    hourly: hourlyRows,
    daily: dailyRows,
    sun: {
      sunrise: dailyRows[0]?.sunrise || null,
      sunset: dailyRows[0]?.sunset || null,
    },
    updatedAt: new Date().toISOString(),
  };
};

export const buildWeatherAlerts = (weather, locationLabel) => {
  const alerts = [];
  const now = new Date().toISOString();

  const today = weather?.daily?.[0];
  const current = weather?.current;

  if (Number.isFinite(today?.max) && today.max >= 40) {
    alerts.push({
      id: 101,
      type: "weather",
      priority: "critical",
      title: "Heat Wave Warning",
      message: `Temperature may reach ${Math.round(today.max)}°C today. Protect crops and irrigate during cooler hours.`,
      location: locationLabel,
      timestamp: now,
      isRead: false,
      actions: ["Irrigate early morning", "Avoid afternoon spray", "Use mulch where possible"],
      icon: "rain",
    });
  }

  if (Number.isFinite(current?.windSpeed) && current.windSpeed >= 30) {
    alerts.push({
      id: 102,
      type: "weather",
      priority: "high",
      title: "Strong Wind Alert",
      message: `High wind speed (${Math.round(current.windSpeed)} km/h) detected. Avoid spraying and secure light structures.`,
      location: locationLabel,
      timestamp: now,
      isRead: false,
      actions: ["Avoid pesticide spray", "Support weak plants", "Secure shade nets"],
      icon: "rain",
    });
  }

  if (Number.isFinite(today?.precipitationProbabilityMax) && today.precipitationProbabilityMax >= 70) {
    alerts.push({
      id: 103,
      type: "weather",
      priority: "high",
      title: "Heavy Rain Probability",
      message: `Rain probability is ${Math.round(today.precipitationProbabilityMax)}% today. Plan field activities accordingly.`,
      location: locationLabel,
      timestamp: now,
      isRead: false,
      actions: ["Check drainage", "Delay fertilizer application", "Protect harvested produce"],
      icon: "rain",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 104,
      type: "soil",
      priority: "low",
      title: "Weather Stable",
      message: "No major weather risks detected for today. Continue routine field monitoring.",
      location: locationLabel,
      timestamp: now,
      isRead: false,
      actions: ["Monitor soil moisture", "Follow regular schedule"],
      icon: "soil",
    });
  }

  return alerts;
};
