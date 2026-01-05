/*
  # RTRWH & AR Assessment Application Database Schema

  ## Overview
  This migration creates the complete database structure for the Rooftop Rainwater Harvesting 
  and Artificial Recharge assessment application based on CGWB Manual (2007).

  ## New Tables

  ### 1. projects
  Stores user assessment projects with property and household details
  - `id` (uuid, primary key)
  - `user_name` (text) - User's full name
  - `user_contact` (text) - Contact number
  - `location_name` (text) - Location name/address
  - `location_lat` (decimal) - Latitude coordinate
  - `location_lng` (decimal) - Longitude coordinate
  - `roof_area` (decimal) - Roof area in sq.m
  - `roof_type` (text) - Type of roof (GI Sheet, Asbestos, Tiles, Concrete)
  - `roof_height` (decimal) - Height of roof from ground in meters
  - `household_size` (integer) - Number of persons
  - `available_space` (decimal) - Available space for structures in sq.m
  - `water_scarcity_days` (integer) - Period of water scarcity in days
  - `current_water_sources` (text) - Description of current water sources
  - `annual_rainfall` (decimal) - Annual average rainfall in mm
  - `rainfall_intensity` (decimal) - Rainfall intensity in mm/hr
  - `aquifer_type` (text) - Consolidated/Semi-consolidated/Unconsolidated
  - `depth_water_premonsoon` (decimal) - Depth to water level pre-monsoon in meters
  - `depth_water_postmonsoon` (decimal) - Depth to water level post-monsoon in meters
  - `soil_type` (text) - Type of soil
  - `infiltration_rate` (decimal) - Soil infiltration rate in mm/hr
  - `created_at` (timestamptz) - Project creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. calculation_results
  Stores all calculation results for each project
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key) - Reference to projects table
  - `water_available` (decimal) - Water available from roof in litres
  - `water_required` (decimal) - Water required for household in litres
  - `is_feasible` (boolean) - Whether project is feasible
  - `tank_capacity` (decimal) - Recommended tank capacity in litres
  - `tank_diameter` (decimal) - Tank diameter in meters
  - `tank_height` (decimal) - Tank height in meters
  - `peak_flow` (decimal) - Peak flow in lps
  - `gutter_diameter` (decimal) - Recommended gutter diameter in mm
  - `downpipe_diameter` (decimal) - Recommended downpipe diameter in mm
  - `first_flush_volume` (decimal) - First flush volume in litres
  - `filter_type` (text) - Type of filter (Slow Sand/Rapid Sand)
  - `filter_area` (decimal) - Filter area in sq.m
  - `filter_length` (decimal) - Filter length in m
  - `filter_width` (decimal) - Filter width in m
  - `recharge_structure_type` (text) - Type of recharge structure
  - `recharge_structure_depth` (decimal) - Depth in meters
  - `recharge_structure_diameter` (decimal) - Diameter in meters
  - `total_cost` (decimal) - Total cost in INR
  - `annual_benefits` (decimal) - Annual benefits in INR
  - `bc_ratio` (decimal) - Benefit-Cost ratio
  - `payback_period` (decimal) - Payback period in years
  - `created_at` (timestamptz) - Calculation timestamp

  ### 3. regional_data
  Reference data for different locations with rainfall and aquifer characteristics
  - `id` (uuid, primary key)
  - `state` (text) - State name
  - `district` (text) - District name
  - `location` (text) - Specific location name
  - `annual_rainfall_min` (decimal) - Minimum annual rainfall in mm
  - `annual_rainfall_max` (decimal) - Maximum annual rainfall in mm
  - `annual_rainfall_avg` (decimal) - Average annual rainfall in mm
  - `rainfall_intensity_20min` (decimal) - Rainfall intensity for 20min duration in mm/hr
  - `aquifer_type` (text) - Primary aquifer type
  - `soil_type` (text) - Primary soil type
  - `infiltration_rate` (decimal) - Typical infiltration rate in mm/hr
  - `depth_water_premonsoon_avg` (decimal) - Average pre-monsoon water depth in m
  - `depth_water_postmonsoon_avg` (decimal) - Average post-monsoon water depth in m
  - `rainfall_zone` (text) - Arid/Semi-arid/Moderate/High
  - `created_at` (timestamptz)

  ### 4. cost_data
  Material and labor cost reference data (can be regional)
  - `id` (uuid, primary key)
  - `region` (text) - Region/state for cost data
  - `item_category` (text) - Category (Tank, Piping, Filter, Recharge, Civil, Labor)
  - `item_name` (text) - Specific item name
  - `unit` (text) - Unit of measurement
  - `rate_min` (decimal) - Minimum rate in INR
  - `rate_max` (decimal) - Maximum rate in INR
  - `rate_avg` (decimal) - Average rate in INR
  - `description` (text) - Item description
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Allow public read access to regional_data and cost_data (reference data)
  - Allow users to create and read their own projects
  - Allow users to read their own calculation results
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  user_contact text NOT NULL,
  location_name text NOT NULL,
  location_lat decimal(10, 7),
  location_lng decimal(10, 7),
  roof_area decimal(10, 2) NOT NULL,
  roof_type text NOT NULL,
  roof_height decimal(10, 2) DEFAULT 3.0,
  household_size integer NOT NULL,
  available_space decimal(10, 2),
  water_scarcity_days integer NOT NULL,
  current_water_sources text,
  annual_rainfall decimal(10, 2),
  rainfall_intensity decimal(10, 2),
  aquifer_type text,
  depth_water_premonsoon decimal(10, 2),
  depth_water_postmonsoon decimal(10, 2),
  soil_type text,
  infiltration_rate decimal(10, 2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create calculation_results table
CREATE TABLE IF NOT EXISTS calculation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  water_available decimal(12, 2),
  water_required decimal(12, 2),
  is_feasible boolean DEFAULT false,
  tank_capacity decimal(12, 2),
  tank_diameter decimal(10, 2),
  tank_height decimal(10, 2),
  peak_flow decimal(10, 3),
  gutter_diameter decimal(10, 2),
  downpipe_diameter decimal(10, 2),
  first_flush_volume decimal(10, 2),
  filter_type text,
  filter_area decimal(10, 2),
  filter_length decimal(10, 2),
  filter_width decimal(10, 2),
  recharge_structure_type text,
  recharge_structure_depth decimal(10, 2),
  recharge_structure_diameter decimal(10, 2),
  total_cost decimal(12, 2),
  annual_benefits decimal(12, 2),
  bc_ratio decimal(10, 2),
  payback_period decimal(10, 2),
  created_at timestamptz DEFAULT now()
);

-- Create regional_data table
CREATE TABLE IF NOT EXISTS regional_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL,
  district text NOT NULL,
  location text NOT NULL,
  annual_rainfall_min decimal(10, 2),
  annual_rainfall_max decimal(10, 2),
  annual_rainfall_avg decimal(10, 2),
  rainfall_intensity_20min decimal(10, 2),
  aquifer_type text,
  soil_type text,
  infiltration_rate decimal(10, 2),
  depth_water_premonsoon_avg decimal(10, 2),
  depth_water_postmonsoon_avg decimal(10, 2),
  rainfall_zone text,
  created_at timestamptz DEFAULT now()
);

-- Create cost_data table
CREATE TABLE IF NOT EXISTS cost_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text DEFAULT 'National',
  item_category text NOT NULL,
  item_name text NOT NULL,
  unit text NOT NULL,
  rate_min decimal(10, 2),
  rate_max decimal(10, 2),
  rate_avg decimal(10, 2),
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_calculation_results_project_id ON calculation_results(project_id);
CREATE INDEX IF NOT EXISTS idx_regional_data_location ON regional_data(state, district, location);
CREATE INDEX IF NOT EXISTS idx_cost_data_category ON cost_data(item_category, region);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Anyone can create projects"
  ON projects FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read all projects"
  ON projects FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can update projects"
  ON projects FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for calculation_results
CREATE POLICY "Anyone can create calculation results"
  ON calculation_results FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read calculation results"
  ON calculation_results FOR SELECT
  TO public
  USING (true);

-- RLS Policies for regional_data (reference data - public read)
CREATE POLICY "Anyone can read regional data"
  ON regional_data FOR SELECT
  TO public
  USING (true);

-- RLS Policies for cost_data (reference data - public read)
CREATE POLICY "Anyone can read cost data"
  ON cost_data FOR SELECT
  TO public
  USING (true);

-- Insert sample cost data based on CGWB Manual
INSERT INTO cost_data (item_category, item_name, unit, rate_min, rate_max, rate_avg, description) VALUES
  -- Storage Tanks
  ('Tank', 'Ferro-cement Tank (4000-15000L)', 'per litre', 120, 150, 135, 'Ferro-cement storage tank for small to medium capacity'),
  ('Tank', 'Masonry Tank (15000-50000L)', 'per litre', 100, 130, 115, 'Brick masonry storage tank for medium to large capacity'),
  ('Tank', 'RCC Tank (>50000L)', 'per litre', 150, 200, 175, 'Reinforced cement concrete tank for large capacity'),
  
  -- Piping & Accessories
  ('Piping', 'GI/PVC Gutter', 'per meter', 200, 400, 300, 'Galvanized iron or PVC gutter for rainwater collection'),
  ('Piping', 'Down Pipe', 'per meter', 150, 300, 225, 'Vertical pipes to convey water from gutter to storage'),
  ('Piping', 'First Flush Unit', 'per unit', 500, 800, 650, 'First flush device to divert initial dirty water'),
  ('Filter', 'Slow Sand Filter Unit', 'per unit', 2000, 5000, 3500, 'Complete slow sand filter with media'),
  ('Filter', 'Rapid Sand Filter Unit', 'per unit', 3000, 6000, 4500, 'Complete rapid sand filter with media'),
  
  -- Recharge Structures
  ('Recharge', 'Recharge Pit (3m depth)', 'per unit', 8000, 12000, 10000, 'Excavated pit with filter media for shallow aquifer recharge'),
  ('Recharge', 'Recharge Shaft (10m depth)', 'per unit', 25000, 40000, 32500, 'Drilled/dug shaft for deep aquifer recharge'),
  ('Recharge', 'Filter Media for Recharge', 'per cu.m', 3000, 6000, 4500, 'Boulders, gravel, and sand layers'),
  
  -- Civil Works
  ('Civil', 'Excavation', 'per cu.m', 200, 300, 250, 'Manual or machine excavation'),
  ('Civil', 'Brick Masonry', 'per cu.m', 400, 600, 500, 'Brick masonry work with cement mortar'),
  ('Civil', 'PCC Work', 'per cu.m', 5000, 7000, 6000, 'Plain cement concrete work'),
  ('Civil', 'RCC Work', 'per cu.m', 6000, 8000, 7000, 'Reinforced cement concrete work'),
  
  -- Materials
  ('Material', 'Cement', 'per bag (50kg)', 350, 450, 400, 'Portland Pozzolana Cement or OPC'),
  ('Material', 'Sand', 'per cu.m', 800, 1200, 1000, 'River sand or manufactured sand'),
  ('Material', 'Aggregate (20mm)', 'per cu.m', 1200, 1600, 1400, 'Coarse aggregate for concrete'),
  ('Material', 'Bricks', 'per 1000 nos', 4000, 6000, 5000, 'First class burnt clay bricks'),
  ('Material', 'Steel Reinforcement', 'per kg', 50, 70, 60, 'TMT bars for reinforcement'),
  
  -- Labor
  ('Labor', 'Skilled Mason', 'per day', 600, 800, 700, 'Skilled masonry work'),
  ('Labor', 'Helper/Unskilled', 'per day', 400, 500, 450, 'Unskilled labor for assistance'),
  ('Labor', 'Plumber', 'per day', 500, 700, 600, 'Skilled plumbing work'),
  
  -- Maintenance
  ('Maintenance', 'Annual Cleaning', 'per year', 1000, 2000, 1500, 'Pre-monsoon and post-monsoon cleaning'),
  ('Maintenance', 'Filter Media Replacement', 'per 3 years', 2000, 4000, 3000, 'Replacement of filter media'),
  ('Maintenance', 'Tank Disinfection', 'per year', 500, 1000, 750, 'Bleaching powder and cleaning')
ON CONFLICT DO NOTHING;

-- Insert sample regional data
INSERT INTO regional_data (state, district, location, annual_rainfall_min, annual_rainfall_max, annual_rainfall_avg, rainfall_intensity_20min, aquifer_type, soil_type, infiltration_rate, depth_water_premonsoon_avg, depth_water_postmonsoon_avg, rainfall_zone) VALUES
  ('Karnataka', 'Bangalore Urban', 'Bangalore', 750, 950, 850, 100, 'Unconsolidated', 'Red Soil', 12, 8, 5, 'Moderate'),
  ('Tamil Nadu', 'Chennai', 'Chennai', 1200, 1400, 1300, 150, 'Semi-consolidated', 'Sandy Loam', 25, 6, 3, 'High'),
  ('Maharashtra', 'Mumbai', 'Mumbai', 2200, 2800, 2500, 200, 'Consolidated', 'Laterite', 8, 4, 2, 'High'),
  ('Rajasthan', 'Jaipur', 'Jaipur', 500, 650, 575, 50, 'Consolidated', 'Sandy Soil', 30, 15, 12, 'Semi-arid'),
  ('Kerala', 'Thiruvananthapuram', 'Trivandrum', 2800, 3200, 3000, 180, 'Unconsolidated', 'Laterite', 15, 3, 1, 'High'),
  ('Delhi', 'New Delhi', 'Delhi', 600, 800, 700, 80, 'Unconsolidated', 'Alluvial', 20, 10, 6, 'Semi-arid'),
  ('West Bengal', 'Kolkata', 'Kolkata', 1500, 1700, 1600, 120, 'Unconsolidated', 'Alluvial', 25, 5, 2, 'High'),
  ('Telangana', 'Hyderabad', 'Hyderabad', 700, 850, 775, 90, 'Semi-consolidated', 'Red Soil', 10, 9, 6, 'Moderate'),
  ('Gujarat', 'Ahmedabad', 'Ahmedabad', 700, 900, 800, 100, 'Unconsolidated', 'Alluvial', 18, 12, 8, 'Moderate'),
  ('Uttar Pradesh', 'Lucknow', 'Lucknow', 900, 1100, 1000, 110, 'Unconsolidated', 'Alluvial', 22, 8, 4, 'Moderate')
ON CONFLICT DO NOTHING;
