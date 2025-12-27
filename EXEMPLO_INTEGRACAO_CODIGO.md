# Exemplo de Código para Integração

## 1. App.tsx - Importações

Adicione estas importações no topo do arquivo `App.tsx`:

```typescript
// Novas funcionalidades
import CashRegister from './components/CashRegister';
import ProfitMarginReports from './components/ProfitMarginReports';
import BackupManager from './components/BackupManager';
import ExpiryAlerts from './components/ExpiryAlerts';
import CustomerPurchaseHistory from './components/CustomerPurchaseHistory';
```

---

## 2. App.tsx - Rotas

Adicione estas rotas dentro do `<Routes>` no `App.tsx`, após as rotas existentes:

```typescript
{/* ==================== NOVAS FUNCIONALIDADES ==================== */}

{/* Controle de Caixa */}
<Route
  path="/cash-register"
  element={
    <Layout user={user} onLogout={handleLogout}>
      <CashRegister currentUser={user} />
    </Layout>
  }
/>

{/* Relatórios de Margem de Lucro */}
<Route
  path="/profit-margin"
  element={
    <Layout user={user} onLogout={handleLogout}>
      <ProfitMarginReports products={products} sales={sales} />
    </Layout>
  }
/>

{/* Backup Automático */}
<Route
  path="/backup"
  element={
    <Layout user={user} onLogout={handleLogout}>
      <BackupManager />
    </Layout>
  }
/>

{/* Alertas de Vencimento */}
<Route
  path="/expiry-alerts"
  element={
    <Layout user={user} onLogout={handleLogout}>
      <ExpiryAlerts products={products} />
    </Layout>
  }
/>

{/* Histórico de Compras por Cliente */}
<Route
  path="/customer-history"
  element={
    <Layout user={user} onLogout={handleLogout}>
      <CustomerPurchaseHistory customers={customers} sales={sales} />
    </Layout>
  }
/>
```

---

## 3. Layout.tsx - Importações de Ícones

Adicione estes ícones à importação do lucide-react no `Layout.tsx`:

```typescript
import {
  // ... ícones existentes
  DollarSign,      // Para Controle de Caixa
  TrendingUp,      // Para Margem de Lucro
  Database,        // Para Backup
  AlertTriangle,   // Para Alertas de Vencimento
  History,         // Para Histórico de Clientes
} from 'lucide-react';
```

---

## 4. Layout.tsx - Itens de Menu

### Opção A: Menu Organizado por Seções

```typescript
{/* Navegação Principal */}
<nav className="flex-1 px-4 py-6 space-y-2">
  
  {/* Dashboard */}
  <Link
    to="/dashboard"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <LayoutDashboard className="w-5 h-5" />
    <span>Dashboard</span>
  </Link>

  {/* PDV */}
  <Link
    to="/pos"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <ShoppingCart className="w-5 h-5" />
    <span>PDV</span>
  </Link>

  {/* NOVO: Controle de Caixa */}
  <Link
    to="/cash-register"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <DollarSign className="w-5 h-5" />
    <span>Controle de Caixa</span>
  </Link>

  {/* Estoque */}
  <Link
    to="/inventory"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <Package className="w-5 h-5" />
    <span>Estoque</span>
  </Link>

  {/* NOVO: Alertas de Vencimento */}
  <Link
    to="/expiry-alerts"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <AlertTriangle className="w-5 h-5" />
    <span>Alertas de Vencimento</span>
  </Link>

  {/* Compras */}
  <Link
    to="/purchases"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <ShoppingBag className="w-5 h-5" />
    <span>Compras</span>
  </Link>

  {/* Clientes */}
  <Link
    to="/customers"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <Users className="w-5 h-5" />
    <span>Clientes</span>
  </Link>

  {/* NOVO: Histórico de Clientes */}
  <Link
    to="/customer-history"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <History className="w-5 h-5" />
    <span>Histórico de Clientes</span>
  </Link>

  {/* Fornecedores */}
  <Link
    to="/suppliers"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <Building className="w-5 h-5" />
    <span>Fornecedores</span>
  </Link>

  {/* Financeiro */}
  <Link
    to="/finance"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <DollarSign className="w-5 h-5" />
    <span>Financeiro</span>
  </Link>

  {/* Relatórios - Submenu */}
  <div className="space-y-1">
    <div className="flex items-center gap-3 px-4 py-3 text-gray-600 font-medium">
      <BarChart3 className="w-5 h-5" />
      <span>Relatórios</span>
    </div>
    <div className="pl-8 space-y-1">
      <Link
        to="/reports"
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm"
      >
        <span>Vendas</span>
      </Link>
      {/* NOVO: Margem de Lucro */}
      <Link
        to="/profit-margin"
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm"
      >
        <TrendingUp className="w-4 h-4" />
        <span>Margem de Lucro</span>
      </Link>
    </div>
  </div>

  {/* Promoções */}
  <Link
    to="/promotions"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <Gift className="w-5 h-5" />
    <span>Promoções</span>
  </Link>

  {/* Configurações - Submenu */}
  <div className="space-y-1">
    <div className="flex items-center gap-3 px-4 py-3 text-gray-600 font-medium">
      <Settings className="w-5 h-5" />
      <span>Configurações</span>
    </div>
    <div className="pl-8 space-y-1">
      <Link
        to="/users"
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm"
      >
        <span>Usuários</span>
      </Link>
      <Link
        to="/settings"
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm"
      >
        <span>Loja</span>
      </Link>
      {/* NOVO: Backup */}
      <Link
        to="/backup"
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm"
      >
        <Database className="w-4 h-4" />
        <span>Backup</span>
      </Link>
    </div>
  </div>

</nav>
```

