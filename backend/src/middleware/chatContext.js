import mongoose from "mongoose";
import User from "../models/User.js";
import Farm from "../models/Farm.js";
import { getAnonymousContext } from "../services/anonymousContextStore.js";
import { verifyFirebaseToken } from "../config/firebaseAdmin.js";
import { resolveUserFromFirebaseClaims } from "../services/authUserResolver.js";

const getRequestToken = (req) => {
  const authHeaderToken = req.header("Authorization")?.replace("Bearer ", "");
  if (authHeaderToken) {
    return authHeaderToken;
  }

  return null;
};

const buildContextText = ({ user, farm, anonymousContext }) => {
  if (!user) {
    const knownCrops = anonymousContext?.crops?.length ? anonymousContext.crops.join(", ") : "not specified";
    const knownLocations = anonymousContext?.locations?.length ? anonymousContext.locations.join(", ") : "not specified";
    return [
      "User is not authenticated.",
      `Known crops from this conversation: ${knownCrops}`,
      `Known locations from this conversation: ${knownLocations}`,
      "If crop or location are still missing, ask concise follow-up questions and reuse known details in next answers.",
    ].join("\n");
  }

  const crops = farm?.selectedCrops?.length ? farm.selectedCrops.join(", ") : "not specified";
  const farmSize = typeof farm?.farmSize === "number" && farm.farmSize > 0 ? `${farm.farmSize} acres` : "not specified";
  const state = farm?.location?.state || "not specified";
  const district = farm?.location?.district || "not specified";

  return [
    `User email: ${user.email || "not available"}`,
    `User preferred language: ${user.language || "hi"}`,
    `Farm location: ${district}, ${state}`,
    `Farm size: ${farmSize}`,
    `Selected crops: ${crops}`,
    "Use this context only when relevant, and do not fabricate missing details.",
  ].join("\n");
};

export const chatContextMiddleware = async (req, _res, next) => {
  const conversationId = req.body?.conversationId || req.query?.conversationId;
  const anonymousContext = getAnonymousContext(conversationId);

  req.chatContext = {
    userId: null,
    user: null,
    farm: null,
    promptContext: buildContextText({ user: null, farm: null, anonymousContext }),
    anonymousContext,
  };

  if (mongoose.connection.readyState !== 1) {
    return next();
  }

  const token = getRequestToken(req);
  if (!token) {
    req.chatContext.promptContext = buildContextText({ user: null, farm: null, anonymousContext });
    req.chatContext.anonymousContext = anonymousContext;
    return next();
  }

  try {
    const decoded = await verifyFirebaseToken(token);
    const userRecord = await resolveUserFromFirebaseClaims(decoded);

    if (!userRecord?._id) {
      req.chatContext.promptContext = buildContextText({ user: null, farm: null, anonymousContext });
      req.chatContext.anonymousContext = anonymousContext;
      return next();
    }

    const [user, farm] = await Promise.all([
      User.findById(userRecord._id).select("email language"),
      Farm.findOne({ userId: userRecord._id }).select("location farmSize selectedCrops distributions"),
    ]);

    req.chatContext = {
      userId: userRecord._id.toString(),
      user,
      farm,
      promptContext: buildContextText({ user, farm, anonymousContext }),
      anonymousContext,
    };
  } catch {
    req.chatContext.promptContext = buildContextText({ user: null, farm: null, anonymousContext });
    req.chatContext.anonymousContext = anonymousContext;
  }

  next();
};

export default chatContextMiddleware;
