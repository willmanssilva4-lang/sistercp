# 🚚 Gestão de Fornecedores - Guia de Integração

## 📋 Visão Geral

Sistema completo de **Gestão de Fornecedores** para o MarketMaster AI, permitindo cadastro, edição, busca e gerenciamento de fornecedores.

---

## 📁 Arquivos Criados

### 1. **`components/Suppliers.tsx`**
Componente React completo com:
- ✅ Listagem de fornecedores
- ✅ Cadastro e edição
- ✅ Busca e filtros
- ✅ Ativar/desativar fornecedores
- ✅ Estatísticas (total, ativos, inativos)
- ✅ Interface moderna e responsiva

### 2. **`migration_suppliers.sql`**
Script SQL com:
- ✅ Criação da tabela `suppliers`
- ✅ Índices para performance
- ✅ Trigger de atualização automática
- ✅ Dados de exemplo (opcional)

### 3. **`types.ts`** (Modificado)
- ✅ Interface `Supplier` adicionada
- ✅ `suppliers` adicionado ao `AppState`

---

## 🔧 Como Integrar no App.tsx

### Passo 1: Importar o Componente

No início do arquivo `App.tsx`, adicione:

```typescript
import Suppliers from './components/Suppliers';
```

### Passo 2: Adicionar Estado de Fornecedores

Dentro do componente `App`, adicione o estado:

```typescript
const [suppliers, setSuppliers] = useState<Supplier[]>([]);
```

### Passo 3: Adicionar Funções de Gerenciamento

Adicione estas funções no `App.tsx`:

```typescript
// Adicionar fornecedor
const handleAddSupplier = (supplierData: Omit<Supplier, 'id'>) => {
  const newSupplier: Supplier = {
    ...supplierData,
    id: 'SUPP' + Date.now()
  };
  setSuppliers([...suppliers, newSupplier]);
  saveSuppliers([...suppliers, newSupplier]);
};

// Atualizar fornecedor
const handleUpdateSupplier = (id: string, updates: Partial<Supplier>) => {
  const updated = suppliers.map(s => 
    s.id === id ? { ...s, ...updates } : s
  );
  setSuppliers(updated);
  saveSuppliers(updated);
};

// Deletar fornecedor
const handleDeleteSupplier = (id: string) => {
  const filtered = suppliers.filter(s => s.id !== id);
  setSuppliers(filtered);
  saveSuppliers(filtered);
};

// Salvar no localStorage
const saveSuppliers = (suppliersToSave: Supplier[]) => {
  localStorage.setItem('mm_suppliers', JSON.stringify(suppliersToSave));
};
```

### Passo 4: Carregar Fornecedores do localStorage

No `useEffect` de carregamento inicial, adicione:

```typescript
useEffect(() => {
  // ... código existente ...
  
  // Carregar fornecedores
  const savedSuppliers = localStorage.getItem('mm_suppliers');
  if (savedSuppliers) {
    setSuppliers(JSON.parse(savedSuppliers));
  }
}, []);
```

### Passo 5: Adicionar Rota

Na seção de rotas do `App.tsx`, adicione:

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

## 🎨 Como Integrar no Layout.tsx

### Adicionar Item no Menu

No arquivo `Layout.tsx`, adicione o item de menu:

```typescript
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

**Importante:** Importe o ícone no topo do arquivo:
```typescript
import { Truck } from 'lucide-react';
```

---

## 🗄️ Executar Migration SQL

### Opção 1: SQLite (Desenvolvimento Local)

Se estiver usando SQLite local:

```bash
sqlite3 database.db < migration_suppliers.sql
```

### Opção 2: Supabase

Se estiver usando Supabase:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo de `migration_suppliers.sql`
4. Execute o script

### Opção 3: Outro Banco de Dados

Adapte o script SQL conforme necessário para seu banco de dados.

---

## 📊 Estrutura da Tabela

```sql
suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  contact_person TEXT,
  payment_terms TEXT,
  notes TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
)
```

---

## 🎯 Funcionalidades Implementadas

### ✅ CRUD Completo
- **Create**: Cadastrar novos fornecedores
- **Read**: Listar e visualizar fornecedores
- **Update**: Editar informações
- **Delete**: Excluir fornecedores

### ✅ Busca e Filtros
- Busca por nome, CNPJ ou pessoa de contato
- Filtro por status (Todos, Ativos, Inativos)

### ✅ Gestão de Status
- Ativar/desativar fornecedores
- Visual diferenciado para inativos

### ✅ Estatísticas
- Total de fornecedores
- Fornecedores ativos
- Fornecedores inativos

### ✅ Interface Moderna
- Cards responsivos
- Modal de cadastro/edição
- Ícones intuitivos
- Cores e gradientes

---

## 💡 Campos do Fornecedor

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| **name** | string | ✅ Sim | Nome do fornecedor |
| **cnpj** | string | ❌ Não | CNPJ do fornecedor |
| **phone** | string | ❌ Não | Telefone de contato |
| **email** | string | ❌ Não | E-mail de contato |
| **address** | string | ❌ Não | Endereço completo |
| **contactPerson** | string | ❌ Não | Nome da pessoa de contato |
| **paymentTerms** | string | ❌ Não | Condições de pagamento |
| **notes** | string | ❌ Não | Observações gerais |
| **active** | boolean | ✅ Sim | Status (ativo/inativo) |

---

## 🔗 Integração com Compras

### Vincular Fornecedor ao Produto

No componente `Purchases.tsx`, você pode:

1. Adicionar dropdown de fornecedores
2. Vincular compra ao fornecedor
3. Filtrar produtos por fornecedor

**Exemplo de código:**

```typescript
<select
  value={selectedSupplier}
  onChange={(e) => setSelectedSupplier(e.target.value)}
  className="border p-2 rounded"
