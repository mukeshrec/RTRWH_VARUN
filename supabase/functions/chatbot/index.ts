import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are an AI assistant for Varun, a professional rainwater harvesting assessment tool. Your role is to help users understand:

1. Rainwater harvesting concepts and benefits
2. Rooftop rainwater harvesting (RTRWH) systems
3. How to use the Varun assessment tool
4. Components of RTRWH systems (catchment, collection, filters, storage, recharge)
5. Cost analysis and economic benefits
6. CGWB (Central Ground Water Board) guidelines and standards
7. Technical specifications like tank sizing, filter design, and recharge structures

KEY FEATURES OF VARUN:
- Complete calculations for water availability and requirements
- Tank sizing and design
- Collection system specifications (gutters, downpipes)
- Filter specifications
- Recharge structure design
- Cost breakdown and economic analysis
- B/C ratio and payback period calculations
- Based on CGWB Manual on Artificial Recharge (2007)

IMPORTANT RULES:
- ONLY answer questions related to rainwater harvesting, the Varun tool, water conservation, or related topics
- If asked about unrelated topics, politely redirect to rainwater harvesting topics
- Be helpful, professional, and concise
- Provide accurate technical information when needed
- Encourage users to try the assessment tool

Keep responses clear and helpful, typically 2-4 sentences unless more detail is requested.`;

interface LocationContext {
  location?: string;
  latitude?: number;
  longitude?: number;
  annualRainfall?: number;
  aquiferType?: string;
  rechargePotential?: string;
}

interface ChatRequest {
  message: string;
  locationContext?: LocationContext;
}

serve(async (req: Request) => {
  // @ts-ignore - Deno is a global in Supabase edge functions
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, locationContext }: ChatRequest = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ response: "Please provide a valid message." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    // @ts-ignore - Deno is a global in Supabase edge functions

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          response:
            "Configuration Error: Gemini API key is not set. Please check your environment variables.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    let promptWithContext = SYSTEM_PROMPT;

    if (locationContext && Object.keys(locationContext).length > 0) {
      promptWithContext += `\n\nLOCATION-SPECIFIC CONTEXT (use this data to provide scientifically accurate, location-specific recommendations):\n`;

      if (locationContext.location) {
        promptWithContext += `- Location: ${locationContext.location}\n`;
      }
      if (locationContext.latitude && locationContext.longitude) {
        promptWithContext += `- Coordinates: ${locationContext.latitude.toFixed(
          4
        )}°N, ${locationContext.longitude.toFixed(4)}°E\n`;
      }
      if (locationContext.annualRainfall) {
        promptWithContext += `- Annual Rainfall: ${locationContext.annualRainfall} mm\n`;
      }
      if (locationContext.aquiferType) {
        const aquiferTypeReadable = locationContext.aquiferType.replace(
          /_/g,
          " "
        );
        promptWithContext += `- Aquifer Type: ${aquiferTypeReadable}\n`;
      }
      if (locationContext.rechargePotential) {
        promptWithContext += `- Groundwater Recharge Potential: ${locationContext.rechargePotential}\n`;
      }

      promptWithContext += `\nIMPORTANT: Based on the above data, provide tailored recommendations for:\n`;
      promptWithContext += `1. Whether to prioritize STORAGE (tanks) or RECHARGE (percolation pits, recharge wells)\n`;
      promptWithContext += `2. Suitable RWH system components based on aquifer type and rainfall\n`;
      promptWithContext += `3. Expected water availability and storage capacity requirements\n`;
      promptWithContext += `4. Any location-specific considerations or warnings\n`;
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptWithContext + "\n\nUser question: " + message },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorJson = JSON.parse(errorText);

      console.error("=== GEMINI API ERROR ===");
      console.error("Status:", response.status, response.statusText);
      console.error("Error Details:", JSON.stringify(errorJson, null, 2));
      console.error("User Message:", message);
      console.error("Timestamp:", new Date().toISOString());
      console.error("========================");

      let userFriendlyMessage =
        "I apologize, but I encountered an error connecting to the AI service. Please try again.";

      if (response.status === 429) {
        userFriendlyMessage =
          "The AI service is currently busy. Please wait a moment and try again.";
      } else if (response.status === 400) {
        userFriendlyMessage =
          "I had trouble understanding that request. Could you rephrase your question?";
      } else if (response.status === 401 || response.status === 403) {
        userFriendlyMessage = "Authentication error. Please contact support.";
      }

      return new Response(
        JSON.stringify({
          response: userFriendlyMessage,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const botResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I apologize, but I couldn't generate a response. Please try again.";

    return new Response(JSON.stringify({ response: botResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    return new Response(
      JSON.stringify({
        response:
          "I apologize, but I encountered an error. Please try again later.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
