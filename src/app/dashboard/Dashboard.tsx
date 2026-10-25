"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SurveyRecord } from "@/lib/types";
import { FACTORS } from "@/lib/questions";
import {
  allAlphas,
  correlationsWithPerformance,
  countBy,
  factorAverages,
  multipleRegression,
} from "@/lib/stats";
import { generateDemoData } from "@/lib/demo";
import { loadLocalResponses } from "@/lib/storage";
import { downloadCsv } from "@/lib/csv";

const PALETTE = ["#0f172a", "#1e3a8a", "#334155", "#475569", "#64748b", "#2563eb"];

export default function Dashboard() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  const [dbRows, setDbRows] = useState<SurveyRecord[]>([]);
  const [localRows, setLocalRows] = useState<SurveyRecord[]>([]);
  const [demoRows, setDemoRows] = useState<SurveyRecord[]>([]);
  const [useDemo, setUseDemo] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setAuthError(json?.error || "Invalid administrator password");
        setLoading(false);
        return;
      }
      setDbRows(json.rows ?? []);
      setLocalRows(loadLocalResponses());
      setAuthed(true);
    } catch {
      setAuthError("Could not connect to the survey database.");
    } finally {
      setLoading(false);
    }
  }

  function toggleDemo() {
    setUseDemo((prev) => {
      const nextVal = !prev;
      if (nextVal && demoRows.length === 0) setDemoRows(generateDemoData(40));
      return nextVal;
    });
  }

  // Combine whatever real data exists; optionally add 40 demo rows.
  const data: SurveyRecord[] = useMemo(() => {
    const real = [...dbRows, ...localRows];
    return useDemo ? [...real, ...demoRows] : real;
  }, [dbRows, localRows, demoRows, useDemo]);

  if (!authed) {
    return <LoginGate {...{ login, password, setPassword, authError, loading }} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <Toolbar
        count={data.length}
        useDemo={useDemo}
        toggleDemo={toggleDemo}
        onExport={() => downloadCsv(data, "atmos_dataset.csv")}
      />

      {data.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 border-dashed">
          <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-slate-800">No Responses in Database</p>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Enable <strong>Simulate Demo Dataset (40)</strong> in the top toolbar to preview the full statistical engine, or submit a response via the survey.
          </p>
          <button onClick={toggleDemo} className="btn-secondary mt-5">
            Load 40 Sample Responses
          </button>
        </div>
      ) : (
        <>
          <StatCards data={data} />
          <FactorAveragesChart data={data} />
          <div className="grid gap-6 lg:grid-cols-2">
            <DemographicChart data={data} field="sector" title="Sample Distribution by Sector" kind="pie" />
            <DemographicChart data={data} field="age_group" title="Sample Distribution by Age Bracket" kind="bar" />
          </div>
          <CorrelationSection data={data} />
          <RegressionSection data={data} />
          <ReliabilitySection data={data} />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login gate
// ---------------------------------------------------------------------------
function LoginGate({
  login,
  password,
  setPassword,
  authError,
  loading,
}: {
  login: (e: React.FormEvent) => void;
  password: string;
  setPassword: (s: string) => void;
  authError: string;
  loading: boolean;
}) {
  return (
    <div className="mx-auto max-w-sm pt-8">
      <form onSubmit={login} className="card p-8 sm:p-10">
        <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white font-mono font-bold text-sm shadow-sm">
          A
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Executive Analytics Portal
        </h1>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          Access restricted to authorized project investigators (GE3751 Management Studies).
        </p>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Access Password
            </span>
            <input
              type="password"
              className="input font-mono"
              placeholder="Enter password…"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </label>
        </div>

        {authError && (
          <p className="mt-3 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700">
            {authError}
          </p>
        )}

        <button type="submit" className="btn-primary mt-5 w-full" disabled={loading}>
          {loading ? "Authenticating Session…" : "Unlock Analytics Suite"}
        </button>

        <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          Default evaluation credentials: <code className="font-mono text-slate-700 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">admin123</code>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------
function Toolbar({
  count,
  useDemo,
  toggleDemo,
  onExport,
}: {
  count: number;
  useDemo: boolean;
  toggleDemo: () => void;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Analytics Suite
          </h1>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-semibold text-slate-700">
            n = {count}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Empirical evaluation of workplace environmental factors on organizational performance.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
          <input
            type="checkbox"
            checked={useDemo}
            onChange={toggleDemo}
            className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <span>Simulate Demo Dataset (40)</span>
        </label>
        <button
          onClick={onExport}
          className="btn-secondary text-xs py-2 px-3.5"
          disabled={count === 0}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Export Dataset (CSV)</span>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat cards — average per factor
// ---------------------------------------------------------------------------
function StatCards({ data }: { data: SurveyRecord[] }) {
  const averages = factorAverages(data);
  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Factor Composite Means (Scale 1.00 – 5.00)
        </h2>
        <span className="text-[11px] text-slate-400">Benchmark: 3.00 (Neutral threshold)</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {FACTORS.map((f) => (
          <div key={f.key} className="card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                {f.key}
              </span>
              <span className="text-[11px] font-medium text-slate-500">{f.short}</span>
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                {averages[f.key].toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 ml-1">/ 5.00</span>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-1.5">
              {averages[f.key] >= 3.5
                ? "Positive evaluation"
                : averages[f.key] >= 2.5
                ? "Neutral evaluation"
                : "Needs intervention"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Factor-wise averages bar chart
// ---------------------------------------------------------------------------
function FactorAveragesChart({ data }: { data: SurveyRecord[] }) {
  const averages = factorAverages(data);
  const chartData = FACTORS.map((f) => ({
    name: f.short,
    code: f.key,
    average: Number(averages[f.key].toFixed(2)),
  }));
  return (
    <ChartCard
      title="Dimension Mean Comparison"
      subtitle="Mean Likert score (1–5) across all 5 organizational dimensions."
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#475569" }} stroke="#cbd5e1" />
          <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: "#475569" }} stroke="#cbd5e1" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="average" radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Demographic breakdown (pie or bar)
// ---------------------------------------------------------------------------
function DemographicChart({
  data,
  field,
  title,
  kind,
}: {
  data: SurveyRecord[];
  field: keyof SurveyRecord;
  title: string;
  kind: "pie" | "bar";
}) {
  const chartData = countBy(data, field);
  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={260}>
        {kind === "pie" ? (
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={85}
              stroke="#ffffff"
              strokeWidth={2}
              label={({ name, value }) => `${name} (${value})`}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                fontSize: "12px",
              }}
            />
          </PieChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} stroke="#cbd5e1" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#475569" }} stroke="#cbd5e1" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Correlation vs performance
// ---------------------------------------------------------------------------
function CorrelationSection({ data }: { data: SurveyRecord[] }) {
  const corr = correlationsWithPerformance(data);
  const chartData = corr.map((c) => ({ name: c.label, r: Number(c.r.toFixed(3)) }));
  return (
    <ChartCard
      title="Bivariate Correlation with Employee Performance"
      subtitle="Pearson's product-moment correlation coefficient (r) between each environmental predictor and performance."
    >
      <div className="grid gap-6 lg:grid-cols-2 items-center">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 11, fill: "#475569" }} stroke="#cbd5e1" />
            <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "#475569" }} stroke="#cbd5e1" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                fontSize: "12px",
              }}
            />
            <ReferenceLine x={0} stroke="#64748b" strokeWidth={1.5} />
            <Bar dataKey="r" radius={[0, 4, 4, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.r >= 0 ? "#0f172a" : "#e11d48"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-left border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-3.5 py-2.5 font-semibold uppercase tracking-wider text-[11px]">Environmental Factor</th>
                <th className="px-3.5 py-2.5 font-semibold uppercase tracking-wider text-[11px]">Pearson r</th>
                <th className="px-3.5 py-2.5 font-semibold uppercase tracking-wider text-[11px]">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {corr.map((c) => (
                <tr key={c.factor} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 font-medium text-slate-800">{c.label}</td>
                  <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900">
                    {c.r > 0 ? `+${c.r.toFixed(3)}` : c.r.toFixed(3)}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="inline-block rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                      {strengthLabel(c.r)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ChartCard>
  );
}

function strengthLabel(r: number): string {
  const a = Math.abs(r);
  if (a >= 0.7) return "Strong Association";
  if (a >= 0.4) return "Moderate Association";
  if (a >= 0.2) return "Weak Association";
  return "Negligible";
}

// ---------------------------------------------------------------------------
// Multiple linear regression
// ---------------------------------------------------------------------------
function RegressionSection({ data }: { data: SurveyRecord[] }) {
  const reg = multipleRegression(data);
  return (
    <ChartCard
      title="Multiple Linear Regression Analysis"
      subtitle="Ordinary Least Squares (OLS) specification: Performance ~ β₀ + β₁(PE) + β₂(SE) + β₃(PS) + β₄(WL)"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="stat-card lg:col-span-1 justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Model Fit (R² Coefficient)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-slate-900 font-mono">
                {reg.rSquared.toFixed(3)}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({(reg.rSquared * 100).toFixed(1)}% explained)
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Indicates the proportion of variance in overall employee performance predictable from the four environmental dimensions combined.
            </p>
          </div>

          {reg.strongest && (
            <div className="mt-4 rounded-lg bg-slate-100 border border-slate-200 p-3 text-xs text-slate-800">
              <div className="font-semibold text-slate-900 mb-0.5">Primary Predictor</div>
              <div>
                <strong>{reg.strongest.label}</strong> exerts the strongest relative coefficient (β = {reg.strongest.beta.toFixed(3)}).
              </div>
            </div>
          )}

          <div className="mt-3 text-[11px] text-slate-400 font-mono">
            Intercept β₀ = {reg.intercept.toFixed(3)} · Sample n = {reg.n}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 lg:col-span-2">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-left border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-3.5 py-2.5 font-semibold uppercase tracking-wider text-[11px]">Independent Variable</th>
                <th className="px-3.5 py-2.5 font-semibold uppercase tracking-wider text-[11px]">Regression Weight (β)</th>
                <th className="px-3.5 py-2.5 font-semibold uppercase tracking-wider text-[11px]">Relationship</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reg.coefficients.map((c) => (
                <tr key={c.factor} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 font-medium text-slate-800">{c.label}</td>
                  <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900">
                    {c.beta >= 0 ? `+${c.beta.toFixed(3)}` : c.beta.toFixed(3)}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-semibold ${
                      c.beta >= 0
                        ? "border-slate-200 bg-slate-100 text-slate-800"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}>
                      {c.beta >= 0 ? "Positive Correlation" : "Negative Correlation"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-3.5 py-2.5 bg-slate-50/60 text-[11px] text-slate-500">
            Each unstandardized β represents the estimated change in the 5-point performance index per 1.0 unit increase in the environmental predictor, holding all other variables constant.
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Reliability — Cronbach's alpha
// ---------------------------------------------------------------------------
function ReliabilitySection({ data }: { data: SurveyRecord[] }) {
  const alphas = allAlphas(data);
  return (
    <ChartCard
      title="Scale Reliability (Cronbach's Alpha)"
      subtitle="Internal consistency assessment for each 4-statement dimension. George & Mallery (2003) standard: α ≥ 0.70 is acceptable."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {alphas.map((a) => {
          const ok = a.alpha >= 0.7;
          return (
            <div key={a.factor} className="card p-4 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-500">
                {a.label}
              </span>
              <div className="my-2">
                <span className="text-2xl font-extrabold font-mono tracking-tight text-slate-900">
                  {a.alpha.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 ml-1">α</span>
              </div>
              <span
                className={`inline-block w-fit rounded border px-2 py-0.5 text-[10px] font-semibold ${
                  ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {ok ? "Reliable (α ≥ 0.70)" : "Below Threshold"}
              </span>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Shared chart card wrapper
// ---------------------------------------------------------------------------
function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      {subtitle && <p className="mb-4 mt-0.5 text-xs text-slate-500 leading-relaxed">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </section>
  );
}
