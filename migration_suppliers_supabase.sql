-- Migration: Adicionar tabela de fornecedores (Supabase PostgreSQL)
-- Data: 2025-12-07
-- Descrição: Cria tabela suppliers para gestão de fornecedores

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cnpj TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    contact_person TEXT,
    payment_terms TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_cnpj ON suppliers(cnpj);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_suppliers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_suppliers_updated ON suppliers;
CREATE TRIGGER trigger_suppliers_updated
BEFORE UPDATE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION update_suppliers_timestamp();

-- RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver fornecedores" ON suppliers
    FOR SELECT USING (true);

CREATE POLICY "Apenas admins e managers podem gerenciar fornecedores" ON suppliers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- Inserir dados iniciais se a tabela estiver vazia (migração de dados locais seria ideal, mas aqui usamos defaults)
INSERT INTO suppliers (name, active)
SELECT 'Coca-Cola FEMSA', TRUE
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Coca-Cola FEMSA');

INSERT INTO suppliers (name, active)
SELECT 'Camil Alimentos', TRUE
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Camil Alimentos');

INSERT INTO suppliers (name, active)
SELECT 'Química Amparo', TRUE
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Química Amparo');

INSERT INTO suppliers (name, active)
SELECT 'Itambé Laticínios', TRUE
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Itambé Laticínios');
