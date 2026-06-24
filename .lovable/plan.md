# Spend Wisely AI — Hackathon Redesign Plan

Goal: transform the app from "dashboard with charts" into **"Your AI Financial Coach"** — clear in 30 seconds, transparent in every number, persona-aware for Students vs Professionals.

---

## 1. Navigation (6 items, down from 7)

```
Home · Transactions · Goals · AI Coach · Investments · Settings
```

- Merge `Add Transaction` into **Transactions** (list + "+ Add" CTA).
- Merge `Budgets`, `Mentor`, `Insights` → new **AI Coach** + **Financial Report** sections.
- Rename `Insights` → **Financial Report** (kept as sub-route under Home or Coach).
- Sidebar icon + label updated; mobile bottom nav mirrors top 5.

## 2. Onboarding — Persona Selection

New first-run modal (or `/onboarding` route) shown when `profiles.onboarding_completed = false`:

1. **Who are you?** → Student / Working Professional → writes `profiles.student_mode`.
2. **Quick basics** → Age, Monthly Income, Risk Appetite (1–5), Investment Experience, Primary Goal Horizon → writes new `investment_profiles` row.

Sets persona-driven defaults; can be re-run from Settings.

## 3. Home Page (rebuilt)

Top row — **exactly 4 cards**:
- Current Balance (renamed from Net Worth — only what we actually track)
- Monthly Income
- Monthly Expenses
- Savings This Month

Then:
- **Financial Health Score** card — big number 0–100 with a transparent breakdown chip-row:
  - Savings Rate (35) · Budget Discipline (25) · Goal Progress (20) · Expense Consistency (15) · Investment Habits (5)
  - Each sub-score shows earned/max and one-line "why".
- **AI Action Center** — max **3** recommendations, each with: insight, *why*, and a CTA ("Set a budget", "Open Coach", "View goal").

Remove duplicate charts already living in Report.

## 4. AI Coach (hero feature)

Convert current `Mentor` page into a **chat-first** experience using AI Elements (`conversation`, `message`, `prompt-input`, `shimmer`).

- Streaming chat backed by existing `financial-mentor` data + new `ai-coach` edge function (uses Lovable AI Gateway, gemini-2.5-flash).
- System prompt feeds: persona, last 30d transactions, budgets, goals, health score.
- Suggested prompts chips: "Where did my money go this week?", "How can I save ₹2,000?", "Am I on track for my Placement Fund?"
- Keeps existing predictions/simulations as a collapsible "Coach Insights" panel under the chat.
- Conversation: **one conversation, localStorage** (no thread sidebar — keeps focus on coaching, no DB cost).

## 5. Goals (new unified page)

Single page merges Challenges + Savings Goals + Placement/Student Goals.

Goal card:
- Name · Target · Saved · Progress % · Est. Completion Date (computed from avg monthly savings to this goal).
- Persona presets:
  - Student: AWS Cert, Placement Prep, Laptop, Higher Studies
  - Pro: Emergency Fund (6× expenses), House Down Payment, Retirement, Vacation
- Tabs: Active / Completed.

Uses existing `savings_goals` + `mentor_challenges` tables; Challenges become a "Weekly Challenges" strip at top.

## 6. Investments (gated by profile)

If no `investment_profiles` row → show a 5-step questionnaire:
Age · Monthly Income · Risk Appetite · Goal Duration · Experience → compute Conservative / Moderate / Aggressive.

Then show generic allocation (no product names — keeps existing constraint):
- "60% Index Fund SIP — because your goal is 10+ years away"
- Each row has a **Why** tooltip.

Student mode hides retirement/aggressive long-term options; emphasizes short-term recurring deposit + low-risk index SIP.

## 7. Financial Report (renamed Insights)

Keeps: Top Categories, Monthly Trend, Savings Growth, Goal Progress, AI Summary.
Removes duplicates already on Home (no second health score, no second balance).
PDF export retained.

## 8. Student Mode — make the toggle real

Settings toggle (`profiles.student_mode`) drives:
- Nav labels ("Pocket Money" vs "Monthly Budget")
- Home AI Action Center prompts
- Goals presets
- Investments hides retirement/tax-saving cards
- Coach system prompt persona

## 9. Premium — remove fake purchase

Replace any "Upgrade" CTA with a disabled **"Premium — Coming Soon"** card listing planned features. No trial activation, no plan changes from client (already enforced by `prevent_profile_plan_change` trigger).

## 10. Design polish

- Keep dark glass aesthetic + ₹ en-IN formatting.
- Every chart gets a 1-line caption explaining what it shows.
- Every AI insight ends with `Why: …`.
- Max 3 highlighted insights per screen.

---

## Technical changes

### Files (create)
- `src/pages/Onboarding.tsx` — persona + basics wizard
- `src/pages/Home.tsx` — replaces current `Dashboard.tsx`
- `src/pages/Coach.tsx` — AI Elements chat (replaces `Mentor.tsx` route)
- `src/pages/Goals.tsx` — unified goals
- `src/pages/Report.tsx` — renamed insights (keep file `Insights.tsx` as redirect)
- `src/components/HealthScoreCard.tsx` — transparent breakdown
- `src/components/AIActionCenter.tsx` — max 3 actions w/ "why"
- `src/components/InvestmentQuestionnaire.tsx`
- `supabase/functions/ai-coach/index.ts` — streaming chat (AI SDK)

### Files (edit)
- `src/App.tsx` — routes: `/home /transactions /goals /coach /investments /report /settings /onboarding`
- `src/components/AppLayout.tsx` — 6-item nav
- `src/pages/Settings.tsx` — Student Mode toggle copy + "Re-run onboarding" + Premium-coming-soon
- `src/pages/Invest.tsx` → split into questionnaire gate + allocation view

### Database (one migration)
- `profiles`: add `onboarding_completed boolean default false`, `persona_age int`, `monthly_income numeric`, `risk_appetite int`, `investment_experience text`, `goal_horizon text`
- `investment_profiles`: already exists — reuse for computed allocation
- No table drops; RLS unchanged (per-user policies already in place)

### AI
- New edge function `ai-coach` using existing `LOVABLE_API_KEY`, `google/gemini-2.5-flash`, streaming via AI SDK `toUIMessageStreamResponse`. Strict rules retained (no specific products).

### Removed / replaced
- `Dashboard.tsx` Net Worth card → Current Balance
- Premium "Start Trial" buttons → "Coming Soon"
- Duplicate health-score widgets in Insights
- Old `Mentor.tsx` becomes Coach Insights panel inside `/coach`

---

## Out of scope (intentionally)

- Real payments / Stripe
- Bank account aggregation
- Multi-currency
- Threaded chat history (one conversation only — keeps focus)

---

Ready to build on your approval. Migration runs first (needs your yes), then frontend + edge function ship together.
