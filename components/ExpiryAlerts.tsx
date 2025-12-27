import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Package, Bell, Settings as SettingsIcon } from 'lucide-react';

interface Product {
    id: string;
    code: string;
    name: string;
    category: string;
    stock: number;
    expiryDate?: string;
}

interface StockBatch {
    id: string;
    productId: string;
    qtyRemaining: number;
    expiryDate?: string;
}

interface ExpiryAlert {
    productId: string;
    productCode: string;
    productName: string;
    category: string;
    stock: number;
    expiryDate: string;
    daysUntilExpiry: number;
    severity: 'critical' | 'warning' | 'info';
    batchId?: string;
    batchQty?: number;
}

interface ExpiryAlertsProps {
    products: Product[];
}

export default function ExpiryAlerts({ products }: ExpiryAlertsProps) {
    const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [criticalDays, setCriticalDays] = useState(7);
    const [warningDays, setWarningDays] = useState(15);
    const [infoDays, setInfoDays] = useState(30);
    const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        checkExpiryDates();
    }, [products, criticalDays, warningDays, infoDays]);

    const loadSettings = () => {
        const saved = localStorage.getItem('expiryAlertSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            setCriticalDays(settings.criticalDays || 7);
            setWarningDays(settings.warningDays || 15);
            setInfoDays(settings.infoDays || 30);
        }
    };

    const saveSettings = () => {
        const settings = { criticalDays, warningDays, infoDays };
        localStorage.setItem('expiryAlertSettings', JSON.stringify(settings));
        setShowSettings(false);
    };

    const checkExpiryDates = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const alertList: ExpiryAlert[] = [];

        // Check products with expiry dates
        products.forEach(product => {
            if (product.expiryDate) {
                const expiryDate = new Date(product.expiryDate);
                expiryDate.setHours(0, 0, 0, 0);
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry <= infoDays) {
                    let severity: 'critical' | 'warning' | 'info' = 'info';
                    if (daysUntilExpiry <= criticalDays) severity = 'critical';
                    else if (daysUntilExpiry <= warningDays) severity = 'warning';

                    alertList.push({
                        productId: product.id,
                        productCode: product.code,
                        productName: product.name,
                        category: product.category,
                        stock: product.stock,
                        expiryDate: product.expiryDate,
                        daysUntilExpiry,
                        severity
                    });
                }
            }
        });

        // Check stock batches (PEPS)
        const stockBatches: StockBatch[] = JSON.parse(localStorage.getItem('stockBatches') || '[]');
        stockBatches.forEach(batch => {
            if (batch.expiryDate && batch.qtyRemaining > 0) {
                const product = products.find(p => p.id === batch.productId);
                if (!product) return;

                const expiryDate = new Date(batch.expiryDate);
                expiryDate.setHours(0, 0, 0, 0);
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry <= infoDays) {
                    let severity: 'critical' | 'warning' | 'info' = 'info';
                    if (daysUntilExpiry <= criticalDays) severity = 'critical';
                    else if (daysUntilExpiry <= warningDays) severity = 'warning';

                    alertList.push({
                        productId: product.id,
                        productCode: product.code,
                        productName: product.name,
                        category: product.category,
                        stock: product.stock,
                        expiryDate: batch.expiryDate,
                        daysUntilExpiry,
                        severity,
                        batchId: batch.id,
                        batchQty: batch.qtyRemaining
                    });
                }
            }
        });

        // Sort by days until expiry (most urgent first)
        alertList.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
        setAlerts(alertList);
    };

    const filteredAlerts = filterSeverity === 'all'
        ? alerts
        : alerts.filter(a => a.severity === filterSeverity);

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    const infoCount = alerts.filter(a => a.severity === 'info').length;

    const formatDate = (date: string) => {
        return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            case 'info': return <Bell className="w-5 h-5 text-blue-600" />;
            default: return <Bell className="w-5 h-5" />;
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Alertas de Vencimento</h1>
                <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                    <SettingsIcon className="w-5 h-5" />
                    Configurações
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div
                    className={`bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white shadow-lg cursor-pointer ${filterSeverity === 'critical' ? 'ring-4 ring-red-300' : ''
                        }`}
                    onClick={() => setFilterSeverity(filterSeverity === 'critical' ? 'all' : 'critical')}
                >
                    <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="w-8 h-8 opacity-80" />
                        <span className="text-3xl font-bold">{criticalCount}</span>
                    </div>
                    <p className="text-red-100 text-sm">Crítico (≤ {criticalDays} dias)</p>
                </div>

                <div
                    className={`bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 text-white shadow-lg cursor-pointer ${filterSeverity === 'warning' ? 'ring-4 ring-yellow-300' : ''
                        }`}
                    onClick={() => setFilterSeverity(filterSeverity === 'warning' ? 'all' : 'warning')}
                >
                    <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="w-8 h-8 opacity-80" />
                        <span className="text-3xl font-bold">{warningCount}</span>
                    </div>
                    <p className="text-yellow-100 text-sm">Atenção (≤ {warningDays} dias)</p>
                </div>

                <div
                    className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg cursor-pointer ${filterSeverity === 'info' ? 'ring-4 ring-blue-300' : ''
                        }`}
                    onClick={() => setFilterSeverity(filterSeverity === 'info' ? 'all' : 'info')}
                >
                    <div className="flex items-center justify-between mb-2">
                        <Bell className="w-8 h-8 opacity-80" />
                        <span className="text-3xl font-bold">{infoCount}</span>
                    </div>
                    <p className="text-blue-100 text-sm">Informativo (≤ {infoDays} dias)</p>
                </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
                {filteredAlerts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhum produto próximo ao vencimento</p>
                    </div>
                ) : (
                    filteredAlerts.map((alert, index) => (
                        <div
                            key={`${alert.productId}-${alert.batchId || index}`}
                            className={`bg-white rounded-lg shadow-md border-l-4 p-4 ${getSeverityColor(alert.severity)}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                    {getSeverityIcon(alert.severity)}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-800">{alert.productName}</h3>
                                            <span className="text-xs font-mono text-gray-500">({alert.productCode})</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Package className="w-4 h-4" />
                                                Categoria: {alert.category}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                Vencimento: {formatDate(alert.expiryDate)}
                                            </span>
                                            {alert.batchQty && (
                                                <span className="font-medium">
                                                    Lote: {alert.batchQty} unidades
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-bold ${alert.daysUntilExpiry <= 0 ? 'text-red-600' :
                                            alert.severity === 'critical' ? 'text-red-600' :
                                                alert.severity === 'warning' ? 'text-yellow-600' :
                                                    'text-blue-600'
                                        }`}>
                                        {alert.daysUntilExpiry <= 0 ? 'VENCIDO' : `${alert.daysUntilExpiry}d`}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {alert.daysUntilExpiry <= 0 ? '' : 'até vencer'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <SettingsIcon className="w-6 h-6" />
                            Configurações de Alertas
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Alerta Crítico (dias)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={criticalDays}
                                    onChange={(e) => setCriticalDays(parseInt(e.target.value) || 7)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Produtos que vencem em até {criticalDays} dias
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Alerta de Atenção (dias)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={warningDays}
                                    onChange={(e) => setWarningDays(parseInt(e.target.value) || 15)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Produtos que vencem em até {warningDays} dias
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Alerta Informativo (dias)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={infoDays}
                                    onChange={(e) => setInfoDays(parseInt(e.target.value) || 30)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Produtos que vencem em até {infoDays} dias
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveSettings}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
