import Link from "next/link";
import { FACTORS } from "@/lib/questions";

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-10">
      {/* Hero Section */}
      <section className="card p-8 sm:p-12 relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
            GE3751 · Principles of Management
          </span>
          <span className="inline-flex items-center rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
            Academic Research Study
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-[1.15]">
          Impact of Workplace Environment on Employee Performance
        </h1>

        <p className="mt-5 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
          Atmos is an empirical research instrument assessing how physical ergonomics,
          interpersonal dynamics, psychological safety, and organizational facilities
          directly influence employee productivity and output quality.
        </p>

        {/* Action Row */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/survey" className="btn-primary">
            Begin Survey Assessment
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            View Analytics Suite
          </Link>
        </div>

        {/* Protocol Meta Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-500">
          <div>
            <div className="font-semibold text-slate-800">No Sign-in</div>
            <div>Completely anonymous</div>
          </div>
          <div>
            <div className="font-semibold text-slate-800">~3 Minutes</div>
            <div>Quick 20 statements</div>
          </div>
          <div>
            <div className="font-semibold text-slate-800">5 Dimensions</div>
            <div>Physical to Performance</div>
          </div>
          <div>
            <div className="font-semibold text-slate-800">Live Analytics</div>
            <div>OLS & Pearson correlation</div>
          </div>
        </div>
      </section>

      {/* Core Research Framework */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-5 gap-1">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Evaluated Dimensions
            </h2>
            <p className="text-sm text-slate-500">
              Standardized 5-point Likert psychometric scale measuring four environmental inputs and organizational output.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            5 Factors · 20 Items
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FACTORS.map((f) => (
            <div key={f.key} className="card-hover p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-bold font-mono text-slate-800">
                    {f.key}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {f.items.length} items
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {f.label}
                </h3>
              </div>
              <p className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                {f.key === "PE" && "Lighting, acoustics, workstation comfort, sanitation."}
                {f.key === "SE" && "Peer collaboration, managerial support, team respect."}
                {f.key === "PS" && "Workload balance, recognition, security, autonomy."}
                {f.key === "WL" && "Break spaces, scheduling flexibility, tooling."}
                {f.key === "EP" && "Productivity, deliverable quality, meeting deadlines."}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Methodology & Analytical Pillars */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            01 / Objectives
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-2">
            Empirical Identification
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Quantify which specific dimension of workplace design exerts the strongest
            influence on employee productivity and retention within modern organizational environments.
          </p>
        </div>

        <div className="card p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            02 / Methodology
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-2">
            Statistical Validation
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Responses are analyzed using Ordinary Least Squares (OLS) multiple regression,
            Pearson bivariate correlations (r), and Cronbach&apos;s alpha internal reliability tests.
          </p>
        </div>

        <div className="card p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            03 / Interventions
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-2">
            Managerial Decisions
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Provides evidence-based decision guidance for organizational leaders allocating capital
            toward facilities, ergonomic improvements, and leadership culture.
          </p>
        </div>
      </section>
    </div>
  );
}
