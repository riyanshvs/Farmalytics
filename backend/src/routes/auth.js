import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

const canUseDatabase = () => mongoose.connection.readyState === 1;

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const decoded = req.user;
    const { name, language } = req.body;

    if (!canUseDatabase()) {
      return res.status(503).json({ message: "Database unavailable" });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (language !== undefined && ["en", "hi"].includes(language)) {
      updateData.language = language;
    }
    updateData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        language: user.language,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    if (!canUseDatabase()) {
      return res.status(200).json({
        user: {
          id: req.user?.userId,
          email: req.user?.email || "",
          name: req.user?.name || "",
          language: "hi",
          emailVerified: Boolean(req.user?.emailVerified),
        },
        degraded: true,
        message: "Database unavailable, returned auth token profile",
      });
    }

    const user = await User.findById(req.user?.userId).select("-__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", (_req, res) => {
  return res.status(200).json({ success: true, message: "Logged out successfully" });
});

export default router;
