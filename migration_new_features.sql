-- Migration: Novas Funcionalidades
-- Data: 2025-12-05
-- Descrição: Adiciona tabelas para Controle de Caixa, Backup e Alertas

-- ============================================
-- 1. CONTROLE DE CAIXA
-- ============================================

-- Tabela de Sessões de Caixa
CREATE TABLE IF NOT EXISTS cash_register_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    user_name TEXT NOT NULL,
    opening_date TIMESTAMP WITH TIME ZONE NOT NULL,
    closing_date TIMESTAMP WITH TIME ZONE,
    opening_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
    closing_balance NUMERIC(10, 2),
    expected_balance NUMERIC(10, 2),
    difference NUMERIC(10, 2),
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX idx_cash_sessions_user ON cash_register_sessions(user_id);
CREATE INDEX idx_cash_sessions_status ON cash_register_sessions(status);
CREATE INDEX idx_cash_sessions_opening_date ON cash_register_sessions(opening_date);

-- ============================================
-- 2. BACKUP E AUDITORIA
-- ============================================

-- Tabela de Histórico de Backups
CREATE TABLE IF NOT EXISTS backup_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    size_bytes BIGINT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('AUTO', 'MANUAL')),
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED')),
    performed_by UUID REFERENCES users(id),
    file_path TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_backup_timestamp ON backup_history(timestamp);
CREATE INDEX idx_backup_type ON backup_history(type);
CREATE INDEX idx_backup_status ON backup_history(status);

-- Tabela de Configurações de Backup
CREATE TABLE IF NOT EXISTS backup_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auto_backup_enabled BOOLEAN DEFAULT TRUE,
    backup_frequency TEXT NOT NULL CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
    last_backup_date TIMESTAMP WITH TIME ZONE,
    retention_days INTEGER DEFAULT 30,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configuração padrão
INSERT INTO backup_settings (auto_backup_enabled, backup_frequency, retention_days)
VALUES (TRUE, 'daily', 30)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. ALERTAS DE VENCIMENTO
-- ============================================

-- Tabela de Configurações de Alertas
CREATE TABLE IF NOT EXISTS expiry_alert_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    critical_days INTEGER DEFAULT 7,
    warning_days INTEGER DEFAULT 15,
    info_days INTEGER DEFAULT 30,
    email_notifications BOOLEAN DEFAULT FALSE,
    notification_emails TEXT[],
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configuração padrão
INSERT INTO expiry_alert_settings (critical_days, warning_days, info_days)
VALUES (7, 15, 30)
ON CONFLICT DO NOTHING;

-- View para Alertas de Vencimento (facilita consultas)
CREATE OR REPLACE VIEW v_expiry_alerts AS
SELECT 
    p.id as product_id,
    p.code as product_code,
    p.name as product_name,
    p.category,
    p.stock,
    p.expiry_date,
    EXTRACT(DAY FROM (p.expiry_date - CURRENT_DATE)) as days_until_expiry,
    CASE 
        WHEN EXTRACT(DAY FROM (p.expiry_date - CURRENT_DATE)) <= (SELECT critical_days FROM expiry_alert_settings LIMIT 1) THEN 'critical'
        WHEN EXTRACT(DAY FROM (p.expiry_date - CURRENT_DATE)) <= (SELECT warning_days FROM expiry_alert_settings LIMIT 1) THEN 'warning'
        WHEN EXTRACT(DAY FROM (p.expiry_date - CURRENT_DATE)) <= (SELECT info_days FROM expiry_alert_settings LIMIT 1) THEN 'info'
        ELSE 'normal'
    END as severity
FROM products p
WHERE p.expiry_date IS NOT NULL
    AND p.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    AND p.stock > 0
ORDER BY p.expiry_date ASC;

