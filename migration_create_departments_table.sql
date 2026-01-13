-- Migration: Add departments table for Auxiliary Data
-- Date: 2026-01-02

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (authenticated)
DROP POLICY IF EXISTS "Allow read access to all users" ON departments;
CREATE POLICY "Allow read access to all users" ON departments FOR SELECT USING (true);

-- Allow write access to authenticated users
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON departments;
CREATE POLICY "Allow write access to authenticated users" ON departments FOR ALL USING (auth.role() = 'authenticated');

-- Insert Defaults
INSERT INTO departments (name) VALUES 
('Bebidas'), ('Mercearia'), ('Açougue'), ('Padaria'), ('Hortifruti'), ('Limpeza'), ('Higiene')
ON CONFLICT (name) DO NOTHING;
