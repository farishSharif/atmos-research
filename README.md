# 🏛️ Atmos — Workplace Environment & Employee Performance Analytics

> **Academic Project for GE3751 – Principles of Management**  
> *An empirical, full-stack executive research platform investigating the quantitative impact of workplace environment dimensions on employee performance.*

---

## 📌 Executive Summary (Elevator Pitch)

Modern organizations frequently rely on subjective intuition or fragmented anecdotal feedback to design workplace policies, often resulting in misallocated HR budgets and suboptimal employee output.

**Atmos** bridges management theory with real-time empirical science. It provides an end-to-end research pipeline featuring:
1. **Anonymous Multi-step Psychometric Survey** (20 Likert-scale items across 4 environmental dimensions + employee performance) with interactive section navigator, real-time live section score tracking, and instant **⚡ Expo Auto-Fill** presets (*High Performer*, *Stress Case*).
2. **Instant Personal Diagnostic Workplace Report** generated dynamically upon submission (personal composite factor breakdown bars and customized workplace persona diagnosis).
3. **Zero-Dependency In-House Statistical Engine** (Sample means, Bivariate Pearson correlation, Ordinary Least Squares multiple linear regression, and Cronbach's alpha reliability).
4. **Password-Gated Executive Dashboard** with dynamic visualization, sector/age breakdowns, primary predictor extraction, and raw CSV dataset export.

---

## 🔬 Conceptual & Theoretical Framework

The study adapts established organizational behavior models into **5 distinct factors** evaluated using a standard 5-point Likert scale (*1 = Strongly Disagree* to *5 = Strongly Agree*):

```mermaid
graph TD
    subgraph Environmental Predictors (Independent Variables)
        PE["<b>Physical Environment (PE)</b><br/>Lighting, Noise, Ergonomics, Hygiene"]
        SE["<b>Social Environment (SE)</b><br/>Peer Support, Leadership, Teamwork, Respect"]
        PS["<b>Psychological Environment (PS)</b><br/>Stress Level, Recognition, Job Security, Autonomy"]
        WL["<b>Facilities & Work-Life (WL)</b><br/>Rest Areas, Flexibility, Tools/Tech, Safety"]
    end

    subgraph Outcome (Dependent Variable)
        EP["<b>Employee Performance (EP)</b><br/>Productivity, Work Quality, Deadline Adherence, Job Satisfaction"]
    end

    PE -->|β₁| EP
    SE -->|β₂| EP
    PS -->|β₃| EP
    WL -->|β₄| EP
```

### The 20-Item Measurement Matrix

| Factor | Code | Dimensions Measured (4 Items Each) |
| :--- | :---: | :--- |
| **Physical Environment** | `PE` | Lighting adequacy (`pe1`), Noise control (`pe2`), Ergonomic seating (`pe3`), Facility hygiene (`pe4`) |
| **Social Environment** | `SE` | Colleague assistance (`se1`), Managerial guidance (`se2`), Team cooperation (`se3`), Workplace respect (`se4`) |
| **Psychological Environment** | `PS` | Workload stress (`ps1`), Effort recognition (`ps2`), Job security (`ps3`), Task autonomy (`ps4`) |
| **Facilities & Work-Life** | `WL` | Break/rest facilities (`wl1`), Schedule flexibility (`wl2`), Modern tools & tech (`wl3`), Physical safety (`wl4`) |
| **Employee Performance** | `EP` | Daily productivity (`ep1`), Quality of output (`ep2`), Deadline consistency (`ep3`), Overall job satisfaction (`ep4`) |

---

## 🧮 Statistical & Analytical Engine

Atmos computes all statistical indicators client/server-side using custom, dependency-free mathematical algorithms (`src/lib/stats.ts`):

### 1. Dimension Composite Means
For each respondent and factor, the score is computed as:
$$\text{Score}(F) = \frac{1}{4} \sum_{i=1}^{4} x_{F,i}$$
*Benchmark:* $\ge 3.50$ = Positive evaluation; $2.50 - 3.49$ = Neutral threshold; $< 2.50$ = Critical intervention required.

### 2. Pearson Product-Moment Correlation ($r$)
Quantifies the bivariate linear association between each environmental factor ($X$) and employee performance ($Y$):
$$r = \frac{\sum (X - \bar{X})(Y - \bar{Y})}{\sqrt{\sum (X - \bar{X})^2 \sum (Y - \bar{Y})^2}}$$
- $|r| \ge 0.70$: Strong association
- $0.40 \le |r| < 0.70$: Moderate association
- $0.20 \le |r| < 0.40$: Weak association

### 3. Multiple Linear Regression (Ordinary Least Squares)
Estimates the simultaneous predictive contribution of all four environmental dimensions:
$$\text{Performance} = \beta_0 + \beta_1(\text{PE}) + \beta_2(\text{SE}) + \beta_3(\text{PS}) + \beta_4(\text{WL})$$
- **Resolution Technique:** Solved analytically using the Normal Equations $\mathbf{\beta} = (\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T\mathbf{y}$ via Gaussian elimination.
- **Model Goodness-of-Fit ($R^2$):** Computes $1 - \frac{SS_{\text{res}}}{SS_{\text{tot}}}$, denoting the percentage of performance variance explained by the environmental model.
- **Primary Predictor Detection:** Automatically highlights the factor with the highest standardized coefficient $\beta$.

### 4. Cronbach's Alpha ($\alpha$) Reliability
Assesses the internal consistency reliability of the 4-item scales:
$$\alpha = \frac{k}{k - 1} \left( 1 - \frac{\sum_{i=1}^k \sigma_i^2}{\sigma_X^2} \right)$$
- An $\alpha \ge 0.70$ satisfies accepted psychometric standards for organizational surveys.

---

## 💻 Tech Stack & Architecture

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server-side API Route Handlers)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict type-safety across models and stats)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Executive dark slate / navy aesthetic)
- **Data Visualization:** [Recharts](https://recharts.org/) (Bar charts, distribution pies, reference line correlations)
- **Database / Backend:** [Supabase](https://supabase.com/) (PostgreSQL with Row-Level Security policies)
- **Offline / Standalone Resilience:** Dual-tier storage with `localStorage` fallback + instant 40-respondent realistic dataset simulator for offline exhibition booths.

---

## 📂 Project Directory Structure

```text
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Executive landing page & research rationale
│   │   ├── survey/
│   │   │   └── SurveyForm.tsx       # Multi-step validated survey with progress indicator
│   │   ├── dashboard/
│   │   │   ├── page.tsx             # Dashboard route wrapper
│   │   │   └── Dashboard.tsx        # Password-gated analytics suite & visualizers
│   │   └── api/
│   │       └── responses/
│   │           └── route.ts         # Secure server-side route (service-role database read)
│   ├── lib/
│   │   ├── stats.ts                 # Custom math engine (Mean, Pearson r, OLS Regression, Cronbach's alpha)
│   │   ├── questions.ts             # Factor definitions, Likert statements & demographics
│   │   ├── demo.ts                  # Statistically coherent 40-record sample generator
│   │   ├── storage.ts               # LocalStorage resilience handler
│   │   ├── supabaseClient.ts        # Public anon + server service role clients
│   │   ├── csv.ts                   # CSV raw matrix export utility
│   │   └── types.ts                 # TypeScript type interfaces
├── supabase/
│   └── schema.sql                   # Postgres table definition & Row-Level Security (RLS) rules
├── .env.example                     # Environment template
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Offline / Standalone Demo Mode (Zero Setup Required)
Run Atmos instantly on any laptop without configuring external databases:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

1. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
2. Visit `/survey` to submit a real response (saved in your browser).
3. Access `/dashboard`, authenticate with password: **`admin123`**.
4. Check **"Simulate Demo Dataset (40)"** to immediately populate all statistical charts and regression outputs.

---

### 2. Production Setup with Supabase (Cloud Database)

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in Supabase and execute [`supabase/schema.sql`](supabase/schema.sql).
   - Configures the `responses` table.
   - Enforces **Row Level Security (RLS)**: Public anonymous clients can only *insert* responses; *reads* require the server-side service role key.
3. Create `.env.local` based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
4. Populate your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ADMIN_PASSWORD="admin123"
   ```
5. Restart your server (`npm run dev`). Responses will now persist directly to PostgreSQL.

---

## 🎙️ Expo Presentation Script (Live Booth Walkthrough)

When presenting Atmos to visitors, judges, or professors at the expo, follow this 4-step sequence:

```
[1. Landing Page]  -->  [2. Survey Form]  -->  [3. Auth Gate]  -->  [4. Executive Dashboard]
   "The Problem"           "Data Capture"         "Data Privacy"         "Empirical Insights"
```

1. **The Entry (`/`):**
   - Introduce the project context for *Principles of Management (GE3751)*.
   - Highlight the clean, distraction-free interface reassuring respondents of 100% anonymity.
2. **The Survey Interface (`/survey`):**
   - Demonstrate the demographic collection (Sector, Age group, Gender).
   - Showcase the sectioned 20 Likert items with real-time validation and progress tracking.
3. **The Executive Portal Gate (`/dashboard`):**
   - Enter `admin123`.
   - Explain: *"Access is restricted to authorized investigators to protect raw organizational metrics."*
4. **The Analytics Suite:**
   - **Simulate Demo Dataset:** Toggle the 40-record sample dataset.
   - **Composite Means:** Compare physical vs psychological workplace scores.
   - **Bivariate Correlation:** Show which factor exhibits the highest Pearson $r$.
   - **Multiple Regression Analysis:** Highlight the **$R^2$ score** (e.g., $R^2 = 0.65 \rightarrow 65\%$ variance explained) and identify the **Primary Predictor**.
   - **Cronbach's Alpha:** Prove survey validity by showing subscale alphas $\ge 0.70$.
   - **CSV Export:** Click **Export Dataset (CSV)** to demonstrate interoperability with SPSS, R, or Excel.

---

## 💼 Managerial Implications (The "So What?")

| Finding Pattern | Typical Managerial Mistake | Atmos Empirical Recommendation |
| :--- | :--- | :--- |
| **High Physical Score, Low Performance Correlation** | Spending heavily on cosmetic office renovations. | Capital is better diverted into leadership development and workflow autonomy. |
| **High Psychological Beta ($\beta_3$)** | Treating burnout solely as an individual wellness issue. | Redesign workload distribution, introduce formal recognition programs, and ensure psychological safety. |
| **Low Work-Life / Facilities Score** | Enforcing rigid on-site attendance without tool support. | Provide flexible schedules and modern productivity software to remove operational friction. |

---

## ❓ Frequently Asked Questions (Viva / Examiner Q&A)

**Q1: Why use Multiple Linear Regression instead of simple correlation?**  
> *Pearson's correlation only evaluates two variables in isolation and can be confounded by common causes. Multiple Regression isolates the unique contribution of each environmental dimension while holding the others constant, revealing which factor has the true primary impact.*

**Q2: What is the significance of Cronbach's Alpha in this study?**  
> *It verifies that the 4 questions measuring each factor actually measure the same underlying construct. An alpha value $\ge 0.70$ provides statistical proof that our measurement scale is reliable and free from random semantic noise.*

**Q3: How is data privacy safeguarded?**  
> *Zero PII (names, emails, employee IDs) is collected. On Supabase, Row-Level Security prevents public users from reading database entries—only the authenticated server backend can query records.*

**Q4: Can this platform handle large enterprise deployments?**  
> *Yes. Built on Next.js and PostgreSQL, Atmos handles thousands of simultaneous responses with low latency and instant CSV dumps for downstream econometric tools.*

---

## 📄 License & Attribution

Developed as a college mini-project for **GE3751 – Principles of Management**.  
Free for academic and educational evaluation.
