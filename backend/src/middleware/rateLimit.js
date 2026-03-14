const buckets = new Map();

const now = () => Date.now();

const getKey = (req) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const userId = req.chatContext?.userId || "anon";
  return `${ip}:${userId}`;
};

export const createRateLimiter = ({ windowMs, maxRequests }) => {
  return (req, res, next) => {
    const key = getKey(req);
    const currentTime = now();

    let bucket = buckets.get(key);
    if (!bucket || currentTime > bucket.expiresAt) {
      bucket = {
        count: 0,
        expiresAt: currentTime + windowMs,
      };
      buckets.set(key, bucket);
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
