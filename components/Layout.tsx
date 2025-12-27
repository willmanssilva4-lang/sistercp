import React, { useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, LogOut, Store, ArrowLeftCircle, Truck, Gift, BarChart3, Layers, DollarSign, TrendingUp, Database, AlertTriangle, History } from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
  userName: string;
  userRole: UserRole;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, onLogout, userName, userRole }) => {
  // Listen for F1 key to exit POS mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentView === 'pos' && e.key === 'F1') {
        e.preventDefault();
        onChangeView('dashboard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, onChangeView]);

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.STOCKIST] },
    { id: 'pos', label: 'PDV / Caixa', icon: ShoppingCart, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER] },
    { id: 'cash-register', label: 'Controle de Caixa', icon: DollarSign, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER], hidden: true },
    { id: 'inventory', label: 'Produtos / Estoque', icon: Package, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STOCKIST] },
    { id: 'expiry-alerts', label: 'Alertas de Vencimento', icon: AlertTriangle, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STOCKIST], hidden: true },
    { id: 'purchases', label: 'Compras / Entrada', icon: Truck, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STOCKIST] },
    { id: 'purchase-suggestion', label: 'Sugestão de Compra', icon: TrendingUp, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STOCKIST], hidden: true },
    { id: 'peps', label: 'Lotes PEPS', icon: Layers, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STOCKIST], hidden: true },
    { id: 'promotions', label: 'Promoções / Kits', icon: Gift, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'finance', label: 'Financeiro', icon: Store, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'advanced-reports', label: 'Relatórios Avançados', icon: TrendingUp, roles: [UserRole.ADMIN, UserRole.MANAGER], hidden: true },
    { id: 'profit-margin', label: 'Margem de Lucro', icon: TrendingUp, roles: [UserRole.ADMIN, UserRole.MANAGER], hidden: true },
    { id: 'customers', label: 'Clientes', icon: Users, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER] },
    { id: 'customer-history', label: 'Histórico de Clientes', icon: History, roles: [UserRole.ADMIN, UserRole.MANAGER], hidden: true },
    { id: 'suppliers', label: 'Fornecedores', icon: Truck, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STOCKIST] },
    { id: 'users', label: 'Usuários', icon: Users, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'backup', label: 'Backup', icon: Database, roles: [UserRole.ADMIN], hidden: true },

    { id: 'settings', label: 'Configurações', icon: Settings, roles: [UserRole.ADMIN, UserRole.MANAGER] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  // POS & PURCHASES FULL SCREEN MODE
  if (currentView === 'pos' || currentView === 'purchases') {
    return (
      <div className="h-screen w-screen bg-gray-100 overflow-hidden relative">
        {children}
        {currentView === 'pos' && (
          <button
            onClick={() => onChangeView('dashboard')}
            className="absolute top-4 right-4 z-50 bg-slate-800 text-white p-2 rounded-full shadow-lg opacity-40 hover:opacity-100 transition-all hover:scale-110 flex items-center gap-2 pr-4 pl-2"
            title="Sair do PDV (F1)"
          >
            <ArrowLeftCircle size={24} className="text-red-400" />
            <span className="text-sm font-bold">Sair do Caixa (F1)</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            MarketMaster
          </h1>
          <p className="text-xs text-slate-400 mt-1">Gestão Inteligente</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.filter((item: any) => !item.hidden).map(item => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === item.id
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 bg-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold">
              {userName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-slate-400">Online</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded transition-colors"
          >
            <LogOut size={16} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm z-10">
          <h2 className="text-lg font-semibold text-gray-700 capitalize">
            {menuItems.find(i => i.id === currentView)?.label || 'Acesso Negado'}
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => onChangeView('settings')}
              className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
              title="Configurações do Sistema"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-gray-50 relative">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
