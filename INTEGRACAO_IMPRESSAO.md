# Guia de Integração - Impressão de Cupons Térmicos

## Arquivos Criados

1. **`src/utils/thermalPrinter.ts`** - Utilitário de impressão com comandos ESC/POS
2. **`src/hooks/useThermalPrinter.ts`** - Hook React para facilitar a integração
3. **`components/Settings.tsx`** - Tela de configurações da loja
4. **Este arquivo** - Instruções de integração

## Como Integrar no POS

### Passo 1: Adicionar o módulo Settings ao App.tsx

No arquivo `App.tsx`, adicione a importação:

```typescript
import Settings from './components/Settings';
```

No switch do `renderContent()`, adicione o case para settings (por volta da linha 1687):

```typescript
case 'settings':
  return <Settings />;
```

No objeto `allowedViews` (linha 1596), adicione 'settings' aos perfis que podem acessar:

```typescript
const allowedViews = {
  [UserRole.ADMIN]: ['dashboard', 'pos', 'inventory', 'purchases', 'peps', 'promotions', 'finance', 'reports', 'users', 'customers', 'settings'],
  [UserRole.MANAGER]: ['dashboard', 'pos', 'inventory', 'purchases', 'peps', 'promotions', 'finance', 'reports', 'users', 'customers', 'settings'],
  [UserRole.CASHIER]: ['dashboard', 'pos', 'customers'],
  [UserRole.STOCKIST]: ['dashboard', 'inventory', 'purchases', 'peps'],
};
```

### Passo 2: Adicionar botão de Configurações no Layout

No arquivo `components/Layout.tsx`, adicione o item de menu para Settings (procure onde estão os outros itens de menu):

```typescript
import { Settings as SettingsIcon } from 'lucide-react';

// No array de itens de menu, adicione:
{
  id: 'settings',
  label: 'Configurações',
  icon: SettingsIcon,
  roles: [UserRole.ADMIN, UserRole.MANAGER]
}
```

### Passo 3: Integrar Impressão no POS

No arquivo `components/POS.tsx`, adicione no topo:

```typescript
import { useThermalPrinter } from '../src/hooks/useThermalPrinter';
```

Dentro do componente POS, adicione:

```typescript
const { printSaleReceipt } = useThermalPrinter();
const [autoPrint, setAutoPrint] = useState(true); // Configurável
```

Na função `handleFinalizeSale`, após processar a venda com sucesso, adicione:

```typescript
// Após onProcessSale(newSale);
if (autoPrint) {
  try {
    await printSaleReceipt(newSale, 'Nome do Operador'); // Pode pegar do currentUser
  } catch (error) {
    console.error('Erro ao imprimir cupom:', error);
    // Não bloqueia a venda se a impressão falhar
  }
}
```

### Passo 4: Adicionar Botão de Reimpressão nos Relatórios

No arquivo `components/Reports.tsx`, você pode adicionar um botão para reimprimir cupons de vendas antigas:

```typescript
import { useThermalPrinter } from '../src/hooks/useThermalPrinter';

// No componente:
const { printSaleReceipt } = useThermalPrinter();

// Adicione um botão na lista de vendas:
<button
  onClick={() => printSaleReceipt(sale, 'Reimpressão')}
  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
  title="Reimprimir Cupom"
>
  <Printer size={18} />
</button>
```

## Configuração Inicial

1. Acesse o menu **Configurações**
2. Preencha os dados da loja (Nome, CNPJ, Endereço, Telefone)
3. Configure a mensagem de rodapé do cupom
4. Escolha a largura da impressora (58mm ou 80mm)
5. Escolha o método de impressão:
   - **Janela de Impressão**: Compatível com todos os navegadores
   - **USB Serial**: Apenas Chrome/Edge, permite impressão direta e abertura de gaveta
6. Clique em **"Imprimir Cupom de Teste"** para verificar
7. Salve as configurações

## Métodos de Impressão

### Janela de Impressão (Padrão)
- Funciona em qualquer navegador
- Abre a janela de impressão do sistema
- O usuário pode escolher a impressora
- Não abre gaveta de dinheiro

### USB Serial (Avançado)
- Requer Chrome ou Edge
- Impressão direta na impressora térmica
- Suporta abertura de gaveta
- Requer permissão do usuário na primeira vez

## Comandos ESC/POS Suportados

O utilitário implementa os seguintes comandos:
- Inicialização da impressora
- Alinhamento (esquerda, centro, direita)
- Negrito
- Tamanhos de fonte
- Corte de papel
- Abertura de gaveta

## Formato do Cupom

```
================================
        NOME DA LOJA
    CNPJ: 00.000.000/0000-00
   Rua Exemplo, 123 - Cidade
      Tel: (00) 0000-0000
================================
      CUPOM NAO FISCAL
================================
Data: 05/12/2024  Hora: 12:40
Cupom: ABC12345
Operador: João Silva
Cliente: Maria Santos
================================
ITEM  DESCRICAO         QTD  VALOR
================================
001  Coca Cola 2L
     2,000 x R$ 9,00    R$ 18,00
002  Arroz 5kg
     1,000 x R$ 24,90   R$ 24,90
================================
TOTAL:                  R$ 42,90
================================
Forma Pagto: Dinheiro
================================
  Obrigado pela preferencia!
       Volte sempre!
```

## Troubleshooting

### Impressora não imprime
1. Verifique se a impressora está ligada e conectada
2. Teste com o cupom de teste nas Configurações
3. Verifique se escolheu o método correto (Serial vs Window)
4. Para USB Serial, permita o acesso quando o navegador solicitar

### Formatação incorreta
1. Verifique se configurou a largura correta (58mm = 32 chars, 80mm = 48 chars)
2. Teste com diferentes larguras nas Configurações

### Gaveta não abre
1. A gaveta só funciona com método USB Serial
2. Verifique se a gaveta está conectada à impressora
3. Teste com o botão "Testar Abertura de Gaveta" nas Configurações

## Próximos Passos Sugeridos

1. Adicionar opção de imprimir 2 vias (cliente + estabelecimento)
2. Implementar impressão de relatórios (fechamento de caixa, etc)
3. Adicionar QR Code no cupom para consulta online
4. Suporte para impressoras de etiquetas (código de barras)
