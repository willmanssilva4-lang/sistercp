# Guia de Integração - Novas Funcionalidades

Este documento fornece instruções detalhadas para integrar as novas funcionalidades ao sistema MarketMaster AI.

## Funcionalidades Implementadas

1. **Controle de Caixa** (`CashRegister.tsx`)
2. **Relatórios de Margem de Lucro** (`ProfitMarginReports.tsx`)
3. **Backup Automático** (`BackupManager.tsx`)
4. **Alertas de Vencimento** (`ExpiryAlerts.tsx`)
5. **Histórico de Compras por Cliente** (`CustomerPurchaseHistory.tsx`)

---

## 1. Importações no App.tsx

Adicione as seguintes importações no início do arquivo `App.tsx`:

```typescript
import CashRegister from './components/CashRegister';
import ProfitMarginReports from './components/ProfitMarginReports';
import BackupManager from './components/BackupManager';
import ExpiryAlerts from './components/ExpiryAlerts';
import CustomerPurchaseHistory from './components/CustomerPurchaseHistory';
```

---

## 2. Rotas no App.tsx

Adicione as seguintes rotas dentro do `<Routes>` no `App.tsx`, logo após as rotas existentes:

```typescript
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

## 3. Menu no Layout.tsx

Adicione os seguintes itens de menu no arquivo `Layout.tsx`. Localize a seção de navegação e adicione:

### 3.1. Controle de Caixa
Adicione no menu principal (pode ser após "POS" ou "Finance"):

```typescript
<Link
  to="/cash-register"
  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
>
  <DollarSign className="w-5 h-5" />
  <span>Controle de Caixa</span>
</Link>
```

**Ícone necessário:** Importe `DollarSign` do lucide-react se ainda não estiver importado.

### 3.2. Relatórios de Margem de Lucro
Adicione na seção de Relatórios:

```typescript
<Link
  to="/profit-margin"
  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
>
  <TrendingUp className="w-5 h-5" />
  <span>Margem de Lucro</span>
</Link>
```

**Ícone necessário:** Importe `TrendingUp` do lucide-react.

### 3.3. Backup Automático
Adicione na seção de Configurações ou Administração:

```typescript
<Link
  to="/backup"
  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
>
  <Database className="w-5 h-5" />
  <span>Backup</span>
</Link>
```

**Ícone necessário:** Importe `Database` do lucide-react.

### 3.4. Alertas de Vencimento
Adicione na seção de Estoque ou Alertas:

```typescript
<Link
  to="/expiry-alerts"
  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
>
  <AlertTriangle className="w-5 h-5" />
  <span>Alertas de Vencimento</span>
</Link>
```

**Ícone necessário:** Importe `AlertTriangle` do lucide-react.

### 3.5. Histórico de Compras por Cliente
Adicione na seção de Clientes ou Relatórios:

```typescript
<Link
  to="/customer-history"
  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
>
  <Users className="w-5 h-5" />
  <span>Histórico de Clientes</span>
</Link>
```

**Ícone necessário:** Importe `Users` do lucide-react.

---

## 4. Importações de Ícones no Layout.tsx

Certifique-se de que os seguintes ícones estão importados no `Layout.tsx`:

```typescript
import {
  // ... ícones existentes
  DollarSign,
  TrendingUp,
  Database,
  AlertTriangle,
  Users
} from 'lucide-react';
```

---

## 5. Estrutura Sugerida do Menu

Sugestão de organização do menu no `Layout.tsx`:

```
📊 Dashboard
💰 PDV (POS)
💵 Controle de Caixa          [NOVO]
📦 Estoque
🛒 Compras
👥 Clientes
🏢 Fornecedores
💼 Financeiro
📈 Relatórios
  ├─ Vendas
  ├─ Curva ABC
  ├─ Margem de Lucro          [NOVO]
  └─ Histórico de Clientes    [NOVO]
🎁 Promoções
⚠️  Alertas de Vencimento      [NOVO]
⚙️  Configurações
  ├─ Usuários
  ├─ Loja
  └─ Backup                   [NOVO]
```

---

## 6. Funcionalidades Automáticas

### 6.1. Backup Automático
O backup automático será executado automaticamente quando o componente `BackupManager` for montado pela primeira vez. Ele verificará se é necessário fazer backup baseado nas configurações do usuário (diário ou semanal).

### 6.2. Alertas de Vencimento
Os alertas são calculados automaticamente ao carregar o componente. Você pode adicionar um badge no menu para mostrar o número de alertas críticos:

```typescript
// No Layout.tsx, você pode adicionar lógica para mostrar badge
const criticalAlerts = products.filter(p => {
  if (!p.expiryDate) return false;
  const days = Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  return days <= 7 && days >= 0;
}).length;

// No item do menu:
<Link to="/expiry-alerts" className="...">
  <AlertTriangle className="w-5 h-5" />
  <span>Alertas de Vencimento</span>
  {criticalAlerts > 0 && (
    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
      {criticalAlerts}
    </span>
  )}
</Link>
```

---

## 7. Permissões de Acesso

Considere adicionar controle de acesso baseado em roles:

```typescript
// Exemplo de controle de acesso no App.tsx
const canAccessCashRegister = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'CASHIER';
const canAccessBackup = user?.role === 'ADMIN';
const canAccessReports = user?.role === 'ADMIN' || user?.role === 'MANAGER';

// Use essas variáveis para mostrar/ocultar rotas e itens de menu
```

---

## 8. Testes Recomendados

Após a integração, teste:

1. **Controle de Caixa:**
   - Abrir caixa com saldo inicial
   - Realizar vendas
   - Fechar caixa e verificar diferença

2. **Relatórios de Margem:**
   - Filtrar por período
   - Filtrar por categoria
   - Exportar CSV

3. **Backup:**
   - Fazer backup manual
   - Restaurar backup
   - Verificar backup automático

4. **Alertas de Vencimento:**
   - Adicionar produtos com datas de vencimento
   - Configurar períodos de alerta
   - Verificar níveis de severidade

5. **Histórico de Clientes:**
   - Selecionar cliente
   - Filtrar por período
   - Verificar estatísticas
   - Exportar CSV

---

## 9. Armazenamento de Dados

Todas as funcionalidades utilizam `localStorage` para persistência:

- `cashRegisterSessions` - Sessões de caixa
- `backupHistory` - Histórico de backups
- `autoBackups` - Backups automáticos (últimos 5)
- `expiryAlertSettings` - Configurações de alertas
- `autoBackupEnabled` - Status do backup automático
- `backupFrequency` - Frequência do backup
- `lastBackupDate` - Data do último backup

---

## 10. Próximos Passos

Após integrar as funcionalidades:

1. Teste cada funcionalidade individualmente
2. Verifique a responsividade em diferentes tamanhos de tela
3. Ajuste cores e estilos conforme o design do sistema
4. Configure permissões de acesso por role
5. Adicione badges/notificações no menu quando apropriado

---

## Suporte

Para dúvidas ou problemas na integração, verifique:
- Console do navegador para erros JavaScript
- Estrutura de dados no localStorage
- Compatibilidade de props entre componentes
