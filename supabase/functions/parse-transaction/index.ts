import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, text, imageBase64 } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    let prompt = "";
    const messages: any[] = [];

    if (mode === "voice") {
      prompt = `You are a transaction parser. The user spoke this text to log a financial transaction. Extract the following fields from it:
- amount (number, in Indian Rupees)
- description (string, short summary)
- type ("income" or "expense")
- category (one of: Food, Shopping, Travel, Entertainment, Health, Education, Salary, Freelance, Other)

User said: "${text}"

Respond ONLY with valid JSON, no explanation:
{"amount": 0, "description": "", "type": "expense", "category": "Other"}`;

      messages.push({ role: "user", content: prompt });
    } else if (mode === "receipt") {
      prompt = `You are a receipt parser. Analyze this receipt image and extract transaction details:
- amount (number, total amount in Indian Rupees)
- description (string, store name or main items)
- type: always "expense"
- category (one of: Food, Shopping, Travel, Entertainment, Health, Education, Other)
- date (string, YYYY-MM-DD format if visible, otherwise null)

Respond ONLY with valid JSON, no explanation:
{"amount": 0, "description": "", "type": "expense", "category": "Other", "date": null}`;

      messages.push({
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = mode === "receipt" ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 256,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI Gateway error:", response.status, err);
      throw new Error(`AI Gateway returned ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in parse-transaction:", error);
    return new Response(
      JSON.stringify({ error: "Failed to parse transaction. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
