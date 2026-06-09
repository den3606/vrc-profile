export const MAX_NAME_LENGTH = 32;
export const MAX_MESSAGE_LENGTH = 500;

export function normalizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const name = raw.trim().replace(/\s+/g, " ");
  if (!name || name.length > MAX_NAME_LENGTH) return null;
  if (/[@`]/.test(name)) return null;

  return name;
}

export function normalizeMessage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const message = raw.trim().replace(/\r\n/g, "\n");
  if (!message || message.length > MAX_MESSAGE_LENGTH) return null;
  if (/@(everyone|here)/i.test(message)) return null;

  return message;
}
