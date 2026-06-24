# Project Memory

## Core
- Spend Wisely AI is "Your AI Financial Coach" for Students & Working Professionals. Clarity > complexity. Every AI insight ends with a **Why:** line. Max 3 highlighted insights per screen.
- Stack: React 18, TS, Tailwind, Supabase (RLS/Auth/Edge), Gemini AI via Lovable AI Gateway.
- UI: Dark-first, glassmorphism, Framer Motion. Primary currency is Indian Rupee (₹) globally (en-IN).
- Navigation (6 items): Home · Transactions · Goals · AI Coach · Investments · Settings. Old routes `/dashboard /mentor /insights /invest` redirect to new ones.
- Auth: Strictly email-based with mandatory verification. DO NOT re-add OAuth.
- Persona: `profiles.student_mode` + `onboarding_completed` gate /onboarding wizard. Persona drives Goals presets, Coach prompts, Investments options.
- Constraint: NEVER use 'Utilities' category. NEVER name specific banks/cards/funds/brokers in recommendations — generic only.
- Premium: payments NOT implemented. Settings shows "Premium — Coming Soon"; no fake upgrade flow.
- Health Score (0-100): Savings Rate (35) + Budget Discipline (25) + Goal Progress (20) + Expense Consistency (15) + Investment Habits (5). Computed in `src/lib/healthScore.ts`. Every sub-score shows a Why tooltip.
- AI Coach (`/coach`) is the hero feature: chat-based, reuses `ai-chat` edge function, one conversation persisted in localStorage.

## Memories
- [Monetization Logic](mem://business/monetization-logic) — Freemium model limits (UI hidden; Premium = coming soon)
- [Investment Strategy](mem://features/investment-strategy) — Questionnaire-first; no implicit risk profile
- [User Onboarding](mem://tech/user-onboarding-automation) — DB triggers + onboarding wizard
- [Layout System](mem://style/layout) — 6-item nav, mobile bottom bar
- [Auth Flow](mem://auth/onboarding-flow) — Email + verified, then `/onboarding` wizard
- [AI Assistant](mem://features/ai-assistant-behavior) — Concise, structured, emoji bullets
- [Finance Analyzer](mem://features/smart-finance-analyzer) — Insights renamed to Financial Report
- [Transaction Export](mem://features/transaction-export) — PDF reports, INR only
- [Voice & Receipt Entry](mem://features/voice-and-receipt-entry) — AI-powered transaction logging
