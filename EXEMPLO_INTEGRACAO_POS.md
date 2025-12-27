# Exemplo de Integração Rápida - Botão de Impressão no POS

## Opção 1: Adicionar no Modal de Sucesso (Recomendado)

Localize o modal de sucesso no `POS.tsx` (procure por "Venda Finalizada" ou similar).

Adicione este código logo após o processamento da venda:

```typescript
// No início do componente POS, adicione:
import { useThermalPrinter } from '../src/hooks/useThermalPrinter';
import { Printer } from 'lucide-react';

// Dentro do componente:
const { printSaleReceipt } = useThermalPrinter();
const [lastSale, setLastSale] = useState<Sale | null>(null);

// Na função handleFinalizeSale, após onProcessSale(newSale):
setLastSale(newSale); // Guardar a última venda

// No modal de sucesso, adicione este botão:
{lastSale && (
  <button
    onClick={async () => {
      try {
        await printSaleReceipt(lastSale, user?.email || 'Operador');
        alert('Cupom enviado para impressão!');
      } catch (error) {
        alert('Erro ao imprimir: ' + (error as Error).message);
      }
    }}
    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors mt-3"
  >
    <Printer size={20} />
    Imprimir Cupom
  </button>
)}
```

## Opção 2: Impressão Automática

Para imprimir automaticamente após cada venda:

```typescript
// No handleFinalizeSale, após onProcessSale(newSale):
try {
  const autoPrint = localStorage.getItem('mm_auto_print') === 'true';
  if (autoPrint) {
    await printSaleReceipt(newSale, user?.email || 'Operador');
  }
} catch (error) {
  console.error('Erro ao imprimir:', error);
  // Não bloqueia a venda se falhar
}
```

## Opção 3: Adicionar Toggle nas Configurações

No componente `Settings.tsx`, adicione:

```typescript
const [autoPrint, setAutoPrint] = useState(
  localStorage.getItem('mm_auto_print') === 'true'
);

// No formulário:
<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
  <div>
    <label className="font-medium text-gray-700">Impressão Automática</label>
    <p className="text-sm text-gray-500">Imprimir cupom automaticamente após cada venda</p>
  </div>
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={autoPrint}
      onChange={(e) => {
        setAutoPrint(e.target.checked);
        localStorage.setItem('mm_auto_print', e.target.checked.toString());
      }}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
  </label>
</div>
```

## Código Completo para Adicionar ao POS

Aqui está um exemplo completo de como modificar minimamente o POS:

```typescript
// 1. Adicione no topo do arquivo POS.tsx:
import { useThermalPrinter } from '../src/hooks/useThermalPrinter';

// 2. Dentro do componente POS, adicione:
const { printSaleReceipt } = useThermalPrinter();

// 3. Crie uma função auxiliar:
const handlePrintReceipt = async (sale: Sale) => {
  try {
    const cashierName = currentUser || 'Operador';
    await printSaleReceipt(sale, cashierName);
    return true;
  } catch (error) {
    console.error('Erro ao imprimir cupom:', error);
    alert('Não foi possível imprimir o cupom. A venda foi registrada normalmente.');
    return false;
  }
};

// 4. Na função handleFinalizeSale, após onProcessSale(newSale):
const autoPrint = localStorage.getItem('mm_auto_print') !== 'false'; // true por padrão
if (autoPrint) {
  handlePrintReceipt(newSale);
}
```

## Testando a Integração

1. Configure a loja em **Configurações**
2. Faça uma venda de teste no PDV
3. O cupom deve imprimir automaticamente (ou clique no botão se implementou manualmente)
4. Verifique se os dados estão corretos no cupom

## Dicas Importantes

- **Não bloqueie a venda**: Sempre use try/catch para que erros de impressão não impeçam a venda
- **Feedback visual**: Mostre ao usuário se a impressão foi bem-sucedida ou não
- **Configuração flexível**: Permita que o usuário escolha impressão automática ou manual
- **Teste antes**: Sempre teste com o cupom de teste nas Configurações antes de usar em produção
