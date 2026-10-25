// ===========================================================================
// stats.ts — all statistical calculations for Atmos.
//
// Everything here is plain, dependency-free math so it is easy to explain in
// the project report:
//   - mean / variance (sample)
//   - Pearson correlation coefficient (r)
//   - Multiple linear regression via ordinary least squares (normal equations)
//   - Cronbach's alpha (internal-consistency reliability)
//
// A respondent's "factor score" is the average of that factor's 4 Likert items
// (each 1-5). So PE score = mean(pe1..pe4), EP score = mean(ep1..ep4), etc.
// ===========================================================================

import type { SurveyRecord, FactorKey } from "./types";
import { FACTORS, ENV_FACTORS } from "./questions";

// ---------------------------------------------------------------------------
// Basic descriptive statistics
// ---------------------------------------------------------------------------

/** Arithmetic mean of an array. Returns 0 for empty input. */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Sample variance (divides by n-1, the unbiased estimator).
 * Used for Cronbach's alpha and correlation building blocks.
 */
export function variance(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const m = mean(values);
  const ss = values.reduce((sum, v) => sum + (v - m) * (v - m), 0);
  return ss / (n - 1);
}

export function standardDeviation(values: number[]): number {
  return Math.sqrt(variance(values));
}

// ---------------------------------------------------------------------------
// Factor scores
// ---------------------------------------------------------------------------

/** Average the 4 items belonging to one factor for a single respondent. */
export function factorScore(record: SurveyRecord, factor: FactorKey): number {
  const def = FACTORS.find((f) => f.key === factor)!;
  const vals = def.items.map((i) => record[i.key] as number);
  return mean(vals);
}

/** Column of factor scores (one value per respondent) for the whole dataset. */
export function factorColumn(data: SurveyRecord[], factor: FactorKey): number[] {
  return data.map((r) => factorScore(r, factor));
}

/** Average factor score across all respondents — used for the stat cards. */
export function factorAverages(
  data: SurveyRecord[],
): Record<FactorKey, number> {
  const out = {} as Record<FactorKey, number>;
  for (const f of FACTORS) {
    out[f.key] = mean(factorColumn(data, f.key));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Pearson correlation coefficient
// ---------------------------------------------------------------------------

/**
 * Pearson's r between two equal-length arrays.
 *   r = Σ(xi-x̄)(yi-ȳ) / sqrt( Σ(xi-x̄)² · Σ(yi-ȳ)² )
 * Returns a value in [-1, 1]; 0 if there is no variation.
 */
export function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    num += a * b;
    dx2 += a * a;
    dy2 += b * b;
  }
  const den = Math.sqrt(dx2 * dy2);
  return den === 0 ? 0 : num / den;
}

export interface CorrelationResult {
  factor: FactorKey;
  label: string;
  r: number;
}

/**
 * Correlation of each ENVIRONMENT factor (PE, SE, PS, WL) with Performance (EP).
 * This answers: "which environment aspect moves together with performance?"
 */
export function correlationsWithPerformance(
  data: SurveyRecord[],
): CorrelationResult[] {
  const ep = factorColumn(data, "EP");
  return ENV_FACTORS.map((f) => ({
    factor: f.key,
    label: f.label,
    r: pearson(factorColumn(data, f.key), ep),
  }));
}

// ---------------------------------------------------------------------------
// Multiple linear regression  (EP ~ PE + SE + PS + WL)
// Ordinary Least Squares solved with the normal equations: β = (XᵀX)⁻¹ Xᵀy
// ---------------------------------------------------------------------------

/** Solve a linear system A·x = b using Gaussian elimination with partial pivoting. */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  // Build an augmented matrix [A | b].
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivot: find the row with the largest absolute value in this column.
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];

    const pivotVal = M[col][col];
    if (Math.abs(pivotVal) < 1e-12) continue; // singular / collinear; skip

    // Normalise the pivot row, then eliminate this column from all other rows.
    for (let j = col; j <= n; j++) M[col][j] /= pivotVal;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      for (let j = col; j <= n; j++) M[r][j] -= factor * M[col][j];
    }
  }
  return M.map((row) => row[n]);
}

