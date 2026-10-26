"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FACTORS,
  LIKERT_LABELS,
  AGE_GROUPS,
  GENDERS,
  SECTORS,
  ALL_ITEM_KEYS,
} from "@/lib/questions";
import type { Demographics, ItemKey, SurveyRecord, FactorKey } from "@/lib/types";
import { getBrowserClient } from "@/lib/supabaseClient";
import { saveLocalResponse } from "@/lib/storage";

type Answers = Partial<Record<ItemKey, number>>;
type Status = "idle" | "submitting" | "done" | "error";

const TOTAL_STEPS = FACTORS.length + 1; // Demographics (0) + 5 Factors (1..5)

// Persona presets for instant Expo demo auto-fill
const PRESETS: Record<
  string,
  { label: string; description: string; demo: Demographics; answers: Record<ItemKey, number> }
> = {
  high_performer: {
    label: "Thriving High-Performer",
    description: "High satisfaction & robust psychological support",
    demo: { age_group: "25-34", gender: "Female", experience: 5, sector: "IT" },
    answers: {
      pe1: 5, pe2: 4, pe3: 5, pe4: 5,
      se1: 5, se2: 5, se3: 5, se4: 5,
      ps1: 4, ps2: 5, ps3: 5, ps4: 4,
      wl1: 4, wl2: 5, wl3: 5, wl4: 5,
      ep1: 5, ep2: 5, ep3: 5, ep4: 5,
    },
  },
  stressed_employee: {
    label: "High Stress & Burnout",
    description: "Adequate physical setup but poor psychological & work-life balance",
    demo: { age_group: "35-44", gender: "Male", experience: 9, sector: "Service" },
    answers: {
      pe1: 4, pe2: 3, pe3: 4, pe4: 4,
      se1: 3, se2: 2, se3: 3, se4: 3,
      ps1: 1, ps2: 2, ps3: 2, ps4: 2,
      wl1: 2, wl2: 1, wl3: 3, wl4: 4,
      ep1: 3, ep2: 3, ep3: 2, ep4: 2,
    },
  },
  balanced: {
    label: "Moderate / Median Employee",
    description: "Representative balanced ratings across all dimensions",
    demo: { age_group: "Under 25", gender: "Male", experience: 2, sector: "Education" },
    answers: {
      pe1: 4, pe2: 3, pe3: 4, pe4: 4,
      se1: 4, se2: 4, se3: 4, se4: 4,
      ps1: 3, ps2: 4, ps3: 3, ps4: 4,
      wl1: 3, wl2: 3, wl3: 4, wl4: 4,
      ep1: 4, ep2: 4, ep3: 4, ep4: 4,
    },
  },
};

