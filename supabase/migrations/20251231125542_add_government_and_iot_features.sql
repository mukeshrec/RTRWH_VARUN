/*
  # Government Integration Suite and IoT Dashboard Schema

  ## New Tables

  ### 1. government_users
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `department` (text)
    - `jurisdiction` (text)
    - `role` (text)
    - `created_at` (timestamptz)

  ### 2. subsidy_applications
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `project_id` (uuid)
    - `application_type` (text)
    - `status` (text)
    - `submitted_at` (timestamptz)
    - `reviewed_at` (timestamptz)
    - `reviewed_by` (uuid, references government_users)
    - `amount_requested` (numeric)
    - `amount_approved` (numeric)
    - `remarks` (text)
    - `documents` (jsonb)

  ### 3. iot_devices
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `project_id` (uuid)
    - `device_type` (text)
    - `device_name` (text)
    - `device_id` (text, unique)
    - `status` (text)
    - `last_reading_at` (timestamptz)
    - `metadata` (jsonb)
    - `created_at` (timestamptz)

  ### 4. sensor_readings
    - `id` (uuid, primary key)
    - `device_id` (uuid, references iot_devices)
    - `reading_type` (text)
    - `value` (numeric)
    - `unit` (text)
    - `timestamp` (timestamptz)
    - `metadata` (jsonb)

  ### 5. installation_registry
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `project_id` (uuid)
    - `address` (text)
    - `latitude` (numeric)
    - `longitude` (numeric)
    - `system_type` (text)
    - `tank_capacity` (numeric)
    - `installation_date` (date)
    - `status` (text)
    - `compliance_status` (text)
    - `last_inspection_date` (date)
    - `annual_water_saved` (numeric)
    - `created_at` (timestamptz)

  ## Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read their own data
    - Add policies for government users to access installation registry and applications
*/

-- Government Users Table
CREATE TABLE IF NOT EXISTS government_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  department text NOT NULL,
  jurisdiction text NOT NULL,
  role text NOT NULL DEFAULT 'officer',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE government_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Government users can read own profile"
  ON government_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Government users can update own profile"
  ON government_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Subsidy Applications Table
CREATE TABLE IF NOT EXISTS subsidy_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  project_id uuid,
  application_type text NOT NULL DEFAULT 'installation_subsidy',
  status text NOT NULL DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES government_users(id),
  amount_requested numeric DEFAULT 0,
  amount_approved numeric DEFAULT 0,
  remarks text,
  documents jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE subsidy_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own applications"
  ON subsidy_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications"
  ON subsidy_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending applications"
  ON subsidy_applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Government users can read all applications"
  ON subsidy_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM government_users
      WHERE government_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Government users can update applications"
  ON subsidy_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM government_users
      WHERE government_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM government_users
      WHERE government_users.user_id = auth.uid()
    )
  );

-- IoT Devices Table
CREATE TABLE IF NOT EXISTS iot_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  project_id uuid,
  device_type text NOT NULL,
  device_name text NOT NULL,
  device_id text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  last_reading_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own devices"
  ON iot_devices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own devices"
  ON iot_devices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
  ON iot_devices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
  ON iot_devices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Sensor Readings Table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES iot_devices(id) ON DELETE CASCADE NOT NULL,
  reading_type text NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own device readings"
  ON sensor_readings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM iot_devices
      WHERE iot_devices.id = sensor_readings.device_id
      AND iot_devices.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert sensor readings"
  ON sensor_readings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM iot_devices
      WHERE iot_devices.id = sensor_readings.device_id
      AND iot_devices.user_id = auth.uid()
    )
  );

-- Installation Registry Table
CREATE TABLE IF NOT EXISTS installation_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  project_id uuid,
  address text NOT NULL,
  latitude numeric,
  longitude numeric,
  system_type text NOT NULL,
  tank_capacity numeric NOT NULL DEFAULT 0,
  installation_date date,
  status text NOT NULL DEFAULT 'planned',
  compliance_status text NOT NULL DEFAULT 'pending',
  last_inspection_date date,
  annual_water_saved numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE installation_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own installations"
  ON installation_registry FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own installations"
  ON installation_registry FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own installations"
  ON installation_registry FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Government users can read all installations"
  ON installation_registry FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM government_users
      WHERE government_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Government users can update installation compliance"
  ON installation_registry FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM government_users
      WHERE government_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM government_users
      WHERE government_users.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subsidy_applications_user_id ON subsidy_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_applications_status ON subsidy_applications(status);
CREATE INDEX IF NOT EXISTS idx_iot_devices_user_id ON iot_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_device_id ON iot_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_id ON sensor_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_installation_registry_user_id ON installation_registry(user_id);
CREATE INDEX IF NOT EXISTS idx_installation_registry_status ON installation_registry(status);