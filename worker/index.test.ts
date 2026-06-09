import { describe, expect, it } from "vitest";
import { normalizeMessage, normalizeName } from "./validate";

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

describe("normalizeMessage", () => {
  it("accepts a trimmed message", () => {
    expect(normalizeMessage("  hello  ")).toBe("hello");
  });

  it("rejects empty and overlong messages", () => {
    expect(normalizeMessage("   ")).toBeNull();
    expect(normalizeMessage("a".repeat(501))).toBeNull();
  });

  it("rejects everyone and here mentions", () => {
    expect(normalizeMessage("@everyone hi")).toBeNull();
    expect(normalizeMessage("@here hi")).toBeNull();
  });
});