-- View para Alertas de Lotes PEPS
CREATE OR REPLACE VIEW v_batch_expiry_alerts AS
SELECT 
    sb.id as batch_id,
    sb.product_id,
    p.code as product_code,
    p.name as product_name,
    p.category,
    sb.qty_remaining as batch_qty,
    sb.expiry_date,
    EXTRACT(DAY FROM (sb.expiry_date - CURRENT_DATE)) as days_until_expiry,
    CASE 
        WHEN EXTRACT(DAY FROM (sb.expiry_date - CURRENT_DATE)) <= (SELECT critical_days FROM expiry_alert_settings LIMIT 1) THEN 'critical'
        WHEN EXTRACT(DAY FROM (sb.expiry_date - CURRENT_DATE)) <= (SELECT warning_days FROM expiry_alert_settings LIMIT 1) THEN 'warning'
        WHEN EXTRACT(DAY FROM (sb.expiry_date - CURRENT_DATE)) <= (SELECT info_days FROM expiry_alert_settings LIMIT 1) THEN 'info'
        ELSE 'normal'
    END as severity
FROM stock_batches sb
JOIN products p ON p.id = sb.product_id
WHERE sb.expiry_date IS NOT NULL
    AND sb.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    AND sb.qty_remaining > 0
ORDER BY sb.expiry_date ASC;

-- ============================================
-- 4. ANÁLISE DE MARGEM DE LUCRO
-- ============================================

-- View para Análise de Margem de Lucro por Produto
CREATE OR REPLACE VIEW v_profit_margin_by_product AS
SELECT 
    p.id as product_id,
    p.code as product_code,
    p.name as product_name,
    p.category,
    p.cost_price,
    p.retail_price,
    p.retail_price - p.cost_price as profit_per_unit,
    CASE 
        WHEN p.retail_price > 0 THEN ((p.retail_price - p.cost_price) / p.retail_price * 100)
        ELSE 0 
    END as margin_percent,
    p.stock,
    (p.retail_price - p.cost_price) * p.stock as potential_profit
FROM products p
WHERE p.retail_price > 0
ORDER BY margin_percent DESC;

-- View para Análise de Margem de Lucro por Vendas
CREATE OR REPLACE VIEW v_profit_margin_by_sales AS
SELECT 
    s.id as sale_id,
    s.timestamp,
    s.customer_id,
    s.customer_name,
    s.total as revenue,
    SUM(si.qty * p.cost_price) as cost,
    s.total - SUM(si.qty * p.cost_price) as profit,
    CASE 
        WHEN s.total > 0 THEN ((s.total - SUM(si.qty * p.cost_price)) / s.total * 100)
        ELSE 0 
    END as margin_percent
FROM sales s
JOIN sale_items si ON si.sale_id = s.id
JOIN products p ON p.id = si.product_id
WHERE s.status = 'COMPLETED'
GROUP BY s.id, s.timestamp, s.customer_id, s.customer_name, s.total
ORDER BY s.timestamp DESC;

-- ============================================
-- 5. HISTÓRICO DE COMPRAS POR CLIENTE
-- ============================================

-- View para Estatísticas de Compras por Cliente
CREATE OR REPLACE VIEW v_customer_purchase_stats AS
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.cpf,
    c.phone,
    c.email,
    COUNT(s.id) as total_purchases,
    COALESCE(SUM(s.total), 0) as total_spent,
    COALESCE(AVG(s.total), 0) as average_ticket,
    MAX(s.timestamp) as last_purchase_date,
    MIN(s.timestamp) as first_purchase_date
FROM customers c
LEFT JOIN sales s ON s.customer_id = c.id AND s.status = 'COMPLETED'
GROUP BY c.id, c.name, c.cpf, c.phone, c.email
ORDER BY total_spent DESC;

