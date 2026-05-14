import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(),
    runTransaction: vi.fn(),
  },
}));

const { getRateLimitKey } = await import("../rate-limiter");

describe("getRateLimitKey", () => {
  it("returns user-based key when userId is provided", () => {
    expect(getRateLimitKey("1.2.3.4", "user123")).toBe("rate_limit_user_user123");
  });

  it("returns ip-based key when userId is absent", () => {
    expect(getRateLimitKey("1.2.3.4")).toBe("rate_limit_ip_1.2.3.4");
  });
});
