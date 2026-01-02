
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Transaction, User } from '../types';
import { Search, Plus, Trash2, ShoppingCart, Truck, Package, Calendar, DollarSign, Save, X, CheckCircle, CreditCard, ArrowLeftCircle, TrendingUp, ChevronRight, ChevronLeft, FileText } from 'lucide-react';
import PurchaseSuggestion from './PurchaseSuggestion';

interface PurchasesProps {
    products: Product[];
    currentUser: User;
    onProcessPurchase: (purchase: any) => Promise<void>;
    transactions: Transaction[];
    onCancelPurchase: (transactionId: string) => void;
    onBack?: () => void;
    suppliersList?: string[];
}

// Interface local para itens da compra
interface PurchaseItem extends Product {
    qty: number;
    subtotal: number;
    qty: number;
    subtotal: number;
    expiryDate?: string;
    totalVolume?: string;
}

const Purchases: React.FC<PurchasesProps> = ({ products, currentUser, onProcessPurchase, transactions, onCancelPurchase, onBack, suppliersList: propSuppliersList }) => {
    // Helper to get local date string in YYYY-MM-DD format
    const getLocalDateString = (daysOffset: number = 0) => {
        const now = new Date();
        now.setDate(now.getDate() + daysOffset);
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'NEW_PURCHASE' | 'HISTORY'>('NEW_PURCHASE');
    const [cart, setCart] = useState<PurchaseItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [supplier, setSupplier] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(getLocalDateString());
    const [dueDate, setDueDate] = useState(getLocalDateString());
    const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PENDING');
    const [installments, setInstallments] = useState(1);
    const [installmentInterval, setInstallmentInterval] = useState(30);
    const [entryType, setEntryType] = useState<'PURCHASE' | 'DONATION' | 'BONUS' | 'ADJUSTMENT'>('PURCHASE');

    // Wizard Step State
    const [currentStep, setCurrentStep] = useState(1);

    // Pricing Mode: MARGIN vs MARKUP
    const [pricingMode, setPricingMode] = useState<'MARGIN' | 'MARKUP'>('MARGIN');

    // Carregar fornecedores do localStorage
    const [suppliersList, setSuppliersList] = useState<string[]>([]);
    const [showSupplierList, setShowSupplierList] = useState(false);

    // Carregar Margens e Markups Personalizadas
    const [categoryMargins, setCategoryMargins] = useState<Record<string, number>>({});
    const [categoryMarkups, setCategoryMarkups] = useState<Record<string, number>>({});

    // Estado do Modal de Sugestão
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);

    // Estados para Histórico
    const [viewPurchase, setViewPurchase] = useState<Transaction | null>(null);
    const [cancelPurchaseId, setCancelPurchaseId] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [mobileView, setMobileView] = useState<'SEARCH' | 'CART'>('SEARCH');

    useEffect(() => {
        // Load Suppliers
        if (propSuppliersList && propSuppliersList.length > 0) {
            setSuppliersList(propSuppliersList);
        } else {
            const savedSuppliers = localStorage.getItem('mm_suppliers');
            if (savedSuppliers) {
                setSuppliersList(JSON.parse(savedSuppliers));
            } else {
                setSuppliersList(['Coca-Cola FEMSA', 'Camil Alimentos', 'Química Amparo', 'Itambé Laticínios']);
            }
        }

        // Load Margins
        const savedMargins = localStorage.getItem('mm_category_margins');
        if (savedMargins) {
            setCategoryMargins(JSON.parse(savedMargins));
        }

        // Load Markups
        const savedMarkups = localStorage.getItem('mm_category_markups');
        if (savedMarkups) {
            setCategoryMarkups(JSON.parse(savedMarkups));
        }
    }, []);

    // --- ACTIONS ---

    const calculateSuggestedPrice = (cost: number, category: string) => {
        if (pricingMode === 'MARGIN') {
            // margin comes as integer percentage (e.g. 30 for 30%)
            const marginPercent = categoryMargins[category] !== undefined ? categoryMargins[category] : 30; // Default 30%
            const marginDecimal = marginPercent / 100;

            // Cálculo Margem sobre Venda: Custo / (1 - Margem)
            if (marginDecimal >= 0.99) return cost * 2; // Prevenção
            return cost / (1 - marginDecimal);
        } else {
            // MARKUP Logic
            const markupPercent = categoryMarkups[category] !== undefined ? categoryMarkups[category] : 30; // Default 30% if missing
            const markupDecimal = markupPercent / 100;

            // Cálculo Markup sobre Custo: Custo * (1 + Markup)
            return cost * (1 + markupDecimal);
        }
    };

    const getPercentageUsed = (category: string) => {
        if (pricingMode === 'MARGIN') return categoryMargins[category] !== undefined ? categoryMargins[category] : 30;
        return categoryMarkups[category] !== undefined ? categoryMarkups[category] : 30;
    };

    const addToCart = (product: Product) => {
        const existingIndex = cart.findIndex(item => item.id === product.id);

        if (existingIndex >= 0) {
            // Item já existe, incrementa
            const newCart = [...cart];
            newCart[existingIndex].qty += 1;
            newCart[existingIndex].subtotal = newCart[existingIndex].costPrice * newCart[existingIndex].qty;
            setCart(newCart);
        } else {
            // Novo item
            const newItem: PurchaseItem = {
                ...product,
                qty: 1,
                ...product,
                qty: 1,
                subtotal: product.costPrice,
                totalVolume: ''
            };
            setCart([...cart, newItem]);
        }
        setSearchTerm('');
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const updateQty = (index: number, newQty: number) => {
        if (newQty < 1) return;
        setCart(prev => prev.map((item, i) => {
            if (i === index) {
                return { ...item, qty: newQty, subtotal: item.costPrice * newQty };
            }
            return item;
        }));
    };

    const updateCost = (index: number, newCost: number) => {
        setCart(prev => prev.map((item, i) => {
            if (i === index) {
                return { ...item, costPrice: newCost, subtotal: newCost * item.qty };
            }
            return item;
        }));
    };

    const handleCostInput = (index: number, value: string) => {
        // Mask logic for 3 decimal places
        const digits = value.replace(/\D/g, '');
        const numberValue = digits ? parseInt(digits, 10) / 1000 : 0;
        updateCost(index, numberValue);
    };

    const updateRetail = (index: number, newPrice: number) => {
        setCart(prev => prev.map((item, i) => {
            if (i === index) {
                return { ...item, retailPrice: newPrice };
            }
            return item;
        }));
    };

    const updateExpiryDate = (index: number, newDate: string) => {
        setCart(prev => prev.map((item, i) => {
            if (i === index) {
                return { ...item, expiryDate: newDate };
            }
            return item;
        }));
    };

    const updateTotalVolume = (index: number, newVolume: string) => {
        setCart(prev => prev.map((item, i) => {
            if (i === index) {
                return { ...item, totalVolume: newVolume };
            }
            return item;
        }));
    };

    const handleAddSuggestedItems = (items: { product: Product; qty: number }[]) => {
        setCart(prev => {
            const newCart = [...prev];
            items.forEach(({ product, qty }) => {
                const index = newCart.findIndex(i => i.id === product.id);
                if (index >= 0) {
                    newCart[index].qty += qty;
                    newCart[index].subtotal = newCart[index].costPrice * newCart[index].qty;
                } else {
                    newCart.push({
                        ...product,
                        qty,
                        subtotal: product.costPrice * qty
                    });
                }
            });
            return newCart;
        });
    };

    const handleFinalize = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) {
            alert("Adicione produtos à compra.");
            return;
        }
        if (!supplier && entryType !== 'ADJUSTMENT') {
            alert("Selecione um fornecedor.");
            return;
        }

        const totalAmount = cart.reduce((acc, item) => acc + item.subtotal, 0);

        const purchaseData = {
            id: crypto.randomUUID(),
            supplier,
            invoiceNumber,
            date: purchaseDate,
            dueDate: dueDate,
            status: paymentStatus,
            installments: paymentStatus === 'PENDING' ? installments : 1,
            installmentInterval: paymentStatus === 'PENDING' ? installmentInterval : 0,
            items: cart,
            total: totalAmount,
            registeredBy: currentUser.id,
            entryType // Pass the entry type
        };

        try {
            await onProcessPurchase(purchaseData);

            // Reset Form
            setCart([]);
            setSupplier('');
            setInvoiceNumber('');
            setPaymentStatus('PENDING');
            setInstallments(1);
            setInstallmentInterval(30);
            setEntryType('PURCHASE');
            setCurrentStep(1);

            // Show success modal
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Erro ao finalizar compra:", error);
            alert("Erro ao finalizar compra: " + (error as any).message);
        }
    };

    const calculateSuggestedPriceForProduct = (cost: number, category: string) => {
        if (pricingMode === 'MARGIN') {
            const marginPercent = categoryMargins[category] !== undefined ? categoryMargins[category] : 30;
            const marginDecimal = marginPercent / 100;
            if (marginDecimal >= 0.99) return cost * 2;
            return cost / (1 - marginDecimal);
        } else {
            const markupPercent = categoryMarkups[category] !== undefined ? categoryMarkups[category] : 30;
            const markupDecimal = markupPercent / 100;
            return cost * (1 + markupDecimal);
        }
    };

    const filteredProducts = searchTerm.trim().length >= 3
        ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm))
        : [];

    const totalPurchase = cart.reduce((acc, item) => acc + item.subtotal, 0);

    // Filtrar compras do histórico
    const purchaseHistory = transactions.filter(t =>
        t.type === 'EXPENSE' &&
        (t.category.includes('Fornecedores') || t.category.includes('Estoque')) &&
        !t.category.includes('Cancelamento')
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Nova Compra (Entrada de Nota)</h2>
                    <p className="text-gray-500 text-sm">Registro de entrada de mercadorias e contas a pagar</p>
                </div>
                <div className="flex flex-col gap-2 items-end w-full sm:w-auto">
                    <button
                        onClick={() => setIsSuggestionModalOpen(true)}
                        className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm transition-all w-full sm:w-auto justify-center"
                    >
                        <TrendingUp size={20} />
                        Sugestão de Compras
                    </button>
                </div>
            </div>

            {onBack && (
                <div className="mb-6">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                        title="Voltar"
                    >
                        <ArrowLeftCircle size={24} />
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 mb-6 w-fit overflow-hidden">
                <button
                    onClick={() => setActiveTab('NEW_PURCHASE')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'NEW_PURCHASE' ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Plus size={18} /> Nova Compra
                </button>
                <button
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'HISTORY' ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Package size={18} /> Histórico ({purchaseHistory.length})
                </button>
            </div>

            {activeTab === 'NEW_PURCHASE' ? (
                <div className="flex flex-col h-full overflow-hidden relative bg-white rounded-xl shadow-sm border border-gray-100">
                    {/* Stepper Header */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-center">
                            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-emerald-600 bg-emerald-50' : 'border-gray-300'}`}>1</div>
                                <span className="hidden sm:inline">Fornecedor</span>
                            </div>
                            <div className={`w-8 sm:w-16 h-0.5 mx-2 ${currentStep >= 2 ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-emerald-600 bg-emerald-50' : 'border-gray-300'}`}>2</div>
                                <span className="hidden sm:inline">Produtos</span>
                            </div>
                            <div className={`w-8 sm:w-16 h-0.5 mx-2 ${currentStep >= 3 ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 3 ? 'border-emerald-600 bg-emerald-50' : 'border-gray-300'}`}>3</div>
                                <span className="hidden sm:inline">Pagamento</span>
                            </div>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {currentStep === 1 && (
                            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                                <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2 mb-6">
                                    <Truck className="text-emerald-600" /> Dados do Fornecedor e Nota
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Fornecedor</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            className="w-full border p-3 pl-10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                            placeholder="Digite o nome do fornecedor..."
                                            value={supplier}
                                            onChange={e => {
                                                setSupplier(e.target.value);
                                                setShowSupplierList(true);
                                            }}
                                            onFocus={() => setShowSupplierList(true)}
                                            onBlur={() => setTimeout(() => setShowSupplierList(false), 200)}
                                            autoFocus
                                        />
                                        <Truck className="absolute left-3 top-3.5 text-gray-400" size={18} />

                                        {showSupplierList && supplier.length >= 1 && (
                                            <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto z-50 animate-fade-in">
                                                {suppliersList.filter(s => s.toLowerCase().includes(supplier.toLowerCase())).length > 0 ? (
                                                    suppliersList.filter(s => s.toLowerCase().includes(supplier.toLowerCase())).map(s => (
                                                        <div
                                                            key={s}
                                                            className="p-3 hover:bg-emerald-50 cursor-pointer text-gray-700 border-b border-gray-50 last:border-0"
                                                            onClick={() => {
                                                                setSupplier(s);
                                                                setShowSupplierList(false);
                                                            }}
                                                        >
                                                            {s}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-gray-400 text-sm italic">Nenhum fornecedor encontrado</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nº Nota / Pedido</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full border p-3 pl-10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                                placeholder="Ex: 12345"
                                                value={invoiceNumber}
                                                onChange={e => setInvoiceNumber(e.target.value)}
                                            />
                                            <FileText className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Entrada</label>
                                        <select
                                            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                                            value={entryType}
                                            onChange={e => setEntryType(e.target.value as any)}
                                        >
                                            <option value="PURCHASE">Compra (Gera Financeiro)</option>
                                            <option value="DONATION">Doação (Sem Financeiro)</option>
                                            <option value="BONUS">Bonificação (Sem Financeiro)</option>
                                            <option value="ADJUSTMENT">Ajuste de Estoque (Sem Financeiro)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de Emissão</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            required
                                            className="w-full border p-3 pl-10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                            value={purchaseDate}
                                            onChange={e => setPurchaseDate(e.target.value)}
                                        />
                                        <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="flex flex-col h-full gap-6 animate-fade-in">
                                {/* Search Area */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Buscar produtos por nome ou código de barras..."
                                            className="w-full border p-3 pl-10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            autoFocus
                                        />
                                        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />

                                        {filteredProducts.length > 0 && (
                                            <div className="absolute top-full left-0 w-full mt-2 border border-gray-100 rounded-xl max-h-60 overflow-y-auto bg-white shadow-xl z-50">
                                                {filteredProducts.map(p => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => addToCart(p)}
                                                        className="p-3 border-b border-gray-50 hover:bg-emerald-50 cursor-pointer flex justify-between items-center transition-colors group"
                                                    >
                                                        <div>
                                                            <p className="font-bold text-gray-800 group-hover:text-emerald-700">{p.name}</p>
                                                            <p className="text-xs text-gray-500">{p.code}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold block mb-1 w-fit ml-auto ${p.stock <= p.minStock ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                                Estoque: {p.stock}
                                                            </span>
                                                            <p className="text-xs text-gray-400">Custo Atual</p>
                                                            <p className="font-bold text-gray-700">R$ {p.costPrice.toFixed(3)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cart Table */}
                                <div className="flex-1 overflow-hidden flex flex-col border border-gray-200 rounded-xl">
                                    <div className="bg-slate-800 text-white p-3 flex justify-between items-center">
                                        <h3 className="font-bold flex items-center gap-2"><ShoppingCart size={18} className="text-emerald-400" /> Carrinho de Compras</h3>
                                        <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">{cart.length} itens</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        {cart.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                                                <Package size={48} className="mb-4 opacity-20" />
                                                <p className="text-lg font-medium">Carrinho vazio</p>
                                                <p className="text-sm">Busque produtos acima para adicionar</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-50 text-gray-500 border-b sticky top-0 z-10">
                                                    <tr>
                                                        <th className="p-3 w-24 text-center">Qtd</th>
                                                        <th className="p-3">Produto</th>
                                                        <th className="p-3 w-28 text-right">Custo (R$)</th>
                                                        <th className="p-3 w-28 text-right">Total</th>
                                                        <th className="p-3 w-24 text-center">Vol. Total</th>
                                                        <th className="p-3 w-32 text-center">Validade</th>
                                                        <th className="p-3 w-32 text-right">Venda (R$)</th>
                                                        <th className="p-3 w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {cart.map((item, idx) => {
                                                        const suggestedPrice = calculateSuggestedPrice(item.costPrice, item.category);
                                                        return (
                                                            <tr key={idx} className="hover:bg-gray-50 group">
                                                                <td className="p-2">
                                                                    <input
                                                                        type="number" min="1"
                                                                        className="w-full border rounded-lg p-1.5 text-center font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                                                        value={item.qty}
                                                                        onChange={e => updateQty(idx, parseInt(e.target.value))}
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <div className="font-bold text-gray-700">{item.name}</div>
                                                                    <div className="text-xs text-gray-400">{item.code}</div>
                                                                </td>
                                                                <td className="p-2">
                                                                    <input
                                                                        type="text"
                                                                        className="w-full border rounded-lg p-1.5 text-right outline-none focus:ring-2 focus:ring-emerald-500"
                                                                        value={item.costPrice.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                                                                        onChange={e => handleCostInput(idx, e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="p-2 text-right font-bold text-gray-700">
                                                                    R$ {item.subtotal.toFixed(2)}
                                                                </td>
                                                                <td className="p-2">
                                                                    <input
                                                                        type="text"
                                                                        className="w-full border rounded-lg p-1.5 text-center text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                                        placeholder="Ex: 2L"
                                                                        value={item.totalVolume || ''}
                                                                        onChange={e => updateTotalVolume(idx, e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input
                                                                        type="date"
                                                                        className="w-full border rounded-lg p-1.5 text-center text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                                        value={item.expiryDate || ''}
                                                                        onChange={e => updateExpiryDate(idx, e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <div className="flex flex-col items-end">
                                                                        <input
                                                                            type="number" step="0.01" min="0"
                                                                            className="w-full border rounded-lg p-1.5 text-right font-medium text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500"
                                                                            value={item.retailPrice}
                                                                            onChange={e => updateRetail(idx, parseFloat(e.target.value))}
                                                                        />
                                                                        <span
                                                                            onClick={() => updateRetail(idx, parseFloat(suggestedPrice.toFixed(2)))}
                                                                            className="text-[10px] cursor-pointer hover:underline text-right mt-1 text-emerald-500"
                                                                            title="Aplicar preço sugerido"
                                                                        >
                                                                            Sug: R$ {suggestedPrice.toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-2 text-center">
                                                                    <button onClick={() => removeFromCart(idx)} className="text-red-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Total Parcial</span>
                                        <span className="text-2xl font-bold text-gray-800">R$ {totalPurchase.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                                <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2 mb-6">
                                    <CreditCard className="text-emerald-600" /> Pagamento e Finalização
                                </h3>

                                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                                    <span className="text-emerald-600 font-medium uppercase tracking-wider text-sm mb-2">Valor Total da Compra</span>
                                    <span className="text-4xl font-bold text-emerald-700">R$ {totalPurchase.toFixed(2)}</span>
                                    <span className="text-emerald-600/70 text-sm mt-2">{cart.length} itens</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Status do Pagamento</label>
                                        <select
                                            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                                            value={paymentStatus}
                                            onChange={e => setPaymentStatus(e.target.value as any)}
                                        >
                                            <option value="PAID">À Vista (Pago)</option>
                                            <option value="PENDING">A Prazo (Pendente)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {paymentStatus === 'PENDING' ? '1ª Parcela / Vencimento' : 'Data do Pagamento'}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                required
                                                className="w-full border p-3 pl-10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                                value={dueDate}
                                                onChange={e => setDueDate(e.target.value)}
                                            />
                                            <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        </div>
                                    </div>
                                </div>

                                {entryType === 'PURCHASE' && paymentStatus === 'PENDING' && (
                                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                                        <label className="block text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
                                            <CreditCard size={18} /> Configuração de Parcelamento
                                        </label>
                                        <div className="flex items-end gap-4">
                                            <div className="flex-1">
                                                <span className="text-xs text-blue-600 font-bold uppercase mb-1.5 block">Qtd. Parcelas</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="48"
                                                    className="w-full border border-blue-200 p-2.5 rounded-lg text-center font-bold text-blue-800 focus:ring-2 focus:ring-blue-400 outline-none"
                                                    value={installments}
                                                    onChange={e => setInstallments(parseInt(e.target.value) || 1)}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-xs text-blue-600 font-bold uppercase mb-1.5 block">Intervalo (Dias)</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full border border-blue-200 p-2.5 rounded-lg text-center font-bold text-blue-800 focus:ring-2 focus:ring-blue-400 outline-none"
                                                    placeholder="Ex: 30"
                                                    value={installmentInterval}
                                                    onChange={e => setInstallmentInterval(parseInt(e.target.value) || 30)}
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-blue-200 flex justify-between items-center text-blue-800">
                                            <span className="text-sm">Valor da Parcela:</span>
                                            <span className="font-bold text-lg">R$ {(totalPurchase / (installments || 1)).toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                        <button
                            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                            disabled={currentStep === 1}
                            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${currentStep === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200 bg-white border border-gray-200'}`}
                        >
                            <ChevronLeft size={20} /> Voltar
                        </button>

                        {currentStep < 3 ? (
                            <button
                                onClick={() => {
                                    if (currentStep === 1 && !supplier && entryType !== 'ADJUSTMENT') {
                                        alert("Por favor, informe o fornecedor.");
                                        return;
                                    }
                                    if (currentStep === 2 && cart.length === 0) {
                                        alert("Adicione pelo menos um produto ao carrinho.");
                                        return;
                                    }
                                    setCurrentStep(prev => Math.min(3, prev + 1));
                                }}
                                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                            >
                                Próximo <ChevronRight size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinalize}
                                className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-0.5"
                            >
                                <Save size={20} /> Finalizar Compra
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                /* HISTORY TAB */
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Fornecedor / NF</th>
                                <th className="p-4 text-right">Valor Total</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Vencimento</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {purchaseHistory.map(purchase => (
                                <tr key={purchase.id} className="hover:bg-gray-50">
                                    <td className="p-4">{new Date(purchase.date).toLocaleDateString('pt-BR')}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800">{purchase.description}</div>
                                        <div className="text-xs text-gray-500">{purchase.items?.length || 0} itens</div>
                                    </td>
                                    <td className="p-4 text-right font-bold text-red-600">R$ {purchase.amount.toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${purchase.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {purchase.status === 'PAID' ? 'Pago' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center text-gray-500">
                                        {purchase.dueDate ? new Date(purchase.dueDate).toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            {purchase.items && purchase.items.length > 0 && (
                                                <button
                                                    onClick={() => setViewPurchase(purchase)}
                                                    className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"
                                                    title="Ver Itens"
                                                >
                                                    <Package size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setCancelPurchaseId(purchase.id)}
                                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                                                title="Cancelar Compra"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {purchaseHistory.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400">
                                        Nenhuma compra registrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Mobile Navigation Bar for Purchases */}
            {activeTab === 'NEW_PURCHASE' && (
                <div className="md:hidden flex border-t bg-white h-16 shrink-0 absolute bottom-0 left-0 right-0 z-30">
                    <button
                        onClick={() => setMobileView('SEARCH')}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 ${mobileView === 'SEARCH' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500'}`}
                    >
                        <Search size={20} />
                        <span className="text-[10px] font-bold uppercase">Produtos</span>
                    </button>
                    <button
                        onClick={() => setMobileView('CART')}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 relative ${mobileView === 'CART' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}
                    >
                        <ShoppingCart size={20} />
                        <span className="text-[10px] font-bold uppercase">Itens</span>
                        {cart.length > 0 && (
                            <span className="absolute top-2 right-1/3 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[18px] text-center">
                                {cart.reduce((a, b) => a + b.qty, 0)}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* Modal de Visualização de Itens */}
            {viewPurchase && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in max-h-[95vh] flex flex-col">
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">Itens da Compra</h3>
                            <button onClick={() => setViewPurchase(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                <p><strong>Fornecedor:</strong> {viewPurchase.description}</p>
                                <p><strong>Data:</strong> {new Date(viewPurchase.date).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div className="space-y-2">
                                {viewPurchase.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm border-b pb-2">
                                        <div>
                                            <p className="font-bold text-gray-700">{item.name}</p>
                                            <p className="text-xs text-gray-500">Cód: {item.code}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800">{item.qty} un</p>
                                            <p className="text-xs text-gray-500">Custo: R$ {item.costPrice.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t font-bold text-lg mt-4">
                                <span>Total Nota</span>
                                <span className="text-red-600">R$ {viewPurchase.amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Cancelamento */}
            {cancelPurchaseId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in p-4 md:p-6 text-center max-h-[95vh] overflow-y-auto">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="text-red-600" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Cancelar esta compra?</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Esta ação irá reverter o estoque, cancelar as transações financeiras e criar um registro de auditoria. Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setCancelPurchaseId(null)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (cancelPurchaseId) {
                                        onCancelPurchase(cancelPurchaseId);
                                        setCancelPurchaseId(null);
                                    }
                                }}
                                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Confirmar Cancelamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isSuggestionModalOpen && (
                <PurchaseSuggestion
                    products={products}
                    onAddItems={handleAddSuggestedItems}
                    onClose={() => setIsSuggestionModalOpen(false)}
                />
            )}

            {/* Modal de Sucesso */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in p-6 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-emerald-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Compra Registrada!</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            A entrada de mercadoria foi processada com sucesso.
                        </p>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                if (onBack) onBack();
                            }}
                            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purchases;
