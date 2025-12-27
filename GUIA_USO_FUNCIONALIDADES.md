# Guia de Uso - Novas Funcionalidades

Este guia fornece exemplos práticos de como usar cada uma das novas funcionalidades.

---

## 💰 1. Controle de Caixa

### Cenário: Abertura de Caixa no Início do Dia

**Passo a Passo:**

1. Funcionário chega e acessa o sistema
2. Navega para "Controle de Caixa"
3. Clica em "Abrir Caixa"
4. Conta o dinheiro no caixa: R$ 200,00
5. Insere "200" no campo "Saldo Inicial"
6. Clica em "Abrir Caixa"

**Resultado:**
```
✅ Caixa Aberto
Operador: João Silva
Abertura: 05/12/2025 08:00
Saldo Inicial: R$ 200,00
```

### Cenário: Fechamento de Caixa no Final do Dia

**Situação:**
- Saldo Inicial: R$ 200,00
- Vendas em Dinheiro: R$ 850,00
- Vendas Fiado: R$ 150,00
- Saldo Esperado: R$ 1.200,00

**Passo a Passo:**

1. Ao final do dia, conta o dinheiro no caixa: R$ 1.195,00
2. Clica em "Fechar Caixa"
3. Insere "1195" no campo "Saldo Final"
4. Adiciona observação: "Faltaram R$ 5,00 - verificar troco errado"
5. Clica em "Fechar Caixa"

**Resultado:**
```
Saldo Inicial: R$ 200,00
Saldo Final: R$ 1.195,00
Saldo Esperado: R$ 1.200,00
Diferença: -R$ 5,00 ⚠️
```

### Interpretando Diferenças

- **Diferença Positiva (+)**: Sobrou dinheiro (possível erro de troco a favor da loja)
- **Diferença Negativa (-)**: Faltou dinheiro (possível erro de troco ou falta)
- **Diferença Zero (0)**: Caixa bateu perfeitamente ✅

---

## 📊 2. Relatórios de Margem de Lucro

### Cenário: Análise Mensal de Produtos

**Objetivo:** Descobrir quais produtos dão mais lucro

**Passo a Passo:**

1. Acessa "Margem de Lucro"
2. Define período: 01/11/2025 a 30/11/2025
3. Seleciona categoria: "Bebidas"
4. Clica para filtrar

**Resultado Exemplo:**

```
┌─────────────────────────────────────────────────────┐
│ RESUMO DO PERÍODO                                   │
├─────────────────────────────────────────────────────┤
│ Receita Total:    R$ 15.450,00                      │
│ Custo Total:      R$ 9.870,00                       │
│ Lucro Total:      R$ 5.580,00                       │
│ Margem Média:     36.12%                            │
└─────────────────────────────────────────────────────┘

TOP 3 PRODUTOS POR LUCRO:

1. Coca-Cola 2L
   Vendidas: 150 unidades
   Receita: R$ 1.200,00
   Custo: R$ 600,00
   Lucro: R$ 600,00
   Margem: 50% 🟢

2. Cerveja Skol Lata
   Vendidas: 300 unidades
   Receita: R$ 1.050,00
   Custo: R$ 750,00
   Lucro: R$ 300,00
   Margem: 28.57% 🟡

3. Água Mineral 500ml
   Vendidas: 200 unidades
   Receita: R$ 400,00
   Custo: R$ 280,00
   Lucro: R$ 120,00
   Margem: 30% 🟢
```

### Cenário: Identificar Produtos com Baixa Margem

**Filtro:** Margem < 15% (produtos em vermelho)

**Ação Recomendada:**
1. Renegociar com fornecedor
2. Aumentar preço de venda
3. Descontinuar produto se não for estratégico

---

## 💾 3. Backup Automático

### Cenário: Configuração Inicial

**Passo a Passo:**

1. Acessa "Backup"
2. Ativa "Backup Automático"
3. Seleciona frequência: "Diário"
4. Sistema salva configuração

**Resultado:**
```
✅ Backup automático ativado
Frequência: Diário
Próximo backup: 06/12/2025 às 00:00
```

### Cenário: Backup Manual Antes de Atualização

**Situação:** Vai fazer uma grande importação de produtos

**Passo a Passo:**

1. Acessa "Backup"
2. Clica em "Backup Manual"
3. Sistema gera arquivo: `marketmaster_backup_2025-12-05.json`
4. Arquivo é baixado automaticamente
5. Guarda arquivo em local seguro

