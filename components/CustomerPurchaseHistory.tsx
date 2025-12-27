import React, { useState, useEffect } from 'react';
import { User, ShoppingCart, Calendar, DollarSign, Package, TrendingUp, Download } from 'lucide-react';

interface Customer {
    id: string;
    name: string;
    cpf?: string;
    phone?: string;
    email?: string;
}

interface Sale {
    id: string;
    timestamp: string;
    customerId?: string;
    customerName?: string;
    items: { code: string; name: string; qty: number; appliedPrice: number; subtotal: number }[];
    total: number;
    paymentMethod: string;
    status: string;
}

interface CustomerPurchaseHistory {
    customer: Customer;
    totalPurchases: number;
    totalSpent: number;
    averageTicket: number;
    lastPurchase?: string;
    purchases: Sale[];
    topProducts: { name: string; qty: number; total: number }[];
}

interface CustomerPurchaseHistoryProps {
    customers: Customer[];
    sales: Sale[];
}

export default function CustomerPurchaseHistory({ customers, sales }: CustomerPurchaseHistoryProps) {
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [historyData, setHistoryData] = useState<CustomerPurchaseHistory | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Set default dates (last 90 days)
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 90);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        if (selectedCustomer) {
            loadCustomerHistory(selectedCustomer);
        }
    }, [selectedCustomer, startDate, endDate, sales]);

    const loadCustomerHistory = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Filter sales by customer and date range
        const customerSales = sales.filter(sale =>
            sale.customerId === customerId &&
            new Date(sale.timestamp) >= start &&
            new Date(sale.timestamp) <= end
        );

        // Calculate statistics
        const totalPurchases = customerSales.length;
        const totalSpent = customerSales.reduce((sum, sale) => sum + sale.total, 0);
        const averageTicket = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
        const lastPurchase = customerSales.length > 0
            ? customerSales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp
            : undefined;

        // Calculate top products
        const productMap = new Map<string, { name: string; qty: number; total: number }>();
        customerSales.forEach(sale => {
            sale.items.forEach(item => {
                if (productMap.has(item.code)) {
                    const existing = productMap.get(item.code)!;
                    existing.qty += item.qty;
                    existing.total += item.subtotal;
                } else {
                    productMap.set(item.code, {
                        name: item.name,
                        qty: item.qty,
                        total: item.subtotal
                    });
                }
            });
        });

        const topProducts = Array.from(productMap.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        setHistoryData({
            customer,
            totalPurchases,
            totalSpent,
            averageTicket,
            lastPurchase,
            purchases: customerSales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
            topProducts
        });
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.cpf && c.cpf.includes(searchTerm)) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDateTime = (date: string) => {
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short'
        }).format(new Date(date));
    };

    const exportToCSV = () => {
        if (!historyData) return;

        const headers = ['Data/Hora', 'Total', 'Método Pagamento', 'Status', 'Itens'];
        const rows = historyData.purchases.map(purchase => [
            formatDateTime(purchase.timestamp),
            purchase.total.toFixed(2),
            purchase.paymentMethod,
            purchase.status,
            purchase.items.map(i => `${i.name} (${i.qty}x)`).join('; ')
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historico_${historyData.customer.name}_${startDate}_${endDate}.csv`;
        a.click();
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Histórico de Compras por Cliente</h1>
                {historyData && (
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Download className="w-5 h-5" />
                        Exportar CSV
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar Cliente
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Nome, CPF ou telefone..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
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
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selecionar Cliente
                    </label>
                    <select
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Selecione um cliente...</option>
                        {filteredCustomers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                                {customer.name} {customer.cpf ? `- CPF: ${customer.cpf}` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Customer Statistics */}
            {historyData && (
                <>
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 mb-6 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <User className="w-8 h-8" />
                            <div>
                                <h2 className="text-xl font-bold">{historyData.customer.name}</h2>
                                <div className="flex gap-4 text-sm text-blue-100">
                                    {historyData.customer.cpf && <span>CPF: {historyData.customer.cpf}</span>}
                                    {historyData.customer.phone && <span>Tel: {historyData.customer.phone}</span>}
                                    {historyData.customer.email && <span>Email: {historyData.customer.email}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <ShoppingCart className="w-6 h-6 text-blue-600" />
                                <p className="text-sm text-gray-600">Total de Compras</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{historyData.totalPurchases}</p>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className="w-6 h-6 text-green-600" />
                                <p className="text-sm text-gray-600">Total Gasto</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(historyData.totalSpent)}</p>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                                <p className="text-sm text-gray-600">Ticket Médio</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(historyData.averageTicket)}</p>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="w-6 h-6 text-orange-600" />
                                <p className="text-sm text-gray-600">Última Compra</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-800">
                                {historyData.lastPurchase ? formatDateTime(historyData.lastPurchase) : 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Produtos Mais Comprados
                            </h2>
                        </div>
                        <div className="p-4">
                            <div className="space-y-2">
                                {historyData.topProducts.map((product, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                                                {index + 1}
                                            </span>
                                            <div>
                                                <p className="font-medium text-gray-800">{product.name}</p>
                                                <p className="text-sm text-gray-500">Quantidade: {product.qty.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <p className="font-semibold text-green-600">{formatCurrency(product.total)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Purchase History */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">Histórico de Compras</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Itens</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {historyData.purchases.map((purchase) => (
                                        <tr key={purchase.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {formatDateTime(purchase.timestamp)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="max-w-xs">
                                                    {purchase.items.slice(0, 2).map((item, idx) => (
                                                        <div key={idx} className="text-xs text-gray-600">
                                                            {item.name} ({item.qty}x)
                                                        </div>
                                                    ))}
                                                    {purchase.items.length > 2 && (
                                                        <div className="text-xs text-gray-400">
                                                            +{purchase.items.length - 2} itens
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                                    {purchase.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                                {formatCurrency(purchase.total)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${purchase.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                        purchase.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {purchase.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {!historyData && selectedCustomer === '' && (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Selecione um cliente para ver o histórico de compras</p>
                </div>
            )}
        </div>
    );
}
