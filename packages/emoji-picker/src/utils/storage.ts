/**
 * SSR-safe localStorage helpers. All access is guarded so calling from the
 * server (Next.js RSC/SSR) or an environment without storage never throws.
 */

function hasLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

export function readStoredList(key: string): string[] {
  if (!hasLocalStorage()) return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function writeStoredList(key: string, values: string[]): void {
  if (!hasLocalStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Ignore quota/availability errors; usage history is a non-critical enhancement.
  }
}

export function readStoredUsageCounts(key: string): Record<string, number> {
  if (!hasLocalStorage()) return {};

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    const result: Record<string, number> = {};
    for (const [name, count] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof count === "number" && Number.isFinite(count)) {
        result[name] = count;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function writeStoredUsageCounts(key: string, counts: Record<string, number>): void {
  if (!hasLocalStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(counts));
  } catch {
    // Ignore quota/availability errors; usage history is a non-critical enhancement.
  }
}
