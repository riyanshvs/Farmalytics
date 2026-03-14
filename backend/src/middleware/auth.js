import jwt from "jsonwebtoken";
import { AUTH_COOKIE_NAME, JWT_SECRET } from "../config/security.js";

const getRequestToken = (req) => {
  const authHeaderToken = req.header("Authorization")?.replace("Bearer ", "");
  if (authHeaderToken) {
    return authHeaderToken;
  }

  return req.cookies?.[AUTH_COOKIE_NAME] || null;
};

export const authMiddleware = (req, res, next) => {
  try {
    const token = getRequestToken(req);

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
