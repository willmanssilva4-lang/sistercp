# 🔍 Como Verificar se o PEPS está Funcionando

## Passo 1: Executar a Migração do Banco de Dados

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **"SQL Editor"**
4. Clique em **"New Query"**
5. Cole o conteúdo do arquivo `database_peps_migration.sql`
6. Clique em **"Run"** (ou pressione Ctrl+Enter)

Se aparecer "Success. No rows returned", está correto! ✅

## Passo 2: Verificar se a Tabela foi Criada

No SQL Editor do Supabase, execute:

```sql
SELECT * FROM stock_batches LIMIT 10;
```

Se não der erro, a tabela foi criada com sucesso! ✅

## Passo 3: Testar com uma Compra Real

1. Abra o sistema MarketMaster AI
2. Vá no módulo **"Compras"**
3. Clique em **"Nova Compra (Entrada de Nota)"**
4. Adicione um produto ao carrinho
5. Preencha os dados e finalize a compra

## Passo 4: Verificar se o Lote foi Criado

No SQL Editor do Supabase, execute:

```sql
-- Ver todos os lotes criados
SELECT 
    sb.id,
    p.name as produto,
    sb.qty_original as qtd_original,
    sb.qty_remaining as qtd_restante,
    sb.cost_price as custo,
    sb.purchase_date as data_compra,
    sb.expiry_date as validade
FROM stock_batches sb
JOIN products p ON p.id = sb.product_id
ORDER BY sb.purchase_date DESC;
```

Se aparecerem lotes na tabela, **o PEPS está funcionando!** 🎉

## Passo 5: Verificar no Console do Navegador

1. Abra o DevTools (F12)
2. Vá na aba **"Console"**
3. Faça uma nova compra
4. Procure por mensagens como:
   - "Lote PEPS criado com sucesso"
   - Ou erros relacionados a `createStockBatch`

## ❌ Se Não Estiver Funcionando

### Erro: "relation 'stock_batches' does not exist"
**Solução:** Execute a migração SQL no Supabase (Passo 1)

### Erro: "Cannot find module './src/utils/pepsUtils'"
**Solução:** Verifique se o arquivo `src/utils/pepsUtils.ts` existe

### Nenhum lote aparece no banco
**Solução:** 
1. Verifique o console do navegador por erros
2. Confirme que a compra foi finalizada com sucesso
3. Verifique se o import está correto no App.tsx

## ✅ Teste Completo

Execute este SQL para ver um resumo completo:

```sql
-- Resumo de lotes por produto
SELECT 
    p.name as produto,
    COUNT(sb.id) as total_lotes,
    SUM(sb.qty_remaining) as estoque_total,
    AVG(sb.cost_price) as custo_medio,
    MIN(sb.purchase_date) as lote_mais_antigo,
    MAX(sb.purchase_date) as lote_mais_recente
FROM products p
LEFT JOIN stock_batches sb ON sb.product_id = p.id AND sb.qty_remaining > 0
GROUP BY p.id, p.name
HAVING COUNT(sb.id) > 0
ORDER BY p.name;
```

---

**Dica:** Se quiser ver os lotes diretamente no sistema, posso criar um componente visual para você! 😊
