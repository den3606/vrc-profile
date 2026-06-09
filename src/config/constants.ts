export const STORAGE_KEY = "vrc-profile-state";
export const SESSION_KEY = "vrc-profile-session";
export const OBSERVED_MS = 180_000;
export const PET_CLICKS_REQUIRED = 10;
export const PET_ESCAPE_CLICKS = 20;

export const BOOT_LINES = [
  "Connection established.",
  "Human detected.",
  "Loading profile...",
] as const;

export const RETURN_MESSAGES: Record<number, string> = {
  2: "Welcome back.",
  3: "You returned.",
  5: "You really like exploring.",
};
