
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
import { createStockBatch } from './src/utils/pepsUtils';
import { AlertTriangle } from 'lucide-react';
import { useProducts } from './contexts/ProductsContext';
import { useSales } from './contexts/SalesContext';
import { useFinance } from './contexts/FinanceContext';
import { usePeople } from './contexts/PeopleContext';

// --- MOCK DATA FOR INITIALIZATION ---
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', code: '789123', name: 'Coca Cola 2L', category: 'Bebidas', subcategory: 'Refrigerantes', brand: 'Coca-Cola', supplier: 'Coca-Cola FEMSA', unit: 'UN', costPrice: 5.50, retailPrice: 9.00, wholesalePrice: 8.00, wholesaleMinQty: 6, stock: 45, minStock: 10, expiryDate: '2025-12-01' },
  { id: '2', code: '789124', name: 'Arroz 5kg Camil', category: 'Mercearia', subcategory: 'Grãos', brand: 'Camil', supplier: 'Camil Alimentos', unit: 'PCT', costPrice: 18.00, retailPrice: 24.90, wholesalePrice: 23.50, wholesaleMinQty: 10, stock: 20, minStock: 5 },
  { id: '3', code: '789125', name: 'Detergente Ypê', category: 'Limpeza', subcategory: 'Lava Louças', brand: 'Ypê', supplier: 'Química Amparo', unit: 'UN', costPrice: 1.80, retailPrice: 2.99, wholesalePrice: 2.50, wholesaleMinQty: 24, stock: 100, minStock: 20 },
  { id: '4', code: '789126', name: 'Leite Integral 1L', category: 'Mercearia', subcategory: 'Laticínios', brand: 'Itambé', supplier: 'Itambé Laticínios', unit: 'L', costPrice: 3.50, retailPrice: 5.20, wholesalePrice: 4.80, wholesaleMinQty: 12, stock: 8, minStock: 12, expiryDate: '2023-11-05' },
];

const INITIAL_USERS: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@market.com', role: UserRole.ADMIN },
  { id: '2', name: 'Maria Silva', email: 'maria@market.com', role: UserRole.MANAGER },
  { id: '3', name: 'João Souza', email: 'joao@market.com', role: UserRole.CASHIER },
];

