# 📝 Exemplo de Código - Integração Completa

## 🎯 Código Completo para App.tsx

Adicione estas seções no seu `App.tsx`:

### 1️⃣ Imports (no topo do arquivo)

```typescript
import Suppliers from './components/Suppliers';
import { Supplier } from './types';
```

---

### 2️⃣ Estado (dentro do componente App)

```typescript
// Adicione junto com os outros estados
const [suppliers, setSuppliers] = useState<Supplier[]>([]);
```

---

### 3️⃣ Funções de Gerenciamento (dentro do componente App)

```typescript
// ==================== GESTÃO DE FORNECEDORES ====================

const handleAddSupplier = (supplierData: Omit<Supplier, 'id'>) => {
  const newSupplier: Supplier = {
    ...supplierData,
    id: 'SUPP' + Date.now()
  };
  
  const updatedSuppliers = [...suppliers, newSupplier];
  setSuppliers(updatedSuppliers);
  saveSuppliers(updatedSuppliers);
  
  console.log('Fornecedor adicionado:', newSupplier);
};

const handleUpdateSupplier = (id: string, updates: Partial<Supplier>) => {
  const updatedSuppliers = suppliers.map(supplier => 
    supplier.id === id ? { ...supplier, ...updates } : supplier
  );
  
  setSuppliers(updatedSuppliers);
  saveSuppliers(updatedSuppliers);
  
  console.log('Fornecedor atualizado:', id, updates);
};

const handleDeleteSupplier = (id: string) => {
  const filteredSuppliers = suppliers.filter(supplier => supplier.id !== id);
  
  setSuppliers(filteredSuppliers);
  saveSuppliers(filteredSuppliers);
  
  console.log('Fornecedor deletado:', id);
};

const saveSuppliers = (suppliersToSave: Supplier[]) => {
  try {
    localStorage.setItem('mm_suppliers', JSON.stringify(suppliersToSave));
    console.log('Fornecedores salvos no localStorage');
  } catch (error) {
    console.error('Erro ao salvar fornecedores:', error);
  }
};

// ================================================================
```

---

### 4️⃣ Carregamento Inicial (dentro do useEffect existente)

```typescript
useEffect(() => {
  // ... código existente de carregamento de produtos, vendas, etc ...
  
  // Carregar fornecedores
  const savedSuppliers = localStorage.getItem('mm_suppliers');
  if (savedSuppliers) {
    try {
      const parsedSuppliers = JSON.parse(savedSuppliers);
      setSuppliers(parsedSuppliers);
      console.log('Fornecedores carregados:', parsedSuppliers.length);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      setSuppliers([]);
    }
  } else {
    console.log('Nenhum fornecedor salvo encontrado');
  }
  
  // ... resto do código ...
}, []);
```

---

### 5️⃣ Rota (na seção de renderização condicional)

```typescript
{currentPage === 'suppliers' && (
  <Suppliers
    suppliers={suppliers}
    onAddSupplier={handleAddSupplier}
    onUpdateSupplier={handleUpdateSupplier}
    onDeleteSupplier={handleDeleteSupplier}
  />
)}
```

---

## 🎨 Código para Layout.tsx

### 1️⃣ Import do Ícone (no topo)

```typescript
import { 
  // ... outros ícones existentes ...
  Truck 
} from 'lucide-react';
```

---

### 2️⃣ Item do Menu (na seção de navegação)

```typescript
{/* Adicione este item onde preferir no menu */}
<button
  onClick={() => onNavigate('suppliers')}
  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
    currentPage === 'suppliers'
      ? 'bg-emerald-100 text-emerald-700'
      : 'text-gray-700 hover:bg-gray-100'
  }`}
>
  <Truck size={20} />
  <span className="font-medium">Fornecedores</span>
</button>
```

---

## 📊 Exemplo de Posicionamento no Menu

Sugestão de ordem no menu lateral:

```typescript
{/* Dashboard */}
<button onClick={() => onNavigate('dashboard')}>...</button>

{/* PDV */}
<button onClick={() => onNavigate('pos')}>...</button>

{/* Estoque */}
<button onClick={() => onNavigate('inventory')}>...</button>

{/* Compras */}
<button onClick={() => onNavigate('purchases')}>...</button>

{/* 🆕 FORNECEDORES - ADICIONE AQUI */}
<button onClick={() => onNavigate('suppliers')}>
  <Truck size={20} />
  <span className="font-medium">Fornecedores</span>
</button>

{/* Clientes */}
<button onClick={() => onNavigate('customers')}>...</button>

{/* Promoções */}
<button onClick={() => onNavigate('promotions')}>...</button>

{/* Financeiro */}
<button onClick={() => onNavigate('finance')}>...</button>

{/* Relatórios */}
<button onClick={() => onNavigate('reports')}>...</button>

{/* Usuários */}
<button onClick={() => onNavigate('users')}>...</button>