-- View para Produtos Mais Comprados por Cliente
CREATE OR REPLACE VIEW v_customer_top_products AS
WITH customer_product_totals AS (
    SELECT 
        s.customer_id,
        si.product_id,
        p.code as product_code,
        p.name as product_name,
        SUM(si.qty) as total_qty,
        SUM(si.subtotal) as total_spent,
        COUNT(DISTINCT s.id) as purchase_count
    FROM sales s
    JOIN sale_items si ON si.sale_id = s.id
    JOIN products p ON p.id = si.product_id
    WHERE s.status = 'COMPLETED' AND s.customer_id IS NOT NULL
    GROUP BY s.customer_id, si.product_id, p.code, p.name
)
SELECT 
    customer_id,
    product_id,
    product_code,
    product_name,
    total_qty,
    total_spent,
    purchase_count,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY total_spent DESC) as rank
FROM customer_product_totals;

-- ============================================
-- 6. FUNÇÕES ÚTEIS
-- ============================================

-- Função para obter sessão de caixa aberta
CREATE OR REPLACE FUNCTION get_open_cash_session(p_user_id UUID)
RETURNS TABLE (
    session_id UUID,
    opening_date TIMESTAMP WITH TIME ZONE,
    opening_balance NUMERIC(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, opening_date, opening_balance
    FROM cash_register_sessions
    WHERE user_id = p_user_id AND status = 'OPEN'
    ORDER BY opening_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular vendas em uma sessão de caixa
CREATE OR REPLACE FUNCTION calculate_session_sales(p_session_id UUID)
RETURNS TABLE (
    total_sales NUMERIC(10, 2),
    cash_sales NUMERIC(10, 2),
    card_sales NUMERIC(10, 2),
    pix_sales NUMERIC(10, 2),
    fiado_sales NUMERIC(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(s.total), 0) as total_sales,
        COALESCE(SUM(CASE WHEN s.payment_method = 'CASH' THEN s.total ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN s.payment_method IN ('CREDIT', 'DEBIT') THEN s.total ELSE 0 END), 0) as card_sales,
        COALESCE(SUM(CASE WHEN s.payment_method = 'PIX' THEN s.total ELSE 0 END), 0) as pix_sales,
        COALESCE(SUM(CASE WHEN s.payment_method = 'FIADO' THEN s.total ELSE 0 END), 0) as fiado_sales
    FROM sales s
    JOIN cash_register_sessions crs ON crs.id = p_session_id
    WHERE s.timestamp >= crs.opening_date
        AND (crs.closing_date IS NULL OR s.timestamp <= crs.closing_date)
        AND s.status = 'COMPLETED';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at em backup_settings
CREATE OR REPLACE FUNCTION update_backup_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_backup_settings_updated
BEFORE UPDATE ON backup_settings
FOR EACH ROW
EXECUTE FUNCTION update_backup_settings_timestamp();

-- Trigger para atualizar updated_at em expiry_alert_settings
CREATE OR REPLACE FUNCTION update_expiry_alert_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expiry_alert_settings_updated
BEFORE UPDATE ON expiry_alert_settings
FOR EACH ROW
EXECUTE FUNCTION update_expiry_alert_settings_timestamp();

-- ============================================
-- 8. COMENTÁRIOS
-- ============================================

COMMENT ON TABLE cash_register_sessions IS 'Registra sessões de abertura e fechamento de caixa';
COMMENT ON TABLE backup_history IS 'Histórico de backups realizados no sistema';
COMMENT ON TABLE backup_settings IS 'Configurações de backup automático';
COMMENT ON TABLE expiry_alert_settings IS 'Configurações de alertas de vencimento de produtos';
COMMENT ON VIEW v_expiry_alerts IS 'View com alertas de produtos próximos ao vencimento';
COMMENT ON VIEW v_batch_expiry_alerts IS 'View com alertas de lotes PEPS próximos ao vencimento';
COMMENT ON VIEW v_profit_margin_by_product IS 'Análise de margem de lucro por produto';
COMMENT ON VIEW v_profit_margin_by_sales IS 'Análise de margem de lucro por venda';
COMMENT ON VIEW v_customer_purchase_stats IS 'Estatísticas de compras por cliente';
COMMENT ON VIEW v_customer_top_products IS 'Produtos mais comprados por cada cliente';