const App: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  // -- DATA STATE --
  // -- CONTEXT STATE --
  const {
    products, kits, promotions, stockMovements,
    addProduct, updateProduct, deleteProduct, adjustStock,
    addKit, updateKit, deleteKit,
    addPromotion, updatePromotion, deletePromotion
  } = useProducts();

  const { sales, addSale, voidSale } = useSales();

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

  const handleAddProduct = async (p: Product) => {
    try {
      await addProduct(p);
    } catch (error) {
      console.error("Erro na requisição:", error);
      setErrorModal({ open: true, message: "Erro inesperado." });
    }
  };

  const handleUpdateProduct = async (p: Product) => {
    try {
      await updateProduct(p);
    } catch (error) {
      console.error(error);
      setErrorModal({ open: true, message: "Erro ao atualizar produto no Supabase." });
    }
  };

  const handleStockAdjustment = async (productId: string, type: 'ENTRY' | 'EXIT', qty: number, reason: string) => {
    try {
      await adjustStock(productId, type, qty, reason);
    } catch (error) {
      console.error(error);
    }
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
  const handleAddPromotion = async (p: Promotion) => {
    try {
      await addPromotion(p);
    } catch (error) {
      setErrorModal({ open: true, message: "Erro ao criar promoção: " + (error as any).message });
    }
  };

  const handleUpdatePromotion = async (p: Promotion) => {
    try {
      await updatePromotion(p);
    } catch (error) {
      setErrorModal({ open: true, message: "Erro ao atualizar promoção: " + (error as any).message });
    }
  };

  const handleDeletePromotion = async (id: string) => {
    try {
      await deletePromotion(id);
    } catch (error) {
      setErrorModal({ open: true, message: "Erro ao excluir promoção: " + (error as any).message });
    }
  };

  const handleAddKit = async (k: ProductKit) => {
    try {
      await addKit(k);
    } catch (error) {
      setErrorModal({ open: true, message: "Erro ao criar kit: " + (error as any).message });
    }
  };

  const handleUpdateKit = async (k: ProductKit) => {
    try {
      await updateKit(k);
    } catch (error) {
      setErrorModal({ open: true, message: "Erro ao atualizar kit: " + (error as any).message });
    }
  };

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
  const handleAddCustomer = async (c: Customer) => {
    try {
      await addCustomer(c);
    } catch (error) {
      setErrorModal({ open: true, message: "Erro ao adicionar cliente: " + (error as any).message });
    }
  };

  const handleUpdateCustomer = async (c: Customer) => {
    try {
      await updateCustomer(c);
    } catch (error) {
      setErrorModal({ open: true, message: "Erro ao atualizar cliente: " + (error as any).message });
    }
  };

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
  const handleAddSupplier = async (s: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = {
      id: crypto.randomUUID(),
      ...s
    };
    const dbSupplier = {
      id: newSupplier.id,
      name: newSupplier.name,
      cnpj: newSupplier.cnpj,
      phone: newSupplier.phone,
      email: newSupplier.email,
      address: newSupplier.address,
      contact_person: newSupplier.contactPerson,
      payment_terms: newSupplier.paymentTerms,
      notes: newSupplier.notes,
      active: newSupplier.active
    };
    const { error } = await supabase.from('suppliers').insert([dbSupplier]);
    if (error) setErrorModal({ open: true, message: "Erro ao adicionar fornecedor: " + error.message });
    else setSuppliers([...suppliers, newSupplier]);
  };

  const handleUpdateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.cnpj !== undefined) dbUpdates.cnpj = updates.cnpj;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.contactPerson !== undefined) dbUpdates.contact_person = updates.contactPerson;
    if (updates.paymentTerms !== undefined) dbUpdates.payment_terms = updates.paymentTerms;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.active !== undefined) dbUpdates.active = updates.active;

    const { error } = await supabase.from('suppliers').update(dbUpdates).eq('id', id);
    if (error) setErrorModal({ open: true, message: "Erro ao atualizar fornecedor: " + error.message });
    else setSuppliers(suppliers.map(curr => curr.id === id ? { ...curr, ...updates } : curr));
  };

  const handleDeleteSupplier = async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) setErrorModal({ open: true, message: "Erro ao excluir fornecedor: " + error.message });
    else setSuppliers(suppliers.filter(s => s.id !== id));
  };


  const handleProcessSale = async (sale: Sale) => {
    // 0. Ensure User Exists in Public Table (Fix for FK Error)
    if (user) {
      const { error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (userCheckError && userCheckError.code === 'PGRST116') {
        // User not found, insert them
        await supabase.from('users').insert([{
          id: user.id,
          name: user.email?.split('@')[0] || 'Caixa',
          email: user.email || 'sem_email@sistema',
          role: 'CASHIER' // Default role
        }]);
      }
    }

    // 1. Add Sale Record to Supabase
    const { error: saleError } = await supabase
      .from('sales')
      .insert([{
        id: sale.id,
        timestamp: sale.timestamp,
        cashier_id: user?.id, // Use current user ID
        customer_name: sale.customerName,
        total: sale.total,
        payment_method: sale.paymentMethod,
        status: sale.status
      }]);

    if (saleError) {
      setErrorModal({ open: true, message: "Erro ao salvar venda: " + saleError.message });
      return;
    }

    // 2. Add Sale Items
    const itemsToInsert = [];
    for (const item of sale.items) {
      // Find product ID by code (or item.id if it matches)
      // In cart, item.id is usually product.id. Let's verify.
      // Yes, addToCart uses ...product, so item.id is product.id.
      itemsToInsert.push({
        sale_id: sale.id,
        product_id: item.id,
        qty: item.qty,
        applied_price: item.appliedPrice,
        subtotal: item.subtotal
      });
    }

    if (itemsToInsert.length > 0) {
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsToInsert);

      if (itemsError) console.error("Erro ao salvar itens da venda:", itemsError);
    }

    setSales([...sales, sale]);

    // 3. Decrement Stock & Log Movements
    const productQtySold: Record<string, number> = {};
    const newMovements: StockMovement[] = [];

    sale.items.forEach(item => {
      const kitDef = kits.find(k => k.code === item.code);
      if (kitDef) {
        kitDef.items.forEach(kitItem => {
          const prod = products.find(p => p.code === kitItem.productCode);
          if (prod) {
            productQtySold[prod.id] = (productQtySold[prod.id] || 0) + (kitItem.qty * item.qty);
          }
        });
      } else {
        productQtySold[item.id] = (productQtySold[item.id] || 0) + item.qty;
      }
    });

    const updatedProducts = products.map(p => {
      const qtySold = productQtySold[p.id];
      if (qtySold) {
        const movement = {
          id: crypto.randomUUID(),
          productId: p.id,
          productName: p.name,
          type: 'EXIT',
          qty: qtySold,
          date: new Date().toISOString(),
          reason: `Venda #${sale.id.slice(0, 6)}`
        };
        newMovements.push(movement as StockMovement);

        // Save movement to Supabase
        supabase.from('stock_movements').insert([{
          id: movement.id,
          product_id: movement.productId,
          type: movement.type,
          qty: movement.qty,
          date: movement.date,
          reason: movement.reason
        }]).then(({ error }) => { if (error) console.error(error); });

        // Update Product Stock in Supabase
        supabase.from('products').update({ stock: p.stock - qtySold }).eq('id', p.id).then();

        return { ...p, stock: p.stock - qtySold };
      }
      return p;
    });
    setProducts(updatedProducts);
    setStockMovements(prev => [...prev, ...newMovements]);

    // 4. Add Finance Transaction (Income)
    if (sale.paymentMethod !== 'FIADO') {
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        type: 'INCOME',
        category: 'Venda',
        amount: sale.total,
        date: new Date().toISOString(),
        description: `Venda #${sale.id.slice(0, 6)}`,
        status: 'PAID'
      };

      await supabase.from('transactions').insert([{
        id: transaction.id,
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
        status: transaction.status
      }]);

      setTransactions(prev => [...prev, transaction]);
    } else {
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        type: 'INCOME',
        category: 'Venda (Fiado)',
        amount: sale.total,
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: `Fiado - ${sale.customerName} #${sale.id.slice(0, 6)}`,
        status: 'PENDING'
      };

      await supabase.from('transactions').insert([{
        id: transaction.id,
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        date: transaction.date,
        due_date: transaction.dueDate,
        description: transaction.description,
        status: transaction.status
      }]);

      setTransactions(prev => [...prev, transaction]);

      // Update Customer Debt if Customer ID is present
      if (sale.customerId) {
        const customer = customers.find(c => c.id === sale.customerId);
        if (customer) {
          const newDebt = customer.debtBalance + sale.total;
          try {
            await updateCustomer({ ...customer, debtBalance: newDebt });
          } catch (error) {
            console.error("Erro ao atualizar dívida do cliente:", error);
            setErrorModal({ open: true, message: "Venda salva, mas erro ao atualizar dívida do cliente." });
          }
        }
      }
    }
  };

  const handleProcessPurchase = async (purchase: any) => {
    // 0. Auto-register Supplier if new
    if (purchase.supplier) {
      const existingSupplier = suppliers.find(s => s.name.toLowerCase() === purchase.supplier.toLowerCase());
      if (!existingSupplier) {
        const newSupplier = {
          name: purchase.supplier,
          active: true
        };
        // We let Supabase generate ID
        const { data: supData, error: supError } = await supabase.from('suppliers').insert([newSupplier]).select().single();

        if (!supError && supData) {
          setSuppliers(prev => [...prev, {
            id: supData.id,
            name: supData.name,
            active: supData.active,
            // map other fields if needed, but they are null/default
          } as Supplier]);
        }
      }
    }

    // 1. Update Stock & Log Movements
    const newMovements: StockMovement[] = [];
    const updatedProducts = products.map(p => {
      const purchasedItem = purchase.items.find((item: any) => item.id === p.id);
      if (purchasedItem) {
        const movement = {
          id: crypto.randomUUID(),
          productId: p.id,
          productName: p.name,
          type: 'ENTRY',
          qty: purchasedItem.qty,
          date: new Date().toISOString(),
          reason: `Compra - ${purchase.supplier}`
        };
        newMovements.push(movement as StockMovement);

        // Save movement
        supabase.from('stock_movements').insert([{
          id: movement.id,
          product_id: movement.productId,
          type: movement.type,
          qty: movement.qty,
          date: movement.date,
          reason: movement.reason
        }]).then();

        // Update Product (including expiry date if provided)
        const productUpdate: any = {
          stock: p.stock + purchasedItem.qty,
          cost_price: purchasedItem.costPrice,
          retail_price: purchasedItem.retailPrice
        };

        // Only update expiry_date if it's provided in the purchase item
        if (purchasedItem.expiryDate) {
          productUpdate.expiry_date = purchasedItem.expiryDate;
        }

        supabase.from('products').update(productUpdate).eq('id', p.id).then();

        return {
          ...p,
          stock: p.stock + purchasedItem.qty,
          costPrice: purchasedItem.costPrice,
          retailPrice: purchasedItem.retailPrice,
          expiryDate: purchasedItem.expiryDate || p.expiryDate
        };
      }
      return p;
    });
    setProducts(updatedProducts);
    setStockMovements(prev => [...prev, ...newMovements]);

    // Prepare items list for transaction history (local only for now as transaction_items table logic is complex)
    const purchaseItems = purchase.items.map((i: any) => ({
      name: i.name,
      code: i.code,
      qty: i.qty,
      costPrice: i.costPrice
    }));

    // 2. Add Expense Transaction(s) (Only if it's a PURCHASE)
    if (purchase.entryType === 'PURCHASE') {
      const numInstallments = purchase.installments || 1;

      if (numInstallments > 1 && purchase.status === 'PENDING') {
        const installmentValue = purchase.total / numInstallments;
        const baseDate = new Date(purchase.dueDate);
        const intervalDays = purchase.installmentInterval || 30;
        const newTransactions: Transaction[] = [];

        for (let i = 0; i < numInstallments; i++) {
          const currentDate = new Date(baseDate);
          currentDate.setDate(baseDate.getDate() + (i * intervalDays));

          const transaction: Transaction = {
            id: crypto.randomUUID(),
            type: 'EXPENSE',
            category: 'Fornecedores (Estoque)',
            amount: installmentValue,
            date: purchase.date,
            dueDate: currentDate.toISOString().split('T')[0],
            description: `Compra - ${purchase.supplier} (Parc ${i + 1}/${numInstallments})`,
            status: 'PENDING',
            items: purchaseItems
          };
          newTransactions.push(transaction);

          // Save to Supabase
          await supabase.from('transactions').insert([{
            id: transaction.id,
            type: transaction.type,
            category: transaction.category,
            amount: transaction.amount,
            date: transaction.date,
            due_date: transaction.dueDate,
            description: transaction.description,
            status: transaction.status
          }]);

          // Save Transaction Items
          if (purchaseItems.length > 0) {
            const itemsToInsert = [];
            for (const item of purchaseItems) {
              const prod = products.find(p => p.code === item.code);
              const purchaseItem = purchase.items.find((pi: any) => pi.code === item.code);
              if (prod) {
                itemsToInsert.push({
                  transaction_id: transaction.id,
                  product_id: prod.id,
                  qty: item.qty,
                  cost_price: item.costPrice,
                  expiry_date: purchaseItem?.expiryDate || null
                });
              }
            }
            if (itemsToInsert.length > 0) {
              await supabase.from('transaction_items').insert(itemsToInsert);
            }
          }
        }
        setTransactions(prev => [...prev, ...newTransactions]);

        // ===== IMPLEMENTAÇÃO PEPS: Criar lotes para cada item comprado =====
        // Usar o ID da primeira transação para vincular os lotes
        const firstTransactionId = newTransactions[0]?.id || '';
        for (const item of purchase.items) {
          await createStockBatch(
            item.id,                    // productId
            firstTransactionId,         // transactionId
            item.qty,                   // quantidade
            item.costPrice,             // preço de custo
            purchase.date,              // data da compra
            item.expiryDate             // data de validade (opcional)
          );
        }

      } else {
        const transaction: Transaction = {
          id: crypto.randomUUID(),
          type: 'EXPENSE',
          category: 'Fornecedores (Estoque)',
          amount: purchase.total,
          date: purchase.date,
          dueDate: purchase.dueDate,
          description: `Compra - ${purchase.supplier} (NF: ${purchase.invoiceNumber})`,
          status: purchase.status,
          items: purchaseItems
        };

        // Save to Supabase
        await supabase.from('transactions').insert([{
          id: transaction.id,
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          date: transaction.date,
          due_date: transaction.dueDate,
          description: transaction.description,
          status: transaction.status
        }]);

        // Save Transaction Items
        if (purchaseItems.length > 0) {
          const itemsToInsert = [];
          for (const item of purchaseItems) {
            const prod = products.find(p => p.code === item.code);
            const purchaseItem = purchase.items.find((pi: any) => pi.code === item.code);
            if (prod) {
              itemsToInsert.push({
                transaction_id: transaction.id,
                product_id: prod.id,
                qty: item.qty,
                cost_price: item.costPrice,
                expiry_date: purchaseItem?.expiryDate || null
              });
            }
          }
          if (itemsToInsert.length > 0) {
            await supabase.from('transaction_items').insert(itemsToInsert);
          }
        }

        setTransactions(prev => [...prev, transaction]);

        // ===== IMPLEMENTAÇÃO PEPS: Criar lotes para cada item comprado =====
        for (const item of purchase.items) {
          await createStockBatch(
            item.id,                    // productId
            transaction.id,             // transactionId
            item.qty,                   // quantidade
            item.costPrice,             // preço de custo
            purchase.date,              // data da compra
            item.expiryDate             // data de validade (opcional)
          );
        }
      }
    } else {
      // Para DONATION, BONUS, ADJUSTMENT - criar lotes sem transação financeira
      for (const item of purchase.items) {
        await createStockBatch(
          item.id,                    // productId
          '',                         // sem transactionId (não há transação financeira)
          item.qty,                   // quantidade
          item.costPrice,             // preço de custo
          purchase.date,              // data da compra
          item.expiryDate             // data de validade (opcional)
        );
      }
    }
  };

  const handleCancelPurchase = async (transactionId: string) => {
    // Find the purchase transaction
    const purchaseTransaction = transactions.find(t => t.id === transactionId);
    if (!purchaseTransaction || !purchaseTransaction.items) {
      setErrorModal({ open: true, message: "Compra não encontrada ou sem itens." });
      return;
    }

    // 1. Revert Stock & Log Movements
    const newMovements: StockMovement[] = [];
    const updatedProducts = products.map(p => {
      const purchasedItem = purchaseTransaction.items?.find((item: any) => item.code === p.code);
      if (purchasedItem) {
        const movement = {
          id: crypto.randomUUID(),
          productId: p.id,
          productName: p.name,
          type: 'EXIT',
          qty: purchasedItem.qty,
          date: new Date().toISOString(),
          reason: `Cancelamento de Compra - ${purchaseTransaction.description}`
        };
        newMovements.push(movement as StockMovement);

        // Save movement to Supabase
        supabase.from('stock_movements').insert([{
          id: movement.id,
          product_id: movement.productId,
          type: movement.type,
          qty: movement.qty,
          date: movement.date,
          reason: movement.reason
        }]).then(({ error }) => { if (error) console.error(error); });

        // Update Product Stock in Supabase
        const newStock = Math.max(0, p.stock - purchasedItem.qty);
        supabase.from('products').update({ stock: newStock }).eq('id', p.id).then();

        return { ...p, stock: newStock };
      }
      return p;
    });
    setProducts(updatedProducts);
    setStockMovements(prev => [...prev, ...newMovements]);

    // 2. Cancel/Delete the original purchase transaction in Supabase
    await supabase.from('transactions').delete().eq('id', transactionId);

    // Delete transaction items
    await supabase.from('transaction_items').delete().eq('transaction_id', transactionId);

    // 3. Se houver transações de parcelas relacionadas, exclua-as também
    // Corresponde apenas a transações com a mesma descrição base exata (antes das informações da parcela)
    const baseDescription = purchaseTransaction.description.includes('(')
      ? purchaseTransaction.description.split('(')[0].trim()
      : purchaseTransaction.description;

    const relatedTransactions = transactions.filter(t =>
      t.id !== transactionId &&
      t.type === 'EXPENSE' &&
      (t.category.includes('Fornecedores') || t.category.includes('Estoque')) &&
      !t.category.includes('Cancelamento') &&
      t.description.startsWith(baseDescription) &&
      (t.description === baseDescription || t.description.includes(`${baseDescription} (`))
    );

    for (const relTrans of relatedTransactions) {
      await supabase.from('transactions').delete().eq('id', relTrans.id);
      await supabase.from('transaction_items').delete().eq('transaction_id', relTrans.id);
    }

    // 4. Create cancellation audit transaction
    const cancellationTransaction: Transaction = {
      id: crypto.randomUUID(),
      type: 'INCOME',
      category: 'Cancelamento de Compra',
      amount: purchaseTransaction.amount,
      date: new Date().toISOString(),
      description: `Cancelamento: ${purchaseTransaction.description}`,
      status: 'PAID'
    };

    await supabase.from('transactions').insert([{
      id: cancellationTransaction.id,
      type: cancellationTransaction.type,
      category: cancellationTransaction.category,
      amount: cancellationTransaction.amount,
      date: cancellationTransaction.date,
      description: cancellationTransaction.description,
      status: cancellationTransaction.status
    }]);

    // 5. Update local state
    setTransactions(prev => [
      ...prev.filter(t => t.id !== transactionId && !relatedTransactions.find(rt => rt.id === t.id)),
      cancellationTransaction
    ]);
  };

  const handleCashMovement = (type: 'INCOME' | 'EXPENSE', amount: number, description: string) => {
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      category: type === 'INCOME' ? 'Reforço de Caixa' : 'Sangria de Caixa',
      amount,
      date: new Date().toISOString(),
      description,
      status: 'PAID'
    };

    setTransactions(prev => [...prev, newTransaction]);
    supabase.from('transactions').insert([{
      id: newTransaction.id,
      type: newTransaction.type,
      category: newTransaction.category,
      amount: newTransaction.amount,
      date: newTransaction.date,
      description: newTransaction.description,
      status: newTransaction.status
    }]).then(({ error }) => { if (error) console.error(error); });
  };

  const handleReturnItems = (saleId: string, itemsToReturn: { itemId: string, qty: number }[]) => {
    const saleSnapshot = sales.find(s => s.id === saleId);
    if (!saleSnapshot) return;

    let refundTotal = 0;
    itemsToReturn.forEach(r => {
      const item = saleSnapshot.items.find(i => (i.cartItemId || i.id) === r.itemId);
      if (item) refundTotal += (item.appliedPrice * r.qty);
    });

    const productQtyReturned: Record<string, number> = {};
    const newMovements: StockMovement[] = [];

    itemsToReturn.forEach(r => {
      const item = saleSnapshot.items.find(i => (i.cartItemId || i.id) === r.itemId);
      if (item) {
        productQtyReturned[item.id] = (productQtyReturned[item.id] || 0) + r.qty;
      }
    });

    setProducts(prevProducts => prevProducts.map(p => {
      const qtyToReturn = productQtyReturned[p.id];
      if (qtyToReturn) {
        newMovements.push({
          id: crypto.randomUUID(),
          productId: p.id,
          productName: p.name,
          type: 'ENTRY',
          qty: qtyToReturn,
          date: new Date().toISOString(),
          reason: `Devolução Venda #${saleId.slice(0, 6)}`
        });
        return { ...p, stock: p.stock + qtyToReturn };
      }
      return p;
    }));
    setStockMovements(prev => [...prev, ...newMovements]);

    // Save movements to Supabase
    if (newMovements.length > 0) {
      const movementsToInsert = newMovements.map(m => ({
        id: m.id,
        product_id: m.productId,
        type: m.type,
        qty: m.qty,
        date: m.date,
        reason: m.reason
      }));
      supabase.from('stock_movements').insert(movementsToInsert).then(({ error }) => { if (error) console.error(error); });

      // Update products stock in Supabase
      newMovements.forEach(m => {
        const p = products.find(prod => prod.id === m.productId);
        if (p) {
          supabase.from('products').update({ stock: p.stock + m.qty }).eq('id', p.id).then();
        }
      });
    }

    setSales(prevSales => {
      const saleIndex = prevSales.findIndex(s => s.id === saleId);
      if (saleIndex === -1) return prevSales;
      const sale = prevSales[saleIndex];
      const updatedItems = sale.items.map(item => {
        const returnData = itemsToReturn.find(r => r.itemId === (item.cartItemId || item.id));
        if (returnData) {
          const newQty = Math.max(0, item.qty - returnData.qty);
          return { ...item, qty: newQty, subtotal: newQty * item.appliedPrice };
        }
        return item;
      }).filter(item => item.qty > 0);

      const newSales = [...prevSales];
      if (updatedItems.length === 0) {
        newSales[saleIndex] = { ...sale, status: 'CANCELED', total: 0, items: [] };
      } else {
        newSales[saleIndex] = { ...sale, items: updatedItems, total: Math.max(0, sale.total - refundTotal) };
      }
      return newSales;
    });

    if (refundTotal > 0 && saleSnapshot.paymentMethod !== 'FIADO') {
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        type: 'EXPENSE',
        category: 'Devolução / Reembolso',
        amount: refundTotal,
        date: new Date().toISOString(),
        description: `Devolução Venda #${saleId.slice(0, 6)}`,
        status: 'PAID'
      };
      setTransactions(prev => [...prev, transaction]);

      // Save transaction to Supabase
      supabase.from('transactions').insert([{
        id: transaction.id,
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
        status: transaction.status
      }]).then(({ error }) => { if (error) console.error(error); });
    }
  };

  const handleVoidSale = async (saleId: string) => {
    const saleToVoid = sales.find(s => s.id === saleId);
    if (!saleToVoid) return;

    // 1. Update sale status in Supabase
    const { error: saleError } = await supabase
      .from('sales')
      .update({ status: 'CANCELED' })
      .eq('id', saleId);

    if (saleError) {
      setErrorModal({ open: true, message: "Erro ao cancelar venda: " + saleError.message });
      return;
    }

    // 2. Update local state
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: 'CANCELED' } : s));

    // 3. Restore stock
    const productQtyRestored: Record<string, number> = {};
    const newMovements: StockMovement[] = [];

    saleToVoid.items.forEach(item => {
      productQtyRestored[item.id] = (productQtyRestored[item.id] || 0) + item.qty;
    });

    setProducts(prevProducts => prevProducts.map(p => {
      const qty = productQtyRestored[p.id];
      if (qty) {
        const movement = {
          id: crypto.randomUUID(),
          productId: p.id,
          productName: p.name,
          type: 'ENTRY',
          qty: qty,
          date: new Date().toISOString(),
          reason: `Estorno Venda #${saleToVoid.id.slice(0, 6)}`
        };
        newMovements.push(movement as StockMovement);

        // Save movement to Supabase
        supabase.from('stock_movements').insert([{
          id: movement.id,
          product_id: movement.productId,
          type: movement.type,
          qty: movement.qty,
          date: movement.date,
          reason: movement.reason
        }]).then(({ error }) => { if (error) console.error(error); });

        // Update product stock in Supabase
        supabase.from('products').update({ stock: p.stock + qty }).eq('id', p.id).then();

        return { ...p, stock: p.stock + qty };
      }
      return p;
    }));
    setStockMovements(prev => [...prev, ...newMovements]);

    // 4. Create refund transaction
    if (saleToVoid.paymentMethod !== 'FIADO') {
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        type: 'EXPENSE',
        category: 'Estorno Completo',
        amount: saleToVoid.total,
        date: new Date().toISOString(),
        description: `Estorno Venda #${saleToVoid.id.slice(0, 6)}`,
        status: 'PAID'
      };

      // Save to Supabase
      await supabase.from('transactions').insert([{
        id: transaction.id,
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
        status: transaction.status
      }]);

      setTransactions(prev => [...prev, transaction]);
    } else {
      // Remove pending fiado transaction
      const transactionToRemove = transactions.find(t => t.description.includes(saleToVoid.id.slice(0, 6)));
      if (transactionToRemove) {
        await supabase.from('transactions').delete().eq('id', transactionToRemove.id);
      }
      setTransactions(prev => prev.filter(t => !t.description.includes(saleToVoid.id.slice(0, 6))));
    }
  };

  const handleAddTransaction = async (t: Transaction) => {
    const { error } = await supabase
      .from('transactions')
      .insert([{
        id: t.id,
        type: t.type,
        category: t.category,
        amount: t.amount,
        date: t.date,
        due_date: t.dueDate,
        description: t.description,
        status: t.status
      }]);

    if (error) {
      setErrorModal({ open: true, message: "Erro ao criar transação: " + error.message });
    } else {
      setTransactions(prev => [...prev, t]);
    }
  };

  const handleUpdateTransactionStatus = async (id: string, status: 'PAID' | 'PENDING') => {
    const { error } = await supabase
      .from('transactions')
      .update({ status })
      .eq('id', id);

    if (error) {
      setErrorModal({ open: true, message: "Erro ao atualizar status: " + error.message });
    } else {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Excluir este lançamento financeiro?')) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        setErrorModal({ open: true, message: "Erro ao excluir transação: " + error.message });
      } else {
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
    }
  };

  // -- USER ACTIONS --
  const handleAddUser = async (u: User) => {
    // 1. Sign Up in Supabase Auth
    if (u.password) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: u.email,
        password: u.password,
        options: {
          data: {
            name: u.name,
            role: u.role
          }
        }
      });

      if (authError) {
        let errorMsg = authError.message;

        // Tradução de erros comuns do Supabase
        if (errorMsg.includes("Email address") && errorMsg.includes("is invalid")) {
          const emailMatch = errorMsg.match(/"([^"]+)"/);
          const email = emailMatch ? emailMatch[1] : "fornecido";
          errorMsg = `O e-mail "${email}" é inválido.`;
        } else if (errorMsg.includes("Password should be at least")) {
          errorMsg = "A senha deve ter pelo menos 6 caracteres.";
        } else if (errorMsg.includes("User already registered")) {
          errorMsg = "Este usuário já está cadastrado.";
        }

        setErrorModal({ open: true, message: "Erro ao criar login: " + errorMsg });
        return;
      }

      if (authData.user) {
        // 2. Insert into Public Users Table using Auth ID
        const { error: dbError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id, // Use the ID from Auth
            name: u.name,
            email: u.email,
            role: u.role
          }]);

        if (dbError) {
          setErrorModal({ open: true, message: "Login criado, mas erro ao salvar dados públicos: " + dbError.message });
        } else {
          setSuccessModal({ open: true, message: "Usuário criado com sucesso! O sistema pode ter logado automaticamente na nova conta." });
          // Reload users to ensure consistency
          fetchUsers();
        }
      }
    } else {
      // Fallback for users without password (should not happen with new form)
      const { error } = await supabase
        .from('users')
        .insert([{
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role
        }]);

      if (error) {
        setErrorModal({ open: true, message: "Erro ao adicionar usuário: " + error.message });
      } else {
        setAllUsers(prev => [...prev, u]);
      }
    }
  };

  const handleUpdateUser = async (u: User) => {
    const { error } = await supabase
      .from('users')
      .update({
        name: u.name,
        email: u.email,
        role: u.role
      })
      .eq('id', u.id);

    if (error) {
      setErrorModal({ open: true, message: "Erro ao atualizar usuário: " + error.message });
    } else {
      setAllUsers(prev => prev.map(curr => curr.id === u.id ? u : curr));
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === user?.id) {
      setErrorModal({ open: true, message: "Você não pode excluir a si mesmo!" });
      return;
    }
    // Confirmation is now handled in UI
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      let msg = error.message;
      if (msg.includes("violates foreign key constraint")) {
        msg = "Não é possível excluir este usuário pois ele possui registros vinculados (vendas, etc).";
      }
      setErrorModal({ open: true, message: "Erro ao excluir usuário: " + msg });
    } else {
      setAllUsers(prev => prev.filter(u => u.id !== id));
      setSuccessModal({ open: true, message: "Usuário excluído com sucesso!" });
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
          onProcessSale={handleProcessSale}
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
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onStockAdjustment={handleStockAdjustment}
          onNavigate={setCurrentView}
        />;
      case 'finance':
        return <Finance transactions={transactions} onAddTransaction={handleAddTransaction} onUpdateStatus={handleUpdateTransactionStatus} onDeleteTransaction={handleDeleteTransaction} onNavigate={setCurrentView} />;
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
          onVoidSale={handleVoidSale}
          onReturnItems={handleReturnItems}
          onNavigateToAdvancedReports={() => setCurrentView('advanced-reports')}
        />;
      case 'advanced-reports':
        return <AdvancedReports sales={sales} products={products} />;
      case 'users':
        return <Users users={allUsers} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} userRole={currentUserRole} />;
      case 'purchases':
        return <Purchases products={products} currentUser={user} onProcessPurchase={handleProcessPurchase} transactions={transactions} onCancelPurchase={handleCancelPurchase} onBack={() => setCurrentView('dashboard')} suppliersList={suppliers.map(s => s.name)} />;
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
          onAddPromotion={handleAddPromotion}
          onUpdatePromotion={handleUpdatePromotion}
          onDeletePromotion={handleDeletePromotion}
          onAddKit={handleAddKit}
          onUpdateKit={handleUpdateKit}
          onDeleteKit={handleDeleteKit}
          userRole={currentUserRole}
        />
      case 'customers':
        return <Customers
          customers={customers}
          onAddCustomer={handleAddCustomer}
          onUpdateCustomer={handleUpdateCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          onPayDebt={handlePayDebt}
          onNavigate={setCurrentView}
        />;
      case 'suppliers':
        return <Suppliers
          suppliers={suppliers}
          onAddSupplier={handleAddSupplier}
          onUpdateSupplier={handleUpdateSupplier}
          onDeleteSupplier={handleDeleteSupplier}
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
