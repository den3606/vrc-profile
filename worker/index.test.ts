import { describe, expect, it } from "vitest";
import { normalizeName } from "./validate";

describe("normalizeName", () => {
  it("accepts a trimmed name", () => {
    expect(normalizeName("  den  ")).toBe("den");
  });

  it("rejects empty and overlong names", () => {
    expect(normalizeName("   ")).toBeNull();
    expect(normalizeName("a".repeat(33))).toBeNull();
  });

  it("rejects discord mention characters", () => {
    expect(normalizeName("@everyone")).toBeNull();
  });
});