### Opção B: Menu Simples (Todos no Mesmo Nível)

```typescript
<nav className="flex-1 px-4 py-6 space-y-2">
  
  {/* Itens existentes... */}

  {/* NOVO: Controle de Caixa */}
  <Link
    to="/cash-register"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <DollarSign className="w-5 h-5" />
    <span>Controle de Caixa</span>
  </Link>

  {/* NOVO: Margem de Lucro */}
  <Link
    to="/profit-margin"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <TrendingUp className="w-5 h-5" />
    <span>Margem de Lucro</span>
  </Link>

  {/* NOVO: Alertas de Vencimento */}
  <Link
    to="/expiry-alerts"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <AlertTriangle className="w-5 h-5" />
    <span>Alertas de Vencimento</span>
  </Link>

  {/* NOVO: Histórico de Clientes */}
  <Link
    to="/customer-history"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <History className="w-5 h-5" />
    <span>Histórico de Clientes</span>
  </Link>

  {/* NOVO: Backup */}
  <Link
    to="/backup"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <Database className="w-5 h-5" />
    <span>Backup</span>
  </Link>

</nav>
```

---

## 5. Layout.tsx - Badge de Alertas (Opcional)

Para mostrar o número de alertas críticos no menu:

```typescript
{/* Adicione este código antes do return do componente Layout */}
const [criticalAlerts, setCriticalAlerts] = React.useState(0);

React.useEffect(() => {
  // Carregar produtos do localStorage
  const productsStr = localStorage.getItem('products');
  if (!productsStr) return;
  
  const products = JSON.parse(productsStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Contar alertas críticos (7 dias ou menos)
  const critical = products.filter((p: any) => {
    if (!p.expiryDate) return false;
    const expiryDate = new Date(p.expiryDate);
    expiryDate.setHours(0, 0, 0, 0);
    const days = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days <= 7 && days >= 0;
  }).length;
  
  setCriticalAlerts(critical);
}, []);

{/* No item do menu de Alertas */}
<Link
  to="/expiry-alerts"
  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
>
  <AlertTriangle className="w-5 h-5" />
  <span>Alertas de Vencimento</span>
  {criticalAlerts > 0 && (
    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
      {criticalAlerts}
    </span>
  )}
</Link>
```

---

## 6. Controle de Acesso por Role (Opcional)

Se você quiser restringir acesso baseado em roles:

