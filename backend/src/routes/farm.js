import express from "express";
import mongoose from "mongoose";
import Farm from "../models/Farm.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateFarmInput } from "../middleware/validation.js";

const router = express.Router();

const canUseDatabase = () => mongoose.connection.readyState === 1;

const farmAuthMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    req.userId = req.user?.userId;
    next();
  });
};

router.get("/", farmAuthMiddleware, async (req, res) => {
  try {
    if (!canUseDatabase()) {
      return res.json({ farm: null, offline: true, degraded: true, degradedReason: "db_unavailable" });
    }

    let farm = await Farm.findOne({ userId: req.userId });

    if (!farm) {
      return res.json({ farm: null });
    }

    res.json({ farm });
  } catch (error) {
    console.error("Error fetching farm:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/", farmAuthMiddleware, validateFarmInput, async (req, res) => {
  try {
    const { location, farmSize, selectedCrops, distributions } = req.body;

    if (!canUseDatabase()) {
      return res.json({
        message: "Farm data stored locally (database unavailable)",
        farm: {
          userId: req.userId,
          location,
          farmSize,
          selectedCrops,
          distributions,
          offline: true,
        },
        offline: true,
        degraded: true,
        degradedReason: "db_unavailable",
      });
    }

    const farmData = {
      userId: req.userId,
      updatedAt: new Date(),
    };

    if (location) farmData.location = location;
    if (farmSize !== undefined) farmData.farmSize = farmSize;
    if (selectedCrops) farmData.selectedCrops = selectedCrops;
    if (distributions) farmData.distributions = distributions;

    let farm = await Farm.findOneAndUpdate(
      { userId: req.userId },
      farmData,
      { new: true, upsert: true }
    );

    res.json({
      message: "Farm data saved successfully",
      farm,
    });
  } catch (error) {
    console.error("Error saving farm:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
