-- Migration: Create tables for Auxiliary Data (Categories, Subcategories, Brands, Terminals)
-- Date: 2026-01-02

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    margin NUMERIC(10, 2) DEFAULT 0,
    markup NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcategories Table
CREATE TABLE IF NOT EXISTS subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Terminals Table
CREATE TABLE IF NOT EXISTS terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    rate_debit NUMERIC(10, 2) DEFAULT 0,
    rate_credit NUMERIC(10, 2) DEFAULT 0,
    rate_pix NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (authenticated)
-- Allow read access to everyone (authenticated)
DROP POLICY IF EXISTS "Allow read access to all users" ON categories;
CREATE POLICY "Allow read access to all users" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access to all users" ON subcategories;
CREATE POLICY "Allow read access to all users" ON subcategories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access to all users" ON brands;
CREATE POLICY "Allow read access to all users" ON brands FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access to all users" ON terminals;
CREATE POLICY "Allow read access to all users" ON terminals FOR SELECT USING (true);

-- Allow write access to authenticated users (or restrict to admin/manager if needed, but for now open to auth)
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON categories;
CREATE POLICY "Allow write access to authenticated users" ON categories FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow write access to authenticated users" ON subcategories;
CREATE POLICY "Allow write access to authenticated users" ON subcategories FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow write access to authenticated users" ON brands;
CREATE POLICY "Allow write access to authenticated users" ON brands FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow write access to authenticated users" ON terminals;
CREATE POLICY "Allow write access to authenticated users" ON terminals FOR ALL USING (auth.role() = 'authenticated');

-- Insert Defaults
INSERT INTO categories (name) VALUES 
('Geral'), ('Bebidas'), ('Mercearia'), ('Limpeza'), ('Hortifruti'), ('Padaria'), ('Açougue')
ON CONFLICT (name) DO NOTHING;

INSERT INTO subcategories (name) VALUES 
('Refrigerantes'), ('Grãos'), ('Laticínios'), ('Lava Louças')
ON CONFLICT (name) DO NOTHING;

INSERT INTO brands (name) VALUES 
('Coca-Cola'), ('Camil'), ('Ypê'), ('Itambé')
ON CONFLICT (name) DO NOTHING;

