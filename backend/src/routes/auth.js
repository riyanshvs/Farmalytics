import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import { generateOTP, verifyOTP } from "../utils/otp.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "farmalytics-secret-key";
const OFFLINE_USERS = new Map();

const canUseDatabase = () => mongoose.connection.readyState === 1;

const getOfflineUser = (phone) => {
  const existing = OFFLINE_USERS.get(phone);
  if (existing) return existing;

  const created = {
    id: `offline-${phone}`,
    phone,
    name: "",
    language: "hi",
  };
  OFFLINE_USERS.set(phone, created);
  return created;
};

router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Valid 10-digit phone number required" });
    }

    const generatedOtp = generateOTP(phone);

    const payload = { message: "OTP sent successfully", success: true };
    if (process.env.NODE_ENV !== "production") {
      payload.otp = generatedOtp;
    }

    res.json(payload);
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP required" });
    }

    const result = verifyOTP(phone, otp);

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    if (!canUseDatabase()) {
      const user = getOfflineUser(phone);
      const token = jwt.sign(
        { userId: user.id, phone: user.phone, offline: true },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      return res.json({
        message: "Login successful",
        success: true,
        token,
        user,
      });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({ phone });
    }

    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      message: "Login successful",
      success: true,
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        language: user.language,
      },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { name, language } = req.body;

    if (!canUseDatabase() || decoded.offline) {
      const offline = getOfflineUser(decoded.phone);
      if (name !== undefined) offline.name = String(name);
      if (language !== undefined && ["en", "hi"].includes(language)) {
        offline.language = language;
      }
      OFFLINE_USERS.set(decoded.phone, offline);

      return res.json({ user: offline });
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
        phone: user.phone,
        name: user.name,
        language: user.language,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!canUseDatabase() || decoded.offline) {
      return res.json({ user: getOfflineUser(decoded.phone) });
    }

    const user = await User.findById(decoded.userId).select("-__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;
