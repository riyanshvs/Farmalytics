import { describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "../src/middleware/rateLimit.js";

describe("rate limiter", () => {
  it("blocks requests above window limit", async () => {
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 1 });
    const req = { headers: {}, ip: "127.0.0.1", chatContext: { userId: "u1" }, socket: {} };
    const next = vi.fn();

    const resA = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await limiter(req, resA, next);
    expect(next).toHaveBeenCalledTimes(1);

    const resB = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await limiter(req, resB, next);
    expect(resB.status).toHaveBeenCalledWith(429);
  });
});
