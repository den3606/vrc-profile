export const ACHIEVEMENTS = {
  "first-contact": { title: "First Contact", emoji: "👋" },
  explorer: { title: "Explorer", emoji: "👁️" },
  observed: { title: "Observed", emoji: "⏱️" },
  "pet-pet-pet": { title: "Pet, Pet, Pet", emoji: "🐕" },
  himawari: { title: "Himawari", emoji: "🌻" },
  "vrc-engineer": { title: "VRC Engineer", emoji: "🔧" },
  honester: { title: "Honester", emoji: "🫡" },
  "escape-from-friend": { title: "Escape From Friend", emoji: "🏃" },
  "your-friend-name": { title: "Your Friend Name", emoji: "🤝" },
  "mirror-mirror": { title: "Mirror, Mirror", emoji: "🪞" },
  "science-and-magic-intersect": { title: "Science And Magic", emoji: "🔮" },
  "help-me-dennnnnn": { title: "Help me, DENNNNNN!!", emoji: "🆘" },
  "full-signal": { title: "Full Signal", emoji: "✨" },
  "deep-diver": { title: "Deep Diver", emoji: "🤿" },
  wafu: { title: "Wafu!", emoji: "🚀" },
} as const;

export type AchievementId = keyof typeof ACHIEVEMENTS;
export type AchievementMeta = (typeof ACHIEVEMENTS)[AchievementId];

export const COMPLETION_ID: AchievementId = "full-signal";
export const POST_COMPLETION_IDS: AchievementId[] = ["deep-diver", "wafu"];
export const GHOST_ACHIEVEMENT_IDS: AchievementId[] = ["wafu"];

export function isAchievementId(value: string): value is AchievementId {
  return value in ACHIEVEMENTS;
}
