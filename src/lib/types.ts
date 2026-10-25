// Shared types for Atmos.

// The 20 Likert item keys (1-5 integers).
export type ItemKey =
  | "pe1" | "pe2" | "pe3" | "pe4"
  | "se1" | "se2" | "se3" | "se4"
  | "ps1" | "ps2" | "ps3" | "ps4"
  | "wl1" | "wl2" | "wl3" | "wl4"
  | "ep1" | "ep2" | "ep3" | "ep4";

export type AgeGroup = "Under 25" | "25-34" | "35-44" | "45-54" | "55+";
export type Gender = "Male" | "Female" | "Other" | "Prefer not to say";
export type Sector =
  | "IT"
  | "Education"
  | "Manufacturing"
  | "Service"
  | "Other";

export interface Demographics {
  age_group: AgeGroup | "";
  gender: Gender | "";
  experience: number | ""; // years
  sector: Sector | "";
}

// A full survey response. Item answers are 1-5.
export type Responses = Record<ItemKey, number>;

export interface SurveyRecord extends Demographics {
  id?: string;
  created_at?: string;
  pe1: number; pe2: number; pe3: number; pe4: number;
  se1: number; se2: number; se3: number; se4: number;
  ps1: number; ps2: number; ps3: number; ps4: number;
  wl1: number; wl2: number; wl3: number; wl4: number;
  ep1: number; ep2: number; ep3: number; ep4: number;
}

// The five factors used across stats + charts.
export type FactorKey = "PE" | "SE" | "PS" | "WL" | "EP";
