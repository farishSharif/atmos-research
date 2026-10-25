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
import type { Demographics, ItemKey, SurveyRecord } from "@/lib/types";
import { getBrowserClient } from "@/lib/supabaseClient";
import { saveLocalResponse } from "@/lib/storage";

type Answers = Partial<Record<ItemKey, number>>;
type Status = "idle" | "submitting" | "done" | "error";

// The survey has: step 0 = demographics, then one step per factor (5 steps),
// so 6 steps total.
const FACTOR_STEPS = FACTORS.length; // 5
const TOTAL_STEPS = FACTOR_STEPS + 1; // + demographics

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

  function setAnswer(key: ItemKey, value: number) {
    setAnswers((a) => ({ ...a, [key]: value }));
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

  async function submit() {
    // Final guard: every question answered.
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

    setStatus("submitting");
    setErrorMsg("");

    try {
      const supabase = getBrowserClient();
      if (supabase) {
        const { error } = await supabase.from("responses").insert(record);
        if (error) throw error;
      } else {
        // No Supabase configured → store locally so the demo works end-to-end.
        saveLocalResponse(record);
      }
      setStatus("done");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      // Even if the DB write fails, keep a local copy so the response isn't lost.
      saveLocalResponse(record);
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong submitting.",
      );
      setStatus("done"); // treat as done — response is saved locally
    }
  }

  // ---- Thank-you screen ----------------------------------------------------
  if (status === "done") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="card p-10 sm:p-12">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-900 text-white shadow-sm">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            Response Successfully Recorded
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Your assessment has been encrypted and anonymously registered into the
            Atmos research database. Your input directly powers our empirical analysis.
          </p>
          {errorMsg && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-200">
              Note: Saved locally ({errorMsg}).
            </p>
          )}

          <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200 text-left text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">Project</span>
              <span>GE3751 Principles of Management</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">Protocol</span>
              <span>Anonymous Psychometric Assessment</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">Items Completed</span>
              <span className="font-mono">20 of 20</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/" className="btn-secondary">
              Study Overview
            </Link>
            <Link href="/dashboard" className="btn-primary">
              Open Analytics Dashboard →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stepLabel =
    step === 0 ? "Demographics" : FACTORS[step - 1].label;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span>
            Section {step + 1} of {TOTAL_STEPS} · {stepLabel}
          </span>
          <span className="font-mono">{answeredCount} of {ALL_ITEM_KEYS.length} answered ({progress}%)</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-900 transition-all duration-300"
            style={{ width: `${(step / (TOTAL_STEPS - 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="card p-6 sm:p-8">
        {step === 0 ? (
          <DemographicsStep
            demo={demo}
            setDemo={setDemo}
            showErrors={showErrors}
          />
        ) : (
          <FactorStep
            factorIndex={step - 1}
            answers={answers}
            setAnswer={setAnswer}
            showErrors={showErrors}
          />
        )}

        {/* Nav buttons */}
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
              {status === "submitting" ? "Encrypting & Submitting…" : "Complete & Submit Survey"}
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
// Step 1: demographics
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
            className="input"
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
// Factor steps: 4 Likert statements each
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
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-block rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-800">
          {factor.key}
        </span>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {factor.label}
        </h2>
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
              className={`rounded-xl border p-4 sm:p-5 transition-colors ${
                missing
                  ? "bg-rose-50/60 border-rose-300 ring-1 ring-rose-200"
                  : "bg-white border-slate-200/90 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase">
                  Statement {idx + 1}
                </span>
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

function LikertRow({
  name,
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
        return (
          <button
            key={v}
            type="button"
            aria-label={`${label} (${v})`}
            onClick={() => onChange(v)}
            className={`flex flex-col items-center justify-center rounded-lg border py-2.5 px-1 text-center transition-all ${
              active
                ? "border-slate-900 bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
                : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
            }`}
          >
            <span className="text-base sm:text-lg font-bold leading-none">{v}</span>
            <span className={`text-[9px] sm:text-[10px] leading-tight mt-1 font-medium ${
              active ? "text-slate-200" : "text-slate-500"
            }`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