export default function SurveyForm() {
  const [step, setStep] = useState(0);
  const [demo, setDemo] = useState<Demographics>({
    age_group: "",
    gender: "",
    experience: "",
    sector: "",
  });
  const [answers, setAnswers] = useState<Answers>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<SurveyRecord | null>(null);

  const answeredCount = useMemo(
    () => ALL_ITEM_KEYS.filter((k) => answers[k] !== undefined).length,
    [answers],
  );
  const progress = Math.round((answeredCount / ALL_ITEM_KEYS.length) * 100);

  const demographicsValid =
    demo.age_group !== "" &&
    demo.gender !== "" &&
    demo.sector !== "" &&
    demo.experience !== "" &&
    Number(demo.experience) >= 0;

  // Validation status for each section
  const sectionStatus = useMemo(() => {
    return [
      demographicsValid,
      ...FACTORS.map((f) => f.items.every((i) => answers[i.key] !== undefined)),
    ];
  }, [demographicsValid, answers]);

  function setAnswer(key: ItemKey, value: number) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  function handleAutoFill(presetKey: keyof typeof PRESETS) {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    setDemo({ ...preset.demo });
    setAnswers({ ...preset.answers });
    setShowErrors(false);
    setDemoNotice(`Loaded "${preset.label}" sample profile (${preset.description}).`);
    setTimeout(() => setDemoNotice(null), 5000);
  }

  function handleReset() {
    setDemo({ age_group: "", gender: "", experience: "", sector: "" });
    setAnswers({});
    setStep(0);
    setShowErrors(false);
    setDemoNotice("Survey form has been cleared.");
    setTimeout(() => setDemoNotice(null), 3000);
  }

  function next() {
    setShowErrors(true);
    if (step === 0) {
      if (!demographicsValid) return;
    } else {
      const factor = FACTORS[step - 1];
      const allAnswered = factor.items.every((i) => answers[i.key] !== undefined);
      if (!allAnswered) return;
    }
    setShowErrors(false);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setShowErrors(false);
    setStep((s) => Math.max(s - 1, 0));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function jumpToStep(targetStep: number) {
    // Only allow jumping back or to a step if previous steps are valid
    if (targetStep < step || sectionStatus[step]) {
      setShowErrors(false);
      setStep(targetStep);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setShowErrors(true);
    }
  }

  async function submit() {
    const missing = ALL_ITEM_KEYS.filter((k) => answers[k] === undefined);
    if (!demographicsValid || missing.length > 0) {
      setShowErrors(true);
      setErrorMsg("Please answer every question before submitting.");
      setStatus("error");
      return;
    }

    const record: SurveyRecord = {
      age_group: demo.age_group,
      gender: demo.gender,
      experience: Number(demo.experience),
      sector: demo.sector,
      ...(Object.fromEntries(
        ALL_ITEM_KEYS.map((k) => [k, answers[k] as number]),
      ) as Record<ItemKey, number>),
    } as SurveyRecord;

    setSubmittedRecord(record);
    setStatus("submitting");
    setErrorMsg("");

    try {
      const supabase = getBrowserClient();
      if (supabase) {
        const { error } = await supabase.from("responses").insert(record);
        if (error) throw error;
      } else {
        saveLocalResponse(record);
      }
      setStatus("done");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      saveLocalResponse(record);
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong submitting.",
      );
      setStatus("done");
    }
  }

  // ---- Personal Diagnostic Report (Thank-you Screen) -----------------------
  if (status === "done" && submittedRecord) {
    return (
      <PersonalDiagnosticReport
        record={submittedRecord}
        errorMsg={errorMsg}
        onReset={() => {
          handleReset();
          setStatus("idle");
          setSubmittedRecord(null);
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Top Demo Toolbar & Expo Helper */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Expo Testing Assist
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleAutoFill("high_performer")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            ⚡ Auto-Fill: High Performer
          </button>
          <button
            type="button"
            onClick={() => handleAutoFill("stressed_employee")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            ⚡ Auto-Fill: Stress Case
          </button>
          {answeredCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {demoNotice && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-medium text-sky-800 animate-fadeIn">
          <span>{demoNotice}</span>
          <button
            type="button"
            onClick={() => setDemoNotice(null)}
            className="text-sky-600 hover:text-sky-900 text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Interactive Step Navigator */}
      <div className="mb-6">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2.5">
          {["Demo", "PE", "SE", "PS", "WL", "EP"].map((code, idx) => {
            const isCurrent = step === idx;
            const isCompleted = sectionStatus[idx];
            return (
              <button
                key={code}
                type="button"
                onClick={() => jumpToStep(idx)}
                className={`flex flex-col items-center justify-center rounded-lg border px-2 py-1.5 text-center transition-all ${
                  isCurrent
                    ? "border-slate-900 bg-slate-900 text-white shadow-xs ring-1 ring-slate-900"
                    : isCompleted
                    ? "border-emerald-300 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/60"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-mono font-bold">{code}</span>
                  {isCompleted && !isCurrent && (
                    <span className="text-emerald-600 text-[10px]">✓</span>
                  )}
                </div>
                <span className="text-[9px] font-medium leading-none mt-0.5 truncate max-w-full">
                  {idx === 0 ? "Profile" : FACTORS[idx - 1].short}
                </span>
              </button>
            );
          })}
        </div>

        {/* Linear Progress Bar */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          <span>
            Section {step + 1} of {TOTAL_STEPS} ·{" "}
            {step === 0 ? "Demographics" : FACTORS[step - 1].label}
          </span>
          <span className="font-mono text-slate-700">
            {answeredCount} / {ALL_ITEM_KEYS.length} answered ({progress}%)
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-900 transition-all duration-300"
            style={{ width: `${(answeredCount / ALL_ITEM_KEYS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Survey Card */}
      <div className="card p-6 sm:p-8">
        {step === 0 ? (
          <DemographicsStep demo={demo} setDemo={setDemo} showErrors={showErrors} />
        ) : (
          <FactorStep
            factorIndex={step - 1}
            answers={answers}
            setAnswer={setAnswer}
            showErrors={showErrors}
          />
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between gap-3 pt-6 border-t border-slate-200/80">
          <button
            type="button"
            onClick={back}
            className="btn-secondary"
            disabled={step === 0}
          >
            ← Previous
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button type="button" onClick={next} className="btn-primary">
              Continue to {step === 0 ? FACTORS[0].short : FACTORS[step].short} →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              className="btn-primary"
              disabled={status === "submitting"}
            >
              {status === "submitting"
                ? "Encrypting & Submitting…"
                : "Complete & Submit Survey"}
            </button>
          )}
        </div>

        {status === "error" && errorMsg && (
          <p className="mt-4 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 0: Demographics
// ---------------------------------------------------------------------------
function DemographicsStep({
  demo,
  setDemo,
  showErrors,
}: {
  demo: Demographics;
  setDemo: (d: Demographics) => void;
  showErrors: boolean;
}) {
  const invalid = (ok: boolean) => showErrors && !ok;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-block rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-700">
          PART 01
        </span>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Demographic Profile
        </h2>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        All responses are strictly anonymous and used exclusively for statistical segmentation (GE3751).
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Age Group" error={invalid(demo.age_group !== "")}>
          <select
            className="input"
            value={demo.age_group}
            onChange={(e) =>
              setDemo({ ...demo, age_group: e.target.value as Demographics["age_group"] })
            }
          >
            <option value="">Select demographic tier…</option>
            {AGE_GROUPS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Gender" error={invalid(demo.gender !== "")}>
          <select
            className="input"
            value={demo.gender}
            onChange={(e) =>
              setDemo({ ...demo, gender: e.target.value as Demographics["gender"] })
            }
          >
            <option value="">Select gender…</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Total Work Experience (Years)"
          error={invalid(demo.experience !== "" && Number(demo.experience) >= 0)}
        >
          <input
            type="number"
            min={0}
            max={60}
            className="input font-mono"
            placeholder="e.g. 4"
            value={demo.experience}
            onChange={(e) =>
              setDemo({
                ...demo,
                experience: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
        </Field>

        <Field label="Industry Sector" error={invalid(demo.sector !== "")}>
          <select
            className="input"
            value={demo.sector}
            onChange={(e) =>
              setDemo({ ...demo, sector: e.target.value as Demographics["sector"] })
            }
          >
            <option value="">Select industry sector…</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {showErrors && (
        <p className="mt-5 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700">
          Please complete all demographic fields to proceed with the assessment.
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label}
      </span>
      <div className={error ? "rounded-lg ring-2 ring-rose-400" : ""}>{children}</div>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Factor Steps (4 Likert items each + Live Section Mean Score)
// ---------------------------------------------------------------------------
function FactorStep({
  factorIndex,
  answers,
  setAnswer,
  showErrors,
}: {
  factorIndex: number;
  answers: Answers;
  setAnswer: (k: ItemKey, v: number) => void;
  showErrors: boolean;
}) {
  const factor = FACTORS[factorIndex];

  // Calculate live section mean if any item is answered
  const sectionValues = factor.items
    .map((i) => answers[i.key])
    .filter((v): v is number => v !== undefined);
  const sectionAnswered = sectionValues.length;
  const sectionMean =
    sectionAnswered > 0
      ? (sectionValues.reduce((sum, v) => sum + v, 0) / sectionAnswered).toFixed(2)
      : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="inline-block rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-800">
            {factor.key}
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {factor.label}
          </h2>
        </div>

        {/* Live Section Mean Pill */}
        {sectionMean && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-mono font-medium text-slate-700">
            <span className="text-slate-400">Section Score:</span>
            <span className="font-bold text-slate-900">{sectionMean}</span>
            <span className="text-[10px] text-slate-400">/ 5.00</span>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500 mb-6">
        Evaluate each statement on a 5-point scale from 1 (Strongly Disagree) to 5 (Strongly Agree).
      </p>

      <div className="space-y-4">
        {factor.items.map((item, idx) => {
          const value = answers[item.key];
          const missing = showErrors && value === undefined;
          return (
            <div
              key={item.key}
              className={`rounded-xl border p-4 sm:p-5 transition-all ${
                missing
                  ? "bg-rose-50/60 border-rose-300 ring-1 ring-rose-200"
                  : value !== undefined
                  ? "bg-slate-50/40 border-slate-300 shadow-xs"
                  : "bg-white border-slate-200/90 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase">
                  Statement {idx + 1} of 4
                </span>
                {value !== undefined && (
                  <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Rating: {value} / 5
                  </span>
                )}
              </div>
              <p className="mb-3.5 text-sm font-semibold text-slate-800 leading-snug">
                {item.text}
              </p>
              <LikertRow
                name={item.key}
                value={value}
                onChange={(v) => setAnswer(item.key, v)}
              />
              {missing && (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  Please select an agreement rating for this statement.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Likert Rating Row with Colored Active Moods
// ---------------------------------------------------------------------------
function LikertRow({
  value,
  onChange,
}: {
  name: string;
  value?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {LIKERT_LABELS.map((label, i) => {
        const v = i + 1;
        const active = value === v;

        // Custom subtle color tone for active states
        const activeColors = [
          "border-rose-700 bg-rose-700 text-white shadow-xs ring-1 ring-rose-700", // 1 Strongly Disagree
          "border-amber-600 bg-amber-600 text-white shadow-xs ring-1 ring-amber-600", // 2 Disagree
          "border-slate-800 bg-slate-800 text-white shadow-xs ring-1 ring-slate-800", // 3 Neutral
          "border-blue-600 bg-blue-600 text-white shadow-xs ring-1 ring-blue-600", // 4 Agree
          "border-emerald-700 bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-700", // 5 Strongly Agree
        ];

        return (
          <button
            key={v}
            type="button"
            aria-label={`${label} (${v})`}
            onClick={() => onChange(v)}
            className={`flex flex-col items-center justify-center rounded-lg border py-2.5 px-1 text-center transition-all ${
              active
                ? activeColors[i]
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className="text-base sm:text-lg font-bold leading-none font-mono">{v}</span>
            <span
              className={`text-[9px] sm:text-[10px] leading-tight mt-1 font-medium ${
                active ? "text-white/90" : "text-slate-500"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// New Feature: Personal Diagnostic Workplace Report (After Submission)
// ---------------------------------------------------------------------------
function PersonalDiagnosticReport({
  record,
  errorMsg,
  onReset,
}: {
  record: SurveyRecord;
  errorMsg?: string;
  onReset: () => void;
}) {
  // Compute individual composite factor scores
  const factorScores: Record<FactorKey, number> = useMemo(() => {
    return {
      PE: (record.pe1 + record.pe2 + record.pe3 + record.pe4) / 4,
      SE: (record.se1 + record.se2 + record.se3 + record.se4) / 4,
      PS: (record.ps1 + record.ps2 + record.ps3 + record.ps4) / 4,
      WL: (record.wl1 + record.wl2 + record.wl3 + record.wl4) / 4,
      EP: (record.ep1 + record.ep2 + record.ep3 + record.ep4) / 4,
    };
  }, [record]);

  // Determine overall diagnostic persona
  const avgEnv = (factorScores.PE + factorScores.SE + factorScores.PS + factorScores.WL) / 4;
  const perf = factorScores.EP;

  let personaTitle = "Balanced Contributor";
  let personaDesc = "Solid satisfaction with stable productivity and balanced environment ratings.";
  let badgeColor = "bg-blue-50 text-blue-700 border-blue-200";

  if (perf >= 4.25 && avgEnv >= 4.0) {
    personaTitle = "Thriving High-Engagement Performer";
    personaDesc = "Optimal alignment: Both environment and employee performance dimensions are exceptionally strong.";
    badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (factorScores.PS <= 2.5 || factorScores.WL <= 2.5) {
    personaTitle = "Workplace Strain & Burnout Risk";
    personaDesc = "Psychological support or work-life facilities require immediate managerial intervention.";
    badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (avgEnv < 2.5) {
    personaTitle = "Disengaged / Hostile Workplace Perception";
    personaDesc = "Significant environmental barriers across physical, social, and psychological factors.";
    badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="card p-6 sm:p-10">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-900 text-white shadow-xs">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="text-center mt-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Assessment Successfully Recorded
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Anonymous registration verified · GE3751 Research Database
          </p>
        </div>

        {/* Personalized Diagnostic Card */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Personal Diagnostic Assessment
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeColor}`}>
              {personaTitle}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            {personaDesc}
          </p>

          {/* Factor Breakdown Bars */}
          <div className="space-y-2.5 pt-3 border-t border-slate-200">
            {FACTORS.map((f) => {
              const score = factorScores[f.key];
              const pct = (score / 5) * 100;
              return (
                <div key={f.key} className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-slate-700">
                      {f.label} ({f.key})
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {score.toFixed(2)} / 5.00
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        score >= 3.5
                          ? "bg-slate-900"
                          : score >= 2.5
                          ? "bg-amber-600"
                          : "bg-rose-600"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <p className="mt-4 text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5 border border-amber-200">
            Note: Saved to local storage ({errorMsg}).
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/dashboard" className="btn-primary text-center">
            View Analytics Dashboard →
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="btn-secondary text-center"
          >
            Submit Another Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
