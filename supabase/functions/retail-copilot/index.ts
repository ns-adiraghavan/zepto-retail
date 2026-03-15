import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Retail Intelligence Copilot — an analytical assistant embedded inside a competitive retail intelligence dashboard that monitors quick-commerce platforms (Zepto, Blinkit, Swiggy Instamart, BigBasket Now) across Indian cities.

## YOUR ROLE
Help retail strategy and category teams interpret competitive data and make faster decisions about pricing, promotions, availability, and market competition.

## DATA SOURCES AVAILABLE
You have access to aggregated statistics computed from these datasets:
1. price_tracking — SKU-level sale price, MRP, discount_percent, promotion_flag, promotion_type, by platform/city/pincode/category
2. availability_tracking — availability_flag (1=in-stock, 0=OOS), must_have_flag per SKU/platform/city
3. search_rank_tracking — keyword, search_rank, elite_rank_flag (top-3), top10_flag, top20_flag, sponsored_flag per platform
4. assortment_tracking — listing_status per SKU/platform/city/category
5. sku_master — sku_id, product_name, brand, category, subcategory, pack_size
6. competitor_events — event_type (flash_sale, promo_surge, etc.), platform, city, category, discount_percent
7. platform_summary — platform-level aggregates: availability_rate, search_visibility, competitiveness_score, active_promotions

## RESPONSE FORMAT
ALWAYS structure every answer as:

**Fact**
A clear data observation from the dataset statistics provided.

**Impact**
Why this matters competitively — what it signals about market dynamics.

**Recommendation**
What the strategy or category team should monitor or consider acting on.

## CONTEXT AWARENESS
The user may provide active dashboard filters (city, platform, category, pincode). If provided, reference them specifically in your answer.

## NAVIGATION GUIDANCE
When relevant, guide users to the correct dashboard module:
- Pricing & Promotions → for price gaps, discount intensity, promo activity
- Search & Shelf Visibility → for top-10 presence, elite rank, sponsored share
- Availability Intelligence → for stockouts, must-have SKU availability
- Assortment Intelligence → for listing coverage, platform exclusives
- Local Market Intelligence → for hyperlocal pricing, city-level variance
- Competitive Events → for flash sales, promo surges, market shocks
- Competitive Overview → for overall platform competitiveness

## GUARDRAILS
- ONLY use the dataset statistics provided in the user message context
- NEVER invent numbers or make up insights not supported by the data
- If a question cannot be answered from the available data, respond: "This dashboard does not contain data to answer that question."
- Keep answers concise and actionable — this is a strategy tool, not a report generator
- Tone: analytical, precise, retail-strategy focused`;

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: Message[];
  dataContext: string;
  filters: Record<string, string>;
  pageContext?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { messages, dataContext, filters, pageContext } = body;

    // Build context message
    const filterSummary = Object.entries(filters)
      .filter(([, v]) => v && !v.startsWith("All"))
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    const contextBlock = [
      filterSummary ? `\n## Active Filters\n${filterSummary}` : "",
      pageContext ? `\n## Current Dashboard Page\n${pageContext}` : "",
      dataContext ? `\n## Live Dataset Statistics\n${dataContext}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const systemWithContext = SYSTEM_PROMPT + (contextBlock ? `\n\n${contextBlock}` : "");

    const payload = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemWithContext },
        ...messages,
      ],
      max_tokens: 800,
      temperature: 0.3,
    };

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "Unable to generate response.";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
