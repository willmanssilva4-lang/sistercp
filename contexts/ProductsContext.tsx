import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, ProductKit, Promotion, StockMovement } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useFinance } from './FinanceContext';
import { usePeople } from './PeopleContext';
import { createStockBatch } from '../src/utils/pepsUtils';

interface ProductsContextType {
  products: Product[];
  kits: ProductKit[];
  promotions: Promotion[];
  stockMovements: StockMovement[];
  loading: boolean;
  addProduct: (p: Product) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (productId: string, type: 'ENTRY' | 'EXIT', qty: number, reason: string) => Promise<void>;
  addKit: (k: ProductKit) => Promise<void>;
  updateKit: (k: ProductKit) => Promise<void>;
  deleteKit: (id: string) => Promise<void>;
  addPromotion: (p: Promotion) => Promise<void>;
  updatePromotion: (p: Promotion) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
  processPurchase: (purchase: any) => Promise<void>;
  cancelPurchase: (transactionId: string) => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [kits, setKits] = useState<ProductKit[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const { addTransaction, transactions, deleteTransaction } = useFinance();
  const { suppliers, addSupplier } = usePeople();

  // Initial Data Load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProducts(),
      fetchKits(),
      fetchPromotions(),
      fetchStockMovements()
    ]);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error("Erro ao carregar produtos:", error);
      return;
    }
    if (data) {
      const mappedProducts: Product[] = data.map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        category: p.category,
        subcategory: p.subcategory,
        brand: p.brand,
        supplier: p.supplier,
        unit: p.unit,
        costPrice: Number(p.cost_price),
        retailPrice: Number(p.retail_price),
        wholesalePrice: Number(p.wholesale_price),
        wholesaleMinQty: Number(p.wholesale_min_qty),
        stock: Number(p.stock),
        minStock: Number(p.min_stock),
        expiryDate: p.expiry_date
      }));
      setProducts(mappedProducts);
    }
  };

  const fetchKits = async () => {
    const { data: kitsData, error } = await supabase.from('product_kits').select('*');
    if (error) {
      console.error("Erro ao carregar kits:", error);
      return;
    }
    if (kitsData) {
      const kitsWithItems = await Promise.all(kitsData.map(async (kit: any) => {
        const { data: itemsData } = await supabase
          .from('product_kit_items')
          .select('*')
          .eq('kit_id', kit.id);

        const items = itemsData ? await Promise.all(itemsData.map(async (item: any) => {
          const { data: prod } = await supabase
            .from('products')
            .select('code')
            .eq('id', item.product_id)
            .single();
          return {
            productCode: prod?.code || '',
            qty: Number(item.qty)
          };
        })) : [];

        return {
          id: kit.id,
          name: kit.name,
          code: kit.code,
          price: Number(kit.price),
          active: kit.active,
          items: items
        };
      }));
      setKits(kitsWithItems);
    }
  };

  const fetchPromotions = async () => {
    const { data: promosData, error } = await supabase.from('promotions').select('*');
    if (error) {
      console.error("Erro ao carregar promoções:", error);
      return;
    }
    if (promosData) {
      const mappedPromos = await Promise.all(promosData.map(async (p: any) => {
        let productCode = '';
        if (p.product_id) {
          const { data: prod } = await supabase
            .from('products')
            .select('code')
            .eq('id', p.product_id)
            .single();
          productCode = prod?.code || '';
        }
        return {
          id: p.id,
          name: p.name,
          type: p.type,
          productCode: productCode,
          promotionalPrice: Number(p.promotional_price),
          startDate: p.start_date,
          endDate: p.end_date,
          active: p.active
        };
      }));
      setPromotions(mappedPromos);
    }
  };

  const fetchStockMovements = async () => {
    const { data, error } = await supabase.from('stock_movements').select('*').order('date', { ascending: true });
    if (error) {
      console.error("Erro ao carregar movimentações:", error);
      return;
    }
    if (data) {
      // We need product names, but products might not be loaded yet if this runs in parallel.
      // Ideally we fetch products first. But for now let's rely on the fact that we can map later or fetch here.
      // To be safe, let's fetch product name for each movement if needed, or just map IDs.
      // The original code used `products.find` which relies on products state.
      // Here we can just map what we have.
      setStockMovements(data.map((m: any) => ({
        id: m.id,
        productId: m.product_id,
        productName: 'Carregando...', // Will be updated by UI or we can fetch.
        type: m.type,
        qty: Number(m.qty),
        date: m.date,
        reason: m.reason
      })));
    }
  };

  // Actions
  const addProduct = async (p: Product) => {
    const dbProduct = {
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      brand: p.brand,
      supplier: p.supplier,
      unit: p.unit,
      cost_price: p.costPrice,
      retail_price: p.retailPrice,
      wholesale_price: p.wholesalePrice,
      wholesale_min_qty: p.wholesaleMinQty,
      stock: p.stock,
      min_stock: p.minStock,
      expiry_date: p.expiryDate || null
    };

    const { error } = await supabase.from('products').insert([dbProduct]);
    if (error) throw error;
    setProducts(prev => [...prev, p]);
  };

  const updateProduct = async (p: Product) => {
    // Log Stock Adjustment if changed
    const oldProduct = products.find(curr => curr.id === p.id);
    if (oldProduct && oldProduct.stock !== p.stock) {
      const diff = p.stock - oldProduct.stock;
      const movement: StockMovement = {
        id: crypto.randomUUID(),
        productId: p.id,
        productName: p.name,
        type: diff > 0 ? 'ENTRY' : 'EXIT',
        qty: Math.abs(diff),
        date: new Date().toISOString(),
        reason: 'Ajuste Manual de Estoque (Edição)'
      };

      await supabase.from('stock_movements').insert([{
        id: movement.id,
        product_id: movement.productId,
        type: movement.type,
        qty: movement.qty,
        date: movement.date,
        reason: movement.reason
      }]);

      setStockMovements(prev => [...prev, movement]);
    }

    const dbProduct = {
      code: p.code,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      brand: p.brand,
      supplier: p.supplier,
      unit: p.unit,
      cost_price: p.costPrice,
      retail_price: p.retailPrice,
      wholesale_price: p.wholesalePrice,
      wholesale_min_qty: p.wholesaleMinQty,
      stock: p.stock,
      min_stock: p.minStock,
      expiry_date: p.expiryDate || null
    };

    const { error } = await supabase.from('products').update(dbProduct).eq('id', p.id);
    if (error) throw error;

    setProducts(prev => prev.map(curr => curr.id === p.id ? p : curr));
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const adjustStock = async (productId: string, type: 'ENTRY' | 'EXIT', qty: number, reason: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    let newStock = product.stock;
    if (type === 'ENTRY') newStock += qty;
    else newStock = Math.max(0, product.stock - qty);

    const movement: StockMovement = {
      id: crypto.randomUUID(),
      productId: productId,
      productName: product.name,
      type: type,
      qty: qty,
      date: new Date().toISOString(),
      reason: reason || 'Ajuste Manual'
    };

    await supabase.from('stock_movements').insert([{
      id: movement.id,
      product_id: movement.productId,
      type: movement.type,
      qty: movement.qty,
      date: movement.date,
      reason: movement.reason
    }]);

    await supabase.from('products').update({ stock: newStock }).eq('id', productId);

    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    setStockMovements(prev => [...prev, movement]);
  };

  const addKit = async (k: ProductKit) => {
    const { error } = await supabase.from('product_kits').insert([{
      id: k.id,
      name: k.name,
      code: k.code,
      price: k.price,
      active: k.active
    }]);
    if (error) throw error;

    const itemsToInsert = [];
    for (const item of k.items) {
      const prod = products.find(p => p.code === item.productCode);
      if (prod) {
        itemsToInsert.push({
          kit_id: k.id,
          product_id: prod.id,
          qty: item.qty
        });
      }
    }

    if (itemsToInsert.length > 0) {
      await supabase.from('product_kit_items').insert(itemsToInsert);
    }
    setKits(prev => [...prev, k]);
  };

  const updateKit = async (k: ProductKit) => {
    const { error } = await supabase.from('product_kits').update({
      name: k.name,
      code: k.code,
      price: k.price,
      active: k.active
    }).eq('id', k.id);
    if (error) throw error;

    await supabase.from('product_kit_items').delete().eq('kit_id', k.id);

    const itemsToInsert = [];
    for (const item of k.items) {
      const prod = products.find(p => p.code === item.productCode);
      if (prod) {
        itemsToInsert.push({
          kit_id: k.id,
          product_id: prod.id,
          qty: item.qty
        });
      }
    }

    if (itemsToInsert.length > 0) {
      await supabase.from('product_kit_items').insert(itemsToInsert);
    }
    setKits(prev => prev.map(curr => curr.id === k.id ? k : curr));
  };

  const deleteKit = async (id: string) => {
    const { error } = await supabase.from('product_kits').delete().eq('id', id);
    if (error) throw error;
    setKits(prev => prev.filter(k => k.id !== id));
  };

  const addPromotion = async (p: Promotion) => {
    const prod = products.find(prod => prod.code === p.productCode);
    const dbPromo = {
      id: p.id,
      name: p.name,
      type: p.type,
      product_id: prod ? prod.id : null,
      promotional_price: p.promotionalPrice,
      start_date: p.startDate,
      end_date: p.endDate,
      active: p.active
    };
    const { error } = await supabase.from('promotions').insert([dbPromo]);
    if (error) throw error;
    setPromotions(prev => [...prev, p]);
  };

  const updatePromotion = async (p: Promotion) => {
    const prod = products.find(prod => prod.code === p.productCode);
    const dbPromo = {
      name: p.name,
      type: p.type,
      product_id: prod ? prod.id : null,
      promotional_price: p.promotionalPrice,
      start_date: p.startDate,
      end_date: p.endDate,
      active: p.active
    };
    const { error } = await supabase.from('promotions').update(dbPromo).eq('id', p.id);
    if (error) throw error;
    setPromotions(prev => prev.map(curr => curr.id === p.id ? p : curr));
  };

  const deletePromotion = async (id: string) => {
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) throw error;
    setPromotions(prev => prev.filter(p => p.id !== id));
  };

  const processPurchase = async (purchase: any) => {
    // 0. Auto-register Supplier if new
    if (purchase.supplier) {
      const existingSupplier = suppliers.find(s => s.name.toLowerCase() === purchase.supplier.toLowerCase());
      if (!existingSupplier) {
        await addSupplier({
          id: crypto.randomUUID(),
          name: purchase.supplier,
          active: true,
          cnpj: '', phone: '', email: '', address: '', contactPerson: '', paymentTerms: '', notes: ''
        });
      }
    }

    // 1. Update Stock & Log Movements
    for (const item of purchase.items) {
      await adjustStock(item.id, 'ENTRY', item.qty, `Compra - ${purchase.supplier}`);

      // Update price and expiry
      const productUpdate: any = {
        cost_price: item.costPrice,
        retail_price: item.retailPrice
      };
      if (item.expiryDate) productUpdate.expiry_date = item.expiryDate;
      await supabase.from('products').update(productUpdate).eq('id', item.id);
    }

    // 2. Add Expense Transaction(s)
    if (purchase.entryType === 'PURCHASE') {
      const purchaseItems = purchase.items.map((i: any) => ({
        name: i.name,
        code: i.code,
        qty: i.qty,
        costPrice: i.costPrice
      }));

      const numInstallments = purchase.installments || 1;
      const installmentValue = purchase.total / numInstallments;
      const baseDate = new Date(purchase.dueDate || purchase.date);
      const intervalDays = purchase.installmentInterval || 30;

      for (let i = 0; i < numInstallments; i++) {
        const currentDate = new Date(baseDate);
        currentDate.setDate(baseDate.getDate() + (i * intervalDays));

        const transactionId = crypto.randomUUID();
        await addTransaction({
          id: transactionId,
          type: 'EXPENSE',
          category: 'Fornecedores (Estoque)',
          amount: installmentValue,
          date: purchase.date,
          dueDate: currentDate.toISOString().split('T')[0],
          description: `Compra - ${purchase.supplier}${numInstallments > 1 ? ` (Parc ${i + 1}/${numInstallments})` : ''}`,
          status: purchase.status || 'PENDING',
          items: purchaseItems
        });

        // Save Transaction Items to Supabase (manual for now as addTransaction doesn't handle items)
        const itemsToInsert = purchase.items.map((item: any) => ({
          transaction_id: transactionId,
          product_id: item.id,
          qty: item.qty,
          cost_price: item.costPrice,
          expiry_date: item.expiryDate || null
        }));
        await supabase.from('transaction_items').insert(itemsToInsert);

        // PEPS Batches (only for the first transaction or if not installment)
        if (i === 0) {
          for (const item of purchase.items) {
            await createStockBatch(item.id, transactionId, item.qty, item.costPrice, purchase.date, item.expiryDate);
          }
        }
      }
    } else {
      // DONATION, etc.
      for (const item of purchase.items) {
        await createStockBatch(item.id, '', item.qty, item.costPrice, purchase.date, item.expiryDate);
      }
    }

    await refreshProducts();
  };

  const cancelPurchase = async (transactionId: string) => {
    const purchaseTransaction = transactions.find(t => t.id === transactionId);
    if (!purchaseTransaction || !purchaseTransaction.items) return;

    // 1. Revert Stock
    for (const item of purchaseTransaction.items) {
      const prod = products.find(p => p.code === item.code);
      if (prod) {
        await adjustStock(prod.id, 'EXIT', item.qty, `Cancelamento Compra - ${purchaseTransaction.description}`);
      }
    }

    // 2. Delete Transactions
    await deleteTransaction(transactionId);

    // Handle related installments
    const baseDescription = purchaseTransaction.description.includes('(')
      ? purchaseTransaction.description.split('(')[0].trim()
      : purchaseTransaction.description;

    const related = transactions.filter(t =>
      t.id !== transactionId &&
      t.description.startsWith(baseDescription)
    );
    for (const r of related) await deleteTransaction(r.id);

    await refreshProducts();
  };

  return (
    <ProductsContext.Provider value={{
      products, kits, promotions, stockMovements, loading,
      addProduct, updateProduct, deleteProduct, adjustStock,
      addKit, updateKit, deleteKit,
      addPromotion, updatePromotion, deletePromotion,
      refreshProducts: fetchData
    }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};
