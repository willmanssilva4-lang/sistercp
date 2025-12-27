
import React, { useState, useMemo } from 'react';
import { Product, Promotion, ProductKit, UserRole } from '../types';
import { Plus, Trash2, Calendar, Tag, Package, Search, Gift, X, Save, AlertCircle, Power, Edit, History } from 'lucide-react';

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
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });

    const [promoProductSearch, setPromoProductSearch] = useState('');
    const [promoProductPrice, setPromoProductPrice] = useState('');

    const [kitForm, setKitForm] = useState({
        name: '',
        code: '',
        price: '',
        items: [] as { productCode: string; qty: number; itemPrice: number }[]
    });

    // Kit Item Selection State
    const [kitItemSearch, setKitItemSearch] = useState('');
    const [kitItemQty, setKitItemQty] = useState(1);

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
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
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
                items: kitForm.items,
                active: true
            };
            onAddKit(newKit);
        }
        setIsModalOpen(false);
        setKitForm({ name: '', code: '', price: '', items: [] });
        setEditingKitId(null);
    };

    const handleEditKit = (kit: ProductKit) => {
        setEditingKitId(kit.id);
        setKitForm({
            name: kit.name,
            code: kit.code,
            price: kit.price.toString(),
            items: kit.items.map(i => ({
                productCode: i.productCode,
                qty: i.qty,
                itemPrice: (i as any).itemPrice || getProductPrice(i.productCode)
            }))
        });
        setIsModalOpen(true);
    };

    const addItemToKit = (product: Product) => {
        setKitForm(prev => {
            const existing = prev.items.find(i => i.productCode === product.code);
            if (existing) {
                return {
                    ...prev,
                    items: prev.items.map(i => i.productCode === product.code ? { ...i, qty: i.qty + kitItemQty } : i)
                };
            }
            return { ...prev, items: [...prev.items, { productCode: product.code, qty: kitItemQty, itemPrice: product.retailPrice }] };
        });
        setKitItemSearch('');
        setKitItemQty(1);
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
                            setKitForm({ name: '', code: '', price: '', items: [] });
                        } else {
                            setPromoForm({
                                name: '',
                                products: [],
                                startDate: new Date().toISOString().split('T')[0],
                                endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
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
                                const isDateValid = new Date() >= new Date(p.startDate) && new Date() <= new Date(p.endDate);
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
                                            <div className="flex items-center gap-1"><Calendar size={12} /> {new Date(p.startDate).toLocaleDateString('pt-BR')} até {new Date(p.endDate).toLocaleDateString('pt-BR')}</div>
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
                                <form onSubmit={handleKitSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Kit</label>
                                        <input required type="text" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 outline-none" placeholder="Ex: Kit Churrasco" value={kitForm.name} onChange={e => setKitForm({ ...kitForm, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Código do Kit (EAN Virtual)</label>
                                        <input required type="text" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 outline-none" placeholder="Ex: KIT001" value={kitForm.code} onChange={e => setKitForm({ ...kitForm, code: e.target.value })} />
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Adicionar Produtos ao Kit</label>
                                        <div className="flex gap-2 mb-2">
                                            <div className="relative flex-1">
                                                <input type="text" placeholder="Buscar item..." className="w-full border p-2 rounded text-sm" value={kitItemSearch} onChange={e => setKitItemSearch(e.target.value)} />
                                                {filteredKitProducts.length > 0 && (
                                                    <div className="absolute top-full left-0 w-full mt-1 bg-white border rounded shadow-xl max-h-32 overflow-y-auto z-10">
                                                        {filteredKitProducts.map(p => (
                                                            <div key={p.id} onClick={() => addItemToKit(p)} className="p-2 hover:bg-blue-50 cursor-pointer text-xs border-b">
                                                                {p.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <input type="number" min="1" className="w-16 border p-2 rounded text-sm text-center" value={kitItemQty} onChange={e => setKitItemQty(parseInt(e.target.value))} />
                                        </div>

                                        <div className="space-y-1 max-h-60 overflow-y-auto">
                                            {kitForm.items.map((item, idx) => (
                                                <div key={idx} className="flex flex-col bg-white p-2 rounded border border-gray-200 text-sm gap-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold">{item.qty}x {getProductName(item.productCode)} <span className="text-xs font-normal text-gray-500">({getProductUnit(item.productCode)})</span></span>
                                                        <button type="button" onClick={() => removeKitItem(idx)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                                        <span>Custo Unit.: R$ {getProductCostPrice(item.productCode).toFixed(2)}</span>
                                                        <div className="flex items-center gap-1">
                                                            <span>Preço no Kit:</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="w-20 border p-1 rounded text-right text-gray-800 font-medium"
                                                                value={item.itemPrice || ''}
                                                                onChange={e => updateKitItemPrice(idx, parseFloat(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <div className="flex justify-between text-xs text-blue-800">
                                            <span>Custo Total: <strong>R$ {calculateKitCostTotal().toFixed(2)}</strong></span>
                                            <span>Venda Original: <strong>R$ {calculateKitOriginalTotal().toFixed(2)}</strong></span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                            <label className="text-sm font-bold text-gray-700">Preço Final do Kit:</label>
                                            <input required type="number" step="0.01" className="w-24 border p-2 rounded font-bold text-emerald-600 text-right" value={kitForm.price} onChange={e => setKitForm({ ...kitForm, price: e.target.value })} />
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold mt-4 hover:bg-emerald-700 transition-colors">{editingKitId ? 'Salvar Alterações' : 'Criar Kit'}</button>
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
