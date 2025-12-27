import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction } from '../types';
import { supabase } from '../lib/supabaseClient';

interface FinanceContextType {
    transactions: Transaction[];
    loading: boolean;
    addTransaction: (t: Transaction) => Promise<void>;
    updateTransactionStatus: (id: string, status: 'PAID' | 'PENDING') => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    refreshTransactions: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('transactions').select('*');
        if (error) {
            console.error("Erro ao carregar transações:", error);
            setLoading(false);
            return;
        }

        if (data) {
            const mappedTransactions = await Promise.all(data.map(async (t: any) => {
                let items: any[] = [];
                if (t.type === 'EXPENSE') {
                    const { data: itemsData } = await supabase
                        .from('transaction_items')
                        .select('*')
                        .eq('transaction_id', t.id);

                    if (itemsData && itemsData.length > 0) {
                        items = await Promise.all(itemsData.map(async (item: any) => {
                            const { data: prod } = await supabase
                                .from('products')
                                .select('code, name')
                                .eq('id', item.product_id)
                                .single();

                            return {
                                name: prod?.name || 'Item Desconhecido',
                                code: prod?.code || '',
                                qty: Number(item.qty),
                                costPrice: Number(item.cost_price)
                            };
                        }));
                    }
                }

                return {
                    id: t.id,
                    type: t.type,
                    category: t.category,
                    amount: Number(t.amount),
                    date: t.date,
                    dueDate: t.due_date,
                    description: t.description,
                    status: t.status,
                    items: items
                };
            }));
            setTransactions(mappedTransactions);
        }
        setLoading(false);
    };

    const addTransaction = async (t: Transaction) => {
        const { error } = await supabase.from('transactions').insert([{
            id: t.id,
            type: t.type,
            category: t.category,
            amount: t.amount,
            date: t.date,
            due_date: t.dueDate,
            description: t.description,
            status: t.status
        }]);

        if (error) throw error;
        setTransactions(prev => [...prev, t]);
    };

    const updateTransactionStatus = async (id: string, status: 'PAID' | 'PENDING') => {
        const { error } = await supabase.from('transactions').update({ status }).eq('id', id);
        if (error) throw error;
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    };

    const deleteTransaction = async (id: string) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    return (
        <FinanceContext.Provider value={{ transactions, loading, addTransaction, updateTransactionStatus, deleteTransaction, refreshTransactions: fetchTransactions }}>
            {children}
        </FinanceContext.Provider>
    );
};

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (context === undefined) {
        throw new Error('useFinance must be used within a FinanceProvider');
    }
    return context;
};
