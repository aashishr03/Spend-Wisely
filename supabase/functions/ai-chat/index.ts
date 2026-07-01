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
    const { messages } = await req.json();

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user } } = await supabase.auth.getUser();

    let transactionContext = "";
    let userAccountId = "";
    let categoryMap: Record<string, string> = {};
    
    if (user) {
      const now = new Date();
      const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const firstOfLastMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-01`;
      const lastOfLastMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-${String(lastMonth.getDate()).padStart(2, "0")}`;

      const [currentRes, lastRes, accountsRes, categoriesRes, profileRes, goalsRes, investRes, budgetsRes] = await Promise.all([
        supabase.from("transactions").select("*, categories(name)").eq("user_id", user.id).gte("date", firstOfMonth).order("date", { ascending: false }),
        supabase.from("transactions").select("*, categories(name)").eq("user_id", user.id).gte("date", firstOfLastMonth).lte("date", lastOfLastMonth),
        supabase.from("accounts").select("*").eq("user_id", user.id),
        supabase.from("categories").select("*"),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("savings_goals").select("*").eq("user_id", user.id),
        supabase.from("investment_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("budgets").select("*, categories(name)").eq("user_id", user.id),
      ]);

      const currentTx = currentRes.data || [];
      const lastTx = lastRes.data || [];
      const accounts = accountsRes.data || [];
      const categories = categoriesRes.data || [];
      const profile = profileRes.data;
      const goals = goalsRes.data || [];
      const invest = investRes.data;
      const budgets = budgetsRes.data || [];

      for (const cat of categories) {
        categoryMap[cat.name.toLowerCase()] = cat.id;
      }

      const defaultAccount = accounts.find((a: any) => a.is_default) || accounts[0];
      if (defaultAccount) userAccountId = defaultAccount.id;

      const totalBalance = accounts.reduce((s: number, a: any) => s + (a.balance || 0), 0);
      const thisMonthIncome = currentTx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
      const thisMonthExpense = currentTx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);
      const lastMonthExpense = lastTx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);
      const savingsRate = thisMonthIncome > 0 ? Math.round(((thisMonthIncome - thisMonthExpense) / thisMonthIncome) * 100) : 0;

      const categorySpending: Record<string, number> = {};
      currentTx.filter((t: any) => t.type === "expense").forEach((t: any) => {
        const cat = t.categories?.name || "Other";
        categorySpending[cat] = (categorySpending[cat] || 0) + t.amount;
      });

      const catBreakdown = Object.entries(categorySpending)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => `${cat}: ₹${amt.toFixed(0)}`)
        .join(", ");

      const availableCategories = categories.map((c: any) => `${c.name} (${c.type})`).join(", ");
      const goalsStr = goals.length
        ? goals.map((g: any) => `${g.name}: ₹${Number(g.saved_amount).toFixed(0)}/₹${Number(g.target_amount).toFixed(0)}${g.target_date ? ` by ${g.target_date}` : ""}`).join("; ")
        : "none";
      const budgetsStr = budgets.length
        ? budgets.map((b: any) => `${b.categories?.name || "?"} limit ₹${Number(b.monthly_limit).toFixed(0)}`).join("; ")
        : "none";

      // Lightweight health score for grounding
      const spendPct = thisMonthIncome > 0 ? Math.round((thisMonthExpense / thisMonthIncome) * 100) : null;
      const goalAvg = goals.length
        ? Math.round(goals.reduce((s: number, g: any) => s + Math.min(100, (Number(g.saved_amount) / Math.max(1, Number(g.target_amount))) * 100), 0) / goals.length)
        : 0;

      transactionContext = `
USER PROFILE:
- Primary financial goal: ${profile?.primary_goal ?? "unknown"}
- Money source: ${profile?.money_source ?? "unknown"}
- Monthly money received: ${profile?.monthly_income ? `₹${profile.monthly_income}` : "not provided"}
- Risk appetite: ${profile?.risk_appetite ?? "?"}/5
- Investment experience: ${profile?.investment_experience ?? "unknown"}
- Goal horizon: ${profile?.goal_horizon ?? "unknown"}
- Investment profile saved: ${invest ? `risk=${invest.risk_level}, monthly=₹${invest.monthly_investment_amount ?? 0}` : "not set"}

USER'S FINANCIAL DATA (this month unless noted):
- Total Balance across accounts: ₹${totalBalance.toFixed(0)}
- Money received this month: ₹${thisMonthIncome.toFixed(0)}
- Expenses this month: ₹${thisMonthExpense.toFixed(0)} (last month: ₹${lastMonthExpense.toFixed(0)})
- Savings rate: ${savingsRate}%   Spend-to-income: ${spendPct ?? "n/a"}%
- Avg goal progress: ${goalAvg}%
- Category breakdown: ${catBreakdown || "No expenses yet"}
- Active savings goals: ${goalsStr}
- Budgets set: ${budgetsStr}
- Recent transactions: ${currentTx.slice(0, 8).map((t: any) => `${t.type} ₹${t.amount} (${t.categories?.name || "N/A"}) on ${t.date}`).join("; ") || "None"}
- Available categories for logging: ${availableCategories}
`;
    }

    const systemPrompt = `You are "Spend Wisely AI", a friendly personal finance coach. Currency is Indian Rupees (₹).

RESPONSE STYLE — STRICT:
- Reply like ChatGPT: short, warm, conversational. Default 3–6 short lines.
- ONLY go deeper if the user explicitly asks ("explain more", "details", "why").
- Use bullets only when listing 2+ items. No headings, no long paragraphs.
- Max 1 emoji per reply. No fluff, no disclaimers, no "as an AI".
- Never say "I don't have access to your data" — the DATA block below IS your access.
- Never ask the user for numbers you can compute from the DATA block (income, spending, goals, budgets, savings rate — all already there).
- Remember earlier messages in this conversation and build on them.

GROUNDING:
- Every number you cite must come from the DATA block.
- If a specific field is missing, say "you haven't logged X yet" and answer using what IS available.
- Never recommend specific banks, cards, brokers, or fund brand names.

TRANSACTION LOGGING (only when the user clearly logs a new expense/income):
Append a JSON block at the very end:
\`\`\`json-transactions
[{"type":"income","amount":5000,"category":"Salary","description":"Salary received"}]
\`\`\`
Do NOT add this block for questions, analysis, or hypotheticals.

${transactionContext}`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 400,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI Gateway error:", response.status, err);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway returned ${response.status}`);
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    // Parse and log transactions
    let loggedTransactions: any[] = [];
    const txMatch = reply.match(/```json-transactions\s*([\s\S]*?)```/);
    if (txMatch && user && userAccountId) {
      try {
        const transactions = JSON.parse(txMatch[1].trim());
        if (Array.isArray(transactions)) {
          for (const tx of transactions) {
            const catName = tx.category || "Other";
            const catId = categoryMap[catName.toLowerCase()];
            if (!catId) continue;

            const { error: insertError } = await supabase
              .from("transactions")
              .insert({
                user_id: user.id,
                account_id: userAccountId,
                category_id: catId,
                type: tx.type,
                amount: tx.amount,
                description: tx.description || catName,
                date: new Date().toISOString().split("T")[0],
              });

            if (!insertError) {
              loggedTransactions.push(tx);
              const balanceChange = tx.type === "income" ? tx.amount : -tx.amount;
              await supabase
                .from("accounts")
                .update({ balance: (await supabase.from("accounts").select("balance").eq("id", userAccountId).single()).data!.balance + balanceChange })
                .eq("id", userAccountId);
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse transactions:", e);
      }
      
      reply = reply.replace(/```json-transactions[\s\S]*?```/, "").trim();
      
      if (loggedTransactions.length > 0) {
        const summary = loggedTransactions.map(t => `• ${t.type === 'income' ? '💰' : '💸'} ${t.category}: ₹${t.amount.toLocaleString('en-IN')}`).join("\n");
        reply += `\n\n✅ **${loggedTransactions.length} transaction(s) logged:**\n${summary}`;
      }
    } else if (txMatch) {
      reply = reply.replace(/```json-transactions[\s\S]*?```/, "").trim();
    }

    return new Response(JSON.stringify({ reply, logged: loggedTransactions.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-chat function:", error);
    return new Response(
      JSON.stringify({ reply: "I'm having trouble right now. Please try again! 🙏" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
