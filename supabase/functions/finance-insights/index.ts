import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const firstOfLastMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-01`;
    const lastOfLastMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-${String(lastMonth.getDate()).padStart(2, "0")}`;

    const [currentRes, lastRes, accountsRes, profileRes, investRes, prevInsightsRes] = await Promise.all([
      supabase.from("transactions").select("*, categories(name, type)").eq("user_id", user.id).gte("date", firstOfMonth).order("date", { ascending: false }),
      supabase.from("transactions").select("*, categories(name, type)").eq("user_id", user.id).gte("date", firstOfLastMonth).lte("date", lastOfLastMonth),
      supabase.from("accounts").select("*").eq("user_id", user.id),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("investment_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("insights_logs").select("generated_text").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);

    const currentTx = currentRes.data || [];
    const lastTx = lastRes.data || [];
    const accounts = accountsRes.data || [];
    const profile = profileRes.data;
    const investProfile = investRes.data;
    const prevInsights = (prevInsightsRes.data || []).map((i: any) => i.generated_text);

    const totalBalance = accounts.reduce((s: number, a: any) => s + (a.balance || 0), 0);
    const thisIncome = currentTx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
    const thisExpense = currentTx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);
    const lastIncome = lastTx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
    const lastExpense = lastTx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);

    const catSpending: Record<string, number> = {};
    const catFrequency: Record<string, number> = {};
    let biggestExpense = { amount: 0, desc: "", category: "" };

    currentTx.filter((t: any) => t.type === "expense").forEach((t: any) => {
      const cat = t.categories?.name || "Other";
      catSpending[cat] = (catSpending[cat] || 0) + t.amount;
      catFrequency[cat] = (catFrequency[cat] || 0) + 1;
      if (t.amount > biggestExpense.amount) {
        biggestExpense = { amount: t.amount, desc: t.description || cat, category: cat };
      }
    });

    const lastCatSpending: Record<string, number> = {};
    lastTx.filter((t: any) => t.type === "expense").forEach((t: any) => {
      const cat = t.categories?.name || "Other";
      lastCatSpending[cat] = (lastCatSpending[cat] || 0) + t.amount;
    });

    const topCategories = Object.entries(catSpending).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const mostFrequent = Object.entries(catFrequency).sort((a, b) => b[1] - a[1])[0];
    const savingsRate = thisIncome > 0 ? ((thisIncome - thisExpense) / thisIncome) * 100 : 0;
    const expenseGrowth = lastExpense > 0 ? ((thisExpense - lastExpense) / lastExpense) * 100 : 0;

    const smallExpenses: Record<string, { count: number; total: number }> = {};
    currentTx.filter((t: any) => t.type === "expense" && t.amount < 500).forEach((t: any) => {
      const cat = t.categories?.name || "Other";
      if (!smallExpenses[cat]) smallExpenses[cat] = { count: 0, total: 0 };
      smallExpenses[cat].count++;
      smallExpenses[cat].total += t.amount;
    });
    const frequentSmall = Object.entries(smallExpenses)
      .filter(([_, v]) => v.count >= 3)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 3);

    const financialDataPrompt = `
USER FINANCIAL DATA (Currency: INR ₹):
- Total Balance: ₹${totalBalance.toFixed(0)}
- This Month Income: ₹${thisIncome.toFixed(0)}
- This Month Expenses: ₹${thisExpense.toFixed(0)}
- Savings Rate: ${savingsRate.toFixed(1)}%
- Last Month Income: ₹${lastIncome.toFixed(0)}
- Last Month Expenses: ₹${lastExpense.toFixed(0)}
- Expense Growth: ${expenseGrowth.toFixed(1)}%
- Top Categories: ${topCategories.map(([c, a]) => `${c}: ₹${a.toFixed(0)}`).join(", ")}
- Most Frequent Expense: ${mostFrequent ? `${mostFrequent[0]} (${mostFrequent[1]} times)` : "N/A"}
- Biggest Single Expense: ₹${biggestExpense.amount.toFixed(0)} (${biggestExpense.desc})
- Category Changes vs Last Month: ${topCategories.map(([c, a]) => {
      const last = lastCatSpending[c] || 0;
      const change = last > 0 ? ((a - last) / last * 100).toFixed(0) : "new";
      return `${c}: ${change}%`;
    }).join(", ")}
- Small Frequent Expenses (<₹500): ${frequentSmall.map(([c, v]) => `${c}: ${v.count} times, ₹${v.total.toFixed(0)}`).join("; ") || "None"}
- Investment Profile: ${investProfile ? `Risk: ${investProfile.risk_level}, Monthly: ₹${investProfile.monthly_investment_amount}` : "Not set"}
- Plan: ${profile?.plan_type || "free"}

PREVIOUS INSIGHTS (DO NOT REPEAT):
${prevInsights.join("\n")}
`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a Smart Finance Analyzer for Indian users. All amounts are in INR (₹). Generate JSON insights.