>
  <option value="">Selecione o fornecedor</option>
  {suppliers.filter(s => s.active).map(supplier => (
    <option key={supplier.id} value={supplier.id}>
      {supplier.name}
    </option>
  ))}
</select>
```

---

## 📱 Exemplo de Uso

### Cadastrar Novo Fornecedor

```typescript
handleAddSupplier({
  name: 'Distribuidora ABC',
  cnpj: '12.345.678/0001-90',
  phone: '(11) 3456-7890',
  email: 'contato@abc.com',
  address: 'Rua Exemplo, 123',
  contactPerson: 'João Silva',
  paymentTerms: '30 dias',
  notes: 'Fornecedor principal de bebidas',
  active: true
});
```

### Atualizar Fornecedor

```typescript
handleUpdateSupplier('SUPP001', {
  phone: '(11) 9999-8888',
  paymentTerms: '45 dias'
});
```

### Desativar Fornecedor

```typescript
handleUpdateSupplier('SUPP001', {
  active: false
});
```

---

## 🎨 Personalização

### Alterar Cores

No arquivo `Suppliers.tsx`, você pode personalizar:

```typescript
// Cor principal (azul)
className="bg-blue-600" // Altere para sua cor

// Cor de sucesso (verde)
className="bg-green-600" // Altere para sua cor

// Cor de inativo (cinza)
className="bg-gray-600" // Altere para sua cor
```

### Adicionar Campos Personalizados

1. Adicione o campo na interface `Supplier` em `types.ts`
2. Adicione o campo no `formData` do componente
3. Adicione o input no modal
4. Adicione a coluna na migration SQL

---

## ✅ Checklist de Integração

- [ ] Executar migration SQL
- [ ] Adicionar import no `App.tsx`
- [ ] Adicionar estado `suppliers`
- [ ] Adicionar funções de gerenciamento
- [ ] Adicionar carregamento do localStorage
- [ ] Adicionar rota no `App.tsx`
- [ ] Adicionar item no menu do `Layout.tsx`
- [ ] Importar ícone `Truck` no `Layout.tsx`
- [ ] Testar cadastro de fornecedor
- [ ] Testar edição de fornecedor
- [ ] Testar busca e filtros
- [ ] Testar ativar/desativar

---

## 🐛 Troubleshooting

### Erro: "Supplier is not defined"
**Solução:** Certifique-se de importar o tipo:
```typescript
import { Supplier } from './types';
```

### Fornecedores não aparecem
**Solução:** Verifique se:
1. Migration SQL foi executada
2. Estado foi inicializado corretamente
3. Rota está configurada

### Modal não abre
**Solução:** Verifique se as funções de callback foram passadas corretamente para o componente.

---

## 🚀 Próximas Melhorias (Opcionais)

- [ ] Histórico de compras por fornecedor
- [ ] Relatório de fornecedores
- [ ] Importação de fornecedores via CSV
- [ ] Exportação de lista de fornecedores
- [ ] Integração com API de CNPJ
- [ ] Múltiplos contatos por fornecedor
- [ ] Avaliação de fornecedores
- [ ] Documentos anexados

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este guia
2. Consulte os comentários no código
3. Teste com dados de exemplo

---

**MarketMaster AI** 🚀  
*Sistema de Gestão Comercial Inteligente*

**Versão**: 2.2 - Com Gestão de Fornecedores  
**Última atualização**: Dezembro 2024
