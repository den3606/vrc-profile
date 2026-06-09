import { describe, expect, it } from "vitest";
import { includesNormalizedCode, matchesAnyCode, normalizeCode } from "./normalize-code";

describe("normalizeCode", () => {
  it("trims, lowercases, and normalizes separators", () => {
    expect(normalizeCode("  Already Knows  ")).toBe("already_knows");
    expect(normalizeCode("deep diver")).toBe("deep_diver");
    expect(normalizeCode("#FCC800")).toBe("#fcc800");
  });
});

describe("matchesAnyCode", () => {
  it("matches himawari color codes case-insensitively", () => {
    expect(matchesAnyCode("#FCC800", ["#fcc800", "fcc800"])).toBe(true);
    expect(matchesAnyCode("FCC800", ["#fcc800", "fcc800"])).toBe(true);
  });
});

describe("includesNormalizedCode", () => {
  it("matches vrc user id variants", () => {
    const codes = [
      "usr_aac1b0fa-a840-4408-bea8-38a010120d03",
      "aac1b0fa-a840-4408-bea8-38a010120d03",
    ] as const;

    expect(
      includesNormalizedCode(
        normalizeCode("usr_aac1b0fa-a840-4408-bea8-38a010120d03"),
        codes
      )
    ).toBe(true);
    expect(
      includesNormalizedCode(normalizeCode("aac1b0fa-a840-4408-bea8-38a010120d03"), codes)
    ).toBe(true);
  });
});
