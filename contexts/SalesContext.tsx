import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Sale, Transaction, StockMovement } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useProducts } from './ProductsContext';
import { useFinance } from './FinanceContext';
import { usePeople } from './PeopleContext';

interface SalesContextType {
    sales: Sale[];
    loading: boolean;
    addSale: (sale: Sale) => Promise<void>;
    voidSale: (saleId: string) => Promise<void>;
    returnItems: (saleId: string, itemsToReturn: { itemId: string, qty: number }[]) => Promise<void>;
    refreshSales: () => Promise<void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const { products, kits, adjustStock } = useProducts();
    const { addTransaction, transactions, deleteTransaction } = useFinance();
    const { customers, updateCustomer } = usePeople();

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        setLoading(true);
        const { data: salesData, error } = await supabase.from('sales').select('*');
        if (error) {
            console.error("Erro ao carregar vendas:", error);
            setLoading(false);
            return;
        }

        if (salesData) {
            const salesWithItems = await Promise.all(salesData.map(async (sale: any) => {
                const { data: itemsData } = await supabase
                    .from('sale_items')
                    .select('*')
                    .eq('sale_id', sale.id);

                const items = itemsData ? await Promise.all(itemsData.map(async (item: any) => {
                    const { data: prod } = await supabase
                        .from('products')
                        .select('code, name, retail_price, cost_price')
                        .eq('id', item.product_id)
                        .single();

                    return {
                        id: item.product_id,
                        cartItemId: item.id,
                        code: prod?.code || '',
                        name: prod?.name || 'Produto Desconhecido',
                        qty: Number(item.qty),
                        appliedPrice: Number(item.applied_price),
                        subtotal: Number(item.subtotal),
                        unit: 'UN',
                        costPrice: Number(prod?.cost_price || 0),
                        retailPrice: Number(prod?.retail_price || item.applied_price),
                        wholesalePrice: 0,
                        wholesaleMinQty: 0,
                        stock: 0,
                        minStock: 0
                    };
                })) : [];

                return {
                    id: sale.id,
                    timestamp: sale.timestamp,
                    cashierId: sale.cashier_id,
                    customerName: sale.customer_name,
                    total: Number(sale.total),
                    paymentMethod: sale.payment_method,
                    status: sale.status,
                    items: items
                };
            }));
            setSales(salesWithItems);
        }
        setLoading(false);
    };

    const addSale = async (sale: Sale) => {
        // 0. Ensure User Exists in Public Table
        if (sale.cashierId) {
            const { error: userCheckError } = await supabase
                .from('users')
                .select('id')
                .eq('id', sale.cashierId)
                .single();

            if (userCheckError && userCheckError.code === 'PGRST116') {
                await supabase.from('users').insert([{
                    id: sale.cashierId,
                    name: 'Caixa',
                    email: 'caixa@sistema',
                    role: 'CASHIER'
                }]);
            }
        }

        // 1. Insert Sale
        const { error: saleError } = await supabase.from('sales').insert([{
            id: sale.id,
            timestamp: sale.timestamp,
            cashier_id: sale.cashierId,
            customer_name: sale.customerName,
            total: sale.total,
            payment_method: sale.paymentMethod,
            status: sale.status
        }]);

        if (saleError) throw saleError;

        // 2. Insert Items
        // 2. Insert Items
        const itemsToInsert = [];

        for (const item of sale.items) {
            // Check if item is a Kit
            const kitDef = kits.find(k => k.code === item.code) || kits.find(k => k.id === item.id);

            if (kitDef) {
                // Explode Kit into components for DB storage (to satisfy FK constraints and track component sales)
                let totalComponentRetail = 0;

                // Calculate total retail value of components for weighting
                const kitComponents = kitDef.items.map(ki => {
                    const prod = products.find(p => p.code === ki.productCode);
                    const retail = prod?.retailPrice || 0;
                    totalComponentRetail += (retail * ki.qty);
                    return { ...ki, retail, prodId: prod?.id };
                });

                const kitPrice = item.appliedPrice; // The price the kit was sold for (unit price)

                for (const comp of kitComponents) {
                    if (!comp.prodId) continue; // Skip if product not found

                    // Calculate proportional price for this component
                    let compPrice = 0;
                    if (totalComponentRetail > 0) {
                        const weight = (comp.retail * comp.qty) / totalComponentRetail;
                        compPrice = (kitPrice * weight) / comp.qty;
                    } else {
                        // Fallback if retail prices are 0
                        compPrice = (kitPrice / kitComponents.length) / comp.qty;
                    }

                    itemsToInsert.push({
                        sale_id: sale.id,
                        product_id: comp.prodId,
                        qty: comp.qty * item.qty, // Component Qty * Kit Qty
                        applied_price: compPrice,
                        subtotal: compPrice * (comp.qty * item.qty)
                    });
                }
            } else {
                // Normal Product
                itemsToInsert.push({
                    sale_id: sale.id,
                    product_id: item.id,
                    qty: item.qty,
                    applied_price: item.appliedPrice,
                    subtotal: item.subtotal
                });
            }
        }

        const { error: itemsError } = await supabase.from('sale_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        // 3. Update Stock & Log Movements
        for (const item of sale.items) {
            const kitDef = kits.find(k => k.code === item.code);
            if (kitDef) {
                for (const kitItem of kitDef.items) {
                    const prod = products.find(p => p.code === kitItem.productCode);
                    if (prod) {
                        await adjustStock(prod.id, 'EXIT', kitItem.qty * item.qty, `Venda Kit #${sale.id.slice(0, 6)}`);
                    }
                }
            } else {
                await adjustStock(item.id, 'EXIT', item.qty, `Venda #${sale.id.slice(0, 6)}`);
            }
        }

        // 4. Add Finance Transaction
        if (sale.paymentMethod !== 'FIADO') {
            await addTransaction({
                id: crypto.randomUUID(),
                type: 'INCOME',
                category: 'Venda',
                amount: sale.total,
                date: new Date().toISOString(),
                description: `Venda #${sale.id.slice(0, 6)}`,
                status: 'PAID'
            });
        } else {
            await addTransaction({
                id: crypto.randomUUID(),
                type: 'INCOME',
                category: 'Venda (Fiado)',
                amount: sale.total,
                date: new Date().toISOString(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                description: `Fiado - ${sale.customerName} #${sale.id.slice(0, 6)}`,
                status: 'PENDING'
            });

            // Update Customer Debt
            if (sale.customerId) {
                const customer = customers.find(c => c.id === sale.customerId);
                if (customer) {
                    await updateCustomer({ ...customer, debtBalance: customer.debtBalance + sale.total });
                }
            }
        }

        setSales(prev => [...prev, sale]);
    };

    const voidSale = async (saleId: string) => {
        const saleToVoid = sales.find(s => s.id === saleId);
        if (!saleToVoid) return;

        // 1. Update status
        const { error } = await supabase.from('sales').update({ status: 'CANCELED' }).eq('id', saleId);
        if (error) throw error;

        // 2. Restore Stock
        for (const item of saleToVoid.items) {
            await adjustStock(item.id, 'ENTRY', item.qty, `Estorno Venda #${saleToVoid.id.slice(0, 6)}`);
        }

        // 3. Handle Finance
        if (saleToVoid.paymentMethod !== 'FIADO') {
            await addTransaction({
                id: crypto.randomUUID(),
                type: 'EXPENSE',
                category: 'Estorno Completo',
                amount: saleToVoid.total,
                date: new Date().toISOString(),
                description: `Estorno Venda #${saleToVoid.id.slice(0, 6)}`,
                status: 'PAID'
            });
        } else {
            const transactionToRemove = transactions.find(t => t.description.includes(saleToVoid.id.slice(0, 6)));
            if (transactionToRemove) {
                await deleteTransaction(transactionToRemove.id);
            }
        }

        setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: 'CANCELED' } : s));
    };

    const returnItems = async (saleId: string, itemsToReturn: { itemId: string, qty: number }[]) => {
        const saleSnapshot = sales.find(s => s.id === saleId);
        if (!saleSnapshot) return;

        let refundTotal = 0;
        for (const r of itemsToReturn) {
            const item = saleSnapshot.items.find(i => (i.cartItemId || i.id) === r.itemId);
            if (item) {
                refundTotal += (item.appliedPrice * r.qty);
                await adjustStock(item.id, 'ENTRY', r.qty, `Devolução Venda #${saleId.slice(0, 6)}`);
            }
        }

        if (refundTotal > 0 && saleSnapshot.paymentMethod !== 'FIADO') {
            await addTransaction({
                id: crypto.randomUUID(),
                type: 'EXPENSE',
                category: 'Devolução / Reembolso',
                amount: refundTotal,
                date: new Date().toISOString(),
                description: `Devolução Venda #${saleId.slice(0, 6)}`,
                status: 'PAID'
            });
        }

        // Update local state (simplified: refresh from DB or update manually)
        await fetchSales();
    };

    return (
        <SalesContext.Provider value={{ sales, loading, addSale, voidSale, returnItems, refreshSales: fetchSales }}>
            {children}
        </SalesContext.Provider>
    );
};

export const useSales = () => {
    const context = useContext(SalesContext);
    if (context === undefined) {
        throw new Error('useSales must be used within a SalesProvider');
    }
    return context;
};
