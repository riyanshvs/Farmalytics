import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import { generateOTP, verifyOTP, getOtpLockStatus } from "../utils/otp.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  JWT_SECRET,
  isInsecureOtpDebugEnabled,
  AUTH_COOKIE_NAME,
  buildAuthCookieOptions,
} from "../config/security.js";

const router = express.Router();
const OFFLINE_USERS = new Map();

const canUseDatabase = () => mongoose.connection.readyState === 1;
const authRouteRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 20 });
const verifyOtpRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 });

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

router.post("/send-otp", authRouteRateLimiter, async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Valid 10-digit phone number required" });
    }

    const generatedOtp = generateOTP(phone);
    if (isInsecureOtpDebugEnabled) {
      console.warn(`[INSECURE_OTP_DEBUG] OTP for ${phone}: ${generatedOtp}`);
    }

    const payload = { message: "OTP sent successfully", success: true };
    if (isInsecureOtpDebugEnabled) {
      payload.otp = generatedOtp;
    }

    res.json(payload);
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/verify-otp", verifyOtpRateLimiter, async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP required" });
    }

    const lockStatus = getOtpLockStatus(phone);
    if (lockStatus.isLocked) {
      return res.status(429).json({
        message: "Too many invalid OTP attempts. Please try again later.",
        retryAfter: Math.ceil(lockStatus.retryAfterMs / 1000),
      });
    }

    const result = verifyOTP(phone, otp);

    if (!result.valid) {
      const status = typeof result.retryAfter === "number" ? 429 : 400;
      return res.status(status).json({ message: result.message, retryAfter: result.retryAfter });
    }

    if (!canUseDatabase()) {
      const user = getOfflineUser(phone);
      const token = jwt.sign(
        { userId: user.id, phone: user.phone, offline: true },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.cookie(AUTH_COOKIE_NAME, token, buildAuthCookieOptions());

      return res.json({
        message: "Login successful",
        success: true,
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

    res.cookie(AUTH_COOKIE_NAME, token, buildAuthCookieOptions());

    res.json({
      message: "Login successful",
      success: true,
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

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const decoded = req.user;
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

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const decoded = req.user;

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
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...buildAuthCookieOptions(),
    expires: new Date(0),
  });

  return res.status(200).json({ success: true, message: "Logged out successfully" });
});

export default router;
