-- Migration: Move margin and markup from categories to departments
-- Date: 2026-01-02

-- Remove columns from categories
ALTER TABLE categories DROP COLUMN IF EXISTS margin;
ALTER TABLE categories DROP COLUMN IF EXISTS markup;

-- Add columns to departments
ALTER TABLE departments ADD COLUMN IF NOT EXISTS margin NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS markup NUMERIC(10, 2) DEFAULT 0;
