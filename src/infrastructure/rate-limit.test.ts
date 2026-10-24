import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimits } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(resetRateLimits);

  it("permite até o máximo e bloqueia o excedente", () => {
    expect(rateLimit("ip", 2, 1000, 0)).toBe(true);
    expect(rateLimit("ip", 2, 1000, 1)).toBe(true);
    expect(rateLimit("ip", 2, 1000, 2)).toBe(false);
  });

  it("libera novamente depois da janela", () => {
    rateLimit("ip", 1, 1000, 0);
    expect(rateLimit("ip", 1, 1000, 500)).toBe(false);
    expect(rateLimit("ip", 1, 1000, 1001)).toBe(true);
  });

  it("separa as chaves", () => {
    rateLimit("a", 1, 1000, 0);
    expect(rateLimit("b", 1, 1000, 0)).toBe(true);
  });
});
