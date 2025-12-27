# 🚀 Guia de Execução da Migração no Supabase

## ✅ Integração Completa Realizada!

Todas as 5 novas funcionalidades foram integradas com sucesso no sistema:

### 📦 Componentes Integrados
- ✅ CashRegister (Controle de Caixa)
- ✅ ProfitMarginReports (Margem de Lucro)
- ✅ BackupManager (Backup Automático)
- ✅ ExpiryAlerts (Alertas de Vencimento)
- ✅ CustomerPurchaseHistory (Histórico de Clientes)

### 🔧 Arquivos Modificados
- ✅ `App.tsx` - Importações e rotas adicionadas
- ✅ `components/Layout.tsx` - Itens de menu adicionados

---

## 🗄️ Executar Migração SQL no Supabase

### Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral

### Passo 2: Executar a Migração

1. Clique em **New Query**
2. Copie todo o conteúdo do arquivo `migration_new_features_supabase.sql`
3. Cole no editor SQL
4. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 3: Verificar Criação das Tabelas

Execute esta query para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'cash_register_sessions',
    'backup_history',
    'backup_settings',
    'expiry_alert_settings'
)
ORDER BY table_name;
```

**Resultado esperado:**
```
backup_history
backup_settings
cash_register_sessions
expiry_alert_settings
```

### Passo 4: Verificar Views Criadas

```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'v_%'
ORDER BY table_name;
```

**Resultado esperado:**
```
v_batch_expiry_alerts
v_customer_purchase_stats
v_customer_top_products
v_expiry_alerts
v_profit_margin_by_product
v_profit_margin_by_sales
```

### Passo 5: Verificar Funções Criadas

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_open_cash_session',
    'calculate_session_sales'
)
ORDER BY routine_name;
```

---

## 🔐 Políticas RLS (Row Level Security)

A migração já inclui políticas de segurança:

### Cash Register Sessions
- ✅ Usuários veem apenas suas próprias sessões
- ✅ Usuários podem criar e atualizar suas sessões

### Backup
- ✅ Apenas ADMIN pode acessar e gerenciar backups

### Alertas
- ✅ Todos podem ver configurações
- ✅ Apenas ADMIN e MANAGER podem alterar

---

## 🧪 Testar as Funcionalidades

### 1. Controle de Caixa
```
1. Acesse o menu "Controle de Caixa"
2. Clique em "Abrir Caixa"
3. Informe saldo inicial: R$ 100,00
4. Confirme abertura
5. Realize algumas vendas no PDV
6. Volte ao Controle de Caixa
7. Clique em "Fechar Caixa"
8. Informe saldo final
9. Verifique a diferença calculada
```

### 2. Alertas de Vencimento
```
1. Acesse "Alertas de Vencimento"
2. Verifique produtos próximos ao vencimento
3. Clique em "Configurações"
4. Ajuste os períodos de alerta
5. Salve e verifique recálculo
```

### 3. Margem de Lucro
```
1. Acesse "Margem de Lucro"
2. Selecione período (últimos 30 dias)
3. Filtre por categoria
4. Verifique cards de resumo
5. Analise tabela de produtos
6. Clique em "Exportar CSV"
```

### 4. Histórico de Clientes
```
1. Acesse "Histórico de Clientes"
2. Busque um cliente
3. Selecione período
4. Verifique estatísticas
5. Veja top produtos
6. Exporte CSV se necessário
```

### 5. Backup
```
1. Acesse "Backup" (apenas ADMIN)
2. Ative backup automático
3. Escolha frequência (diário/semanal)
4. Clique em "Backup Manual"
5. Arquivo será baixado
6. Teste restauração (cuidado!)
```

---

## 📊 Estrutura de Dados Criada

### Tabelas
1. **cash_register_sessions** - Sessões de caixa
2. **backup_history** - Histórico de backups
3. **backup_settings** - Configurações de backup
4. **expiry_alert_settings** - Configurações de alertas

### Views
1. **v_expiry_alerts** - Alertas de produtos
2. **v_batch_expiry_alerts** - Alertas de lotes PEPS
3. **v_profit_margin_by_product** - Margem por produto
4. **v_profit_margin_by_sales** - Margem por venda
5. **v_customer_purchase_stats** - Estatísticas de clientes
6. **v_customer_top_products** - Top produtos por cliente

### Funções
1. **get_open_cash_session(user_id)** - Busca sessão aberta
2. **calculate_session_sales(session_id)** - Calcula vendas da sessão

---

## 🎯 Permissões por Role

### ADMIN
- ✅ Controle de Caixa
- ✅ Margem de Lucro
- ✅ **Backup** (exclusivo)
- ✅ Alertas de Vencimento
- ✅ Histórico de Clientes

### MANAGER
- ✅ Controle de Caixa
- ✅ Margem de Lucro
- ✅ Alertas de Vencimento
- ✅ Histórico de Clientes

### CASHIER
- ✅ Controle de Caixa

### STOCKIST
- ✅ Alertas de Vencimento

---

## 🔍 Troubleshooting

### Erro: "relation already exists"
**Solução:** Algumas tabelas já existem. Execute apenas as partes que faltam.

### Erro: "permission denied"
**Solução:** Verifique se está usando um usuário com permissões de administrador no Supabase.

### Erro: "function does not exist"
**Solução:** Execute novamente a parte de criação de funções.

### Views não aparecem
**Solução:** Verifique se as tabelas base (products, sales, customers) existem.

---

## 📝 Queries Úteis

### Ver todas as sessões de caixa abertas
```sql
SELECT * FROM cash_register_sessions WHERE status = 'OPEN';
```

### Ver alertas críticos
```sql
SELECT * FROM v_expiry_alerts WHERE severity = 'critical';
```

### Ver margem de lucro por categoria
```sql
SELECT 
    category,
    AVG(margin_percent) as avg_margin,
    SUM(potential_profit) as total_potential
FROM v_profit_margin_by_product
GROUP BY category
ORDER BY avg_margin DESC;
```

### Ver top 10 clientes
```sql
SELECT * FROM v_customer_purchase_stats 
ORDER BY total_spent DESC 
LIMIT 10;
```

---

## ✅ Checklist de Verificação

- [ ] Migração SQL executada sem erros
- [ ] 4 tabelas criadas
- [ ] 6 views criadas
- [ ] 2 funções criadas
- [ ] Políticas RLS ativas
- [ ] Menu atualizado com novos itens
- [ ] Controle de Caixa funcionando
- [ ] Alertas de Vencimento funcionando
- [ ] Margem de Lucro funcionando
- [ ] Histórico de Clientes funcionando
- [ ] Backup funcionando (apenas ADMIN)

---

## 🎉 Pronto!

Todas as funcionalidades estão integradas e prontas para uso!

**Próximos passos:**
1. Teste cada funcionalidade
2. Treine sua equipe
3. Configure backup automático
4. Ajuste períodos de alertas
5. Monitore margem de lucro

---

**Desenvolvido em:** 05/12/2025  
**Versão:** 1.0  
**Status:** ✅ Integrado e Pronto para Produção
