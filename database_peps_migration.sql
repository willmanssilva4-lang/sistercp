-- Migration para implementar PEPS (FIFO)
-- Tabela para armazenar lotes de compra

CREATE TABLE IF NOT EXISTS stock_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    qty_original NUMERIC(10, 3) NOT NULL,
    qty_remaining NUMERIC(10, 3) NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_stock_batches_product ON stock_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_batches_purchase_date ON stock_batches(purchase_date);
CREATE INDEX IF NOT EXISTS idx_stock_batches_remaining ON stock_batches(qty_remaining) WHERE qty_remaining > 0;

-- Comentários
COMMENT ON TABLE stock_batches IS 'Armazena lotes de compra para controle PEPS (Primeiro que Entra, Primeiro que Sai)';
COMMENT ON COLUMN stock_batches.qty_original IS 'Quantidade original do lote';
COMMENT ON COLUMN stock_batches.qty_remaining IS 'Quantidade restante no lote';
COMMENT ON COLUMN stock_batches.cost_price IS 'Preço de custo unitário do lote';
COMMENT ON COLUMN stock_batches.purchase_date IS 'Data da compra (usado para ordenação PEPS)';
