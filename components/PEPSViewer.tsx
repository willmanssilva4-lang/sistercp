import React, { useState, useEffect } from 'react';
import { Package, Calendar, DollarSign, TrendingDown, AlertCircle } from 'lucide-react';
import { getProductBatches, getAverageCost } from '../src/utils/pepsUtils';
import { Product } from '../types';

interface StockBatch {
    id: string;
    productId: string;
    transactionId?: string;
    qtyOriginal: number;
    qtyRemaining: number;
    costPrice: number;
    purchaseDate: string;
    expiryDate?: string;
}

interface PEPSViewerProps {
    products: Product[];
}

const PEPSViewer: React.FC<PEPSViewerProps> = ({ products }) => {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [batches, setBatches] = useState<StockBatch[]>([]);
    const [averageCost, setAverageCost] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    const loadBatches = async (productId: string) => {
        setLoading(true);
        try {
            const productBatches = await getProductBatches(productId);
            const avgCost = await getAverageCost(productId);
            setBatches(productBatches);
            setAverageCost(avgCost);
        } catch (error) {
            console.error('Erro ao carregar lotes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        loadBatches(product.id);
    };

    // Recarregar lotes quando o produto selecionado muda
    useEffect(() => {
        if (selectedProduct) {
            loadBatches(selectedProduct.id);
        }
    }, [selectedProduct?.id]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const getDaysUntilExpiry = (expiryDate: string) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const totalStock = batches.filter(b => b.qtyRemaining > 0).reduce((sum, b) => sum + b.qtyRemaining, 0);
    const totalValue = batches.filter(b => b.qtyRemaining > 0).reduce((sum, b) => sum + (b.qtyRemaining * b.costPrice), 0);
    const activeBatches = batches.filter(b => b.qtyRemaining > 0);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <Package className="text-blue-600" size={32} />
                            Visualizador de Lotes PEPS
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Controle de estoque pelo método Primeiro que Entra, Primeiro que Sai
                        </p>
                    </div>
                    {selectedProduct && (
                        <button
                            onClick={() => loadBatches(selectedProduct.id)}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Atualizar
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lista de Produtos */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="font-bold text-lg text-gray-800">Produtos</h2>
                                <p className="text-sm text-gray-500">Selecione para ver lotes</p>
                            </div>
                            <div className="max-h-[600px] overflow-y-auto">
                                {products.map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleProductSelect(product)}
                                        className={`w-full p-4 text-left border-b border-gray-100 hover:bg-blue-50 transition-colors ${selectedProduct?.id === product.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                            }`}
                                    >
                                        <div className="font-medium text-gray-800">{product.name}</div>
                                        <div className="text-sm text-gray-500">Código: {product.code}</div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            Estoque: <span className="font-semibold">{product.stock}</span> {product.unit}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Detalhes dos Lotes */}
                    <div className="lg:col-span-2">
                        {!selectedProduct ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                <Package className="mx-auto text-gray-300 mb-4" size={64} />
                                <p className="text-gray-500 text-lg">Selecione um produto para ver os lotes PEPS</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Resumo */}
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
                                    <h2 className="text-2xl font-bold mb-4">{selectedProduct.name}</h2>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-blue-200 text-sm">Total de Lotes</div>
                                            <div className="text-3xl font-bold">{activeBatches.length}</div>
                                        </div>
                                        <div>
                                            <div className="text-blue-200 text-sm">Estoque Total</div>
                                            <div className="text-3xl font-bold">{totalStock.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-blue-200 text-sm">Custo Médio</div>
                                            <div className="text-3xl font-bold">
                                                R$ {averageCost.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-blue-500">
                                        <div className="text-blue-200 text-sm">Valor Total em Estoque</div>
                                        <div className="text-2xl font-bold">
                                            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>

                                {/* Lista de Lotes */}
                                {loading ? (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-gray-500 mt-4">Carregando lotes...</p>
                                    </div>
                                ) : activeBatches.length === 0 ? (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                        <AlertCircle className="mx-auto text-yellow-500 mb-4" size={48} />
                                        <p className="text-gray-600 text-lg font-medium">Nenhum lote encontrado</p>
                                        <p className="text-gray-500 mt-2">
                                            Registre uma compra para criar lotes PEPS
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                                        <div className="p-4 border-b border-gray-200">
                                            <h3 className="font-bold text-lg text-gray-800">
                                                Lotes Disponíveis (Ordem PEPS)
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Ordenados por data de compra (mais antigos primeiro)
                                            </p>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {activeBatches.map((batch, index) => {
                                                const daysUntilExpiry = batch.expiryDate ? getDaysUntilExpiry(batch.expiryDate) : null;
                                                const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                                                const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

                                                return (
                                                    <div
                                                        key={batch.id}
                                                        className={`p-4 hover:bg-gray-50 transition-colors ${isExpired ? 'bg-red-50' : isExpiringSoon ? 'bg-yellow-50' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                                                                        LOTE #{index + 1}
                                                                    </span>
                                                                    {isExpired && (
                                                                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">
                                                                            VENCIDO
                                                                        </span>
                                                                    )}
                                                                    {isExpiringSoon && (
                                                                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                                                                            VENCE EM {daysUntilExpiry} DIAS
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                                                    <div>
                                                                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                                                                            <Calendar size={12} />
                                                                            Data de Compra
                                                                        </div>
                                                                        <div className="font-semibold text-gray-800">
                                                                            {formatDate(batch.purchaseDate)}
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                                                                            <Package size={12} />
                                                                            Quantidade
                                                                        </div>
                                                                        <div className="font-semibold text-gray-800">
                                                                            {batch.qtyRemaining.toFixed(2)} / {batch.qtyOriginal.toFixed(2)}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {((batch.qtyRemaining / batch.qtyOriginal) * 100).toFixed(0)}% restante
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                                                                            <DollarSign size={12} />
                                                                            Custo Unitário
                                                                        </div>
                                                                        <div className="font-semibold text-gray-800">
                                                                            R$ {batch.costPrice.toFixed(2)}
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                                                                            <TrendingDown size={12} />
                                                                            Valor Total
                                                                        </div>
                                                                        <div className="font-semibold text-gray-800">
                                                                            R$ {(batch.qtyRemaining * batch.costPrice).toFixed(2)}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {batch.expiryDate && (
                                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                                        <div className="text-xs text-gray-500">
                                                                            Validade: <span className="font-semibold">{formatDate(batch.expiryDate)}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PEPSViewer;