export interface RegressionResult {
  // Intercept + one coefficient per environment factor (PE, SE, PS, WL).
  intercept: number;
  coefficients: { factor: FactorKey; label: string; beta: number }[];
  rSquared: number;
  // Factor with the largest |beta| — the "strongest impact".
  strongest: { factor: FactorKey; label: string; beta: number } | null;
  n: number;
}

/**
 * Predict Performance (EP) from the four environment factors.
 * Design matrix X has a leading column of 1s (for the intercept) plus the four
 * factor-score columns. We solve (XᵀX)β = Xᵀy.
 */
export function multipleRegression(data: SurveyRecord[]): RegressionResult {
  const n = data.length;
  const predictors = ENV_FACTORS; // PE, SE, PS, WL
  const k = predictors.length;

  const empty: RegressionResult = {
    intercept: 0,
    coefficients: predictors.map((f) => ({ factor: f.key, label: f.label, beta: 0 })),
    rSquared: 0,
    strongest: null,
    n,
  };
  if (n <= k + 1) return empty; // not enough data to fit

  // y = Performance column; X rows = [1, PE, SE, PS, WL].
  const y = factorColumn(data, "EP");
  const cols = predictors.map((f) => factorColumn(data, f.key));
  const X: number[][] = [];
  for (let i = 0; i < n; i++) {
    X.push([1, ...cols.map((c) => c[i])]);
  }

  const p = k + 1; // number of parameters including intercept

  // Build XᵀX (p×p) and Xᵀy (p).
  const XtX: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
  const Xty: number[] = Array(p).fill(0);
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < p; a++) {
      Xty[a] += X[i][a] * y[i];
      for (let b = 0; b < p; b++) {
        XtX[a][b] += X[i][a] * X[i][b];
      }
    }
  }

  const beta = solveLinearSystem(XtX, Xty);

  // R² = 1 - SS_residual / SS_total
  const my = mean(y);
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    let pred = 0;
    for (let a = 0; a < p; a++) pred += beta[a] * X[i][a];
    ssRes += (y[i] - pred) ** 2;
    ssTot += (y[i] - my) ** 2;
  }
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  const coefficients = predictors.map((f, idx) => ({
    factor: f.key,
    label: f.label,
    beta: beta[idx + 1], // +1 skips the intercept
  }));

  const strongest = coefficients.reduce(
    (best, c) => (Math.abs(c.beta) > Math.abs(best.beta) ? c : best),
    coefficients[0],
  );

  return { intercept: beta[0], coefficients, rSquared, strongest, n };
}

// ---------------------------------------------------------------------------
// Cronbach's alpha (reliability of each 4-item factor)
//   α = (k / (k-1)) · (1 - Σ var(itemᵢ) / var(total))
// where k = number of items, total = sum of the item scores per respondent.
// Values ≥ 0.7 are generally considered acceptable reliability.
// ---------------------------------------------------------------------------

export interface AlphaResult {
  factor: FactorKey;
  label: string;
  alpha: number;
  k: number;
}

export function cronbachAlpha(
  data: SurveyRecord[],
  factor: FactorKey,
): number {
  const def = FACTORS.find((f) => f.key === factor)!;
  const items = def.items.map((i) => i.key);
  const k = items.length;
  if (data.length < 2 || k < 2) return 0;

  // Variance of each individual item across respondents.
  let sumItemVar = 0;
  for (const key of items) {
    sumItemVar += variance(data.map((r) => r[key] as number));
  }

  // Variance of the per-respondent total (sum of the k items).
  const totals = data.map((r) =>
    items.reduce((s, key) => s + (r[key] as number), 0),
  );
  const totalVar = variance(totals);
  if (totalVar === 0) return 0;

  return (k / (k - 1)) * (1 - sumItemVar / totalVar);
}

export function allAlphas(data: SurveyRecord[]): AlphaResult[] {
  return FACTORS.map((f) => ({
    factor: f.key,
    label: f.label,
    alpha: cronbachAlpha(data, f.key),
    k: f.items.length,
  }));
}

// ---------------------------------------------------------------------------
// Demographic breakdowns (counts for pie/bar charts)
// ---------------------------------------------------------------------------

export function countBy<K extends keyof SurveyRecord>(
  data: SurveyRecord[],
  field: K,
): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const r of data) {
    const raw = r[field];
    const key = raw === undefined || raw === null || raw === "" ? "Unknown" : String(raw);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map, ([name, value]) => ({ name, value }));
}
