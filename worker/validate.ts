export const MAX_NAME_LENGTH = 32;

export function normalizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const name = raw.trim().replace(/\s+/g, " ");
  if (!name || name.length > MAX_NAME_LENGTH) return null;
  if (/[@`]/.test(name)) return null;

  return name;
}
