import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Farm from "../models/Farm.js";
import User from "../models/User.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "farmalytics-secret-key";
const canUseDatabase = () => mongoose.connection.readyState === 1;

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

router.get("/", authMiddleware, async (req, res) => {
  try {
    if (!canUseDatabase()) {
      return res.json({ farm: null, offline: true });
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

router.put("/", authMiddleware, async (req, res) => {
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
