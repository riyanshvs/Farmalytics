import express from "express";
import mongoose from "mongoose";
import Farm from "../models/Farm.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateNewsQuery } from "../middleware/validation.js";
import { getNewsBundle } from "../services/newsService.js";

const router = express.Router();

const canUseDatabase = () => mongoose.connection.readyState === 1;

const resolveLocation = async (req) => {
  let state = req.query?.state;
  let district = req.query?.district;

  if ((!state || !district) && canUseDatabase() && req.user?.userId) {
    const farm = await Farm.findOne({ userId: req.user.userId }).select("location");
    state = state || farm?.location?.state;
    district = district || farm?.location?.district;
  }

  return {
    state,
    district,
  };
};

router.get("/", authMiddleware, validateNewsQuery, async (req, res) => {
  try {
    const location = await resolveLocation(req);

    const bundle = await getNewsBundle({
      language: req.query.language,
      category: req.query.category,
      priority: req.query.priority,
      state: location.state,
      district: location.district,
      limit: req.query.limit,
      offset: req.query.offset,
      forceRefresh: req.query.forceRefresh === "true",
    });

    const category = req.query.category || "all";
    const priority = req.query.priority || "all";

    const filteredNews = bundle.news.filter((item) => {
      const categoryMatches = category === "all" || item.categoryKey === category;
      const priorityMatches = priority === "all" || item.priority === priority;
      return categoryMatches && priorityMatches;
    });

    const offset = Number(req.query.offset || 0);
    const limit = Number(req.query.limit || 24);
    const pagedNews = filteredNews.slice(offset, offset + limit);

    return res.json({
      news: pagedNews,
      marketReports: bundle.marketReports,
      meta: {
        total: filteredNews.length,
        offset,
        limit,
        language: bundle.language,
        location: {
          state: location.state || null,
          district: location.district || null,
        },
        cache: bundle.cache,
        lastUpdatedAt: bundle.lastUpdatedAt,
      },
    });
  } catch (error) {
    console.error("Failed to fetch news feed:", error);
    return res.status(502).json({
      message: "Unable to load news feed right now.",
    });
  }
});

export default router;
