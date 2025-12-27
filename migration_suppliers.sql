-- Migration: Adicionar tabela de fornecedores
-- Data: 2024-12-05
-- Descrição: Cria tabela suppliers para gestão de fornecedores

CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cnpj TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    contact_person TEXT,
    payment_terms TEXT,
    notes TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_cnpj ON suppliers(cnpj);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER IF NOT EXISTS update_suppliers_timestamp 
AFTER UPDATE ON suppliers
BEGIN
    UPDATE suppliers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Inserir fornecedores de exemplo (opcional - pode remover se não quiser dados de exemplo)
INSERT OR IGNORE INTO suppliers (id, name, cnpj, phone, email, contact_person, payment_terms, active) VALUES
('SUPP001', 'Distribuidora ABC Ltda', '12.345.678/0001-90', '(11) 3456-7890', 'contato@distribuidoraabc.com', 'João Silva', '30 dias', 1),
('SUPP002', 'Atacadão XYZ', '98.765.432/0001-10', '(11) 9876-5432', 'vendas@atacadaoxyz.com', 'Maria Santos', 'À vista', 1),
('SUPP003', 'Fornecedor Nacional', '11.222.333/0001-44', '(21) 2222-3333', 'comercial@fornecedornacional.com', 'Pedro Costa', '15/30 dias', 1);
