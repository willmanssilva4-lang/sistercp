-- Criar tabela stock_batches para controle PEPS (Primeiro que Entra, Primeiro que Sai)
CREATE TABLE IF NOT EXISTS stock_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    qty_original DECIMAL(10, 3) NOT NULL,
    qty_remaining DECIMAL(10, 3) NOT NULL,
    cost_price DECIMAL(10, 3) NOT NULL,
    purchase_date DATE NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_stock_batches_product_id ON stock_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_batches_purchase_date ON stock_batches(purchase_date);
CREATE INDEX IF NOT EXISTS idx_stock_batches_qty_remaining ON stock_batches(qty_remaining);

-- Comentários para documentação
COMMENT ON TABLE stock_batches IS 'Lotes de estoque para controle PEPS (Primeiro que Entra, Primeiro que Sai)';
COMMENT ON COLUMN stock_batches.product_id IS 'ID do produto';
COMMENT ON COLUMN stock_batches.transaction_id IS 'ID da transação de compra (opcional)';
COMMENT ON COLUMN stock_batches.qty_original IS 'Quantidade original do lote';
COMMENT ON COLUMN stock_batches.qty_remaining IS 'Quantidade restante no lote';
COMMENT ON COLUMN stock_batches.cost_price IS 'Preço de custo unitário';
COMMENT ON COLUMN stock_batches.purchase_date IS 'Data da compra';
COMMENT ON COLUMN stock_batches.expiry_date IS 'Data de validade (opcional)';
