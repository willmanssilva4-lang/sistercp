-- Migração: Adicionar tabela de configurações da loja
-- Opcional: Use esta migração se quiser armazenar as configurações no Supabase
-- ao invés de localStorage (recomendado para ambientes multi-usuário)

-- Criar tabela de configurações
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    address TEXT,
    phone VARCHAR(20),
    footer_message TEXT,
    printer_width INTEGER DEFAULT 32 CHECK (printer_width IN (32, 48)),
    print_method VARCHAR(10) DEFAULT 'window' CHECK (print_method IN ('serial', 'window')),
    auto_print BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE store_settings IS 'Configurações da loja para impressão de cupons';
COMMENT ON COLUMN store_settings.name IS 'Nome da loja (obrigatório)';
COMMENT ON COLUMN store_settings.cnpj IS 'CNPJ da loja';
COMMENT ON COLUMN store_settings.address IS 'Endereço completo da loja';
COMMENT ON COLUMN store_settings.phone IS 'Telefone de contato';
COMMENT ON COLUMN store_settings.footer_message IS 'Mensagem de rodapé do cupom';
COMMENT ON COLUMN store_settings.printer_width IS 'Largura da impressora em caracteres (32 para 58mm, 48 para 80mm)';
COMMENT ON COLUMN store_settings.print_method IS 'Método de impressão (serial ou window)';
COMMENT ON COLUMN store_settings.auto_print IS 'Imprimir automaticamente após venda';

-- Inserir configuração padrão
INSERT INTO store_settings (name, footer_message) 
VALUES (
    'Meu Mercado',
    E'Obrigado pela preferencia!\nVolte sempre!'
) ON CONFLICT DO NOTHING;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_store_settings_created_at ON store_settings(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_store_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_store_settings_updated_at
    BEFORE UPDATE ON store_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_store_settings_updated_at();

-- RLS (Row Level Security) - Opcional
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler
CREATE POLICY "Permitir leitura para todos" ON store_settings
    FOR SELECT
    USING (true);

-- Política: Apenas admins podem atualizar
CREATE POLICY "Apenas admins podem atualizar" ON store_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'ADMIN'
        )
    );

-- Política: Apenas admins podem inserir
CREATE POLICY "Apenas admins podem inserir" ON store_settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'ADMIN'
        )
    );
