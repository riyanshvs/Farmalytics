const buckets = new Map();
const MAX_BUCKETS = 5000;

const cleanupExpiredBuckets = () => {
  const currentTime = now();
  for (const [key, bucket] of buckets.entries()) {
    if (currentTime > bucket.expiresAt) {
      buckets.delete(key);
    }
  }
};

// Best-effort periodic cleanup so stale keys do not accumulate indefinitely.
const cleanupTimer = setInterval(cleanupExpiredBuckets, 60 * 1000);
if (typeof cleanupTimer?.unref === "function") {
  cleanupTimer.unref();
}

const now = () => Date.now();

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
};

const getKey = (req) => {
  const ip = getClientIp(req);
  const userId = req.chatContext?.userId || "anon";
  return `${ip}:${userId}`;
};

export const createRateLimiter = ({ windowMs, maxRequests }) => {
  return (req, res, next) => {
    cleanupExpiredBuckets();

    const key = getKey(req);
    const currentTime = now();

    let bucket = buckets.get(key);
    if (!bucket || currentTime > bucket.expiresAt) {
      bucket = {
        count: 0,
        expiresAt: currentTime + windowMs,
      };
      buckets.set(key, bucket);

      if (buckets.size > MAX_BUCKETS) {
        // Drop the oldest inserted key to keep memory usage bounded.
        const oldestKey = buckets.keys().next().value;
        if (oldestKey) {
          buckets.delete(oldestKey);
        }
      }
    }

    bucket.count += 1;

    if (bucket.count > maxRequests) {
      const retryAfter = Math.ceil((bucket.expiresAt - currentTime) / 1000);
      return res.status(429).json({
        error: "Too many requests. Please try again shortly.",
        retryAfter,
      });
    }

    next();
  };
};

export default createRateLimiter;
