import express from "express";
import mongoose from "mongoose";
import Farm from "../models/Farm.js";
import { authMiddleware } from "../middleware/auth.js";
import { geocodeInIndia, fetchWeatherSnapshot } from "../services/weatherService.js";

const router = express.Router();

const canUseDatabase = () => mongoose.connection.readyState === 1;

const isValidCoordinatePair = (lat, lon) =>
  Number.isFinite(lat) &&
  Number.isFinite(lon) &&
  lat >= -90 &&
  lat <= 90 &&
  lon >= -180 &&
  lon <= 180;

const resolveCoordinates = async (req) => {
  const lat = req.query?.lat ? Number(req.query.lat) : null;
  const lon = req.query?.lon ? Number(req.query.lon) : null;

  if (isValidCoordinatePair(lat, lon)) {
    return {
      latitude: lat,
      longitude: lon,
      source: "query",
      locationLabel: "Custom Location",
    };
  }

  if ((lat !== null || lon !== null) && !isValidCoordinatePair(lat, lon)) {
    throw new Error("Invalid coordinates. Latitude must be between -90 and 90 and longitude between -180 and 180.");
  }

  let state = req.query?.state;
  let district = req.query?.district;

  if ((!state || !district) && canUseDatabase() && req.user?.userId) {
    const farm = await Farm.findOne({ userId: req.user.userId }).select("location");
    state = state || farm?.location?.state;
    district = district || farm?.location?.district;
  }

  const geo = await geocodeInIndia({ state, district });
  return {
    latitude: geo.latitude,
    longitude: geo.longitude,
    source: "geocoded",
    locationLabel: geo.resolvedName,
  };
};

router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const coords = await resolveCoordinates(req);
    const weather = await fetchWeatherSnapshot({
      latitude: coords.latitude,
      longitude: coords.longitude,
      timezone: "Asia/Kolkata",
    });

    return res.json({
      location: {
        label: coords.locationLabel,
        source: coords.source,
        latitude: weather.latitude,
        longitude: weather.longitude,
      },
      weather,
    });
  } catch (error) {
    console.error("Failed to fetch weather summary:", error);
    return res.status(400).json({
      message: "Unable to fetch weather summary",
    });
  }
});

export default router;
