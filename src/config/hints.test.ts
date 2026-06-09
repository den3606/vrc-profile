import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS } from "./achievements";
import { HINT_ACHIEVEMENT_IDS, HINT_DETAILS } from "./hints";

describe("hint config", () => {
  it("keeps hint lists aligned", () => {
    expect(HINT_ACHIEVEMENT_IDS.length).toBe(HINT_DETAILS.length);
  });

  it("references valid achievement ids", () => {
    for (const id of HINT_ACHIEVEMENT_IDS) {
      expect(id in ACHIEVEMENTS).toBe(true);
    }
  });
});