**Resultado:**
```
✅ Backup realizado com sucesso!
Arquivo: marketmaster_backup_2025-12-05.json
Tamanho: 2.4 MB
Data: 05/12/2025 14:30
```

### Cenário: Restauração de Backup

**Situação:** Dados foram corrompidos ou deletados acidentalmente

**Passo a Passo:**

1. Acessa "Backup"
2. Clica em "Restaurar Backup"
3. Seleciona arquivo `.json` do backup
4. Confirma: "Tem certeza? Todos os dados atuais serão substituídos"
5. Clica em "Sim, restaurar"
6. Sistema recarrega página

**Resultado:**
```
✅ Backup restaurado com sucesso!
Dados restaurados de: 05/12/2025 14:30
A página será recarregada...
```

---

## ⚠️ 4. Alertas de Vencimento

### Cenário: Monitoramento Diário

**Ao acessar o sistema:**

```
┌─────────────────────────────────────────────────────┐
│ ALERTAS DE VENCIMENTO                               │
├─────────────────────────────────────────────────────┤
│ 🔴 Crítico:    3 produtos                           │
│ 🟡 Atenção:    7 produtos                           │
│ 🔵 Info:       12 produtos                          │
└─────────────────────────────────────────────────────┘
```

### Exemplo de Alertas

**Crítico (≤ 7 dias):**
```
🔴 Iogurte Danone Morango
   Código: 7891234567890
   Categoria: Laticínios
   Vencimento: 08/12/2025
   Dias: 3 dias
   Estoque: 15 unidades

   AÇÃO URGENTE: Fazer promoção ou descartar
```

**Atenção (≤ 15 dias):**
```
🟡 Leite Integral 1L
   Código: 7891234567891
   Categoria: Laticínios
   Vencimento: 15/12/2025
   Dias: 10 dias
   Estoque: 30 unidades

   AÇÃO: Monitorar vendas
```

**Informativo (≤ 30 dias):**
```
🔵 Queijo Mussarela
   Código: 7891234567892
   Categoria: Laticínios
   Vencimento: 28/12/2025
   Dias: 23 dias
   Estoque: 8 unidades

   AÇÃO: Acompanhar
```

### Cenário: Configuração Personalizada

**Situação:** Loja trabalha com produtos de giro rápido

**Passo a Passo:**

1. Clica em "Configurações"
2. Altera:
   - Crítico: 3 dias (ao invés de 7)
   - Atenção: 7 dias (ao invés de 15)
   - Info: 14 dias (ao invés de 30)
3. Salva configurações

**Resultado:**
```
✅ Configurações salvas
Alertas agora são mais sensíveis para produtos de giro rápido
```

---

## 📜 5. Histórico de Compras por Cliente

### Cenário: Análise de Cliente VIP

**Passo a Passo:**

1. Acessa "Histórico de Clientes"
2. Busca: "Maria Silva"
3. Seleciona período: Últimos 90 dias
4. Clica em "Buscar"

**Resultado:**

```
┌─────────────────────────────────────────────────────┐
│ MARIA SILVA                                         │
│ CPF: 123.456.789-00                                 │
│ Tel: (11) 98765-4321                                │
├─────────────────────────────────────────────────────┤
│ Total de Compras:    24                             │
│ Total Gasto:         R$ 3.450,00                    │
│ Ticket Médio:        R$ 143,75                      │
│ Última Compra:       03/12/2025 15:30               │
└─────────────────────────────────────────────────────┘

TOP 5 PRODUTOS MAIS COMPRADOS:

1. 🥇 Arroz Tio João 5kg
   Quantidade: 12 unidades
   Total gasto: R$ 360,00

2. 🥈 Feijão Preto 1kg
   Quantidade: 10 unidades
   Total gasto: R$ 89,00

3. 🥉 Óleo de Soja 900ml
   Quantidade: 8 unidades
   Total gasto: R$ 64,00

4. Açúcar Cristal 1kg
   Quantidade: 6 unidades
   Total gasto: R$ 36,00

5. Café Pilão 500g
   Quantidade: 5 unidades
   Total gasto: R$ 75,00
```

### Cenário: Identificar Clientes Inativos

**Objetivo:** Encontrar clientes que não compram há mais de 30 dias

**Passo a Passo:**

1. Percorre lista de clientes
2. Verifica "Última Compra"
3. Identifica clientes inativos
4. Planeja ação de reativação (WhatsApp, promoção, etc.)

### Cenário: Exportação para Análise

**Passo a Passo:**

1. Seleciona cliente: "João Santos"
2. Define período: 01/01/2025 a 31/12/2025
3. Clica em "Exportar CSV"
4. Abre arquivo no Excel
5. Faz análise personalizada (gráficos, tabelas dinâmicas)

