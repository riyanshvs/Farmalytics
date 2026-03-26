import dotenv from "dotenv";

dotenv.config();

export const AUTH_COOKIE_NAME = "farmalytics_auth";
export const isProduction = process.env.NODE_ENV === "production";

export const buildAuthCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
});

export default {
  AUTH_COOKIE_NAME,
  isProduction,
  buildAuthCookieOptions,
};