RESPOND WITH ONLY VALID JSON:
{
  "healthScore": <0-100>,
  "healthColor": "green" | "yellow" | "red",
  "healthFactors": { "savingsRate": <0-25>, "expenseControl": <0-25>, "budgetAdherence": <0-25>, "investmentConsistency": <0-25> },
  "topSpending": [{"category": string, "amount": number, "percentOfTotal": number, "changeVsLastMonth": number}],
  "mostFrequentExpense": {"category": string, "count": number},
  "biggestExpense": {"description": string, "amount": number},
  "recommendations": [{"text": string, "type": "saving"|"investment"|"warning"|"positive", "priority": "high"|"medium"|"low"}],
  "savingsOpportunities": [{"text": string, "potentialSaving": number}],
  "monthlyComparison": {"incomeChange": number, "expenseChange": number, "savingsChange": number},
  "goalProjection": string | null,
  "investmentInsight": string | null
}

RULES:
- All amounts in ₹ (INR)
- healthColor: >70=green, 40-70=yellow, <40=red
- 3-5 UNIQUE recommendations not in previous insights
- Be specific with real numbers
- For savingsOpportunities, use actual small frequent expense patterns
- investmentInsight only if user has investment profile`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: financialDataPrompt },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI error:", response.status, err);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI returned ${response.status}`);
    }

    const aiData = await response.json();
    let reply = aiData.choices?.[0]?.message?.content || "";

    const jsonMatch = reply.match(/```json\s*([\s\S]*?)```/) || reply.match(/\{[\s\S]*\}/);
    let insights;
    try {
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : reply;
      insights = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error("JSON parse error:", e);
      insights = getDefaultInsights(totalBalance, thisIncome, thisExpense, savingsRate, expenseGrowth, topCategories, biggestExpense);
    }

    if (insights.recommendations?.length > 0) {
      const textsToStore = insights.recommendations.map((r: any) => r.text).join(" | ");
      await supabase.from("insights_logs").insert({
        user_id: user.id,
        insight_type: "smart_analyzer",
        generated_text: textsToStore,
      });
    }

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate insights" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getDefaultInsights(balance: number, income: number, expense: number, savingsRate: number, expenseGrowth: number, topCats: [string, number][], biggest: { amount: number; desc: string }) {
  const healthScore = Math.min(100, Math.max(0,
    (savingsRate > 20 ? 25 : savingsRate > 10 ? 15 : 5) +
    (expenseGrowth < 5 ? 25 : expenseGrowth < 15 ? 15 : 5) +
    20 + 15
  ));
  return {
    healthScore,
    healthColor: healthScore > 70 ? "green" : healthScore > 40 ? "yellow" : "red",
    healthFactors: { savingsRate: savingsRate > 20 ? 25 : 15, expenseControl: expenseGrowth < 5 ? 25 : 15, budgetAdherence: 20, investmentConsistency: 15 },
    topSpending: topCats.slice(0, 3).map(([c, a]) => ({ category: c, amount: a, percentOfTotal: expense > 0 ? (a / expense) * 100 : 0, changeVsLastMonth: 0 })),
    mostFrequentExpense: { category: topCats[0]?.[0] || "N/A", count: 0 },
    biggestExpense: { description: biggest.desc, amount: biggest.amount },
    recommendations: [{ text: "Start tracking your expenses regularly to get personalized insights.", type: "positive", priority: "medium" }],
    savingsOpportunities: [],
    monthlyComparison: { incomeChange: 0, expenseChange: expenseGrowth, savingsChange: 0 },
    goalProjection: null,
    investmentInsight: null,
  };
}
