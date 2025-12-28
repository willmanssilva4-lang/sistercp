import React, { useState, useMemo } from 'react';
import { Sale, Product } from '../types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend, ComposedChart, Area
} from 'recharts';
import {
    TrendingUp, Download, Calendar, Package, DollarSign, BarChart3,
    FileText, ArrowLeft, Filter, RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AdvancedReportsProps {
    sales: Sale[];
    products: Product[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AdvancedReports: React.FC<AdvancedReportsProps> = ({ sales, products }) => {
    const [currentView, setCurrentView] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [compareStartDate, setCompareStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 60)).toISOString().split('T')[0]);
    const [compareEndDate, setCompareEndDate] = useState(new Date(new Date().setDate(new Date().getDate() - 31)).toISOString().split('T')[0]);

    // Filtrar vendas por período
    const filteredSales = useMemo(() => {
        return sales.filter(s => {
            const date = s.timestamp.substring(0, 10);
            return date >= startDate && date <= endDate && s.status === 'COMPLETED';
        });
    }, [sales, startDate, endDate]);

    // Vendas do período de comparação
    const compareSales = useMemo(() => {
        return sales.filter(s => {
            const date = s.timestamp.substring(0, 10);
            return date >= compareStartDate && date <= compareEndDate && s.status === 'COMPLETED';
        });
    }, [sales, compareStartDate, compareEndDate]);

    // Análise ABC de Produtos
    const abcAnalysis = useMemo(() => {
        const productSales: Record<string, { value: number; qty: number; name: string; category: string }> = {};

        filteredSales.forEach(s => {
            s.items.forEach(item => {
                if (!productSales[item.id]) {
                    productSales[item.id] = {
                        value: 0,
                        qty: 0,
                        name: item.name,
                        category: item.category || 'Sem Categoria'
                    };
                }
                productSales[item.id].value += item.appliedPrice * item.qty;
                productSales[item.id].qty += item.qty;
            });
        });

        const sorted = Object.entries(productSales)
            .sort((a, b) => b[1].value - a[1].value);

        const totalValue = sorted.reduce((acc, [_, data]) => acc + data.value, 0);
        let accumulated = 0;

        return sorted.map(([id, data]) => {
            accumulated += data.value;
            const percent = (data.value / totalValue) * 100;
            const accumulatedPercent = (accumulated / totalValue) * 100;

            let classification = 'C';
            if (accumulatedPercent <= 80) classification = 'A';
            else if (accumulatedPercent <= 95) classification = 'B';

            return {
                id,
                ...data,
                percent,
                accumulatedPercent,
                classification
            };
        });
    }, [filteredSales]);

    // Produtos mais vendidos
    const topProducts = useMemo(() => {
        const productSales: Record<string, { qty: number; value: number; name: string }> = {};

        filteredSales.forEach(s => {
            s.items.forEach(item => {
                if (!productSales[item.id]) {
                    productSales[item.id] = { qty: 0, value: 0, name: item.name };
                }
                productSales[item.id].qty += item.qty;
                productSales[item.id].value += item.appliedPrice * item.qty;
            });
        });

        return Object.entries(productSales)
            .sort((a, b) => b[1].value - a[1].value)
            .slice(0, 10)
            .map(([id, data]) => ({ id, ...data }));
    }, [filteredSales]);

    // Análise de tendências (últimos 7 dias)
    const trendAnalysis = useMemo(() => {
        const last7Days: Record<string, number> = {};
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            last7Days[dateStr] = 0;
        }

        sales.filter(s => s.status === 'COMPLETED').forEach(s => {
            const date = s.timestamp.substring(0, 10);
            if (last7Days[date] !== undefined) {
                last7Days[date] += s.total;
            }
        });

        return Object.entries(last7Days).map(([date, value]) => ({
            date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value
        }));
    }, [sales]);

    // Comparação entre períodos
    const periodComparison = useMemo(() => {
        const current = filteredSales.reduce((acc, s) => acc + s.total, 0);
        const previous = compareSales.reduce((acc, s) => acc + s.total, 0);
        const variation = previous > 0 ? ((current - previous) / previous) * 100 : 0;

        return {
            current,
            previous,
            variation,
            currentCount: filteredSales.length,
            previousCount: compareSales.length
        };
    }, [filteredSales, compareSales]);

    // Exportar para PDF
    const exportToPDF = (reportType: string) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Relatório Avançado', 14, 22);
        doc.setFontSize(11);
        doc.text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`, 14, 30);

        if (reportType === 'ABC') {
            const tableData = abcAnalysis.map(item => [
                item.classification,
                item.name,
                item.category,
                item.qty.toString(),
                `R$ ${item.value.toFixed(2)}`,
                `${item.percent.toFixed(1)}%`
            ]);

            autoTable(doc, {
                head: [['Classe', 'Produto', 'Categoria', 'Qtd', 'Valor', '%']],
                body: tableData,
                startY: 40,
            });
        } else if (reportType === 'TOP_PRODUCTS') {
            const tableData = topProducts.map(item => [
                item.name,
                item.qty.toString(),
                `R$ ${item.value.toFixed(2)}`
            ]);

            autoTable(doc, {
                head: [['Produto', 'Quantidade', 'Valor Total']],
                body: tableData,
                startY: 40,
            });
        }

        doc.save(`Relatorio_Avancado_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Renderizar menu principal
    if (!currentView) {
        return (
            <div className="p-4 md:p-6 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <BarChart3 className="text-blue-600" size={32} />
                            Relatórios Avançados
                        </h2>
                        <p className="text-gray-500 text-sm">Análises detalhadas e comparativas</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                        onClick={() => setCurrentView('COMPARISON')}
                        className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white">
                                <RefreshCw size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Comparação de Períodos</h3>
                                <p className="text-xs text-gray-500">Compare vendas entre períodos</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setCurrentView('TRENDS')}
                        className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Análise de Tendências</h3>
                                <p className="text-xs text-gray-500">Últimos 7 dias de vendas</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setCurrentView('ABC')}
                        className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white">
                                <BarChart3 size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Curva ABC</h3>
                                <p className="text-xs text-gray-500">Classificação de produtos</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setCurrentView('TOP_PRODUCTS')}
                        className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white">
                                <Package size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Top 10 Produtos</h3>
                                <p className="text-xs text-gray-500">Mais vendidos do período</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    // Renderizar relatórios específicos
    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <button
                    onClick={() => setCurrentView(null)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-bold bg-gray-100 px-3 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center"
                >
                    <ArrowLeft size={20} />
                    Voltar
                </button>
                <button
                    onClick={() => exportToPDF(currentView!)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto justify-center"
                >
                    <Download size={20} />
                    Exportar PDF
                </button>
            </div>

            {/* Filtros de Data */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-end">
                    <div className="w-full sm:w-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                        />
                    </div>
                    <div className="w-full sm:w-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                        />
                    </div>
                    {currentView === 'COMPARISON' && (
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4">
                            <div className="w-full sm:w-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Comparar: Início</label>
                                <input
                                    type="date"
                                    value={compareStartDate}
                                    onChange={(e) => setCompareStartDate(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                                />
                            </div>
                            <div className="w-full sm:w-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Comparar: Fim</label>
                                <input
                                    type="date"
                                    value={compareEndDate}
                                    onChange={(e) => setCompareEndDate(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Comparação de Períodos */}
            {currentView === 'COMPARISON' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500 font-medium">Período Atual</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">
                                R$ {periodComparison.current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{periodComparison.currentCount} vendas</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500 font-medium">Período Anterior</p>
                            <p className="text-3xl font-bold text-gray-600 mt-2">
                                R$ {periodComparison.previous.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{periodComparison.previousCount} vendas</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500 font-medium">Variação</p>
                            <p className={`text-3xl font-bold mt-2 ${periodComparison.variation >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {periodComparison.variation >= 0 ? '+' : ''}{periodComparison.variation.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {periodComparison.variation >= 0 ? 'Crescimento' : 'Queda'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-80">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Comparação Visual</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Período Anterior', value: periodComparison.previous },
                                { name: 'Período Atual', value: periodComparison.current }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Análise de Tendências */}
            {currentView === 'TRENDS' && (
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-96">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Tendência dos Últimos 7 Dias</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trendAnalysis}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="value" fill="#10b981" fillOpacity={0.3} stroke="#10b981" />
                            <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Curva ABC */}
            {currentView === 'ABC' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                            <p className="text-sm text-emerald-700 font-medium">Classe A (até 80%)</p>
                            <p className="text-3xl font-bold text-emerald-600 mt-2">
                                {abcAnalysis.filter(p => p.classification === 'A').length}
                            </p>
                            <p className="text-xs text-emerald-600 mt-1">Produtos essenciais</p>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                            <p className="text-sm text-blue-700 font-medium">Classe B (80-95%)</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">
                                {abcAnalysis.filter(p => p.classification === 'B').length}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">Produtos importantes</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <p className="text-sm text-gray-700 font-medium">Classe C (95-100%)</p>
                            <p className="text-3xl font-bold text-gray-600 mt-2">
                                {abcAnalysis.filter(p => p.classification === 'C').length}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">Produtos complementares</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto max-h-[500px]">
                            <table className="w-full text-left text-sm min-w-[600px]">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="p-4">Classe</th>
                                        <th className="p-4">Produto</th>
                                        <th className="p-4">Categoria</th>
                                        <th className="p-4 text-right">Qtd</th>
                                        <th className="p-4 text-right">Valor</th>
                                        <th className="p-4 text-right">% Acum.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {abcAnalysis.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.classification === 'A' ? 'bg-emerald-100 text-emerald-700' :
                                                    item.classification === 'B' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {item.classification}
                                                </span>
                                            </td>
                                            <td className="p-4 font-medium">{item.name}</td>
                                            <td className="p-4 text-gray-600">{item.category}</td>
                                            <td className="p-4 text-right">{item.qty}</td>
                                            <td className="p-4 text-right font-bold text-emerald-600">
                                                R$ {item.value.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right text-gray-600">
                                                {item.accumulatedPercent.toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Top 10 Produtos */}
            {currentView === 'TOP_PRODUCTS' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-96">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Top 10 Produtos Mais Vendidos</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#10b981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[500px]">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-4">#</th>
                                        <th className="p-4">Produto</th>
                                        <th className="p-4 text-right">Quantidade</th>
                                        <th className="p-4 text-right">Valor Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {topProducts.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="p-4 font-bold text-gray-400">#{idx + 1}</td>
                                            <td className="p-4 font-medium">{item.name}</td>
                                            <td className="p-4 text-right">{item.qty}</td>
                                            <td className="p-4 text-right font-bold text-emerald-600">
                                                R$ {item.value.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedReports;
