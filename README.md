# Premeth v2

A free, no-signup-required MDCAT prep platform — rebuilt on Next.js + Supabase.

This is the **frontend application** that consumes the open-source [premeth-data](https://github.com/eldrickbnt/premeth-data) MCQ dataset (2,500+ past papers, 400,000+ questions). It's a complete rebuild of premeth.com that adds three things students explicitly asked for:

1. **Diagrams render inline** — questions with figures now show them next to the question instead of leaving them invisible.
2. **Reportable questions** — students can flag wrong answers, typos, and missing diagrams in two clicks. Reports go to a Supabase table for maintainers to review.
3. **Accounts (optional)** — sign up to save attempts, track weak topics, and get a dashboard. Practice still works fully without an account.

Plus a built-in HTML-canvas **scratchpad** for free-body diagrams, organic structures, and working-out, right next to the paper.

---

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** with a custom design system (lab-green on ink, paper-cream explanation cards, Fraunces display + Inter body)
- **Supabase** for auth, Postgres, and Storage (avatars + paper JSON)
- **GSAP** + `@gsap/react` for entrance and scroll-triggered animations
- **Sonner** for toast notifications
- Hosted on **Vercel** (free tier) — the heavy paper data lives in Supabase Storage so the deploy stays tiny

---

## Quick start (local development)

### 1. Clone and install

```bash
git clone <this-repo>
cd premeth-app
npm install
```

### 2. Create a Supabase project

1. Go to <https://app.supabase.com> and create a new project (free tier is fine).
2. From the project dashboard, grab the **Project URL** and **anon key** (Project Settings → API).

### 3. Run the database migration

In Supabase Studio → **SQL Editor** → New Query, paste the contents of [`supabase/migrations/0001_initial.sql`](./supabase/migrations/0001_initial.sql) and hit **Run**.

This creates:
- `profiles` table (one row per user, with username + avatar_url)
- `attempts` table (saved practice sessions)
- `question_reports` table (flagged MCQs)
- An auto-trigger that creates a profile row when a user signs up
- Two public Storage buckets: `avatars` and `premeth-data`
- Row-level security policies for everything

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Then fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The **service role key** is only used by the one-time data upload script. Never expose it to the client or commit it.

### 5. Upload the MCQ data to Supabase Storage

Clone the data repo somewhere on your machine:

```bash
git clone https://github.com/eldrickbnt/premeth-data ../premeth-data
```

Then push every paper JSON to the `premeth-data` Storage bucket:

```bash
npm run upload-data -- ../premeth-data
```

This uploads ~2,600 JSON files (~540 MB total). It's resumable — re-running skips files already there. On a normal connection it takes 5–10 minutes.

If you ever update the dataset, also re-bundle the catalog indexes:

```bash
npm run build-indexes -- ../premeth-data
```

This writes `lib/data/indexes.ts` (~1 MB) which ships with the app for instant catalog browsing.

### 6. Configure Supabase Auth email templates (optional but recommended)

In Supabase Studio → **Authentication → Email Templates**, edit the "Reset password" template's link to point to:

```
{{ .SiteURL }}/reset-password
```

And the "Confirm signup" link to:

```
{{ .SiteURL }}/auth/callback
```

Then in **Authentication → URL Configuration**, set **Site URL** to `http://localhost:3000` for dev (and your production URL on Vercel later). Add `http://localhost:3000/**` and `https://your-domain.com/**` to the **Redirect URLs** allow-list.

### 7. Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Go to <https://vercel.com> → **New Project** → import the repo.
3. Add the same four env vars from `.env.local` in **Project Settings → Environment Variables**. Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL (e.g. `https://premeth.vercel.app`) or your custom domain.
4. Deploy.
5. Back in Supabase Studio → **Authentication → URL Configuration**, replace the dev URL with your production URL.

Total cost: $0/month on Vercel free tier + Supabase free tier (good for ~50k MAU and 1 GB storage — the data is ~540 MB).

---

## Project structure

```
app/
  ├── page.tsx                       # Landing page
  ├── layout.tsx                     # Root layout, fonts, toaster
  ├── globals.css                    # Tailwind + custom animations + brand colors
  ├── exams/page.tsx                 # Browse all 31 categories
  ├── papers/[category]/page.tsx     # Paper list per category
  ├── practice/[category]/[paperId]/page.tsx   # The quiz — diagrams, reports, keyboard nav
  ├── draw/page.tsx                  # HTML-canvas scratchpad
  ├── profile/page.tsx               # Avatar, username, password
  ├── dashboard/page.tsx             # Attempt history + weak-topic analysis
  ├── about/page.tsx                 # About page
  ├── login/, signup/, forgot-password/, reset-password/   # Auth pages
  └── auth/callback/route.ts         # Email-link auth handler

components/
  ├── Navbar.tsx, Footer.tsx, AuthShell.tsx
  ├── Hero.tsx, Features.tsx, Marquee.tsx, FAQ.tsx
  ├── QuestionImage.tsx              # Inline diagram with fallback
  └── ReportModal.tsx                # Question reporting flow

lib/
  ├── supabase/{client,server,middleware}.ts
  ├── types.ts                       # Question / Paper / Attempt / Report
  ├── categories.ts                  # 31 categories with names + descriptions
  ├── data.ts                        # fetchIndex / fetchPaper helpers
  └── data/indexes.ts                # Auto-generated bundled catalog (~960 KB)

scripts/
  ├── build-indexes.mjs              # Bundle index.json files into the app
  └── upload-data.mjs                # Push paper JSON to Supabase Storage

supabase/migrations/
  └── 0001_initial.sql               # DB schema + RLS + buckets

middleware.ts                        # Refreshes Supabase auth session on every request
```

---

## Design system

The brand identity intentionally extends the original premeth.com voice ("Ensuring premed students stay premeth", Heisenberg-lab humor) rather than flattening it into another generic ed-tech grotesque.

| Layer       | Choice                                                              |
| ----------- | ------------------------------------------------------------------- |
| Background  | `#0a0a0a` ink with subtle 56px grid + green ambient orbs            |
| Accent      | `#3ee089` "meth" green — used sparingly, never as a wash            |
| Text        | `#f7f3ec` paper-cream (warm white) over ink                         |
| Explanation | Reverses to paper-cream background with ink text — like a lab note  |
| Display     | **Fraunces** (variable serif) — literary, slightly playful           |
| Body        | **Inter** — clean, neutral, lets the display do the work             |

### Motion principles (Emil Kowalski's framework)

All UI animations follow these rules:

- **No `transition: all`** — every transition specifies exact properties (color, transform, border-color, background-color).
- **No `ease-in` on UI** — it makes interfaces feel sluggish. We use `ease-out` for entries and the custom strong curves stored as CSS variables: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.
- **High-frequency = no animation.** The question-card swap on the practice page (which can fire 100+ times per session) animates in 180ms with an 8px translate — fast enough to feel like instant feedback, not a transition.
- **One-time = can breathe.** The hero entrance and scroll-revealed sections use 400–800ms staggered timelines because users see them once per session.
- **Press feedback** is `transform: scale(0.97)` on `:active` for all buttons that opt into the `.press` class.
- **Hover lift** is gated behind `@media (hover: hover) and (pointer: fine)` so touch devices don't get false-positive transforms on tap.

### Design review pass (Emil-style)

A before/after audit of the most-touched surfaces:

| Before                                                                  | After                                                                              | Why                                                                                       |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Generic `transition-all duration-300`                                   | `transition: color 160ms var(--ease-out), background-color 160ms var(--ease-out)`  | `all` is wasteful and hurts perf; named properties tell the GPU exactly what to composite |
| Modal entrance with `scale(0)`                                          | `scale(0.96) translateY(8px)` with opacity                                         | Nothing in real life appears from literal nothing — start near, not at zero               |
| Question-card swap with 400ms ease-in-out                               | 180ms `power2.out` + 8px translate                                                 | Question swap fires often; users feel sluggishness over 200ms                             |
| Generic `ease-out` (CSS default)                                        | `cubic-bezier(0.23, 1, 0.32, 1)` (strong)                                          | CSS defaults lack punch; the strong curve makes animations feel intentional               |
| Hover `scale(1.05)` ungated                                             | Wrapped in `@media (hover: hover) and (pointer: fine)`                             | Touch devices fire hover on tap, causing false positives                                  |
| Answer-button entrance animation                                        | None — only state transitions                                                       | Options are visible immediately; movement adds latency to a decision-heavy moment         |
| Toast with fixed 4s timer                                               | Sonner's swipe-to-dismiss + auto-pause when tab hidden                             | Handles edge cases the user never notices                                                 |
| Same enter/exit speed for explanation card                              | Enter `fade-up 280ms`, no exit animation (it's destroyed on question change)       | Exits should be faster than enters; here, the unmount is effectively instant              |

---

## How the data layer works

Two-tier strategy to keep the Vercel deploy slim:

**Tier 1 (bundled with app):** The 31 `index.json` files (~960 KB combined) live in `lib/data/indexes.ts` as a TypeScript module. The catalog (browse categories, browse papers, filter by subject) renders instantly with zero network requests.

**Tier 2 (Supabase Storage):** The individual paper JSON files (~540 MB total) live in a public `premeth-data` Storage bucket. When a student opens a paper, the app fetches just that one JSON file (typically 50–500 KB), cached by Vercel's edge for an hour and by the browser for far longer (`Cache-Control: max-age=31536000` since the content is immutable).

This means:
- Vercel deploy is ~5 MB.
- Adding 1,000 more papers doesn't increase deploy size.
- Page load is instant for the catalog, ~200 ms for a paper start.

---

## Adding new MCQs

The data lives in a separate repo so anyone can PR a fix without touching the frontend. Workflow:

1. Fork [premeth-data](https://github.com/eldrickbnt/premeth-data).
2. Add or fix a JSON file. The schema is documented in that repo's README.
3. Send a PR.
4. When merged, the maintainer re-runs `npm run build-indexes` and `npm run upload-data` to push the changes to Supabase.

---

## Admin: reviewing question reports

Reports are stored in the `question_reports` table. To review them, log into Supabase Studio → **Table Editor → question_reports** and filter by `status = 'open'`. Update the `status` column to `reviewed`, `fixed`, or `dismissed` as you triage them.

(A built-in admin dashboard at `/admin/reports` would be a natural next addition.)

---

## License

The app code is MIT. The MCQ dataset has its own license — see the data repo.

Built on the original premeth.com by the open-source community.
