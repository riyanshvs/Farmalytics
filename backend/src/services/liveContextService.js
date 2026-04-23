import { fetchWeatherSnapshot, geocodeInIndia, buildWeatherAlerts } from "./weatherService.js";
import { fetchMarketPrices } from "./marketPriceService.js";

const summarizeFarm = (farm) => {
  if (!farm) return null;

  return {
    location: farm.location || null,
    farmSize: typeof farm.farmSize === "number" ? farm.farmSize : null,
    selectedCrops: Array.isArray(farm.selectedCrops) ? farm.selectedCrops : [],
    distributions: Array.isArray(farm.distributions) ? farm.distributions : [],
  };
};

export const buildLiveContext = async ({ farm, primaryIntent, entities }) => {
  const farmSummary = summarizeFarm(farm);
  const state = farm?.location?.state;
  const district = farm?.location?.district;

  const wantsWeather = !primaryIntent || primaryIntent === "weather" || primaryIntent === "alerts";
  const wantsMarket = !primaryIntent || primaryIntent === "market" || primaryIntent === "crop_advice";
  const wantsFarm = Boolean(farmSummary);

  const result = {
    farm: farmSummary,
    weather: null,
    alerts: [],
    market: null,
    sourcesUsed: wantsFarm ? ["farm"] : [],
  };

  if (!state || !district) {
    return result;
  }

  if (wantsWeather) {
    try {
      const geo = await geocodeInIndia({ state, district });
      const weather = await fetchWeatherSnapshot({
        latitude: geo.latitude,
        longitude: geo.longitude,
        timezone: "Asia/Kolkata",
      });

      result.weather = {
        location: geo.resolvedName,
        current: weather.current,
        daily: weather.daily?.slice(0, 3) || [],
        updatedAt: weather.updatedAt,
      };
      result.alerts = buildWeatherAlerts(weather, geo.resolvedName).slice(0, 3);
      result.sourcesUsed.push("weather");
      if (result.alerts.length > 0) {
        result.sourcesUsed.push("alerts");
      }
    } catch {
      // Live weather is optional context; swallow and continue.
    }
  }

  if (wantsMarket) {
    try {
      const market = await fetchMarketPrices({
        state,
        district,
        selectedCrops: entities?.crops?.length ? entities.crops : farmSummary?.selectedCrops || [],
        limit: 12,
      });

      if (market?.items?.length) {
        result.market = {
          location: market.location,
          items: market.items.slice(0, 4),
          matchedCrops: market.matchedCrops || [],
          fetchedAt: market.fetchedAt,
        };
        result.sourcesUsed.push("market");
      }
    } catch {
      // Market data is optional context; swallow and continue.
    }
  }

  result.sourcesUsed = Array.from(new Set(result.sourcesUsed));
  return result;
};

export default {
  buildLiveContext,
};
