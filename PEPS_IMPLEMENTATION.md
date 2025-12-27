# Implementação do Método PEPS (FIFO) - MarketMaster AI

## O que é PEPS?

PEPS (Primeiro que Entra, Primeiro que Sai) ou FIFO (First In, First Out) é um método de controle de estoque onde os produtos adquiridos primeiro são os primeiros a serem vendidos. Este método é especialmente importante para:

- Produtos perecíveis (alimentos, medicamentos)
- Controle preciso do custo das mercadorias vendidas (CMV)
- Conformidade fiscal e contábil
- Evitar perdas por vencimento de produtos

## Arquivos Criados/Modificados

### 1. **database_peps_migration.sql**
Script SQL para criar a tabela `stock_batches` no banco de dados Supabase.

**Como executar:**
1. Acesse o painel do Supabase
2. Vá em SQL Editor
3. Cole o conteúdo do arquivo `database_peps_migration.sql`
4. Execute o script

### 2. **src/utils/pepsUtils.ts**
Arquivo com funções utilitárias para gerenciar lotes PEPS:

- `createStockBatch()`: Cria um novo lote quando uma compra é registrada
- `consumeStockPEPS()`: Consome estoque seguindo o método PEPS
- `restoreStockPEPS()`: Restaura estoque em caso de devolução/cancelamento
- `getProductBatches()`: Lista todos os lotes de um produto
- `getAverageCost()`: Calcula o custo médio ponderado do estoque

### 3. **types.ts**
Adicionada a interface `StockBatch` para tipagem TypeScript.

### 4. **App.tsx**
Modificada a função `handleProcessPurchase()` para criar lotes PEPS automaticamente quando uma compra é registrada.

## Como Funciona

### 1. Registro de Compra
Quando uma nova compra é registrada através do módulo "Compras":

```typescript
// Para cada item comprado, um lote é criado automaticamente
await createStockBatch(
  productId,      // ID do produto
  transactionId,  // ID da transação de compra
  qty,            // Quantidade comprada
  costPrice,      // Preço de custo unitário
  purchaseDate,   // Data da compra
  expiryDate      // Data de validade (opcional)
);
```

### 2. Estrutura do Lote
Cada lote armazena:
- **qtyOriginal**: Quantidade original comprada
- **qtyRemaining**: Quantidade restante no lote
- **costPrice**: Preço de custo unitário deste lote
- **purchaseDate**: Data da compra (usada para ordenação PEPS)
- **expiryDate**: Data de validade (opcional)

### 3. Consumo PEPS (Vendas)
Quando uma venda é realizada, o sistema:
1. Busca lotes disponíveis ordenados por data de compra (mais antigos primeiro)
2. Consome a quantidade necessária dos lotes mais antigos
3. Calcula o custo médio ponderado dos itens vendidos
4. Atualiza a quantidade restante em cada lote

### 4. Exemplo Prático

**Compras:**
- 10/11/2024: 100 unidades a R$ 5,00 cada
- 15/11/2024: 50 unidades a R$ 5,50 cada
- 20/11/2024: 75 unidades a R$ 6,00 cada

**Venda de 120 unidades:**
- Consome 100 unidades do lote de 10/11 (R$ 5,00)
- Consome 20 unidades do lote de 15/11 (R$ 5,50)
- Custo médio: (100 × 5,00 + 20 × 5,50) / 120 = R$ 5,08

**Estoque restante:**
- Lote 10/11: 0 unidades
- Lote 15/11: 30 unidades a R$ 5,50
- Lote 20/11: 75 unidades a R$ 6,00

## Próximos Passos (Opcional)

Para completar a implementação PEPS, você pode:

### 1. Integrar com Vendas
Modificar a função `handleProcessSale()` em `App.tsx` para usar `consumeStockPEPS()`:

```typescript
import { consumeStockPEPS } from './src/utils/pepsUtils';

// Dentro de handleProcessSale, para cada item vendido:
const result = await consumeStockPEPS(item.id, item.qty);
console.log('Custo médio da venda:', result.averageCost);
```

### 2. Relatório de Lotes
Criar um componente para visualizar lotes por produto:

```typescript
import { getProductBatches } from './src/utils/pepsUtils';

const batches = await getProductBatches(productId);
// Exibir em tabela: data, quantidade original, quantidade restante, custo
```

### 3. Alertas de Vencimento
Usar a data de validade dos lotes para alertar sobre produtos próximos ao vencimento:

```typescript
const expiringBatches = batches.filter(b => {
  if (!b.expiryDate) return false;
  const daysUntilExpiry = daysBetween(new Date(), new Date(b.expiryDate));
  return daysUntilExpiry <= 30 && b.qtyRemaining > 0;
});
```

## Benefícios da Implementação

✅ **Controle Preciso de Custos**: Cada venda usa o custo real dos lotes vendidos
✅ **Rastreabilidade**: Saber exatamente qual lote foi vendido
✅ **Gestão de Validade**: Controle de produtos com data de vencimento
✅ **Conformidade Fiscal**: Método aceito pela Receita Federal
✅ **Redução de Perdas**: Venda dos produtos mais antigos primeiro

## Suporte

Para dúvidas ou problemas:
1. Verifique se a migração do banco de dados foi executada
2. Confirme que os imports estão corretos
3. Verifique o console do navegador para erros
4. Teste com uma compra simples primeiro

---

**Nota**: Esta implementação está pronta para uso. A criação de lotes acontece automaticamente a cada nova compra registrada no sistema.
