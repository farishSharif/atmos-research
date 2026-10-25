import type { SurveyRecord } from "./types";
import { ALL_ITEM_KEYS } from "./questions";

// Convert survey records to a CSV string and trigger a browser download.

const HEADERS = [
  "id",
  "created_at",
  "age_group",
  "gender",
  "experience",
  "sector",
  ...ALL_ITEM_KEYS,
];

function escape(value: unknown): string {
  const s = value === undefined || value === null ? "" : String(value);
  // Quote if the value contains comma, quote or newline.
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(data: SurveyRecord[]): string {
  const lines = [HEADERS.join(",")];
  for (const r of data) {
    lines.push(HEADERS.map((h) => escape((r as unknown as Record<string, unknown>)[h])).join(","));
  }
  return lines.join("\n");
}

export function downloadCsv(data: SurveyRecord[], filename = "atmos_responses.csv"): void {
  const blob = new Blob([toCsv(data)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
