import React, { useState, useMemo, useEffect } from 'react';
import { Product, Sale } from '../types';
import { ShoppingCart, Check, X, AlertTriangle, TrendingUp, Package } from 'lucide-react';

interface PurchaseSuggestionProps {
    products: Product[];
    onAddItems: (items: { product: Product; qty: number }[]) => void;
    onClose: () => void;
}

const PurchaseSuggestion: React.FC<PurchaseSuggestionProps> = ({ products, onAddItems, onClose }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [sales, setSales] = useState<Sale[]>([]);

    // Carregar vendas do localStorage para cálculo de sugestão
    useEffect(() => {
        const savedSales = localStorage.getItem('mm_sales');
        if (savedSales) {
            setSales(JSON.parse(savedSales));
        }
    }, []);

    // Calcular média de vendas diárias (últimos 30 dias)
    const productSalesStats = useMemo(() => {
        const stats: Record<string, number> = {};
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        sales.forEach(sale => {
            const saleDate = new Date(sale.timestamp);
            if (saleDate >= thirtyDaysAgo) {
                sale.items.forEach(item => {
                    // Tentar encontrar o ID do produto. 
                    // No SaleItem, item.id é o product_id (ver App.tsx fetchSales)
                    stats[item.id] = (stats[item.id] || 0) + item.qty;
                });
            }
        });
        return stats;
    }, [sales]);

    // Filtrar produtos que precisam de reposição (estoque <= estoque mínimo OU estoque < cobertura de vendas)
    const suggestions = useMemo(() => {
        return products
            .map(p => {
                const salesLast30Days = productSalesStats[p.id] || 0;
                const dailySales = salesLast30Days / 30;

                // Meta: Cobrir 30 dias de vendas ou respeitar o estoque mínimo (o que for maior)
                // Se não houver vendas, usa apenas o estoque mínimo * 3 como antes
                let targetStock = 0;

                if (salesLast30Days > 0) {
                    targetStock = Math.ceil(dailySales * 30); // Cobrir próximos 30 dias
                    // Se o target for muito baixo mas tiver minStock, garante pelo menos o minStock
                    if (targetStock < p.minStock) targetStock = p.minStock;
                } else {
                    // Fallback para lógica antiga se não tiver vendas
                    targetStock = p.minStock > 0 ? p.minStock * 3 : 10;
                }

                const suggestQty = Math.max(targetStock - p.stock, 0);

                return {
                    ...p,
                    suggestQty,
                    salesLast30Days,
                    targetStock
                };
            })
            .filter(p => p.suggestQty > 0); // Mostrar apenas se tiver sugestão de compra
    }, [products, productSalesStats]);

    // Inicializar quantidades e seleção quando as sugestões mudarem
    useMemo(() => {
        const initialQty: Record<string, number> = {};
        const initialSel = new Set<string>();
        suggestions.forEach(p => {
            initialQty[p.id] = p.suggestQty;
            initialSel.add(p.id); // Selecionar todos por padrão
        });
        setQuantities(initialQty);
        setSelectedIds(initialSel);
    }, [suggestions]);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const updateQty = (id: string, qty: number) => {
        setQuantities(prev => ({ ...prev, [id]: qty }));
    };

    const handleConfirm = () => {
        const itemsToAdd = suggestions
            .filter(p => selectedIds.has(p.id))
            .map(p => ({
                product: p,
                qty: quantities[p.id] || 1
            }));

        onAddItems(itemsToAdd);
        onClose();
    };

    const totalCost = suggestions
        .filter(p => selectedIds.has(p.id))
        .reduce((acc, p) => acc + (p.costPrice * (quantities[p.id] || 0)), 0);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in">
                {/* Cabeçalho */}
                <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl flex items-center gap-2">
                            <TrendingUp className="text-emerald-400" /> Sugestão de Compras
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                            Produtos com estoque baixo ({suggestions.length} itens encontrados)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                    {suggestions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Check size={64} className="mb-4 text-emerald-500 bg-emerald-100 p-4 rounded-full" />
                            <h4 className="text-xl font-bold text-gray-700">Tudo Certo!</h4>
                            <p>Nenhum produto precisa de reposição no momento.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 text-gray-600 font-bold text-sm uppercase">
                                    <tr>
                                        <th className="p-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.size === suggestions.length && suggestions.length > 0}
                                                onChange={() => {
                                                    if (selectedIds.size === suggestions.length) {
                                                        setSelectedIds(new Set());
                                                    } else {
                                                        setSelectedIds(new Set(suggestions.map(s => s.id)));
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                        </th>
                                        <th className="p-4">Produto</th>
                                        <th className="p-4 text-center">Vendas (30d)</th>
                                        <th className="p-4 text-center">Estoque Atual</th>
                                        <th className="p-4 text-center">Meta</th>
                                        <th className="p-4 text-center w-32">Sugestão (Qtd)</th>
                                        <th className="p-4 text-right">Custo Est.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {suggestions.map(p => (
                                        <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(p.id) ? 'bg-emerald-50/30' : ''}`}>
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(p.id)}
                                                    onChange={() => toggleSelection(p.id)}
                                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800">{p.name}</div>
                                                <div className="text-xs text-gray-500">{p.code}</div>
                                            </td>
                                            <td className="p-4 text-center text-blue-600 font-medium">
                                                {p.salesLast30Days}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded font-bold text-xs ${p.stock <= p.minStock ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {p.stock}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-gray-500 font-medium">
                                                {p.targetStock}
                                            </td>
                                            <td className="p-4">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={quantities[p.id] || ''}
                                                    onChange={(e) => updateQty(p.id, parseInt(e.target.value) || 0)}
                                                    className="w-full border border-gray-300 rounded-lg p-2 text-center font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                            </td>
                                            <td className="p-4 text-right font-medium text-gray-700">
                                                R$ {(p.costPrice * (quantities[p.id] || 0)).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Rodapé */}
                <div className="p-6 bg-white border-t border-gray-200 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-500">Total Estimado</p>
                        <p className="text-2xl font-bold text-emerald-700">R$ {totalCost.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedIds.size === 0}
                            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <ShoppingCart size={20} />
                            Adicionar {selectedIds.size} Itens à Compra
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseSuggestion;
