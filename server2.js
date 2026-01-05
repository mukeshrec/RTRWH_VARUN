import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// Manually set environment variables
process.env.VITE_SUPABASE_URL = "https://dyoyfbopdgjmubbuqifd.supabase.co";
process.env.VITE_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b3lmYm9wZGdqbXViYnVxaWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMTIxMjcsImV4cCI6MjA4MjY4ODEyN30.xmhM1MY0g2cWoJeb35_Uu2tNRTrZoAjS4_7TYojrydk";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Test endpoint
app.get("/", (req, res) => {
  res.json({
    message: "RTRWH Backend API Server is running",
    status: "success",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log("Supabase URL:", process.env.VITE_SUPABASE_URL);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});
