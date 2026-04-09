import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { fetchWeatherSnapshot, geocodeInIndia, buildWeatherAlerts } from "../services/weatherService.js";
import mongoose from "mongoose";
import Farm from "../models/Farm.js";
import AlertState from "../models/AlertState.js";

const router = express.Router();

const canUseDatabase = () => mongoose.connection.readyState === 1;

const isValidCoordinatePair = (lat, lon) =>
  Number.isFinite(lat) &&
  Number.isFinite(lon) &&
  lat >= -90 &&
  lat <= 90 &&
  lon >= -180 &&
  lon <= 180;

const resolveLocationForAlerts = async (req) => {
  const lat = req.query?.lat ? Number(req.query.lat) : null;
  const lon = req.query?.lon ? Number(req.query.lon) : null;

  if (isValidCoordinatePair(lat, lon)) {
    return { latitude: lat, longitude: lon, locationLabel: "Custom Location" };
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
    locationLabel: geo.resolvedName,
  };
};

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude, locationLabel } = await resolveLocationForAlerts(req);
    const weather = await fetchWeatherSnapshot({
      latitude,
      longitude,
      timezone: "Asia/Kolkata",
    });

    const weatherAlerts = buildWeatherAlerts(weather, locationLabel);

    const advisoryAlerts = [
      {
        id: 201,
        type: "market",
        priority: "medium",
        title: "Market Watch",
        message: "Track mandi prices this week before finalizing crop sale timing.",
        location: locationLabel,
        timestamp: new Date().toISOString(),
        isRead: false,
        actions: ["Check mandi prices", "Compare nearby markets"],
        icon: "market",
      },
      {
        id: 202,
        type: "government",
        priority: "low",
        title: "Scheme Reminder",
        message: "Review current government subsidy and insurance windows in your state.",
        location: locationLabel,
        timestamp: new Date().toISOString(),
        isRead: false,
        actions: ["Check PM-KISAN status", "Verify crop insurance deadlines"],
        icon: "government",
      },
    ];

    const generatedAlerts = [...weatherAlerts, ...advisoryAlerts];

    let readIds = [];
    let dismissedIds = [];
    if (canUseDatabase() && req.user?.userId) {
      const state = await AlertState.findOne({ userId: req.user.userId }).select("readIds dismissedIds");
      readIds = state?.readIds || [];
      dismissedIds = state?.dismissedIds || [];
    }

    const dismissedSet = new Set(dismissedIds);
    const readSet = new Set(readIds);

    const alerts = generatedAlerts
      .filter((alert) => !dismissedSet.has(alert.id))
      .map((alert) => ({
        ...alert,
        isRead: alert.isRead || readSet.has(alert.id),
      }));

    return res.json({
      alerts,
      weatherSnapshot: {
        location: locationLabel,
        current: weather.current,
      },
      state: {
        readIds,
        dismissedIds,
      },
    });
  } catch (error) {
    console.error("Failed to generate alerts:", error);
    return res.status(400).json({
      message: "Unable to generate alerts",
    });
  }
});

router.post("/read", authMiddleware, async (req, res) => {
  try {
    const alertId = Number(req.body?.alertId);
    if (!Number.isFinite(alertId)) {
      return res.status(400).json({ message: "alertId is required" });
    }

    if (!canUseDatabase() || !req.user?.userId) {
      return res.json({ success: true, offline: true });
    }

    await AlertState.findOneAndUpdate(
      { userId: req.user.userId },
      { $addToSet: { readIds: alertId } },
      { upsert: true, new: true }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to mark alert as read:", error);
    return res.status(500).json({ message: "Failed to update alert state" });
  }
});

router.post("/dismiss", authMiddleware, async (req, res) => {
  try {
    const alertId = Number(req.body?.alertId);
    if (!Number.isFinite(alertId)) {
      return res.status(400).json({ message: "alertId is required" });
    }

    if (!canUseDatabase() || !req.user?.userId) {
      return res.json({ success: true, offline: true });
    }

    await AlertState.findOneAndUpdate(
      { userId: req.user.userId },
      {
        $addToSet: { dismissedIds: alertId },
        $pull: { readIds: alertId },
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to dismiss alert:", error);
    return res.status(500).json({ message: "Failed to update alert state" });
  }
});

router.post("/reset", authMiddleware, async (req, res) => {
  try {
    if (!canUseDatabase() || !req.user?.userId) {
      return res.json({ success: true, offline: true });
    }

    await AlertState.findOneAndUpdate(
      { userId: req.user.userId },
      {
        $set: {
          readIds: [],
          dismissedIds: [],
        },
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, message: "Alert state reset" });
  } catch (error) {
    console.error("Failed to reset alert state:", error);
    return res.status(500).json({ message: "Failed to reset alert state" });
  }
});

export default router;
