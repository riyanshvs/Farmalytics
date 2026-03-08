import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { generateOTP, verifyOTP } from "../utils/otp.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "farmalytics-secret-key";

router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Valid 10-digit phone number required" });
    }

    generateOTP(phone);

    res.json({ message: "OTP sent successfully", success: true });
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