{/* Configurações */}
<button onClick={() => onNavigate('settings')}>...</button>
```

---

## 🔗 Integração com Compras (Opcional)

Se quiser vincular fornecedores às compras, adicione em `Purchases.tsx`:

### 1️⃣ Adicionar Props

```typescript
interface PurchasesProps {
  // ... props existentes ...
  suppliers: Supplier[]; // 🆕 Adicione esta linha
}
```

### 2️⃣ Adicionar Estado

```typescript
const [selectedSupplier, setSelectedSupplier] = useState<string>('');
```

### 3️⃣ Adicionar Seletor no Modal

```typescript
{/* Adicione este campo no modal de nova compra */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Fornecedor
  </label>
  <select
    value={selectedSupplier}
    onChange={(e) => setSelectedSupplier(e.target.value)}
    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Selecione o fornecedor</option>
    {suppliers
      .filter(s => s.active)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(supplier => (
        <option key={supplier.id} value={supplier.id}>
          {supplier.name}
        </option>
      ))}
  </select>
</div>
```

### 4️⃣ Passar Suppliers no App.tsx

```typescript
{currentPage === 'purchases' && (
  <Purchases
    // ... outras props ...
    suppliers={suppliers} // 🆕 Adicione esta linha
  />
)}
```

---

## 🗄️ Estrutura de Dados

### Exemplo de Fornecedor

```typescript
const exemploFornecedor: Supplier = {
  id: 'SUPP1733431234567',
  name: 'Distribuidora ABC Ltda',
  cnpj: '12.345.678/0001-90',
  phone: '(11) 3456-7890',
  email: 'contato@distribuidoraabc.com',
  address: 'Rua Exemplo, 123 - Centro - São Paulo/SP',
  contactPerson: 'João Silva',
  paymentTerms: '30 dias',
  notes: 'Fornecedor principal de bebidas. Entrega às terças e quintas.',
  active: true
};
```

### Exemplo de Array de Fornecedores

```typescript
const suppliers: Supplier[] = [
  {
    id: 'SUPP001',
    name: 'Distribuidora ABC',
    cnpj: '12.345.678/0001-90',
    phone: '(11) 3456-7890',
    email: 'contato@abc.com',
    contactPerson: 'João Silva',
    paymentTerms: '30 dias',
    active: true
  },
  {
    id: 'SUPP002',
    name: 'Atacadão XYZ',
    cnpj: '98.765.432/0001-10',
    phone: '(11) 9876-5432',
    email: 'vendas@xyz.com',
    contactPerson: 'Maria Santos',
    paymentTerms: 'À vista',
    active: true
  },
  {
    id: 'SUPP003',
    name: 'Fornecedor Inativo',
    phone: '(21) 2222-3333',
    active: false
  }
];
```

---

## 🧪 Testando a Integração

### Teste 1: Verificar se Carregou

```typescript
// No console do navegador (F12)
console.log('Fornecedores:', localStorage.getItem('mm_suppliers'));
```

### Teste 2: Adicionar Fornecedor Manualmente

```typescript
// No console do navegador
const testSupplier = {
  id: 'TEST001',
  name: 'Fornecedor Teste',
  phone: '(11) 99999-9999',
  active: true
};

const current = JSON.parse(localStorage.getItem('mm_suppliers') || '[]');
current.push(testSupplier);
localStorage.setItem('mm_suppliers', JSON.stringify(current));
location.reload(); // Recarregar página
```

### Teste 3: Limpar Dados

```typescript
// No console do navegador
localStorage.removeItem('mm_suppliers');
location.reload();
```

---

## ✅ Checklist de Verificação

Após integrar, verifique:

- [ ] ✅ Ícone `Truck` importado no `Layout.tsx`
- [ ] ✅ Item "Fornecedores" aparece no menu
- [ ] ✅ Clicar no menu abre a página de fornecedores
- [ ] ✅ Botão "Novo Fornecedor" funciona
- [ ] ✅ Modal de cadastro abre corretamente
- [ ] ✅ Consegue cadastrar um fornecedor
- [ ] ✅ Fornecedor aparece na lista
- [ ] ✅ Busca funciona
- [ ] ✅ Filtros (Todos/Ativos/Inativos) funcionam
- [ ] ✅ Editar fornecedor funciona
- [ ] ✅ Ativar/desativar funciona
- [ ] ✅ Excluir fornecedor funciona
- [ ] ✅ Dados persistem após recarregar página
- [ ] ✅ Estatísticas mostram valores corretos

---

## 🎯 Exemplo Completo de Fluxo

### 1. Usuário Clica em "Fornecedores"
```
Layout.tsx → onNavigate('suppliers') → App.tsx → currentPage = 'suppliers'
```

### 2. App.tsx Renderiza Componente
```
<Suppliers
  suppliers={suppliers}
  onAddSupplier={handleAddSupplier}
  onUpdateSupplier={handleUpdateSupplier}
  onDeleteSupplier={handleDeleteSupplier}
/>
```

### 3. Usuário Cadastra Fornecedor
```
Suppliers.tsx → handleSubmit() → onAddSupplier(data) → 
App.tsx → handleAddSupplier() → setSuppliers() → saveSuppliers()
```

### 4. Dados São Salvos
```
localStorage.setItem('mm_suppliers', JSON.stringify(suppliers))
```

### 5. Página Recarrega
```
useEffect() → localStorage.getItem('mm_suppliers') → 
setSuppliers(parsed) → Suppliers.tsx recebe suppliers atualizados
```

---

## 🚀 Pronto para Usar!

Após seguir todos os passos acima, o módulo de Gestão de Fornecedores estará completamente integrado e funcionando!

**MarketMaster AI** 🚀  
*Sistema de Gestão Comercial Inteligente*
