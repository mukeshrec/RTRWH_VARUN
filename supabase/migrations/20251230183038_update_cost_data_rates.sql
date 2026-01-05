/*
  # Update Cost Data with Correct Rates
  
  Updates the cost_data table with corrected rates based on CGWB Manual specifications.
  
  ## Changes
  - Update storage tank costs to ₹12-15 per litre (ferro-cement)
  - Update storage tank costs to ₹10-13 per litre (masonry)
  - Update storage tank costs to ₹15-20 per litre (RCC)
  - Adjust other component costs to realistic values
*/

-- Delete existing cost data
DELETE FROM cost_data;

-- Insert corrected cost data
INSERT INTO cost_data (item_category, item_name, unit, rate_min, rate_max, rate_avg, description) VALUES
  -- Storage Tanks (CORRECTED RATES per litre)
  ('Tank', 'Ferro-cement Tank (4000-15000L)', 'per litre', 12, 15, 13, 'Ferro-cement storage tank for small to medium capacity'),
  ('Tank', 'Masonry Tank (15000-50000L)', 'per litre', 10, 13, 11, 'Brick masonry storage tank for medium to large capacity'),
  ('Tank', 'RCC Tank (>50000L)', 'per litre', 15, 20, 17, 'Reinforced cement concrete tank for large capacity'),
  
  -- Piping & Accessories
  ('Piping', 'GI/PVC Gutter', 'per meter', 200, 400, 300, 'Galvanized iron or PVC gutter for rainwater collection'),
  ('Piping', 'Down Pipe', 'per meter', 150, 250, 200, 'Vertical pipes to convey water from gutter to storage'),
  ('Piping', 'First Flush Unit', 'per unit', 500, 800, 650, 'First flush device to divert initial dirty water'),
  ('Filter', 'Slow Sand Filter Unit', 'per unit', 2000, 4000, 3000, 'Complete slow sand filter with media'),
  ('Filter', 'Rapid Sand Filter Unit', 'per unit', 3000, 5000, 4000, 'Complete rapid sand filter with media'),
  ('Filter', 'Filter Media', 'per cu.m', 600, 1000, 800, 'Sand, gravel layers for filtration'),
  
  -- Recharge Structures
  ('Recharge', 'Recharge Pit (3m depth)', 'per unit', 8000, 12000, 10000, 'Excavated pit with filter media for shallow aquifer recharge'),
  ('Recharge', 'Recharge Shaft (10m depth)', 'per unit', 25000, 35000, 30000, 'Drilled/dug shaft for deep aquifer recharge'),
  
  -- Civil Works
  ('Civil', 'Excavation', 'per cu.m', 200, 300, 250, 'Manual or machine excavation'),
  ('Civil', 'Brick Masonry', 'per cu.m', 400, 600, 500, 'Brick masonry work with cement mortar'),
  ('Civil', 'PCC Work', 'per cu.m', 5000, 6000, 5500, 'Plain cement concrete work'),
  ('Civil', 'RCC Work', 'per cu.m', 6000, 7000, 6500, 'Reinforced cement concrete work'),
  ('Civil', 'Plastering', 'per sq.m', 40, 60, 50, 'Internal/external plastering work'),
  
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
  ('Maintenance', 'Tank Disinfection', 'per year', 500, 1000, 750, 'Bleaching powder and cleaning'),
  
  -- Water Cost Reference
  ('Water', 'Alternative Water Source', 'per cu.m', 15, 25, 20, 'Cost of water from tankers or other sources'),
  ('Water', 'Electricity for Pumping', 'per kWh', 6, 8, 7, 'Electricity cost for water pumping')
ON CONFLICT DO NOTHING;
