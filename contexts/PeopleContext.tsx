import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Customer, Supplier, UserRole, Transaction } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useFinance } from './FinanceContext';

interface PeopleContextType {
    users: User[];
    customers: Customer[];
    suppliers: Supplier[];
    loading: boolean;
    addUser: (u: User) => Promise<void>;
    updateUser: (u: User) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    addCustomer: (c: Customer) => Promise<void>;
    updateCustomer: (c: Customer) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    payDebt: (customerId: string, amount: number) => Promise<void>;
    addSupplier: (s: Supplier) => Promise<void>;
    updateSupplier: (s: Supplier) => Promise<void>;
    deleteSupplier: (id: string) => Promise<void>;
    refreshPeople: () => Promise<void>;
}

const PeopleContext = createContext<PeopleContextType | undefined>(undefined);

export const PeopleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);

    const { addTransaction } = useFinance();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([
            fetchUsers(),
            fetchCustomers(),
            fetchSuppliers()
        ]);
        setLoading(false);
    };

    const fetchUsers = async () => {
        const { data, error } = await supabase.from('users').select('*');
        if (error) console.error("Erro ao carregar usuários:", error);
        else if (data) setUsers(data as User[]);
    };

    const fetchCustomers = async () => {
        const { data, error } = await supabase.from('customers').select('*');
        if (error) console.error("Erro ao carregar clientes:", error);
        else if (data) {
            setCustomers(data.map((c: any) => ({
                id: c.id,
                name: c.name,
                cpf: c.cpf,
                phone: c.phone,
                email: c.email,
                address: c.address,
                creditLimit: Number(c.credit_limit),
                debtBalance: Number(c.debt_balance)
            })));
        }
    };

    const fetchSuppliers = async () => {
        const { data, error } = await supabase.from('suppliers').select('*');
        if (error) console.error("Erro ao carregar fornecedores:", error);
        else if (data) {
            setSuppliers(data.map((s: any) => ({
                id: s.id,
                name: s.name,
                cnpj: s.cnpj,
                phone: s.phone,
                email: s.email,
                address: s.address,
                contactPerson: s.contact_person,
                paymentTerms: s.payment_terms,
                notes: s.notes,
                active: s.active
            })));
        }
    };

    // User Actions
    const addUser = async (u: User) => {
        if (u.password) {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: u.email,
                password: u.password,
                options: { data: { name: u.name, role: u.role } }
            });

            if (authError) throw authError;

            if (authData.user) {
                const { error: dbError } = await supabase.from('users').insert([{
                    id: authData.user.id,
                    name: u.name,
                    email: u.email,
                    role: u.role
                }]);
                if (dbError) throw dbError;
                fetchUsers(); // Reload to get correct ID if needed
            }
        } else {
            const { error } = await supabase.from('users').insert([{
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role
            }]);
            if (error) throw error;
            setUsers(prev => [...prev, u]);
        }
    };

    const updateUser = async (u: User) => {
        const { error } = await supabase.from('users').update({
            name: u.name,
            email: u.email,
            role: u.role
        }).eq('id', u.id);
        if (error) throw error;
        setUsers(prev => prev.map(curr => curr.id === u.id ? u : curr));
    };

    const deleteUser = async (id: string) => {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    // Customer Actions
    const addCustomer = async (c: Customer) => {
        const dbCustomer = {
            id: c.id,
            name: c.name,
            cpf: c.cpf,
            phone: c.phone,
            email: c.email,
            address: c.address,
            credit_limit: c.creditLimit,
            debt_balance: c.debtBalance
        };
        const { error } = await supabase.from('customers').insert([dbCustomer]);
        if (error) throw error;
        setCustomers(prev => [...prev, c]);
    };

    const updateCustomer = async (c: Customer) => {
        const dbCustomer = {
            name: c.name,
            cpf: c.cpf,
            phone: c.phone,
            email: c.email,
            address: c.address,
            credit_limit: c.creditLimit,
            debt_balance: c.debtBalance
        };
        const { error } = await supabase.from('customers').update(dbCustomer).eq('id', c.id);
        if (error) throw error;
        setCustomers(prev => prev.map(curr => curr.id === c.id ? c : curr));
    };

    const deleteCustomer = async (id: string) => {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) throw error;
        setCustomers(prev => prev.filter(c => c.id !== id));
    };

    const payDebt = async (customerId: string, amount: number) => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        const newBalance = Math.max(0, customer.debtBalance - amount);
        const { error } = await supabase.from('customers').update({ debt_balance: newBalance }).eq('id', customerId);
        if (error) throw error;

        // Create Transaction
        const transaction: Transaction = {
            id: crypto.randomUUID(),
            type: 'INCOME',
            category: 'Pagamento de Dívida',
            amount: amount,
            date: new Date().toISOString(),
            description: `Pagamento de Dívida - ${customer.name}`,
            status: 'PAID'
        };

        await addTransaction(transaction);

        setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, debtBalance: newBalance } : c));
    };

    // Supplier Actions
    const addSupplier = async (s: Supplier) => {
        const { error } = await supabase.from('suppliers').insert([{
            id: s.id,
            name: s.name,
            cnpj: s.cnpj,
            phone: s.phone,
            email: s.email,
            address: s.address,
            contact_person: s.contactPerson,
            payment_terms: s.paymentTerms,
            notes: s.notes,
            active: s.active
        }]);
        if (error) throw error;
        setSuppliers(prev => [...prev, s]);
    };

    const updateSupplier = async (s: Supplier) => {
        const { error } = await supabase.from('suppliers').update({
            name: s.name,
            cnpj: s.cnpj,
            phone: s.phone,
            email: s.email,
            address: s.address,
            contact_person: s.contactPerson,
            payment_terms: s.paymentTerms,
            notes: s.notes,
            active: s.active
        }).eq('id', s.id);
        if (error) throw error;
        setSuppliers(prev => prev.map(curr => curr.id === s.id ? s : curr));
    };

    const deleteSupplier = async (id: string) => {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (error) throw error;
        setSuppliers(prev => prev.filter(s => s.id !== id));
    };

    return (
        <PeopleContext.Provider value={{
            users, customers, suppliers, loading,
            addUser, updateUser, deleteUser,
            addCustomer, updateCustomer, deleteCustomer, payDebt,
            addSupplier, updateSupplier, deleteSupplier,
            refreshPeople: fetchData
        }}>
            {children}
        </PeopleContext.Provider>
    );
};

export const usePeople = () => {
    const context = useContext(PeopleContext);
    if (context === undefined) {
        throw new Error('usePeople must be used within a PeopleProvider');
    }
    return context;
};
