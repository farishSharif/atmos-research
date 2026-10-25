import type { SurveyRecord } from "./types";

// localStorage fallback so the whole app works without Supabase.
// Survey submissions land here when Supabase is not configured, and the
// dashboard reads them back for a real end-to-end demo.

const KEY = "atmos_responses";
const LEGACY_KEY = "worksense_responses";

export function saveLocalResponse(record: SurveyRecord): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadLocalResponses();
    existing.push({
      ...record,
      id: record.id ?? crypto.randomUUID(),
      created_at: record.created_at ?? new Date().toISOString(),
    });
    window.localStorage.setItem(KEY, JSON.stringify(existing));
  } catch {
    // Ignore quota / private-mode errors — the thank-you screen still shows.
  }
}

export function loadLocalResponses(): SurveyRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY) || window.localStorage.getItem(LEGACY_KEY);
    return raw ? (JSON.parse(raw) as SurveyRecord[]) : [];
  } catch {
    return [];
  }
}

export function clearLocalResponses(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
