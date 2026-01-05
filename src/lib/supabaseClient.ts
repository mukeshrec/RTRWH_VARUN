import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dyoyfbopdgjmubbuqifd.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b3lmYm9wZGdqbXViYnVxaWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMTIxMjcsImV4cCI6MjA4MjY4ODEyN30.xmhM1MY0g2cWoJeb35_Uu2tNRTrZoAjS4_7TYojrydk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
