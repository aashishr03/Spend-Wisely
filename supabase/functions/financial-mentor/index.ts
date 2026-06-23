import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const last = new Date(year, month, 0);
    const firstLast = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-01`;
    const lastLast = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;

    const [curRes, lastRes, budgetRes, profileRes] = await Promise.all([
      supabase.from("transactions").select("*, categories(name, type)").eq("user_id", user.id).gte("date", firstOfMonth),
      supabase.from("transactions").select("*, categories(name, type)").eq("user_id", user.id).gte("date", firstLast).lte("date", lastLast),
      supabase.from("budgets").select("*, categories(name)").eq("user_id", user.id).eq("month", month + 1).eq("year", year),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);

    const cur = curRes.data || [];
    const lastTx = lastRes.data || [];
    const budgets = budgetRes.data || [];
    const profile = profileRes.data;

    const income = cur.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const expense = cur.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const lastExpense = lastTx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);

    // Category spending
    const catNow: Record<string, number> = {};
    const catLast: Record<string, number> = {};
    cur.filter((t: any) => t.type === "expense").forEach((t: any) => {
      const c = t.categories?.name || "Other";
      catNow[c] = (catNow[c] || 0) + Number(t.amount);
    });
    lastTx.filter((t: any) => t.type === "expense").forEach((t: any) => {
      const c = t.categories?.name || "Other";
      catLast[c] = (catLast[c] || 0) + Number(t.amount);
    });

    // Predictions per category (linear projection)
    const dailyRate = dayOfMonth > 0 ? expense / dayOfMonth : 0;
    const projectedMonthExpense = dailyRate * daysInMonth;
    const projectedSavings = income - projectedMonthExpense;

    const categoryPredictions = Object.entries(catNow).map(([name, spent]) => {
      const projected = (spent / dayOfMonth) * daysInMonth;
      const budget = budgets.find((b: any) => b.categories?.name === name);
      const limit = budget ? Number(budget.monthly_limit) : null;
      const overBy = limit ? projected - limit : 0;
      const changePct = catLast[name] ? ((spent - catLast[name]) / catLast[name]) * 100 : 0;
      return {
        category: name,
        spent: Math.round(spent),
        projected: Math.round(projected),
        limit,
        overBy: Math.round(overBy),
        changePct: Math.round(changePct),
      };
    }).sort((a, b) => b.projected - a.projected);

    // Financial Health Score (0-100)
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    let score = 50;
    if (savingsRate >= 30) score += 25; else if (savingsRate >= 15) score += 15; else if (savingsRate >= 5) score += 5; else score -= 10;
    // Budget adherence
    const overBudgetCount = categoryPredictions.filter(c => c.limit && c.projected > c.limit).length;
    score -= overBudgetCount * 5;
    // Consistency: penalize if expense growth > 25%
    const growth = lastExpense > 0 ? ((expense - lastExpense) / lastExpense) * 100 : 0;
    if (growth > 25) score -= 10; else if (growth < -5) score += 5;
    // Activity bonus
    if (cur.length >= 10) score += 5;
    score = Math.max(0, Math.min(100, Math.round(score)));

    const status = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Average" : "Poor";

    // Future simulations (6mo, 12mo) — base on monthly savings
    const monthlySavings = Math.max(0, income - expense);
    const simulations = {
      current: {
        sixMonth: Math.round(monthlySavings * 6),
        oneYear: Math.round(monthlySavings * 12),
      },
      increase20: {
        sixMonth: Math.round((income - expense * 1.2) * 6),
        oneYear: Math.round((income - expense * 1.2) * 12),
      },
      save100Daily: {
        sixMonth: Math.round(monthlySavings * 6 + 100 * 30 * 6),
        oneYear: Math.round(monthlySavings * 12 + 100 * 365),
      },
      invest: {
        // 12% annual return compounded monthly on monthly contribution
        sixMonth: Math.round(fv(monthlySavings, 0.12 / 12, 6)),
        oneYear: Math.round(fv(monthlySavings, 0.12 / 12, 12)),
      },
    };

    // Build base recommendations & challenges
    const recommendations: string[] = [];
    const challenges: { title: string; description: string; savings: number }[] = [];

    if (savingsRate < 10) recommendations.push("Your savings rate is low. Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.");
    if (growth > 20) recommendations.push(`Spending grew ${Math.round(growth)}% vs last month — review your top categories.`);
    const topOver = categoryPredictions.find(c => c.overBy > 0);
    if (topOver) recommendations.push(`You may exceed your ${topOver.category} budget by ₹${topOver.overBy.toLocaleString("en-IN")}.`);

    challenges.push({ title: "No-Delivery 3 Days", description: "Skip food delivery for 3 days this week.", savings: 300 });
    challenges.push({ title: "10% Entertainment Cut", description: "Reduce entertainment spending by 10% this week.", savings: Math.round((catNow["Entertainment"] || 500) * 0.1) });
    challenges.push({ title: "₹50/day Cert Fund", description: "Save ₹50 every day toward a certification course.", savings: 350 });

    // AI-generated personalized mentor narrative
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    let mentorNarrative = "";
    if (apiKey) {
      const prompt = `You are an AI Financial Mentor for a ${profile?.student_mode ? "college student" : "young professional"} in India. Currency is INR ₹.

Data:
- Income this month: ₹${income.toFixed(0)}
- Expense this month: ₹${expense.toFixed(0)} (projected: ₹${projectedMonthExpense.toFixed(0)})
- Savings rate: ${savingsRate.toFixed(1)}%
- Health Score: ${score}/100 (${status})
- Top categories: ${categoryPredictions.slice(0, 3).map(c => `${c.category} ₹${c.spent}`).join(", ")}
- Spending growth vs last month: ${growth.toFixed(1)}%

STRICT RULES:
- DO NOT name any specific bank, credit card, mutual fund, stock, app, broker, or financial product.
- Only give GENERIC behavioural guidance (e.g. "reduce subscriptions", "build an emergency fund", "save for certifications", "save for semester fees", "improve savings rate").
- Reply with ONLY 4 concise bullet points (with emojis), each one short. No preamble, no disclaimers.`;

      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (resp.ok) {
          const j = await resp.json();
          mentorNarrative = j.choices?.[0]?.message?.content || "";
        }
      } catch (_) { /* noop */ }
    }

    return new Response(JSON.stringify({
      score, status,
      income, expense, projectedMonthExpense, projectedSavings, savingsRate, growth,
      categoryPredictions, simulations, recommendations, challenges,
      mentorNarrative,
      studentMode: profile?.student_mode ?? false,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function fv(monthlyContribution: number, monthlyRate: number, months: number): number {
  if (monthlyContribution <= 0) return 0;
  if (monthlyRate === 0) return monthlyContribution * months;
  return monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}
