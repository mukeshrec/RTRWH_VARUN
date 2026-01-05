import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "varun-auth",
  },
});

export interface Project {
  id: string;
  user_name: string;
  user_contact: string;
  location_name: string;
  location_lat?: number;
  location_lng?: number;
  roof_area: number;
  roof_type: string;
  roof_height: number;
  household_size: number;
  available_space?: number;
  water_scarcity_days: number;
  current_water_sources?: string;
  annual_rainfall?: number;
  rainfall_intensity?: number;
  aquifer_type?: string;
  depth_water_premonsoon?: number;
  depth_water_postmonsoon?: number;
  soil_type?: string;
  infiltration_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface CalculationResult {
  id: string;
  project_id: string;
  water_available: number;
  water_required: number;
  is_feasible: boolean;
  tank_capacity: number;
  tank_diameter: number;
  tank_height: number;
  peak_flow: number;
  gutter_diameter: number;
  downpipe_diameter: number;
  first_flush_volume: number;
  filter_type: string;
  filter_area: number;
  filter_length: number;
  filter_width: number;
  recharge_structure_type: string;
  recharge_structure_depth: number;
  recharge_structure_diameter: number;
  total_cost: number;
  annual_benefits: number;
  bc_ratio: number;
  payback_period: number;
  created_at: string;
}

export interface RegionalData {
  id: string;
  state: string;
  district: string;
  location: string;
  annual_rainfall_min: number;
  annual_rainfall_max: number;
  annual_rainfall_avg: number;
  rainfall_intensity_20min: number;
  aquifer_type: string;
  soil_type: string;
  infiltration_rate: number;
  depth_water_premonsoon_avg: number;
  depth_water_postmonsoon_avg: number;
  rainfall_zone: string;
}

export interface CostData {
  id: string;
  region: string;
  item_category: string;
  item_name: string;
  unit: string;
  rate_min: number;
  rate_max: number;
  rate_avg: number;
  description: string;
}

export async function saveProject(
  projectData: Partial<Project>
): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .insert([projectData])
    .select()
    .single();

  if (error) {
    console.error("Error saving project:", error);
    return null;
  }

  return data;
}

export async function saveCalculationResults(
  resultsData: Partial<CalculationResult>
): Promise<CalculationResult | null> {
  const { data, error } = await supabase
    .from("calculation_results")
    .insert([resultsData])
    .select()
    .single();

  if (error) {
    console.error("Error saving calculation results:", error);
    return null;
  }

  return data;
}

export async function getRegionalData(
  state?: string,
  district?: string
): Promise<RegionalData[]> {
  let query = supabase.from("regional_data").select("*");

  if (state) {
    query = query.eq("state", state);
  }

  if (district) {
    query = query.eq("district", district);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching regional data:", error);
    return [];
  }

  return data || [];
}

export async function getCostData(category?: string): Promise<CostData[]> {
  let query = supabase.from("cost_data").select("*");

  if (category) {
    query = query.eq("item_category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching cost data:", error);
    return [];
  }

  return data || [];
}

export async function getProjectWithResults(projectId: string): Promise<{
  project: Project | null;
  results: CalculationResult | null;
}> {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    console.error("Error fetching project:", projectError);
    return { project: null, results: null };
  }

  const { data: results, error: resultsError } = await supabase
    .from("calculation_results")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (resultsError) {
    console.error("Error fetching results:", resultsError);
  }

  return { project, results };
}

export async function getAllProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }

  return data || [];
}
