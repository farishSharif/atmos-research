import type { SurveyRecord, ItemKey } from "./types";
import { FACTORS, AGE_GROUPS, GENDERS, SECTORS } from "./questions";

// Generate N realistic dummy responses entirely in the browser (NOT saved to
// the DB). Used by the dashboard "Load demo data" toggle and as a fallback so
// the demo is never empty.
//
// We give each respondent a hidden "workplace quality" trait, then draw the
// environment items around that trait and make Performance depend on it. That
// way the demo data actually shows real correlation / regression structure
// instead of random noise.

function clamp1to5(x: number): number {
  return Math.max(1, Math.min(5, Math.round(x)));
}

// Box-Muller transform → standard normal random number.
function randNormal(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateDemoData(n = 40): SurveyRecord[] {
  const rows: SurveyRecord[] = [];

  for (let i = 0; i < n; i++) {
    // Latent "quality of workplace" for this person (centred at 3.3).
    const trait = 3.3 + randNormal() * 0.9;

    const record: Partial<SurveyRecord> = {
      id: `demo-${i + 1}`,
      created_at: new Date(Date.now() - i * 3600_000).toISOString(),
      age_group: pick(AGE_GROUPS),
      gender: pick(GENDERS),
      experience: clamp1to5(Math.abs(randNormal()) * 6) + Math.floor(Math.random() * 10),
      sector: pick(SECTORS),
    };

    // Environment items: centred on the trait with a little item-level noise.
    for (const f of FACTORS) {
      if (f.key === "EP") continue;
      for (const item of f.items) {
        record[item.key] = clamp1to5(trait + randNormal() * 0.6);
      }
    }

    // Performance depends on the environment trait + noise, so regression/
    // correlation come out meaningful.
    const perfBase = 1.1 + 0.62 * trait + randNormal() * 0.5;
    for (const item of FACTORS.find((f) => f.key === "EP")!.items) {
      record[item.key] = clamp1to5(perfBase + randNormal() * 0.4);
    }

    rows.push(record as SurveyRecord);
  }

  return rows;
}

// Ensure every item key exists and is a valid integer (defensive, for CSV etc.)
export function sanitizeRecord(r: SurveyRecord): SurveyRecord {
  const copy = { ...r };
  for (const f of FACTORS) {
    for (const item of f.items) {
      const v = copy[item.key as ItemKey];
      copy[item.key as ItemKey] = clamp1to5(Number(v) || 3);
    }
  }
  return copy;
}
