
import React, { useState, useMemo } from 'react';
import { Product, Promotion, ProductKit, UserRole } from '../types';
import { Plus, Trash2, Calendar, Tag, Package, Search, Gift, X, Save, AlertCircle, Power, Edit, History, Scale, Barcode } from 'lucide-react';

interface PromotionsProps {
    products: Product[];
    promotions: Promotion[];
    kits: ProductKit[];
    onAddPromotion: (p: Promotion) => void;
    onUpdatePromotion: (p: Promotion) => void;
    onDeletePromotion: (id: string) => void;
    onAddKit: (k: ProductKit) => void;
    onUpdateKit: (k: ProductKit) => void;
    onDeleteKit: (id: string) => void;
    userRole: UserRole;
}

const Promotions: React.FC<PromotionsProps> = ({
    products, promotions, kits, onAddPromotion, onUpdatePromotion, onDeletePromotion, onAddKit, onUpdateKit, onDeleteKit, userRole
}) => {
    // Helper to get local date string in YYYY-MM-DD format
    const getLocalDateString = (daysOffset: number = 0) => {
        const now = new Date();
        now.setDate(now.getDate() + daysOffset);
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [activeTab, setActiveTab] = useState<'OFFERS' | 'KITS' | 'HISTORY'>('OFFERS');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [promoToDelete, setPromoToDelete] = useState<string[] | null>(null);

    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [editingKitId, setEditingKitId] = useState<string | null>(null);

    // Forms
    const [promoForm, setPromoForm] = useState({
        name: '',
        products: [] as { productCode: string; promotionalPrice: number }[],
        startDate: getLocalDateString(),
        endDate: getLocalDateString(7)
    });

    const [promoProductSearch, setPromoProductSearch] = useState('');
    const [promoProductPrice, setPromoProductPrice] = useState('');

    const [kitForm, setKitForm] = useState({
        name: '',
        code: '',
        price: '',
        unit: 'UN',
        items: [] as { productCode: string; qty: number; itemPrice: number }[]
    });

    // Kit Item Selection State
    const [kitItemSearch, setKitItemSearch] = useState('');
    const [kitItemQty, setKitItemQty] = useState('1');

    // Calculator State
    const [showCalculator, setShowCalculator] = useState(false);
    const [calcTotalVolume, setCalcTotalVolume] = useState('');
    const [calcDesiredVolume, setCalcDesiredVolume] = useState('');

    // --- HELPERS ---
    const getProductName = (code: string) => products.find(p => p.code === code)?.name || 'Produto não encontrado';

    const getProductPrice = (code: string) => products.find(p => p.code === code)?.retailPrice || 0;
    const getProductCostPrice = (code: string) => products.find(p => p.code === code)?.costPrice || 0;
    const getProductUnit = (code: string) => products.find(p => p.code === code)?.unit || 'UN';

    const showAlert = (msg: string) => setAlertMessage(msg);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return [];
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm));
    }, [products, searchTerm]);

    const filteredKitProducts = useMemo(() => {
        if (!kitItemSearch) return [];
        return products.filter(p => p.name.toLowerCase().includes(kitItemSearch.toLowerCase()) || p.code.includes(kitItemSearch));
    }, [products, kitItemSearch]);

    const filteredPromoProducts = useMemo(() => {
        if (!promoProductSearch) return [];
        return products.filter(p => p.name.toLowerCase().includes(promoProductSearch.toLowerCase()) || p.code.includes(promoProductSearch));
    }, [products, promoProductSearch]);


    // --- HANDLERS ---
    const handlePromoSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (promoForm.products.length === 0) {
            showAlert("Adicione pelo menos um produto à campanha.");
            return;
        }

        // Create one promotion per product
        promoForm.products.forEach(item => {
            const newPromo: Promotion = {
                id: crypto.randomUUID(),
                name: promoForm.name,
                type: 'SIMPLE_DISCOUNT',
                productCode: item.productCode,
                promotionalPrice: item.promotionalPrice,
                startDate: promoForm.startDate,
                endDate: promoForm.endDate,
                active: true
            };
            onAddPromotion(newPromo);
        });

        setIsModalOpen(false);
        setPromoForm({
            name: '',
            products: [],
            startDate: getLocalDateString(),
            endDate: getLocalDateString(7)
        });
    };

    const addProductToPromo = (product: Product) => {
        const price = parseFloat(promoProductPrice);
        if (isNaN(price) || price <= 0) {
            showAlert("Digite um preço promocional válido.");
            return;
        }

        setPromoForm(prev => {
            const existing = prev.products.find(p => p.productCode === product.code);
            if (existing) {
                showAlert("Este produto já está na campanha.");
                return prev;
            }
            return {
                ...prev,
                products: [...prev.products, { productCode: product.code, promotionalPrice: price }]
            };
        });
        setPromoProductSearch('');
        setPromoProductPrice('');
    };

    const removeProductFromPromo = (idx: number) => {
        setPromoForm(prev => ({
            ...prev,
            products: prev.products.filter((_, i) => i !== idx)
        }));
    };

    const handleKitSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (kitForm.items.length === 0) {
            showAlert("Adicione pelo menos um produto ao kit.");
            return;
        }

        const parsedPrice = parseFloat(kitForm.price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            showAlert("Preço do kit inválido.");
            return;
        }

        if (editingKitId) {
            const existingKit = kits.find(k => k.id === editingKitId);
            const updatedKit: ProductKit = {
                id: editingKitId,
                name: kitForm.name,
                code: kitForm.code,
                price: parsedPrice,
                unit: kitForm.unit,
                items: kitForm.items,
                active: existingKit ? existingKit.active : true
            };
            onUpdateKit(updatedKit);
        } else {
            const newKit: ProductKit = {
                id: crypto.randomUUID(),
                name: kitForm.name,
                code: kitForm.code,
                price: parsedPrice,
                unit: kitForm.unit,
                items: kitForm.items,
                active: true
            };
            onAddKit(newKit);
        }
        setIsModalOpen(false);
        setKitForm({ name: '', code: '', price: '', unit: 'UN', items: [] });
        setEditingKitId(null);
    };

    const handleEditKit = (kit: ProductKit) => {
        setEditingKitId(kit.id);
        setKitForm({
            name: kit.name,
            code: kit.code,
            price: kit.price.toString(),
            unit: kit.unit || 'UN',
            items: kit.items.map(i => ({
                productCode: i.productCode,
                qty: i.qty,
                itemPrice: (i as any).itemPrice || getProductPrice(i.productCode)
            }))
        });
        setIsModalOpen(true);
    };

    const addItemToKit = (product: Product) => {
        const qty = parseFloat(kitItemQty);
        if (isNaN(qty) || qty <= 0) {
            showAlert("Quantidade inválida.");
            return;
        }

        setKitForm(prev => {
            const existing = prev.items.find(i => i.productCode === product.code);
            if (existing) {
                return {
                    ...prev,
                    items: prev.items.map(i => i.productCode === product.code ? { ...i, qty: i.qty + qty } : i)
                };
            }
            return { ...prev, items: [...prev.items, { productCode: product.code, qty: qty, itemPrice: product.retailPrice }] };
        });
        setKitItemSearch('');
        setKitItemQty('1');
    };

    const removeKitItem = (idx: number) => {
        setKitForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx)
        }));
    };

    const calculateKitOriginalTotal = () => {
        return kitForm.items.reduce((acc, item) => {
            return acc + (getProductPrice(item.productCode) * item.qty);
        }, 0);
    };

    const calculateKitCostTotal = () => {
        return kitForm.items.reduce((acc, item) => {
            return acc + (getProductCostPrice(item.productCode) * item.qty);
        }, 0);
    };

    const updateKitItemPrice = (idx: number, newPrice: number) => {
        setKitForm(prev => {
            const newItems = [...prev.items];
            newItems[idx] = { ...newItems[idx], itemPrice: newPrice };
            const newTotal = newItems.reduce((acc, item) => acc + (item.itemPrice * item.qty), 0);
            return { ...prev, items: newItems, price: newTotal.toFixed(2) };
        });
    };

    // Toggle Handlers
    const togglePromotion = (p: Promotion) => {
        onUpdatePromotion({ ...p, active: !p.active });
    };

    const toggleKit = (k: ProductKit) => {
        onUpdateKit({ ...k, active: !k.active });
    };

    const groupedPromotions = useMemo(() => {
        const groups: { [key: string]: Promotion[] } = {};
        promotions.forEach(p => {
            const key = `${p.name}|${p.startDate}|${p.endDate}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });
        return Object.values(groups);
    }, [promotions]);

    const visiblePromotions = useMemo(() => {
        if (activeTab === 'KITS') return [];
        const now = new Date();
        return groupedPromotions.filter(group => {
            const p = group[0];
            // Consider end of day for expiry
            const endDate = new Date(p.endDate + 'T23:59:59');
            const isExpired = now > endDate;

            if (activeTab === 'HISTORY') return isExpired;
            return !isExpired;
        });
    }, [groupedPromotions, activeTab]);

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Promoções & Kits</h2>
                    <p className="text-gray-500 text-sm">Gerencie ofertas temporárias e combos de produtos</p>
                </div>
                <button
                    onClick={() => {
                        if (activeTab === 'KITS') {
                            setEditingKitId(null);
                            setKitForm({ name: '', code: '', price: '', unit: 'UN', items: [] });
                        } else {
                            setPromoForm({
                                name: '',
                                products: [],
                                startDate: getLocalDateString(),
                                endDate: getLocalDateString(7)
                            });
                        }
                        setIsModalOpen(true);
                    }}
                    className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                >
                    <Plus size={20} /> {activeTab === 'KITS' ? 'Novo Kit' : 'Nova Oferta'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 mb-6 w-fit overflow-hidden">
                <button
                    onClick={() => setActiveTab('OFFERS')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'OFFERS' ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Tag size={18} /> Ofertas & Descontos
                </button>
                <button
                    onClick={() => setActiveTab('KITS')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'KITS' ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Gift size={18} /> Kits & Combos
                </button>
                <button
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'HISTORY' ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <History size={18} /> Histórico
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-y-auto">
                {activeTab !== 'KITS' ? (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="p-4">Campanha / Produto</th>
                                <th className="p-4">Período</th>
                                <th className="p-4 text-right">Preço Original</th>
                                <th className="p-4 text-right">Preço Oferta</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {visiblePromotions.map(group => {
                                const p = group[0];
                                // Ensure we have just the date part YYYY-MM-DD
                                const startStr = p.startDate.split('T')[0];
                                const endStr = p.endDate.split('T')[0];

                                const isDateValid = new Date() >= new Date(startStr + 'T00:00:00') && new Date() <= new Date(endStr + 'T23:59:59');
                                const allActive = group.every(item => item.active);
                                const statusLabel = !allActive ? 'Desativada' : (isDateValid ? 'Ativa' : 'Expirada/Futura');
                                const statusColor = !allActive ? 'bg-gray-100 text-gray-500 border-gray-200' : (isDateValid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200');

                                return (
                                    <tr key={p.id} className={`hover:bg-gray-50 ${!allActive ? 'opacity-75' : ''}`}>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800">{p.name}</div>
                                            <div className="flex flex-col gap-1 mt-1">
                                                {group.map(item => (
                                                    <div key={item.id} className="text-xs text-gray-500">
                                                        {getProductName(item.productCode)}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {startStr.split('-').reverse().join('/')} até {endStr.split('-').reverse().join('/')}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right text-gray-500">
                                            {group.map(item => (
                                                <div key={item.id} className="text-xs line-through">R$ {getProductPrice(item.productCode).toFixed(2)}</div>
                                            ))}
                                        </td>
                                        <td className="p-4 text-right font-bold text-emerald-600">
                                            {group.map(item => (
                                                <div key={item.id} className="text-xs">R$ {item.promotionalPrice.toFixed(2)}</div>
                                            ))}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => group.forEach(item => togglePromotion(item))}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 mx-auto transition-colors ${statusColor}`}
                                                title="Clique para Ativar/Desativar Todos"
                                            >
                                                <Power size={10} /> {statusLabel}
                                            </button>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => {
                                                if (userRole !== UserRole.ADMIN) {
                                                    showAlert("Apenas administradores podem excluir promoções.");
                                                    return;
                                                }
                                                setPromoToDelete(group.map(item => item.id));
                                            }} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {visiblePromotions.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhuma oferta encontrada.</td></tr>}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="p-4">Nome do Kit</th>
                                <th className="p-4">Cód. Kit</th>
                                <th className="p-4">Itens Inclusos</th>
                                <th className="p-4 text-right">Preço Venda</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {kits.map(k => (
                                <tr key={k.id} className={`hover:bg-gray-50 ${!k.active ? 'opacity-75' : ''}`}>
                                    <td className="p-4 font-bold text-gray-800 flex items-center gap-2"><Package size={16} className="text-purple-500" /> {k.name}</td>
                                    <td className="p-4 text-gray-600 font-mono bg-gray-50 w-fit px-2 rounded border border-gray-100">{k.code}</td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            {k.items.map((item, idx) => (
                                                <span key={idx} className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded w-fit">
                                                    {item.qty}x {getProductName(item.productCode)}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-bold text-emerald-600">R$ {k.price.toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => toggleKit(k)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 mx-auto transition-colors ${k.active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                                            title="Clique para Ativar/Desativar"
                                        >
                                            <Power size={10} /> {k.active ? 'Ativo' : 'Inativo'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-center flex justify-center gap-2">
                                        <button onClick={() => handleEditKit(k)} className="text-blue-400 hover:text-blue-600"><Edit size={18} /></button>
                                        <button onClick={() => onDeleteKit(k.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                            {kits.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum kit cadastrado.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>

            {/* --- MODALS --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in">
                        <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-gray-800">{activeTab !== 'KITS' ? 'Nova Campanha de Oferta' : (editingKitId ? 'Editar Kit' : 'Criar Novo Kit')}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>

                        <div className="p-6">
                            {activeTab !== 'KITS' ? (
                                <form onSubmit={handlePromoSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Campanha</label>
                                        <input required type="text" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 outline-none" placeholder="Ex: Oferta de Natal" value={promoForm.name} onChange={e => setPromoForm({ ...promoForm, name: e.target.value })} />
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Adicionar Produtos à Campanha</label>
                                        <div className="flex gap-2 mb-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Buscar produto..."
                                                    className="w-full border p-2 rounded text-sm"
                                                    value={promoProductSearch}
                                                    onChange={e => setPromoProductSearch(e.target.value)}
                                                />
                                                {filteredPromoProducts.length > 0 && (
                                                    <div className="absolute top-full left-0 w-full mt-1 bg-white border rounded shadow-xl max-h-32 overflow-y-auto z-10">
                                                        {filteredPromoProducts.map(p => (
                                                            <div
                                                                key={p.id}
                                                                onClick={() => {
                                                                    setPromoProductSearch(p.name);
                                                                    setPromoProductPrice(p.retailPrice.toString());
                                                                }}
                                                                className="p-2 hover:bg-emerald-50 cursor-pointer text-xs border-b"
                                                            >
                                                                <div className="font-bold">{p.name}</div>
                                                                <div className="text-gray-500">Preço atual: R$ {p.retailPrice.toFixed(2)}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="Preço"
                                                className="w-24 border p-2 rounded text-sm text-right font-bold text-emerald-600"
                                                value={promoProductPrice}
                                                onChange={e => setPromoProductPrice(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const product = products.find(p => p.name === promoProductSearch);
                                                    if (product) addProductToPromo(product);
                                                }}
                                                className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        <div className="space-y-1 max-h-60 overflow-y-auto">
                                            {promoForm.products.map((item, idx) => {
                                                const product = products.find(p => p.code === item.productCode);
                                                const originalPrice = product?.retailPrice || 0;
                                                const discount = originalPrice > 0 ? ((originalPrice - item.promotionalPrice) / originalPrice * 100) : 0;

                                                return (
                                                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 text-sm">
                                                        <div className="flex-1">
                                                            <div className="font-bold">{getProductName(item.productCode)}</div>
                                                            <div className="text-xs text-gray-500">
                                                                De R$ {originalPrice.toFixed(2)} por R$ {item.promotionalPrice.toFixed(2)}
                                                                <span className="ml-2 text-emerald-600 font-bold">({discount.toFixed(0)}% OFF)</span>
                                                            </div>
                                                        </div>
                                                        <button type="button" onClick={() => removeProductFromPromo(idx)} className="text-red-400 hover:text-red-600 ml-2">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                            {promoForm.products.length === 0 && (
                                                <div className="text-center text-gray-400 text-xs py-4">
                                                    Nenhum produto adicionado
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                                            <input required type="date" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 outline-none" value={promoForm.startDate} onChange={e => setPromoForm({ ...promoForm, startDate: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                                            <input required type="date" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 outline-none" value={promoForm.endDate} onChange={e => setPromoForm({ ...promoForm, endDate: e.target.value })} />
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold mt-4 hover:bg-emerald-700 transition-colors">
                                        Salvar Campanha ({promoForm.products.length} produto{promoForm.products.length !== 1 ? 's' : ''})
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleKitSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        <div className="md:col-span-8">
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Kit</label>
                                            <div className="relative">
                                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    required
                                                    type="text"
                                                    className="w-full border border-gray-300 pl-10 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                                    placeholder="Ex: Kit Churrasco Premium"
                                                    value={kitForm.name}
                                                    onChange={e => setKitForm({ ...kitForm, name: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Unidade</label>
                                            <div className="relative">
                                                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <select
                                                    className="w-full border border-gray-300 pl-10 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none bg-white"
                                                    value={kitForm.unit}
                                                    onChange={e => setKitForm({ ...kitForm, unit: e.target.value })}
                                                >
                                                    <option value="UN">UN - Unidade</option>
                                                    <option value="KG">KG - Quilograma</option>
                                                    <option value="L">L - Litro</option>
                                                    <option value="ML">ML - Mililitro</option>
                                                    <option value="CX">CX - Caixa</option>
                                                    <option value="PCT">PCT - Pacote</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Código do Kit (EAN Virtual)</label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                required
                                                type="text"
                                                className="w-full border border-gray-300 pl-10 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                                placeholder="Ex: KIT001"
                                                value={kitForm.code}
                                                onChange={e => setKitForm({ ...kitForm, code: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                            <Gift size={14} /> Composição do Kit
                                        </label>

                                        <div className="flex gap-2 mb-3">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar produtos para adicionar..."
                                                    className="w-full border border-gray-300 pl-9 p-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                    value={kitItemSearch}
                                                    onChange={e => setKitItemSearch(e.target.value)}
                                                />
                                                {filteredKitProducts.length > 0 && (
                                                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-20">
                                                        {filteredKitProducts.map(p => (
                                                            <div
                                                                key={p.id}
                                                                onClick={() => addItemToKit(p)}
                                                                className="p-2.5 hover:bg-emerald-50 cursor-pointer text-sm border-b border-gray-50 last:border-0 flex justify-between items-center group"
                                                            >
                                                                <span className="font-medium text-gray-700 group-hover:text-emerald-700">{p.name}</span>
                                                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full group-hover:bg-emerald-100 group-hover:text-emerald-600">R$ {p.retailPrice.toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-24">
                                                <input
                                                    type="number"
                                                    min="0.000001"
                                                    step="0.000001"
                                                    className="w-full border border-gray-300 p-2 rounded-lg text-sm text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                                                    value={kitItemQty}
                                                    onChange={e => setKitItemQty(e.target.value)}
                                                    placeholder="Qtd"
                                                    title="Quantidade (ex: 0.5 para 500g/ml)"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowCalculator(!showCalculator)}
                                                className={`p-2 rounded-lg border transition-colors ${showCalculator ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'}`}
                                                title="Calculadora de Conversão"
                                            >
                                                <div className="flex items-center justify-center w-5 h-5 font-bold text-xs">
                                                    %
                                                </div>
                                            </button>
                                        </div>

                                        {showCalculator && (
                                            <div className="mb-4 bg-emerald-50 p-3 rounded-lg border border-emerald-100 animate-fade-in">
                                                <label className="block text-xs font-bold text-emerald-800 mb-2 uppercase">Conversor de Medidas (Regra de 3)</label>
                                                <div className="flex items-end gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] text-emerald-700 mb-1">Total na Embalagem (ex: 2000ml)</label>
                                                        <input
                                                            type="number"
                                                            className="w-full border border-emerald-200 p-1.5 rounded text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                                            placeholder="Ex: 2000"
                                                            value={calcTotalVolume}
                                                            onChange={e => setCalcTotalVolume(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] text-emerald-700 mb-1">Qtd. Desejada (ex: 0.04ml)</label>
                                                        <input
                                                            type="number"
                                                            className="w-full border border-emerald-200 p-1.5 rounded text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                                            placeholder="Ex: 0.04"
                                                            value={calcDesiredVolume}
                                                            onChange={e => setCalcDesiredVolume(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex-none pb-0.5">
                                                        <span className="text-emerald-400 font-bold">=</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] text-emerald-700 mb-1">Resultado (Fração)</label>
                                                        <div className="w-full bg-white border border-emerald-200 p-1.5 rounded text-sm font-bold text-emerald-800 h-[34px] flex items-center">
                                                            {calcTotalVolume && calcDesiredVolume && parseFloat(calcTotalVolume) > 0
                                                                ? (parseFloat(calcDesiredVolume) / parseFloat(calcTotalVolume)).toFixed(6)
                                                                : '0.000000'}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (calcTotalVolume && calcDesiredVolume && parseFloat(calcTotalVolume) > 0) {
                                                                const result = parseFloat(calcDesiredVolume) / parseFloat(calcTotalVolume);
                                                                setKitItemQty(result.toFixed(6));
                                                                setShowCalculator(false);
                                                            }
                                                        }}
                                                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 h-[34px]"
                                                    >
                                                        Usar
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-emerald-600 mt-2 italic">
                                                    Ex: Se o frasco tem 2000ml e você quer 0.04ml, o sistema calculará a fração (0.000020) para descontar corretamente do estoque.
                                                </p>
                                            </div>
                                        )}

                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                            {kitForm.items.map((item, idx) => (
                                                <div key={idx} className="flex flex-col bg-white p-3 rounded-lg border border-gray-200 shadow-sm gap-2 hover:border-emerald-200 transition-colors">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">{item.qty}x</span>
                                                            <span className="font-bold text-gray-700">{getProductName(item.productCode)}</span>
                                                            <span className="text-xs text-gray-400">({getProductUnit(item.productCode)})</span>
                                                        </div>
                                                        <button type="button" onClick={() => removeKitItem(idx)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-full transition-colors"><X size={16} /></button>
                                                    </div>

                                                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md mt-1">
                                                        <div className="text-xs text-gray-500">
                                                            Custo Unit.: <span className="font-medium">R$ {getProductCostPrice(item.productCode).toFixed(2)}</span>
                                                            <span className="mx-2">|</span>
                                                            Custo Porção: <span className="font-medium text-emerald-600">R$ {(getProductCostPrice(item.productCode) * item.qty).toFixed(4)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium text-gray-600">Preço no Kit:</span>
                                                            <div className="relative">
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">R$</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="w-20 border border-gray-300 py-1 pl-6 pr-1 rounded text-right text-sm font-bold text-gray-800 focus:ring-1 focus:ring-emerald-500 outline-none"
                                                                    value={item.itemPrice || ''}
                                                                    onChange={e => updateKitItemPrice(idx, parseFloat(e.target.value))}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {kitForm.items.length === 0 && (
                                                <div className="text-center py-8 text-gray-400 bg-white rounded-lg border border-dashed border-gray-300">
                                                    <Package size={32} className="mx-auto mb-2 opacity-20" />
                                                    <p className="text-sm">Nenhum produto adicionado ao kit</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                                        <div className="flex justify-between text-sm text-blue-800">
                                            <span>Custo Total dos Itens:</span>
                                            <strong>R$ {calculateKitCostTotal().toFixed(4)}</strong>
                                        </div>
                                        <div className="flex justify-between text-sm text-blue-800/70">
                                            <span>Valor de Venda (Soma):</span>
                                            <strong>R$ {calculateKitOriginalTotal().toFixed(2)}</strong>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-blue-200 mt-1">
                                            <label className="text-base font-bold text-gray-800">Preço Final do Kit:</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 font-bold">R$</span>
                                                <input
                                                    required
                                                    type="number"
                                                    step="0.01"
                                                    className="w-32 border-2 border-emerald-100 pl-8 pr-3 py-2 rounded-lg font-bold text-emerald-700 text-xl text-right focus:border-emerald-500 focus:ring-0 outline-none shadow-sm"
                                                    value={kitForm.price}
                                                    onChange={e => setKitForm({ ...kitForm, price: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 transition-all transform hover:-translate-y-0.5">
                                        {editingKitId ? 'Salvar Alterações' : 'Criar Kit'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- DELETE CONFIRMATION MODAL --- */}
            {promoToDelete && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="text-red-600" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Excluir esta promoção?</h3>
                        <p className="text-gray-500 text-sm mb-6">Esta ação não pode ser desfeita.</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setPromoToDelete(null)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (promoToDelete) {
                                        promoToDelete.forEach(id => onDeletePromotion(id));
                                        setPromoToDelete(null);
                                    }
                                }}
                                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SYSTEM ALERT MODAL --- */}
            {alertMessage && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in p-6 text-center">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="text-yellow-600" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Atenção</h3>
                        <p className="text-gray-500 text-sm mb-6">{alertMessage}</p>
                        <button
                            onClick={() => setAlertMessage(null)}
                            className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                            Entendi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Promotions;
