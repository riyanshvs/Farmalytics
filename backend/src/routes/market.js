import express from "express";
import mongoose from "mongoose";
import Farm from "../models/Farm.js";
import { authMiddleware } from "../middleware/auth.js";
import { fetchMarketPrices } from "../services/marketPriceService.js";

const router = express.Router();

const canUseDatabase = () => mongoose.connection.readyState === 1;

const parseCropList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

router.get("/", authMiddleware, async (req, res) => {
  try {
    let state = String(req.query?.state || "").trim();
    let district = String(req.query?.district || "").trim();
    let selectedCrops = parseCropList(req.query?.crops);

    if (canUseDatabase() && req.user?.userId) {
      const farm = await Farm.findOne({ userId: req.user.userId }).select("location selectedCrops");

      if (!state) state = farm?.location?.state || "";
      if (!district) district = farm?.location?.district || "";
      if (selectedCrops.length === 0 && Array.isArray(farm?.selectedCrops)) {
        selectedCrops = farm.selectedCrops.filter(Boolean);
      }
    }

    const market = await fetchMarketPrices({
      state,
      district,
      selectedCrops,
      limit: req.query?.limit ? Number(req.query.limit) : undefined,
    });

    return res.json({
      market,
      selectedCrops,
      location: market.location,
      degraded: !market.configured,
      degradedReason: market.configured ? null : "market_source_unconfigured",
    });
  } catch (error) {
    console.error("Failed to load market prices:", error);
    return res.status(502).json({
      message: "Unable to load market prices",
    });
  }
});

export default router;