```typescript
{/* No App.tsx, antes das rotas */}
const canAccessCashRegister = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'CASHIER';
const canAccessReports = user?.role === 'ADMIN' || user?.role === 'MANAGER';
const canAccessBackup = user?.role === 'ADMIN';

{/* Nas rotas, adicione verificação */}
{canAccessCashRegister && (
  <Route
    path="/cash-register"
    element={
      <Layout user={user} onLogout={handleLogout}>
        <CashRegister currentUser={user} />
      </Layout>
    }
  />
)}

{canAccessReports && (
  <Route
    path="/profit-margin"
    element={
      <Layout user={user} onLogout={handleLogout}>
        <ProfitMarginReports products={products} sales={sales} />
      </Layout>
    }
  />
)}

{canAccessBackup && (
  <Route
    path="/backup"
    element={
      <Layout user={user} onLogout={handleLogout}>
        <BackupManager />
      </Layout>
    }
  />
)}

{/* No Layout.tsx, nos itens de menu */}
{canAccessCashRegister && (
  <Link to="/cash-register" className="...">
    <DollarSign className="w-5 h-5" />
    <span>Controle de Caixa</span>
  </Link>
)}
```

---

## 7. Exemplo Completo de Integração Mínima

### App.tsx (apenas as adições necessárias)

```typescript
// 1. Adicionar importações
import CashRegister from './components/CashRegister';
import ProfitMarginReports from './components/ProfitMarginReports';
import BackupManager from './components/BackupManager';
import ExpiryAlerts from './components/ExpiryAlerts';
import CustomerPurchaseHistory from './components/CustomerPurchaseHistory';

// 2. Dentro do <Routes>, adicionar as rotas
<Route path="/cash-register" element={<Layout user={user} onLogout={handleLogout}><CashRegister currentUser={user} /></Layout>} />
<Route path="/profit-margin" element={<Layout user={user} onLogout={handleLogout}><ProfitMarginReports products={products} sales={sales} /></Layout>} />
<Route path="/backup" element={<Layout user={user} onLogout={handleLogout}><BackupManager /></Layout>} />
<Route path="/expiry-alerts" element={<Layout user={user} onLogout={handleLogout}><ExpiryAlerts products={products} /></Layout>} />
<Route path="/customer-history" element={<Layout user={user} onLogout={handleLogout}><CustomerPurchaseHistory customers={customers} sales={sales} /></Layout>} />
```

### Layout.tsx (apenas as adições necessárias)

```typescript
// 1. Adicionar ícones à importação
import { /* ... */, DollarSign, TrendingUp, Database, AlertTriangle, History } from 'lucide-react';

// 2. Adicionar itens de menu
<Link to="/cash-register" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors">
  <DollarSign className="w-5 h-5" />
  <span>Controle de Caixa</span>
</Link>

<Link to="/profit-margin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors">
  <TrendingUp className="w-5 h-5" />
  <span>Margem de Lucro</span>
</Link>

<Link to="/backup" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors">
  <Database className="w-5 h-5" />
  <span>Backup</span>
</Link>

<Link to="/expiry-alerts" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors">
  <AlertTriangle className="w-5 h-5" />
  <span>Alertas de Vencimento</span>
</Link>

<Link to="/customer-history" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors">
  <History className="w-5 h-5" />
  <span>Histórico de Clientes</span>
</Link>
```

---

## 8. Verificação Pós-Integração

Após integrar, verifique:

1. ✅ Todas as rotas estão acessíveis
2. ✅ Itens de menu aparecem corretamente
3. ✅ Ícones estão sendo exibidos
4. ✅ Não há erros no console
5. ✅ Navegação funciona corretamente
6. ✅ Dados são salvos no localStorage
7. ✅ Componentes renderizam sem erros

---

## 9. Troubleshooting

### Erro: "Cannot find module"
- Verifique se os arquivos `.tsx` estão na pasta `components/`
- Verifique o caminho de importação

### Erro: "X is not defined"
- Verifique se todos os ícones estão importados do lucide-react
- Verifique se as props estão sendo passadas corretamente

### Componente não renderiza
- Abra o console do navegador (F12)
- Verifique se há erros JavaScript
- Verifique se as props necessárias estão sendo passadas

### Dados não são salvos
- Verifique se o localStorage está habilitado no navegador
- Teste em modo normal (não privado/incógnito)
- Verifique o Application tab no DevTools

---

Pronto! Com essas instruções você consegue integrar todas as funcionalidades ao sistema.
