import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "RTRWH Backend API Server",
    status: "running",
    timestamp: new Date(),
    endpoints: {
      health: "GET /health",
      aquifer: "POST /api/aquifer",
      rainfall: "POST /api/rainfall",
      elevation: "POST /api/elevation",
      waterBodies: "POST /api/water-bodies",
    },
  });
});
// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Backend server is running", timestamp: new Date() });
});

// Supabase Aquifer Data
app.post("/api/aquifer", async (req, res) => {
  try {
    const { state, region } = req.body;

    if (!state || typeof state !== "string") {
      return res.status(400).json({ error: "Please provide a valid state." });
    }

    const { data, error } = await supabase
      .from("aquifer_mapping")
      .select("*")
      .eq("state", state)
      .eq("region", region || null)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supabase Rainfall Data
app.post("/api/rainfall", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required." });
    }

    const { data, error } = await supabase
      .from("rainfall_data")
      .select("*")
      .gte("latitude", latitude - 1)
      .lte("latitude", latitude + 1)
      .gte("longitude", longitude - 1)
      .lte("longitude", longitude + 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supabase Elevation Data
app.post("/api/elevation", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required." });
    }

    const { data, error } = await supabase
      .from("elevation_data")
      .select("elevation")
      .eq("latitude", latitude)
      .eq("longitude", longitude)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supabase Water Bodies
app.post("/api/water-bodies", async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.body;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required." });
    }

    const { data, error } = await supabase
      .from("water_bodies")
      .select("*")
      .gte("latitude", latitude - radius)
      .lte("latitude", latitude + radius)
      .gte("longitude", longitude - radius)
      .lte("longitude", longitude + radius);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gemini AI Chatbot Proxy
app.post("/api/chatbot", async (req, res) => {
  try {
    const { message, locationContext } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Please provide a valid message." });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error("Gemini API key not configured");
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    // Build system prompt
    let systemPrompt = `You are an AI assistant for Varun, a professional rainwater harvesting assessment tool. Your role is to help users understand:

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

    // Add location context if available
    if (locationContext && Object.keys(locationContext).length > 0) {
      systemPrompt += `\n\nLOCATION-SPECIFIC CONTEXT (use this data to provide scientifically accurate, location-specific recommendations):\n`;
      if (locationContext.location) {
        systemPrompt += `- Location: ${locationContext.location}\n`;
      }
      if (locationContext.latitude && locationContext.longitude) {
        systemPrompt += `- Coordinates: ${locationContext.latitude.toFixed(
          4
        )}°N, ${locationContext.longitude.toFixed(4)}°E\n`;
      }
      if (locationContext.annualRainfall) {
        systemPrompt += `- Annual Rainfall: ${locationContext.annualRainfall} mm\n`;
      }
      if (locationContext.aquiferType) {
        const aquiferTypeReadable = locationContext.aquiferType.replace(
          /_/g,
          " "
        );
        systemPrompt += `- Aquifer Type: ${aquiferTypeReadable}\n`;
      }
      if (locationContext.rechargePotential) {
        systemPrompt += `- Groundwater Recharge Potential: ${locationContext.rechargePotential}\n`;
      }
      systemPrompt += `\nIMPORTANT: Based on the above data, provide tailored recommendations for:\n1. Whether to prioritize STORAGE (tanks) or RECHARGE (percolation pits, recharge wells)\n2. Suitable RWH system components based on aquifer type and rainfall\n3. Expected water availability and storage capacity requirements\n4. Any location-specific considerations or warnings\n`;
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemPrompt + "\n\nUser question: " + message,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorData);
      return res.status(geminiResponse.status).json({
        error: "Failed to get response from Gemini API",
        details: errorData,
      });
    }

    const data = await geminiResponse.json();
    const botResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I encountered an error. Please try again.";

    res.json({ response: botResponse });
  } catch (error) {
    console.error("Chatbot API error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Backend server running at http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ Supabase connected to: ${supabaseUrl}`);
});