**Arquivo CSV Gerado:**
```csv
Data/Hora,Total,Método Pagamento,Status,Itens
05/12/2025 10:30,45.50,CASH,COMPLETED,Arroz (1x); Feijão (1x)
03/12/2025 15:20,89.90,PIX,COMPLETED,Carne (2kg); Tomate (1kg)
01/12/2025 09:15,23.00,CASH,COMPLETED,Pão (5x); Leite (2x)
```

---

## 🎯 Casos de Uso Combinados

### Caso 1: Rotina Diária do Gerente

**Manhã (08:00):**
1. ✅ Abre caixa com saldo inicial
2. ✅ Verifica alertas de vencimento
3. ✅ Planeja promoções para produtos críticos

**Tarde (14:00):**
4. ✅ Analisa margem de lucro do dia anterior
5. ✅ Verifica histórico de clientes VIP

**Noite (20:00):**
6. ✅ Fecha caixa e confere diferença
7. ✅ Faz backup manual se necessário

### Caso 2: Análise Mensal

**Início do Mês:**
1. ✅ Exporta relatório de margem de lucro do mês anterior
2. ✅ Identifica produtos com baixa margem
3. ✅ Renegoceia com fornecedores
4. ✅ Analisa histórico dos top 10 clientes
5. ✅ Planeja estratégias de fidelização

### Caso 3: Preparação para Auditoria

**Antes da Auditoria:**
1. ✅ Faz backup completo de todos os dados
2. ✅ Exporta relatórios de margem de lucro
3. ✅ Exporta histórico de fechamento de caixa
4. ✅ Verifica produtos vencidos/próximos ao vencimento
5. ✅ Organiza documentação

---

## 📊 Indicadores de Performance (KPIs)

### Controle de Caixa
- **Meta:** Diferença ≤ R$ 10,00 por dia
- **Alerta:** Diferença > R$ 50,00 (investigar)

### Margem de Lucro
- **Meta:** Margem média ≥ 30%
- **Alerta:** Produtos com margem < 10% (revisar)

### Alertas de Vencimento
- **Meta:** 0 produtos vencidos
- **Alerta:** > 5 produtos críticos (fazer promoção)

### Histórico de Clientes
- **Meta:** Ticket médio crescendo mês a mês
- **Alerta:** Cliente VIP sem comprar há > 30 dias

---

## 🔔 Notificações Sugeridas

### Diárias
- 🔴 Produtos vencidos ou críticos
- 💰 Diferença de caixa > R$ 50,00

### Semanais
- 📊 Resumo de margem de lucro
- 👥 Clientes inativos há > 30 dias

### Mensais
- 💾 Lembrete de backup manual
- 📈 Relatório de performance geral

---

## 💡 Dicas e Boas Práticas

### Controle de Caixa
- ✅ Sempre conte o dinheiro antes de abrir
- ✅ Documente diferenças significativas
- ✅ Treine equipe sobre troco correto

### Margem de Lucro
- ✅ Revise preços mensalmente
- ✅ Compare com concorrência
- ✅ Considere sazonalidade

### Backup
- ✅ Faça backup antes de grandes mudanças
- ✅ Guarde backups em local seguro
- ✅ Teste restauração periodicamente

### Alertas de Vencimento
- ✅ Verifique diariamente
- ✅ Faça promoções para produtos críticos
- ✅ Ajuste pedidos baseado em alertas

### Histórico de Clientes
- ✅ Use para personalizar atendimento
- ✅ Identifique padrões de compra
- ✅ Crie programa de fidelidade

---

## 🚨 Troubleshooting Comum

### "Diferença de caixa muito alta"
**Possíveis causas:**
- Erro de troco
- Venda não registrada
- Sangria não documentada

**Solução:**
- Revisar vendas do dia
- Verificar notas fiscais
- Treinar equipe

### "Margem de lucro negativa"
**Possíveis causas:**
- Preço de venda menor que custo
- Custo desatualizado
- Promoção muito agressiva

**Solução:**
- Revisar precificação
- Atualizar custos
- Ajustar promoções

### "Muitos produtos vencidos"
**Possíveis causas:**
- Compra excessiva
- Produto de baixo giro
- Falta de monitoramento

**Solução:**
- Ajustar pedidos
- Fazer promoções antecipadas
- Verificar alertas diariamente

---

Pronto! Com este guia você tem exemplos práticos de como usar cada funcionalidade no dia a dia.
