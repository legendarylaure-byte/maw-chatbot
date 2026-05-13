import { describe, it, expect } from "vitest";
import { checkRateLimit, getRateLimitKey } from "../rate-limiter";

describe("getRateLimitKey", () => {
  it("returns user-based key when userId is provided", () => {
    expect(getRateLimitKey("1.2.3.4", "user123")).toBe("user:user123");
  });

  it("returns ip-based key when userId is absent", () => {
    expect(getRateLimitKey("1.2.3.4")).toBe("ip:1.2.3.4");
  });
});

describe("checkRateLimit", () => {
  const config = { maxRequests: 3, windowMinutes: 1 };

  it("allows requests under the limit", () => {
    const key = `test:under:${Date.now()}:${Math.random()}`;
    const r1 = checkRateLimit(key, config);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
  });

  it("blocks requests over the limit", () => {
    const key = `test:over:${Date.now()}:${Math.random()}`;
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const r4 = checkRateLimit(key, config);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("reports correct remaining count", () => {
    const key = `test:remaining:${Date.now()}:${Math.random()}`;
    const r1 = checkRateLimit(key, config);
    expect(r1.remaining).toBe(2);
    const r2 = checkRateLimit(key, config);
    expect(r2.remaining).toBe(1);
  });
});
