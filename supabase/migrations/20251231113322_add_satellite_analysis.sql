/*
  # Add Satellite Imagery and Site Analysis Features

  ## Overview
  This migration adds support for storing roof polygon coordinates, elevation data,
  and site analysis results from satellite imagery integration.

  ## Changes to Existing Tables

  ### 1. projects table
  Added columns for:
  - `roof_polygon` (jsonb) - Array of [lng, lat] coordinates defining roof outline
  - `elevation` (decimal) - Site elevation in meters above sea level
  - `slope` (decimal) - Terrain slope in degrees
  - `shadow_analysis` (jsonb) - Shadow pattern analysis for optimal placement
  - `nearby_water_bodies` (jsonb) - Array of nearby water sources with distances
  - `site_recommendations` (text[]) - Array of site-specific recommendations
  - `site_warnings` (text[]) - Array of site-specific warnings

  ## Security
  - No changes to existing RLS policies
  - All new fields follow existing access patterns
*/

-- Add satellite analysis fields to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'roof_polygon'
  ) THEN
    ALTER TABLE projects ADD COLUMN roof_polygon jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'elevation'
  ) THEN
    ALTER TABLE projects ADD COLUMN elevation decimal(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'slope'
  ) THEN
    ALTER TABLE projects ADD COLUMN slope decimal(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'shadow_analysis'
  ) THEN
    ALTER TABLE projects ADD COLUMN shadow_analysis jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'nearby_water_bodies'
  ) THEN
    ALTER TABLE projects ADD COLUMN nearby_water_bodies jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'site_recommendations'
  ) THEN
    ALTER TABLE projects ADD COLUMN site_recommendations text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'site_warnings'
  ) THEN
    ALTER TABLE projects ADD COLUMN site_warnings text[];
  END IF;
END $$;

-- Create index for spatial queries on roof_polygon
CREATE INDEX IF NOT EXISTS idx_projects_roof_polygon ON projects USING GIN (roof_polygon);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_projects_location ON projects(location_lat, location_lng);
