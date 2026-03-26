import mongoose from "mongoose";
import { verifyFirebaseToken } from "../config/firebaseAdmin.js";
import { resolveUserFromFirebaseClaims } from "../services/authUserResolver.js";

const getRequestToken = (req) => {
  const authHeaderToken = req.header("Authorization")?.replace("Bearer ", "");
  if (authHeaderToken) {
    return authHeaderToken;
  }

  return null;
};

export const authMiddleware = async (req, res, next) => {
  try {
    const token = getRequestToken(req);

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = await verifyFirebaseToken(token);

    let userRecord = null;
    if (mongoose.connection.readyState === 1) {
      userRecord = await resolveUserFromFirebaseClaims(decoded);
    }

    req.user = {
      userId: userRecord?._id?.toString() || decoded.uid,
      firebaseUid: decoded.uid,
      email: decoded.email || userRecord?.email || "",
      emailVerified: Boolean(decoded.email_verified),
      name: decoded.name || userRecord?.name || "",
      authProvider: "firebase",
    };
    req.userRecord = userRecord;
    next();
  } catch {
    res.status(401).json({ message: "Firebase token is not valid" });
  }
};
