import { describe, expect, it } from "vitest";
import { resolveLocaleFromInput } from "./locale-codes";

describe("resolveLocaleFromInput", () => {
  it("resolves direct locale codes", () => {
    expect(resolveLocaleFromInput("ja")).toBe("ja");
    expect(resolveLocaleFromInput("en")).toBe("en");
    expect(resolveLocaleFromInput("zh")).toBe("zh");
    expect(resolveLocaleFromInput("zh-tw")).toBe("zh-TW");
    expect(resolveLocaleFromInput("tw")).toBe("zh-TW");
    expect(resolveLocaleFromInput("kr")).toBe("kr");
    expect(resolveLocaleFromInput("ko")).toBe("kr");
  });

  it("resolves lang subcommands", () => {
    expect(resolveLocaleFromInput("lang ja")).toBe("ja");
    expect(resolveLocaleFromInput("lang en")).toBe("en");
    expect(resolveLocaleFromInput("lang zh")).toBe("zh");
    expect(resolveLocaleFromInput("lang zh-tw")).toBe("zh-TW");
    expect(resolveLocaleFromInput("lang tw")).toBe("zh-TW");
    expect(resolveLocaleFromInput("lang kr")).toBe("kr");
    expect(resolveLocaleFromInput("lang ko")).toBe("kr");
  });
});
