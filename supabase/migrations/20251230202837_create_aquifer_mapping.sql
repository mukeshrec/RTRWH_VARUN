/*
  # Aquifer Mapping for Indian Regions

  1. New Tables
    - `aquifer_mapping`
      - `id` (uuid, primary key)
      - `state` (text) - Indian state name
      - `region` (text) - Specific region within state
      - `aquifer_type` (text) - Type: hard_rock, alluvial, coastal, fractured_rock
      - `description` (text) - Details about the aquifer
      - `recharge_potential` (text) - High, Medium, Low
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `aquifer_mapping` table
    - Allow public read access (data is public information)

  3. Sample Data
    - Pre-populate with major Indian states and their aquifer types
*/

CREATE TABLE IF NOT EXISTS aquifer_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL,
  region text,
  aquifer_type text NOT NULL,
  description text,
  recharge_potential text DEFAULT 'Medium',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE aquifer_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to aquifer data"
  ON aquifer_mapping
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert aquifer mapping data for Indian states
INSERT INTO aquifer_mapping (state, region, aquifer_type, description, recharge_potential) VALUES
  -- Hard Rock Aquifers (Peninsular India)
  ('Karnataka', 'All regions', 'hard_rock', 'Predominantly crystalline rocks with limited groundwater storage in fractures and weathered zones', 'Low'),
  ('Telangana', 'All regions', 'hard_rock', 'Granite and gneiss formations with groundwater in weathered and fractured zones', 'Low'),
  ('Andhra Pradesh', 'Rayalaseema', 'hard_rock', 'Crystalline rocks with limited permeability', 'Low'),
  ('Tamil Nadu', 'Western regions', 'hard_rock', 'Granitic terrain with groundwater in fractures', 'Low'),
  ('Maharashtra', 'Deccan plateau', 'hard_rock', 'Basaltic hard rock with moderate fracture systems', 'Medium'),
  ('Madhya Pradesh', 'Central regions', 'hard_rock', 'Granite and gneiss with weathered zones', 'Low'),
  ('Rajasthan', 'Western regions', 'hard_rock', 'Hard rock terrain with limited groundwater', 'Low'),
  ('Jharkhand', 'All regions', 'hard_rock', 'Chota Nagpur plateau with hard rock aquifers', 'Low'),
  ('Chhattisgarh', 'All regions', 'hard_rock', 'Crystalline basement rocks', 'Low'),
  ('Odisha', 'Western regions', 'hard_rock', 'Granite-gneiss complex', 'Low'),
  
  -- Alluvial Aquifers (Indo-Gangetic Plains)
  ('Punjab', 'All regions', 'alluvial', 'Highly productive alluvial aquifers with excellent recharge', 'High'),
  ('Haryana', 'All regions', 'alluvial', 'Deep alluvial deposits with high groundwater potential', 'High'),
  ('Uttar Pradesh', 'All regions', 'alluvial', 'Thick alluvial sequences with multiple aquifer systems', 'High'),
  ('Bihar', 'All regions', 'alluvial', 'Indo-Gangetic alluvium with high permeability', 'High'),
  ('West Bengal', 'All regions', 'alluvial', 'Quaternary alluvium with excellent aquifer properties', 'High'),
  ('Uttarakhand', 'Plains', 'alluvial', 'Terai and Bhabar zones with good aquifer systems', 'High'),
  ('Delhi', 'All regions', 'alluvial', 'Yamuna alluvial plains', 'Medium'),
  ('Chandigarh', 'All regions', 'alluvial', 'Alluvial deposits', 'Medium'),
  
  -- Coastal Aquifers
  ('Kerala', 'Coastal regions', 'coastal', 'Coastal sediments with risk of saltwater intrusion', 'Medium'),
  ('Goa', 'All regions', 'coastal', 'Lateritic and coastal alluvium with seawater interface', 'Medium'),
  ('Andhra Pradesh', 'Coastal districts', 'coastal', 'Deltaic deposits with freshwater-saltwater interface', 'Medium'),
  ('Tamil Nadu', 'Coastal regions', 'coastal', 'Coastal alluvium vulnerable to sea intrusion', 'Medium'),
  ('Odisha', 'Coastal regions', 'coastal', 'Deltaic and coastal deposits', 'Medium'),
  ('Gujarat', 'Coastal regions', 'coastal', 'Coastal aquifers with salinity issues', 'Low'),
  ('Maharashtra', 'Konkan coast', 'coastal', 'Lateritic coastal belt', 'Medium'),
  
  -- Fractured Rock Aquifers
  ('Himachal Pradesh', 'All regions', 'fractured_rock', 'Himalayan fractured rock systems', 'Low'),
  ('Uttarakhand', 'Hilly regions', 'fractured_rock', 'Fractured metamorphic rocks', 'Low'),
  ('Jammu and Kashmir', 'All regions', 'fractured_rock', 'Himalayan fractured aquifers', 'Low'),
  ('Sikkim', 'All regions', 'fractured_rock', 'Fractured rocks in mountainous terrain', 'Low'),
  ('Arunachal Pradesh', 'All regions', 'fractured_rock', 'Himalayan fractured formations', 'Low'),
  ('Nagaland', 'All regions', 'fractured_rock', 'Hilly fractured rock terrain', 'Low'),
  ('Manipur', 'All regions', 'fractured_rock', 'Fractured sedimentary and metamorphic rocks', 'Low'),
  ('Mizoram', 'All regions', 'fractured_rock', 'Fractured rock aquifers in hills', 'Low'),
  ('Tripura', 'All regions', 'fractured_rock', 'Fractured sandstone aquifers', 'Low'),
  ('Meghalaya', 'All regions', 'fractured_rock', 'Fractured rocks with karst features', 'Medium'),
  
  -- Mixed/Special Cases
  ('Gujarat', 'Northern regions', 'alluvial', 'Alluvial plains with good groundwater', 'High'),
  ('Gujarat', 'Saurashtra', 'hard_rock', 'Basaltic hard rock', 'Low'),
  ('Rajasthan', 'Eastern regions', 'alluvial', 'Alluvial deposits', 'Medium'),
  ('Assam', 'Brahmaputra valley', 'alluvial', 'Alluvial aquifers', 'High');
