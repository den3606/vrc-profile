export function normalizeCode(input: string): string {
  return input.trim().toLowerCase().replace(/[\s_]+/g, "_");
}

export function matchesAnyCode(input: string, codes: readonly string[]): boolean {
  const normalized = normalizeCode(input);
  return codes.some((code) => normalizeCode(code) === normalized);
}

export function includesNormalizedCode(
  normalizedValue: string,
  codes: readonly string[]
): boolean {
  return codes.some((code) => normalizeCode(code) === normalizedValue);
}
