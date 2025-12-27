-- Migration: Create Customers Table
-- Date: 2025-12-26
-- Description: Creates the customers table for CRM and Credit management

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    cpf TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    credit_limit NUMERIC(10, 2) DEFAULT 0,
    debt_balance NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_cpf ON customers(cpf);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_customers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_customers_updated ON customers;
CREATE TRIGGER trigger_customers_updated
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_customers_timestamp();

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON customers
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON customers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON customers
    FOR DELETE USING (auth.role() = 'authenticated');
