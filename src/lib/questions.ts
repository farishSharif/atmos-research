import type { ItemKey, FactorKey } from "./types";

// Each factor and the 4 statements that measure it.
// Keys map 1:1 to the database columns (pe1..ep4).

export interface Factor {
  key: FactorKey;
  label: string;
  short: string;
  items: { key: ItemKey; text: string }[];
}

export const FACTORS: Factor[] = [
  {
    key: "PE",
    label: "Physical Environment",
    short: "Physical",
    items: [
      { key: "pe1", text: "The lighting at my workplace is comfortable and adequate." },
      { key: "pe2", text: "Noise levels at my workplace allow me to concentrate." },
      { key: "pe3", text: "My seating and workstation are ergonomic and comfortable." },
      { key: "pe4", text: "My workplace is kept clean and well maintained." },
    ],
  },
  {
    key: "SE",
    label: "Social Environment",
    short: "Social",
    items: [
      { key: "se1", text: "My colleagues support me when I need help." },
      { key: "se2", text: "My manager supports me and gives useful guidance." },
      { key: "se3", text: "There is good cooperation within my team." },
      { key: "se4", text: "I am treated with respect at my workplace." },
    ],
  },
  {
    key: "PS",
    label: "Psychological Environment",
    short: "Psychological",
    items: [
      { key: "ps1", text: "My workload keeps my stress at a manageable level." },
      { key: "ps2", text: "My efforts and achievements are recognised." },
      { key: "ps3", text: "I feel secure about my job." },
      { key: "ps4", text: "I have enough autonomy to do my job well." },
    ],
  },
  {
    key: "WL",
    label: "Facilities & Work-Life",
    short: "Facilities",
    items: [
      { key: "wl1", text: "There are adequate rest areas / break facilities." },
      { key: "wl2", text: "I have flexibility in my working hours when needed." },
      { key: "wl3", text: "I am provided with the tools and technology I need." },
      { key: "wl4", text: "I feel safe at my workplace." },
    ],
  },
  {
    key: "EP",
    label: "Employee Performance",
    short: "Performance",
    items: [
      { key: "ep1", text: "I am productive in my daily work." },
      { key: "ep2", text: "The quality of my work is high." },
      { key: "ep3", text: "I consistently meet my deadlines." },
      { key: "ep4", text: "Overall, I am satisfied with my job." },
    ],
  },
];

// Flat list of all 20 item keys in order.
export const ALL_ITEM_KEYS: ItemKey[] = FACTORS.flatMap((f) =>
  f.items.map((i) => i.key),
);

// Environment factors (predictors) — everything except Performance.
export const ENV_FACTORS = FACTORS.filter((f) => f.key !== "EP");

export const LIKERT_LABELS = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
];

export const AGE_GROUPS = ["Under 25", "25-34", "35-44", "45-54", "55+"] as const;
export const GENDERS = ["Male", "Female", "Other", "Prefer not to say"] as const;
export const SECTORS = ["IT", "Education", "Manufacturing", "Service", "Other"] as const;
