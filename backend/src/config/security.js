import dotenv from "dotenv";

dotenv.config();

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(value).trim();
};

export const JWT_SECRET = requiredEnv("JWT_SECRET");
export const AUTH_COOKIE_NAME = "farmalytics_auth";
export const isProduction = process.env.NODE_ENV === "production";

export const isInsecureOtpDebugEnabled =
  process.env.ALLOW_INSECURE_OTP_DEBUG === "true" && process.env.NODE_ENV !== "production";

export const buildAuthCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
});

export default {
  JWT_SECRET,
  AUTH_COOKIE_NAME,
  isProduction,
  isInsecureOtpDebugEnabled,
  buildAuthCookieOptions,
};