# Atmos

**Impact of Workplace Environment on Employee Performance**
A college mini project for **GE3751 – Principles of Management**.

Atmos is an executive web application that collects a 20-item workplace survey and
analyses it on an analytics dashboard with mean scores, Pearson correlation,
multiple linear regression, and Cronbach's alpha reliability.

> **Runs out of the box with zero setup.** Without a database it saves
> responses to the browser (`localStorage`) and the dashboard has a **Simulate Demo
> Dataset** toggle that generates 40 realistic responses — so you always have a
> working demo. Add Supabase env vars to switch to a real shared database.

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (Executive slate/navy palette, professional typography)
- **Supabase** (Postgres) — optional
- **Recharts** for charts

---

## Pages

| Route        | What it does |
|--------------|--------------|
| `/`          | Landing page — intro, objective, "Take the Survey" button |
| `/survey`    | Multi-step form: demographics + 20 Likert statements, progress bar, full validation, thank-you screen |
| `/dashboard` | Password-protected analytics: stat cards, charts, correlation, regression, Cronbach's alpha, CSV export, demo-data toggle |

---

## Quick start (demo mode — no database)

```bash
npm install
npm run dev
``` 

Open **http://localhost:3000**.

1. Fill in the survey at `/survey` (saved to your browser).
2. Go to `/dashboard`, enter the password **`admin123`**.
3. Tick **Load demo data (40)** to populate every chart instantly.

That's the full demo — no Supabase needed.

---

## Full setup with Supabase (shared database)

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase **SQL Editor**, run the contents of
   [`supabase/schema.sql`](supabase/schema.sql). This creates the `responses`
   table and enables **Row Level Security**:
   - the public/anon key may **insert** survey responses only;
   - reads are blocked for the browser and happen **server-side** via the
     service-role key (used by `/api/responses`).
3. Copy `.env.example` to `.env.local` and fill in:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Where to find it |
   |----------|------------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → `anon` public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` key (server only) |
   | `ADMIN_PASSWORD` | Any password for the dashboard (default `admin123`) |

4. Restart `npm run dev`. The survey now writes to Postgres, and the dashboard
   reads real rows through the server route.

---

## Project structure

```
src/
  app/
    page.tsx                 Landing page
    survey/                  Multi-step survey (client form)
    dashboard/               Password-gated analytics dashboard
    api/responses/route.ts   Server read route (password + service key)
  lib/
    stats.ts                 ★ All statistics (mean, Pearson r, regression, Cronbach's alpha) — commented
    questions.ts             The 5 factors & 20 statements
    demo.ts                  40-row demo-data generator
    storage.ts               localStorage fallback
    supabaseClient.ts        Browser (anon) + server (service) clients
    csv.ts                   CSV export
    types.ts                 Shared types
supabase/schema.sql          Postgres schema + RLS policies
.env.example                 Environment variable template
```

The five factors (4 items each):

- **PE** Physical Environment — lighting, noise, ergonomics, cleanliness
- **SE** Social Environment — colleague/manager support, cooperation, respect
- **PS** Psychological Environment — stress, recognition, job security, autonomy
- **WL** Facilities & Work-Life — rest areas, flexible hours, tools, safety
- **EP** Employee Performance — productivity, quality, deadlines, satisfaction

---

## The statistics (`src/lib/stats.ts`)

- **Mean / variance** — descriptive scores per factor.
- **Pearson's r** — correlation of each environment factor with Performance.
- **Multiple linear regression** — `Performance ~ PE + SE + PS + WL` solved with
  the normal equations (`β = (XᵀX)⁻¹Xᵀy`) via Gaussian elimination. Reports R²,
  coefficients, and the factor with the strongest impact.
- **Cronbach's alpha** — reliability of each 4-item factor (≥ 0.70 = acceptable).

All of it is plain, dependency-free math with comments so it's easy to explain
in the report.

---

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Add the environment variables (same as `.env.local`) under
   **Settings → Environment Variables**. (Skip them to deploy in demo mode.)
4. Click **Deploy**. Vercel auto-detects Next.js — no extra config needed.

---

## Notes for the report

- Survey is anonymous; no login is required to respond.
- The dashboard is the "admin/researcher" view and is password protected.
- CSV export gives the raw response matrix for analysis in Excel/SPSS if needed.
