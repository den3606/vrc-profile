import { describe, expect, it } from "vitest";
import { isAchievementId } from "./achievements";
import { getHintAchievementIds, getHintDetails } from "./hints";

describe("hint config", () => {
  it("keeps hint lists aligned", () => {
    expect(getHintAchievementIds().length).toBe(getHintDetails().length);
  });

  it("references valid achievement ids", () => {
    for (const id of getHintAchievementIds()) {
      expect(isAchievementId(id)).toBe(true);
    }
  });
});
