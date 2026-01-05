import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

// --- CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = 3000;

// --- MIDDLEWARE ---
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// --- SUPABASE SETUP ---
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || "", supabaseKey || "");

// --- ROUTES ---

// Health Checks
app.get("/", (req, res) => res.json({ status: "running" }));
app.get("/health", (req, res) => res.json({ status: "Backend server is running" }));

// (Optional) Add your Supabase/OpenCage specific routes here as you build them.
// The Gemini Chatbot route has been removed.

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`\n✅ Backend server running at http://localhost:${PORT}`);
});