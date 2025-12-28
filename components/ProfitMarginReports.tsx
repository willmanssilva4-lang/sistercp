import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, DollarSign, Percent, Calendar, Download } from 'lucide-react';

interface Product {
    id: string;
    code: string;
    name: string;
    category: string;
    costPrice: number;
    retailPrice: number;
    stock: number;
}

interface Sale {
    id: string;
    timestamp: string;
    items: { code: string; qty: number; appliedPrice: number; subtotal: number }[];
    total: number;
}

interface ProfitData {
    productCode: string;
    productName: string;
    category: string;
    qtySold: number;
    revenue: number;
    cost: number;
    profit: number;
    marginPercent: number;
}

interface ProfitMarginReportsProps {
    products: Product[];
    sales: Sale[];
}

export default function ProfitMarginReports({ products, sales }: ProfitMarginReportsProps) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [profitData, setProfitData] = useState<ProfitData[]>([]);
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        averageMargin: 0
    });

    useEffect(() => {
        // Set default dates (last 30 days)
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            calculateProfitMargins();
        }
    }, [startDate, endDate, selectedCategory, products, sales]);

    const calculateProfitMargins = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Filter sales by date range
        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.timestamp);
            return saleDate >= start && saleDate <= end;
        });

        // Calculate profit per product
        const profitMap = new Map<string, ProfitData>();

        filteredSales.forEach(sale => {
            sale.items.forEach(item => {
                const product = products.find(p => p.code === item.code);
                if (!product) return;

                // Filter by category if selected
                if (selectedCategory !== 'all' && product.category !== selectedCategory) return;

                const revenue = item.subtotal;
                const cost = product.costPrice * item.qty;
                const profit = revenue - cost;
                const marginPercent = revenue > 0 ? (profit / revenue) * 100 : 0;

                if (profitMap.has(item.code)) {
                    const existing = profitMap.get(item.code)!;
                    existing.qtySold += item.qty;
                    existing.revenue += revenue;
                    existing.cost += cost;
                    existing.profit += profit;
                    existing.marginPercent = existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0;
                } else {
                    profitMap.set(item.code, {
                        productCode: item.code,
                        productName: product.name,
                        category: product.category,
                        qtySold: item.qty,
                        revenue,
                        cost,
                        profit,
                        marginPercent
                    });
                }
            });
        });

        const data = Array.from(profitMap.values()).sort((a, b) => b.profit - a.profit);
        setProfitData(data);

        // Calculate summary
        const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
        const totalCost = data.reduce((sum, item) => sum + item.cost, 0);
        const totalProfit = totalRevenue - totalCost;
        const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        setSummary({
            totalRevenue,
            totalCost,
            totalProfit,
            averageMargin
        });
    };

    const categories = ['all', ...new Set(products.map(p => p.category))];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const exportToCSV = () => {
        const headers = ['Código', 'Produto', 'Categoria', 'Qtd Vendida', 'Receita', 'Custo', 'Lucro', 'Margem %'];
        const rows = profitData.map(item => [
            item.productCode,
            item.productName,
            item.category,
            item.qtySold.toString(),
            item.revenue.toFixed(2),
            item.cost.toFixed(2),
            item.profit.toFixed(2),
            item.marginPercent.toFixed(2)
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `margem_lucro_${startDate}_${endDate}.csv`;
        a.click();
    };

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Relatório de Margem de Lucro</h1>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto justify-center"
                >
                    <Download className="w-5 h-5" />
                    Exportar CSV
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data Inicial
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data Final
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categoria
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todas</option>
                            {categories.filter(c => c !== 'all').map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <DollarSign className="w-8 h-8 opacity-80" />
                    </div>
                    <p className="text-blue-100 text-sm mb-1">Receita Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <Package className="w-8 h-8 opacity-80" />
                    </div>
                    <p className="text-orange-100 text-sm mb-1">Custo Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary.totalCost)}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-8 h-8 opacity-80" />
                    </div>
                    <p className="text-green-100 text-sm mb-1">Lucro Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary.totalProfit)}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <Percent className="w-8 h-8 opacity-80" />
                    </div>
                    <p className="text-purple-100 text-sm mb-1">Margem Média</p>
                    <p className="text-2xl font-bold">{summary.averageMargin.toFixed(2)}%</p>
                </div>
            </div>

            {/* Profit Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qtd Vendida</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Receita</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Custo</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lucro</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margem %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {profitData.map((item) => (
                                <tr key={item.productCode} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-mono">{item.productCode}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{item.productName}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right">{item.qtySold.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                                        {formatCurrency(item.revenue)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-orange-600">
                                        {formatCurrency(item.cost)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                        {formatCurrency(item.profit)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right">
                                        <span className={`font-bold ${item.marginPercent >= 30 ? 'text-green-600' :
                                            item.marginPercent >= 15 ? 'text-yellow-600' :
                                                'text-red-600'
                                            }`}>
                                            {item.marginPercent.toFixed(2)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
