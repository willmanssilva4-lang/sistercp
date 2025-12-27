import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Sale, Transaction, StockMovement } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useProducts } from './ProductsContext';

interface SalesContextType {
    sales: Sale[];
    loading: boolean;
    addSale: (sale: Sale) => Promise<void>;
    voidSale: (saleId: string) => Promise<void>;
    refreshSales: () => Promise<void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const { products, adjustStock } = useProducts(); // Dependency on Products

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
        const itemsToInsert = await Promise.all(sale.items.map(async (item) => {
            // We need product_id. We have item.id which IS product_id in the cart logic of App.tsx
            // But let's verify. In App.tsx: id: item.product_id. Yes.
            return {
                sale_id: sale.id,
                product_id: item.id,
                qty: item.qty,
                applied_price: item.appliedPrice,
                subtotal: item.subtotal
            };
        }));

        const { error: itemsError } = await supabase.from('sale_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        setSales(prev => [...prev, sale]);
    };

    const voidSale = async (saleId: string) => {
        const saleToVoid = sales.find(s => s.id === saleId);
        if (!saleToVoid) return;

        // 1. Update status
        const { error } = await supabase.from('sales').update({ status: 'CANCELED' }).eq('id', saleId);
        if (error) throw error;

        // 2. Restore Stock (Using ProductsContext)
        for (const item of saleToVoid.items) {
            await adjustStock(item.id, 'ENTRY', item.qty, `Estorno Venda #${saleToVoid.id.slice(0, 6)}`);
        }

        setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: 'CANCELED' } : s));
    };

    return (
        <SalesContext.Provider value={{ sales, loading, addSale, voidSale, refreshSales: fetchSales }}>
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
