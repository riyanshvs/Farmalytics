import Redis from "ioredis";

const REDIS_URL = String(process.env.REDIS_URL || "").trim();
const CACHE_PROVIDER = String(process.env.CACHE_PROVIDER || "memory").toLowerCase();
const RATE_LIMIT_PROVIDER = String(process.env.RATE_LIMIT_PROVIDER || "memory").toLowerCase();

let redisClient = null;

export const shouldUseRedisForCache = () => CACHE_PROVIDER === "redis";
export const shouldUseRedisForRateLimit = () => RATE_LIMIT_PROVIDER === "redis";

export const getRedisClient = () => {
  if (!REDIS_URL) return null;
  if (redisClient) return redisClient;

  redisClient = new Redis(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
  });

  redisClient.on("error", (error) => {
    console.warn("Redis connection warning:", error?.message || error);
  });

  return redisClient;
};

export const ensureRedisConnection = async () => {
  const client = getRedisClient();
  if (!client) return false;

  if (client.status === "ready") return true;
  try {
    await client.connect();
    return true;
  } catch (error) {
    console.warn("Failed to connect Redis:", error?.message || error);
    return false;
  }
};
