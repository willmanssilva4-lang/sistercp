
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabaseClient';
import { Login } from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POS from './components/POS';
import Finance from './components/Finance';
import Reports from './components/Reports';
import Users from './components/Users';
import Customers from './components/Customers';
import Purchases from './components/Purchases';
import Promotions from './components/Promotions';
import PEPSViewer from './components/PEPSViewer';
import Settings from './components/Settings';
import CashRegister from './components/CashRegister';
import ProfitMarginReports from './components/ProfitMarginReports';
import BackupManager from './components/BackupManager';
import ExpiryAlerts from './components/ExpiryAlerts';
import CustomerPurchaseHistory from './components/CustomerPurchaseHistory';
import Suppliers from './components/Suppliers';
import PurchaseSuggestion from './components/PurchaseSuggestion';
import AdvancedReports from './components/AdvancedReports';
import { Product, Sale, User, UserRole, Transaction, Promotion, ProductKit, StockMovement, Customer, Supplier } from './types';
import { AlertTriangle } from 'lucide-react';
import { useProducts } from './contexts/ProductsContext';
import { useSales } from './contexts/SalesContext';
import { useFinance } from './contexts/FinanceContext';
import { usePeople } from './contexts/PeopleContext';



const App: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  // -- DATA STATE --
  // -- CONTEXT STATE --
  const {
    products, kits, promotions, stockMovements,
    addProduct, updateProduct, deleteProduct, adjustStock,
    addKit, updateKit, deleteKit,
    addPromotion, updatePromotion, deletePromotion,
    processPurchase, cancelPurchase
  } = useProducts();

  const { sales, addSale, voidSale, returnItems } = useSales();

  const {
    transactions, addTransaction, updateTransactionStatus, deleteTransaction
  } = useFinance();

  const {
    users: allUsers, customers, suppliers,
    addUser, updateUser, deleteUser,
    addCustomer, updateCustomer, deleteCustomer, payDebt,
    addSupplier, updateSupplier, deleteSupplier
  } = usePeople();

  // -- UI STATE --
  const [errorModal, setErrorModal] = useState({ open: false, message: '' });
  const [successModal, setSuccessModal] = useState({ open: false, message: '' });

  // -- LOAD DATA ON MOUNT --
  // -- LOAD DATA --
  // Data loading is now handled by Context Providers (ProductsContext, SalesContext, etc.)



  // -- ACTIONS --


  const handleLogout = async () => {
    await signOut();
    setCurrentView('dashboard');
  };







  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error(error);
        setErrorModal({ open: true, message: "Erro ao excluir produto do Supabase." });
      }
    }
  };

  // Promotion Handlers




  const handleDeleteKit = async (id: string) => {
    if (confirm('Excluir este kit?')) {
      try {
        await deleteKit(id);
      } catch (error) {
        setErrorModal({ open: true, message: "Erro ao excluir kit: " + (error as any).message });
      }
    }
  };

  // Customer Handlers


  const handleDeleteCustomer = async (id: string) => {
    if (confirm('Excluir este cliente?')) {
      try {
        await deleteCustomer(id);
      } catch (error) {
        setErrorModal({ open: true, message: "Erro ao excluir cliente: " + (error as any).message });
      }
    }
  };

  const handlePayDebt = async (customerId: string, amount: number) => {
    try {
      await payDebt(customerId, amount);
      setSuccessModal({ open: true, message: `Pagamento de R$ ${amount.toFixed(2)} registrado com sucesso!` });
    } catch (error) {
      setErrorModal({ open: true, message: "Erro ao atualizar saldo: " + (error as any).message });
    }
  };

  // Supplier Handlers



  const handleCashMovement = async (type: 'INCOME' | 'EXPENSE', amount: number, description: string) => {
    await addTransaction({
      id: crypto.randomUUID(),
      type,
      category: type === 'INCOME' ? 'Reforço de Caixa' : 'Sangria de Caixa',
      amount,
      date: new Date().toISOString(),
      description,
      status: 'PAID'
    });
  };





  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Excluir este lançamento financeiro?')) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        setErrorModal({ open: true, message: "Erro ao excluir transação: " + (error as any).message });
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === user?.id) {
      setErrorModal({ open: true, message: "Você não pode excluir a si mesmo!" });
      return;
    }
    if (confirm('Excluir este usuário?')) {
      try {
        await deleteUser(id);
        setSuccessModal({ open: true, message: "Usuário excluído com sucesso!" });
      } catch (error) {
        setErrorModal({ open: true, message: "Erro ao excluir usuário: " + (error as any).message });
      }
    }
  };

  // -- RENDER --
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // Fix: Normalize role to uppercase to prevent Access Denied errors
  const dbUser = allUsers.find(u => u.id === user.id);
  const rawRole = user.user_metadata?.role || dbUser?.role || UserRole.CASHIER;
  const currentUserRole = String(rawRole).toUpperCase() as UserRole;

  const renderContent = () => {
    // Permission Check
    const allowedViews = {
      [UserRole.ADMIN]: ['dashboard', 'pos', 'inventory', 'purchases', 'purchase-suggestion', 'peps', 'promotions', 'finance', 'reports', 'advanced-reports', 'users', 'customers', 'suppliers', 'settings', 'cash-register', 'profit-margin', 'backup', 'expiry-alerts', 'customer-history'],
      [UserRole.MANAGER]: ['dashboard', 'pos', 'inventory', 'purchases', 'purchase-suggestion', 'peps', 'promotions', 'finance', 'reports', 'advanced-reports', 'users', 'customers', 'suppliers', 'settings', 'cash-register', 'profit-margin', 'expiry-alerts', 'customer-history'],
      [UserRole.CASHIER]: ['dashboard', 'pos', 'customers', 'cash-register'],
      [UserRole.STOCKIST]: ['dashboard', 'inventory', 'purchases', 'purchase-suggestion', 'peps', 'suppliers', 'expiry-alerts'],
    };

    const allowedForRole = allowedViews[currentUserRole] || []; // Safety fallback

    if (!allowedForRole.includes(currentView)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <div className="bg-red-50 p-6 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10" /><line x1="15" x2="9" y1="9" y2="15" /><line x1="9" x2="15" y1="9" y2="15" /></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Acesso Negado</h3>
          <p>Você não tem permissão para acessar este módulo.</p>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard products={products} sales={sales} transactions={transactions} />;
      case 'pos':
        // Check for open cash register session
        const sessions = JSON.parse(localStorage.getItem('cashRegisterSessions') || '[]');
        const openSession = sessions.find((s: any) => s.status === 'OPEN');

        if (!openSession) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="bg-yellow-50 p-6 rounded-full mb-4">
                <AlertTriangle className="text-yellow-600 w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Caixa Fechado</h3>
              <p className="mb-6">É necessário abrir o caixa antes de realizar vendas.</p>
              <button
                onClick={() => setCurrentView('cash-register')}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
              >
                Ir para Controle de Caixa
              </button>
            </div>
          );
        }

        return <POS
          products={products}
          onProcessSale={addSale}
          onCashMovement={handleCashMovement}
          currentUser={user.id}
          promotions={promotions}
          kits={kits}
          customers={customers}
          onError={(msg) => setErrorModal({ open: true, message: msg })}
          onSuccess={(msg) => setSuccessModal({ open: true, message: msg })}
        />;
      case 'inventory':
        return <Inventory
          products={products}
          stockMovements={stockMovements}
          onAddProduct={addProduct}
          onUpdateProduct={updateProduct}
          onDeleteProduct={handleDeleteProduct}
          onStockAdjustment={adjustStock}
          onNavigate={setCurrentView}
        />;
      case 'finance':
        return <Finance transactions={transactions} onAddTransaction={addTransaction} onUpdateStatus={updateTransactionStatus} onDeleteTransaction={handleDeleteTransaction} onNavigate={setCurrentView} />;
      case 'reports':
        // Create a proper User object with role for Reports
        const dbUser = allUsers.find(u => u.id === user.id);
        const userWithRole = {
          id: user.id,
          name: user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: user.user_metadata?.role || dbUser?.role || UserRole.CASHIER
        };
        return <Reports
          sales={sales}
          products={products}
          transactions={transactions}
          currentUser={userWithRole}
          onVoidSale={voidSale}
          onReturnItems={returnItems}
          onNavigateToAdvancedReports={() => setCurrentView('advanced-reports')}
        />;
      case 'advanced-reports':
        return <AdvancedReports sales={sales} products={products} />;
      case 'users':
        return <Users users={allUsers} onAddUser={addUser} onUpdateUser={updateUser} onDeleteUser={handleDeleteUser} userRole={currentUserRole} />;
      case 'purchases':
        return <Purchases products={products} currentUser={user} onProcessPurchase={processPurchase} transactions={transactions} onCancelPurchase={cancelPurchase} onBack={() => setCurrentView('dashboard')} suppliersList={suppliers.map(s => s.name)} />;
      case 'purchase-suggestion':
        return (
          <div className="p-6">
            <PurchaseSuggestion
              products={products}
              onAddItems={(items) => {
                setSuccessModal({ open: true, message: `${items.length} itens selecionados. Redirecionando para Compras...` });
                setCurrentView('purchases');
              }}
              onClose={() => setCurrentView('dashboard')}
            />
          </div>
        );
      case 'peps':
        return <PEPSViewer products={products} />;
      case 'promotions':
        return <Promotions
          products={products}
          promotions={promotions}
          kits={kits}
          onAddPromotion={addPromotion}
          onUpdatePromotion={updatePromotion}
          onDeletePromotion={deletePromotion}
          onAddKit={addKit}
          onUpdateKit={updateKit}
          onDeleteKit={deleteKit}
          userRole={currentUserRole}
        />
      case 'customers':
        return <Customers
          customers={customers}
          onAddCustomer={addCustomer}
          onUpdateCustomer={updateCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          onPayDebt={payDebt}
          onNavigate={setCurrentView}
        />;
      case 'suppliers':
        return <Suppliers
          suppliers={suppliers}
          onAddSupplier={addSupplier}
          onUpdateSupplier={updateSupplier}
          onDeleteSupplier={deleteSupplier}
        />;
      case 'cash-register':
        const currentUserForCash = {
          id: user.id,
          name: user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: currentUserRole
        };
        return <CashRegister currentUser={currentUserForCash} />;
      case 'profit-margin':
        return <ProfitMarginReports products={products} sales={sales} />;
      case 'backup':
        return <BackupManager />;
      case 'expiry-alerts':
        return <ExpiryAlerts products={products} />;
      case 'customer-history':
        return <CustomerPurchaseHistory customers={customers} sales={sales} />;
      case 'settings':
        return <Settings onNavigate={setCurrentView} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <h3 className="text-xl font-semibold">Módulo em Desenvolvimento</h3>
              <p>O módulo "{currentView}" estará disponível na próxima atualização.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <Routes>
      <Route path="/" element={
        <Layout
          currentView={currentView}
          onChangeView={setCurrentView}
          onLogout={handleLogout}
          userName={user.email || 'User'}
          userRole={currentUserRole}
        >
          {renderContent()}

          {/* GLOBAL ERROR MODAL */}
          {errorModal.open && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-red-900">Atenção</h3>
                </div>
                <div className="p-6 text-center">
                  <p className="text-gray-700 text-lg mb-6">{errorModal.message}</p>
                  <button
                    onClick={() => setErrorModal({ open: false, message: '' })}
                    className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                  >
                    Entendi, fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GLOBAL SUCCESS MODAL */}
          {successModal.open && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                <div className="bg-emerald-50 p-6 flex flex-col items-center text-center border-b border-emerald-100">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-emerald-900">Sucesso!</h3>
                </div>
                <div className="p-6 text-center">
                  <p className="text-gray-700 text-lg mb-6">{successModal.message}</p>
                  <button
                    onClick={() => setSuccessModal({ open: false, message: '' })}
                    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                  >
                    Ótimo, continuar
                  </button>
                </div>
              </div>
            </div>
          )}
        </Layout>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
