
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, User } from '../types';
import CashRegister from './CashRegister';
import {
    ArrowUpCircle,
    ArrowDownCircle,
    DollarSign,
    Plus,
    CheckCircle2,
    Clock,
    Trash2,
    AlertCircle,
    Activity,
    Tags,
    X,
    ChevronDown,
    Wallet,
    TrendingUp
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface FinanceProps {
    transactions: Transaction[];
    onAddTransaction: (t: Transaction) => void;
    onUpdateStatus: (id: string, status: 'PAID' | 'PENDING') => void;
    onDeleteTransaction: (id: string) => void;
    onNavigate?: (view: string) => void;
    currentUser: User | null;
}

const DEFAULT_INCOME_CATEGORIES = [
    "Vendas",
    "Recebimento de Fiado",
    "Aporte de Capital",
    "Reembolsos",
    "Outras Receitas"
];

const DEFAULT_EXPENSE_CATEGORIES = [
    "Fornecedores (Estoque)",
    "Aluguel",
    "Água / Luz / Internet",
    "Salários & Comissões",
    "Impostos",
    "Manutenção",
    "Marketing",
    "Limpeza & Consumo",
    "Outras Despesas"
];

const Finance: React.FC<FinanceProps> = ({ transactions, onAddTransaction, onUpdateStatus, onDeleteTransaction, onNavigate, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState(false);
    const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

    // --- CATEGORY MANAGEMENT STATE ---
    const [incomeCategories, setIncomeCategories] = useState<string[]>(() => {
        const saved = localStorage.getItem('mm_fin_income_cats');
        return saved ? JSON.parse(saved) : DEFAULT_INCOME_CATEGORIES;
    });

    const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
        const saved = localStorage.getItem('mm_fin_expense_cats');
        return saved ? JSON.parse(saved) : DEFAULT_EXPENSE_CATEGORIES;
    });

    // Persistence
    useEffect(() => localStorage.setItem('mm_fin_income_cats', JSON.stringify(incomeCategories)), [incomeCategories]);
    useEffect(() => localStorage.setItem('mm_fin_expense_cats', JSON.stringify(expenseCategories)), [expenseCategories]);

    // Category Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryTab, setCategoryTab] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
    const [newCategoryInput, setNewCategoryInput] = useState('');

    // Inline Category Add State (inside Transaction Modal)
    const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

    // Expanded categories state (for collapsible cards)
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    // Form State
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        type: 'EXPENSE',
        category: 'Fornecedores (Estoque)',
        date: new Date().toLocaleDateString('pt-BR').split('/').reverse().join('-'), // Local Date YYYY-MM-DD
        dueDate: new Date().toLocaleDateString('pt-BR').split('/').reverse().join('-'), // Local Date YYYY-MM-DD
        status: 'PAID'
    });

    // Reset adding mode when modal closes
    useEffect(() => {
        if (!isModalOpen) setIsAddingNewCategory(false);
    }, [isModalOpen]);

    // Update category default when type changes (only if not adding new)
    useEffect(() => {
        if (!isAddingNewCategory) {
            if (formData.type === 'INCOME') {
                if (!incomeCategories.includes(formData.category)) {
                    setFormData(prev => ({ ...prev, category: incomeCategories[0] || '' }));
                }
            } else {
                if (!expenseCategories.includes(formData.category)) {
                    setFormData(prev => ({ ...prev, category: expenseCategories[0] || '' }));
                }
            }
        }
    }, [formData.type, incomeCategories, expenseCategories, isAddingNewCategory]);

    // --- HANDLERS ---
    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        const val = newCategoryInput.trim();
        if (!val) return;

        if (categoryTab === 'INCOME') {
            if (incomeCategories.includes(val)) { alert('Categoria já existe.'); return; }
            setIncomeCategories(prev => [...prev, val].sort());
        } else {
            if (expenseCategories.includes(val)) { alert('Categoria já existe.'); return; }
            setExpenseCategories(prev => [...prev, val].sort());
        }
        setNewCategoryInput('');
    };

    const handleDeleteCategory = (cat: string) => {
        if (categoryTab === 'INCOME') {
            setIncomeCategories(prev => prev.filter(c => c !== cat));
        } else {
            setExpenseCategories(prev => prev.filter(c => c !== cat));
        }
    };

    // Calculate Stats
    const stats = useMemo(() => {
        const income = transactions
            .filter(t => t.type === 'INCOME' && t.status === 'PAID')
            .reduce((acc, t) => acc + t.amount, 0);

        const expense = transactions
            .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
            .reduce((acc, t) => acc + t.amount, 0);

        const pendingPayable = transactions
            .filter(t => t.type === 'EXPENSE' && t.status === 'PENDING')
            .reduce((acc, t) => acc + t.amount, 0);

        const pendingReceivable = transactions
            .filter(t => t.type === 'INCOME' && t.status === 'PENDING')
            .reduce((acc, t) => acc + t.amount, 0);

        return { income, expense, balance: income - expense, pendingPayable, pendingReceivable };
    }, [transactions]);

    // Chart Data (Daily Cash Flow)
    const chartData = useMemo(() => {
        const data: Record<string, { date: string, income: number, expense: number }> = {};

        // Get last 14 days
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('pt-BR');
            data[dateStr] = { date: dateStr.slice(0, 5), income: 0, expense: 0 };
        }

        transactions.forEach(t => {
            if (t.status === 'PAID') {
                const dateStr = new Date(t.date).toLocaleDateString('pt-BR');
                if (data[dateStr]) {
                    if (t.type === 'INCOME') data[dateStr].income += t.amount;
                    else data[dateStr].expense += t.amount;
                }
            }
        });

        return Object.values(data);
    }, [transactions]);

    // Filter Transactions
    const filteredTransactions = transactions.filter(t => {
        if (filterType !== 'ALL' && t.type !== filterType) return false;
        if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
        return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // If adding a new category inline, save it first
        const finalCategory = formData.category.trim();
        if (isAddingNewCategory && finalCategory) {
            if (formData.type === 'INCOME' && !incomeCategories.includes(finalCategory)) {
                setIncomeCategories(prev => [...prev, finalCategory].sort());
            } else if (formData.type === 'EXPENSE' && !expenseCategories.includes(finalCategory)) {
                setExpenseCategories(prev => [...prev, finalCategory].sort());
            }
        }

        const newTransaction: Transaction = {
            id: crypto.randomUUID(),
            type: formData.type as 'INCOME' | 'EXPENSE',
            category: finalCategory,
            description: formData.description,
            amount: parseFloat(formData.amount),
            date: new Date(formData.date).toISOString(),
            dueDate: new Date(formData.dueDate).toISOString(),
            status: formData.status as 'PAID' | 'PENDING'
        };
        onAddTransaction(newTransaction);
        setIsModalOpen(false);
        setIsAddingNewCategory(false);
        setFormData({
            description: '',
            amount: '',
            type: 'EXPENSE',
            category: expenseCategories[0] || '',
            date: new Date().toLocaleDateString('pt-BR').split('/').reverse().join('-'),
            dueDate: new Date().toLocaleDateString('pt-BR').split('/').reverse().join('-'),
            status: 'PAID'
        });
    };

    const isOverdue = (t: Transaction) => {
        if (t.status === 'PAID') return false;
        const due = new Date(t.dueDate || t.date);
        const today = new Date();
        return due < today;
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl z-50">
                    <p className="font-bold text-gray-700 mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
                            {entry.name}: {entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Módulo Financeiro</h2>
                    <p className="text-gray-500 text-sm">Gestão de fluxo de caixa e contas</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onNavigate && onNavigate('profit-margin')}
                        className="bg-purple-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all"
                    >
                        <TrendingUp size={20} /> Margem de Lucro
                    </button>
                    <button
                        onClick={() => setIsCashRegisterModalOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                    >
                        <Wallet size={20} /> Controle de Caixa
                    </button>
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Tags size={20} /> Categorias
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                    >
                        <Plus size={20} /> Novo Lançamento
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-500 text-sm font-medium">Saldo em Caixa</span>
                        <div className={`p-2 rounded-lg ${stats.balance >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                        R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-500 text-sm font-medium">Entradas (Recebido)</span>
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                            <ArrowUpCircle size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">
                        R$ {stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                        <Clock size={10} /> + R$ {stats.pendingReceivable.toFixed(2)} a receber
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-500 text-sm font-medium">Saídas (Pago)</span>
                        <div className="p-2 rounded-lg bg-red-100 text-red-600">
                            <ArrowDownCircle size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">
                        R$ {stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> - R$ {stats.pendingPayable.toFixed(2)} a pagar
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-500 text-sm font-medium">Resultado Líquido</span>
                        <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                            <Activity size={20} />
                        </div>
                    </div>
                    <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {(stats.income > 0 ? (stats.balance / stats.income * 100) : 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Margem Operacional</p>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Fluxo de Caixa (Últimos 14 dias)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36} />
                        <Area
                            type="monotone"
                            dataKey="income"
                            name="Entradas"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorIncome)"
                            isAnimationActive={true}
                            animationDuration={1500}
                            animationEasing="ease-out"
                        />
                        <Area
                            type="monotone"
                            dataKey="expense"
                            name="Saídas"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorExpense)"
                            isAnimationActive={true}
                            animationDuration={1500}
                            animationEasing="ease-out"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b flex flex-wrap gap-4 justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">Histórico de Lançamentos</h3>
                    <div className="flex gap-2">
                        <select
                            className="bg-white border text-sm rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                        >
                            <option value="ALL">Todas Categorias</option>
                            <option value="INCOME">Entradas</option>
                            <option value="EXPENSE">Saídas</option>
                        </select>
                        <select
                            className="bg-white border text-sm rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                        >
                            <option value="ALL">Todos Status</option>
                            <option value="PAID">Pago / Recebido</option>
                            <option value="PENDING">Pendente</option>
                        </select>
                    </div>
                </div>

                <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                    {(() => {
                        // Group transactions by category
                        const groupedByCategory: Record<string, typeof filteredTransactions> = {};
                        filteredTransactions.forEach(t => {
                            if (!groupedByCategory[t.category]) {
                                groupedByCategory[t.category] = [];
                            }
                            groupedByCategory[t.category].push(t);
                        });

                        // Sort categories alphabetically
                        const categories = Object.keys(groupedByCategory).sort();

                        if (categories.length === 0) {
                            return (
                                <div className="p-8 text-center text-gray-400">
                                    Nenhum lançamento encontrado com os filtros atuais.
                                </div>
                            );
                        }

                        return categories.map(category => {
                            const categoryTransactions = groupedByCategory[category];
                            const categoryTotal = categoryTransactions.reduce((sum, t) => {
                                return sum + (t.type === 'INCOME' ? t.amount : -t.amount);
                            }, 0);
                            const isIncome = categoryTransactions[0]?.type === 'INCOME';

                            const isExpanded = expandedCategories.has(category);
                            const toggleCategory = () => {
                                setExpandedCategories(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(category)) {
                                        newSet.delete(category);
                                    } else {
                                        newSet.add(category);
                                    }
                                    return newSet;
                                });
                            };

                            return (
                                <div key={category} className={`border rounded-xl overflow-hidden ${isIncome ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}>
                                    {/* Category Header - Clickable */}
                                    <div
                                        onClick={toggleCategory}
                                        className={`p-4 flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity ${isIncome ? 'bg-emerald-100/50' : 'bg-red-100/50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isIncome ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                                {isIncome ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{category}</h4>
                                                <p className="text-xs text-gray-500">{categoryTransactions.length} lançamento(s)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`text-xl font-bold ${categoryTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {categoryTotal >= 0 ? '+' : ''} R$ {Math.abs(categoryTotal).toFixed(2)}
                                            </div>
                                            <ChevronDown
                                                size={20}
                                                className={`text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                    </div>


                                    {/* Transactions in this category - Only show when expanded */}
                                    {isExpanded && (
                                        <div className="bg-white divide-y divide-gray-100">
                                            {categoryTransactions.map(t => {
                                                const overdue = isOverdue(t);
                                                return (
                                                    <div key={t.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                        <div className="flex justify-between items-start gap-4">
                                                            {/* Left Section - Main Info */}
                                                            <div className="flex-1 space-y-1">
                                                                <h5 className="font-medium text-gray-800">{t.description}</h5>
                                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="font-medium">Data:</span>
                                                                        <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                                                                    </div>
                                                                    {t.dueDate && t.status === 'PENDING' && (
                                                                        <div className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-bold' : ''}`}>
                                                                            <span className="font-medium">Vence:</span>
                                                                            <span>{new Date(t.dueDate).toLocaleDateString('pt-BR')}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Right Section - Value & Actions */}
                                                            <div className="flex items-center gap-4">
                                                                <div className={`text-lg font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                    {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {t.status === 'PAID' ? (
                                                                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">
                                                                            <CheckCircle2 size={12} /> Confirmado
                                                                        </span>
                                                                    ) : (
                                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${overdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                            <Clock size={12} /> {overdue ? 'Atrasado' : 'Pendente'}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex gap-1">
                                                                    {t.status === 'PENDING' && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onUpdateStatus(t.id, 'PAID');
                                                                            }}
                                                                            title="Marcar como Pago/Recebido"
                                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                        >
                                                                            <CheckCircle2 size={16} />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onDeleteTransaction(t.id);
                                                                        }}
                                                                        title="Excluir lançamento"
                                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>

            {/* MODAL: CATEGORIES MANAGEMENT */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Categorias Financeiras</h3>
                            <button onClick={() => setIsCategoryModalOpen(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                        </div>

                        <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                            <button onClick={() => setCategoryTab('EXPENSE')} className={`flex-1 py-2 text-sm font-bold rounded transition-colors ${categoryTab === 'EXPENSE' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}>Despesas / Saídas</button>
                            <button onClick={() => setCategoryTab('INCOME')} className={`flex-1 py-2 text-sm font-bold rounded transition-colors ${categoryTab === 'INCOME' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}>Receitas / Entradas</button>
                        </div>

                        <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Nova categoria..."
                                className="flex-1 border p-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                value={newCategoryInput}
                                onChange={e => setNewCategoryInput(e.target.value)}
                            />
                            <button type="submit" className="bg-emerald-600 text-white px-4 rounded-lg font-bold hover:bg-emerald-700"><Plus size={20} /></button>
                        </form>

                        <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50 p-2 space-y-2">
                            {(categoryTab === 'INCOME' ? incomeCategories : expenseCategories).map(cat => (
                                <div key={cat} className="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
                                    <span className="font-medium text-gray-700">{cat}</span>
                                    <button
                                        onClick={() => handleDeleteCategory(cat)}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Add Transaction */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Novo Lançamento</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    className={`p-3 border rounded-xl text-center cursor-pointer transition-all ${formData.type === 'INCOME' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' : 'border-gray-200'}`}
                                    onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                                >
                                    Entrada
                                </div>
                                <div
                                    className={`p-3 border rounded-xl text-center cursor-pointer transition-all ${formData.type === 'EXPENSE' ? 'border-red-500 bg-red-50 text-red-700 font-bold' : 'border-gray-200'}`}
                                    onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                                >
                                    Saída / Despesa
                                </div>
                            </div>

                            {/* Helper Text */}
                            <div className="text-xs text-gray-500 text-center bg-gray-50 p-2 rounded-lg">
                                {formData.type === 'INCOME'
                                    ? 'Dinheiro que entra no caixa (Vendas, Recebimentos).'
                                    : 'Dinheiro que sai do caixa (Contas, Fornecedores).'}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input required type="text" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                                    placeholder={formData.type === 'INCOME' ? "Ex: Venda de sucata" : "Ex: Conta de Luz (Cemig)"}
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                                    <input required type="number" step="0.01" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                                        value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <div className="flex gap-1">
                                        {isAddingNewCategory ? (
                                            <input
                                                type="text"
                                                autoFocus
                                                className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none bg-emerald-50"
                                                placeholder="Nova categoria..."
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            />
                                        ) : (
                                            <select className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none bg-white"
                                                value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                                {formData.type === 'INCOME'
                                                    ? incomeCategories.map(c => <option key={c} value={c}>{c}</option>)
                                                    : expenseCategories.map(c => <option key={c} value={c}>{c}</option>)
                                                }
                                            </select>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAddingNewCategory(!isAddingNewCategory);
                                                // Reset to default selection if cancelling, or clear for typing
                                                if (isAddingNewCategory) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        category: formData.type === 'INCOME' ? incomeCategories[0] : expenseCategories[0]
                                                    }));
                                                } else {
                                                    setFormData(prev => ({ ...prev, category: '' }));
                                                }
                                            }}
                                            className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${isAddingNewCategory ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 bg-gray-50 text-emerald-600 hover:bg-emerald-50'}`}
                                            title={isAddingNewCategory ? "Cancelar nova categoria" : "Criar nova categoria"}
                                        >
                                            {isAddingNewCategory ? <X size={20} /> : <Plus size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Competência</label>
                                    <input required type="date" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                                        value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
                                    <input required type="date" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                                        value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status Inicial</label>
                                <select className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                                    value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="PAID">
                                        {formData.type === 'INCOME' ? 'Já Recebido (Caiu no caixa)' : 'Já Pago (Saiu do caixa)'}
                                    </option>
                                    <option value="PENDING">
                                        {formData.type === 'INCOME' ? 'A Receber (Futuro)' : 'A Pagar (Boleto/Futuro)'}
                                    </option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">Salvar Lançamento</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Cash Register */}
            {isCashRegisterModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl animate-scale-in flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800">Controle de Caixa</h3>
                            <button
                                onClick={() => setIsCashRegisterModalOpen(false)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <CashRegister
                                currentUser={currentUser}
                                onSessionOpen={() => setIsCashRegisterModalOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
