import { randomInt } from "crypto";

const OTP_STORE = new Map();
const OTP_ATTEMPTS = new Map();

const MAX_INVALID_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

const getAttemptState = (phone) => {
  const current = OTP_ATTEMPTS.get(phone);
  if (!current) {
    return { invalidAttempts: 0, lockedUntil: 0 };
  }

  if (current.lockedUntil && Date.now() > current.lockedUntil) {
    OTP_ATTEMPTS.delete(phone);
    return { invalidAttempts: 0, lockedUntil: 0 };
  }

  return current;
};

const setAttemptState = (phone, nextState) => {
  OTP_ATTEMPTS.set(phone, nextState);
};

export const generateOTP = (phone) => {
  const otp = randomInt(100000, 1000000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  OTP_STORE.set(phone, { otp, expiresAt });

  // Reset lock/attempt state whenever a fresh OTP is issued.
  OTP_ATTEMPTS.delete(phone);

  return otp;
};

export const getOtpLockStatus = (phone) => {
  const state = getAttemptState(phone);
  const retryAfterMs = Math.max(0, (state.lockedUntil || 0) - Date.now());

  return {
    isLocked: retryAfterMs > 0,
    retryAfterMs,
  };
};

export const verifyOTP = (phone, otp) => {
  const lockStatus = getOtpLockStatus(phone);
  if (lockStatus.isLocked) {
    return {
      valid: false,
      message: "Too many invalid OTP attempts. Please try again later.",
      retryAfter: Math.ceil(lockStatus.retryAfterMs / 1000),
    };
  }

  const stored = OTP_STORE.get(phone);

  if (!stored) {
    return { valid: false, message: "OTP not found or expired" };
  }

  if (Date.now() > stored.expiresAt) {
    OTP_STORE.delete(phone);
    return { valid: false, message: "OTP expired" };
  }

  if (stored.otp !== otp) {
    const prev = getAttemptState(phone);
    const nextAttempts = (prev.invalidAttempts || 0) + 1;
    if (nextAttempts >= MAX_INVALID_ATTEMPTS) {
      setAttemptState(phone, {
        invalidAttempts: nextAttempts,
        lockedUntil: Date.now() + LOCK_WINDOW_MS,
      });
      return {
        valid: false,
        message: "Too many invalid OTP attempts. Please try again later.",
        retryAfter: Math.ceil(LOCK_WINDOW_MS / 1000),
      };
    }

    setAttemptState(phone, {
      invalidAttempts: nextAttempts,
      lockedUntil: 0,
    });

    return { valid: false, message: "Invalid OTP" };
  }

  OTP_STORE.delete(phone);
  OTP_ATTEMPTS.delete(phone);
  return { valid: true, message: "OTP verified" };
};
