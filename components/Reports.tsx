
import React, { useState, useMemo, useEffect } from 'react';
import { Sale, Product, Transaction, User } from '../types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area, ComposedChart, Line
} from 'recharts';
import {
    Calendar, Ban, Download, TrendingUp, TrendingDown, DollarSign,
    Package, AlertTriangle, Users, Tag, Truck, Calculator,
    Receipt, Coins, Percent, PlusCircle, RotateCcw, Tags, Eye, Search, Gift,
    CheckCircle, Clock, CreditCard, ShoppingBag, XCircle, FileText, ChevronDown, ArrowLeft, Store, Sliders, Trash2, Plus
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
    sales: Sale[];
    products: Product[];
    transactions: Transaction[];
    currentUser: User;
    onVoidSale: (saleId: string) => void;
    onReturnItems: (saleId: string, items: { itemId: string, qty: number }[]) => void;
    onNavigateToAdvancedReports: () => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl z-50">
                <p className="font-bold text-gray-700 mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
                        {entry.name}: {entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        {entry.payload.accumulatedPercent !== undefined && index === 1 && ` (${entry.payload.accumulatedPercent.toFixed(1)}%)`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// --- REDESIGNED MENU CARD MATCHING REFERENCE IMAGE ---
const ReportMenuCard = ({ title, description, icon: Icon, onClick }: any) => (
    <button
        onClick={onClick}
        className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-5 relative overflow-hidden group text-left"
    >
        {/* Icon Circle */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md z-10 shrink-0 border-2 border-emerald-100">
            <Icon size={24} />
        </div>

        {/* Text Content */}
        <div className="flex-1 z-10">
            <h3 className="text-gray-800 font-medium text-base">{title}</h3>
            <p className="text-[10px] text-gray-500 uppercase mt-1 leading-tight font-bold tracking-wide">
                {description}
            </p>
        </div>

        {/* Green Gradient Effect on Right Side */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-green-300/40 via-green-100/20 to-transparent pointer-events-none" />
    </button>
);

const KPICard = ({ title, value, subtext, icon: Icon, color = 'emerald' }: any) => (
    <div className={`bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-${color}-500`}>
        <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
            <p className={`text-2xl font-black text-gray-800 mt-1`}>{value}</p>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-full bg-${color}-50 text-${color}-600`}>
            <Icon size={24} />
        </div>
    </div>
);

// --- CONFIG MODAL COMPONENT ---
const TimeRangeConfigModal = ({ isOpen, onClose, ranges, setRanges }: any) => {
    if (!isOpen) return null;

    const [localRanges, setLocalRanges] = useState(ranges);
    const [newStart, setNewStart] = useState('');
    const [newEnd, setNewEnd] = useState('');
    const [newLabel, setNewLabel] = useState('');

    const handleAdd = () => {
        if (!newStart || !newEnd || !newLabel) return;
        setLocalRanges([...localRanges, { start: newStart, end: newEnd, label: newLabel }]);
        setNewStart('');
        setNewEnd('');
        setNewLabel('');
    };

    const handleRemove = (idx: number) => {
        const n = [...localRanges];
        n.splice(idx, 1);
        setLocalRanges(n);
    };

    const handleSave = () => {
        setRanges(localRanges);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 animate-scale-in">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-bold text-gray-800 text-lg">Configurar Faixas Horárias</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
                </div>

                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                    {localRanges.map((r: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div>
                                <p className="font-bold text-gray-700">{r.label}</p>
                                <p className="text-xs text-gray-500">{r.start} - {r.end}</p>
                            </div>
                            <button onClick={() => handleRemove(idx)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                        </div>
                    ))}
                    {localRanges.length === 0 && <p className="text-center text-gray-400 text-sm">Nenhuma faixa configurada.</p>}
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                    <p className="text-xs font-bold text-blue-700 uppercase mb-2">Adicionar Nova Faixa</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <input type="time" className="p-2 rounded border text-sm" value={newStart} onChange={e => setNewStart(e.target.value)} />
                        <input type="time" className="p-2 rounded border text-sm" value={newEnd} onChange={e => setNewEnd(e.target.value)} />
                    </div>
                    <input
                        type="text"
                        placeholder="Nome (ex: Almoço)"
                        className="w-full p-2 rounded border text-sm mb-2"
                        value={newLabel}
                        onChange={e => setNewLabel(e.target.value)}
                    />
                    <button onClick={handleAdd} className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center gap-2">
                        <Plus size={16} /> Adicionar
                    </button>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 border rounded-xl font-bold text-gray-500 hover:bg-gray-50">Cancelar</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200">Salvar Alterações</button>
                </div>
            </div>
        </div>
    );
};

const Reports: React.FC<ReportsProps> = ({ sales, products, transactions, currentUser, onVoidSale, onReturnItems, onNavigateToAdvancedReports }) => {
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 13)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentView, setCurrentView] = useState<string | null>(null);

    // States for Manage Sale Modal
    const [viewSale, setViewSale] = useState<Sale | null>(null);
    const [manageSale, setManageSale] = useState<Sale | null>(null);
    const [isReturnMode, setIsReturnMode] = useState(false);
    const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});

    // States for Purchase Details Modal
    const [viewPurchase, setViewPurchase] = useState<Transaction | null>(null);

    // State for Product Detail Report
    // State for Product Detail Report - Stores the specific sale item details
    const [selectedProductDetail, setSelectedProductDetail] = useState<any | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCashier, setSelectedCashier] = useState('ALL');
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [showPermissionDenied, setShowPermissionDenied] = useState(false);

    const [showReturnValidation, setShowReturnValidation] = useState(false);

    // --- HOURLY SALES SPECIFIC STATE ---
    const [selectedDayOfWeek, setSelectedDayOfWeek] = useState('ALL');
    const [selectedPaymentMethodFilter, setSelectedPaymentMethodFilter] = useState('ALL');
    const [showTimeRangeConfig, setShowTimeRangeConfig] = useState(false);
    const [timeRanges, setTimeRanges] = useState<{ start: string; end: string; label: string }[]>(() => {
        const saved = localStorage.getItem('mm_report_time_ranges');
        return saved ? JSON.parse(saved) : [
            { start: '00:00', end: '08:00', label: 'Madrugada/Manhã' },
            { start: '08:00', end: '12:00', label: 'Manhã Comercial' },
            { start: '12:00', end: '14:00', label: 'Almoço' },
            { start: '14:00', end: '18:00', label: 'Tarde' },
            { start: '18:00', end: '23:59', label: 'Noite' }
        ];
    });

    // Save time ranges when changed
    useEffect(() => {
        localStorage.setItem('mm_report_time_ranges', JSON.stringify(timeRanges));
    }, [timeRanges]);

    // Helper to check if time is in range
    const isTimeInRange = (timeStr: string, start: string, end: string) => {
        // timeStr format HH:MM
        return timeStr >= start && timeStr <= end;
    };

    // Detectar quando o sistema foi resetado e resetar os filtros de data
    useEffect(() => {
        const checkReset = () => {
            const filterFlag = localStorage.getItem('mm_reports_date_filter');
            if (!filterFlag) {
                // Sistema foi resetado, restaurar filtros para HOJE (zerar histórico visual)
                const newEndDate = new Date().toISOString().split('T')[0];
                // Ao resetar, queremos que o gráfico comece "do zero", ou seja, apenas hoje.
                const newStartDate = newEndDate;

                setStartDate(newStartDate);
                setEndDate(newEndDate);
                // Marcar que já resetamos
                localStorage.setItem('mm_reports_date_filter', 'active');
            }
        };
        checkReset();
    }, [sales, transactions]); // Reexecutar quando sales ou transactions mudarem (indicando possível reset)

    // --- DOWNLOAD LOGIC ---
    const handleDownload = (format: 'CSV' | 'PDF') => {
        setShowDownloadMenu(false);
        const reportTitle = currentView === 'SALES_PERIOD' ? 'Vendas por Período' :
            currentView === 'SALES_COSTS' ? 'Detalhes de Vendas e Custos' :
                currentView === 'PAYMENT_METHODS' ? 'Formas de Pagamento' :
                    currentView === 'PRODUCT_GROUPS' ? 'Vendas por Grupos' :
                        currentView === 'BRANDS' ? 'Vendas por Marcas' :
                            currentView === 'SUPPLIERS' ? 'Vendas por Fornecedores' :
                                currentView === 'ABC_PRODUCTS' ? 'Curva ABC' :
                                    currentView === 'SALES_BY_PRODUCT' ? 'Vendas por Produtos' :
                                        currentView === 'PURCHASES' ? 'Relatório de Compras' :
                                            currentView === 'RETURNS' ? 'Devoluções' :
                                                currentView === 'CANCELLED' ? 'Vendas Canceladas' : 'Relatório';

        if (format === 'CSV') {
            let csvContent = "data:text/csv;charset=utf-8,";

            if (currentView === 'SALES_PERIOD') {
                csvContent += "Data;Valor\n";
                salesByDay.forEach(row => {
                    csvContent += `${row.fullDate};${row.value.toFixed(2).replace('.', ',')}\n`;
                });
            } else if (currentView === 'SALES_COSTS') {
                // Simplified for CSV
                csvContent += "Item;Valor\n";
                csvContent += `Receita Bruta;${filteredSales.reduce((acc, s) => acc + s.total, 0).toFixed(2).replace('.', ',')}\n`;
                // Add more rows as needed
            } else if (currentView === 'SALES_BY_PRODUCT') {
                csvContent += "Produto;Codigo;Qtd;Valor\n";
                const productSales: Record<string, any> = {};
                filteredSales.forEach(s => s.items.forEach(i => {
                    if (!productSales[i.name]) productSales[i.name] = { value: 0, qty: 0, code: i.code || '-' };
                    productSales[i.name].value += (i.appliedPrice * i.qty);
                    productSales[i.name].qty += i.qty;
                }));
                Object.entries(productSales).sort((a, b) => b[1].value - a[1].value).forEach(([name, data]) => {
                    csvContent += `${name};${data.code};${data.qty};${data.value.toFixed(2).replace('.', ',')}\n`;
                });
            } else if (currentView === 'ABC_PRODUCTS') {
                csvContent += "Classificacao;Produto;Categoria;Valor;%\n";
                // Re-calculate ABC data locally or extract if possible. 
                // For simplicity, we'll just dump the filtered sales items for now or better, re-calc quickly:
                const productSales: Record<string, any> = {};
                filteredSales.forEach(s => s.items.forEach(i => {
                    if (!productSales[i.name]) productSales[i.name] = { value: 0, category: i.category };
                    productSales[i.name].value += (i.appliedPrice * i.qty);
                }));
                Object.entries(productSales).sort((a, b) => b[1].value - a[1].value).forEach(([name, data]) => {
                    csvContent += ` ;${name};${data.category};${data.value.toFixed(2).replace('.', ',')}\n`;
                });
            } else if (currentView === 'HOURLY_SALES') {
                csvContent += "Faixa Horaria;Qtd Vendas;Faturamento Bruto;Descontos;Faturamento Liquido;Ticket Medio;Part. %\n";

                // Re-calculate for export to ensure consistency
                const hourlyData = timeRanges.map(range => ({
                    ...range,
                    count: 0,
                    gross: 0,
                    discount: 0,
                    net: 0
                }));

                const totalNetExport = filteredSales.reduce((acc, s) => {
                    // Apply extra filters for Hourly View
                    const date = new Date(s.timestamp);
                    const dayOfWeek = date.getDay().toString();
                    if (selectedDayOfWeek !== 'ALL' && dayOfWeek !== selectedDayOfWeek) return acc;
                    if (selectedPaymentMethodFilter !== 'ALL' && s.paymentMethod !== selectedPaymentMethodFilter) return acc;
                    return acc + s.total;
                }, 0);

                filteredSales.forEach(s => {
                    // Apply extra filters
                    const date = new Date(s.timestamp);
                    const dayOfWeek = date.getDay().toString();
                    if (selectedDayOfWeek !== 'ALL' && dayOfWeek !== selectedDayOfWeek) return;
                    if (selectedPaymentMethodFilter !== 'ALL' && s.paymentMethod !== selectedPaymentMethodFilter) return;

                    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                    // Find range
                    const rangeIndex = hourlyData.findIndex(r => isTimeInRange(timeStr, r.start, r.end));
                    if (rangeIndex !== -1) {
                        const grossSale = s.items.reduce((acc, i) => acc + (i.retailPrice * i.qty), 0);
                        const netSale = s.total;
                        const discountSale = grossSale - netSale;

                        hourlyData[rangeIndex].count += 1;
                        hourlyData[rangeIndex].gross += grossSale;
                        hourlyData[rangeIndex].net += netSale;
                        hourlyData[rangeIndex].discount += discountSale;
                    }
                });

                hourlyData.forEach(h => {
                    const ticket = h.count > 0 ? h.net / h.count : 0;
                    const percent = totalNetExport > 0 ? (h.net / totalNetExport) * 100 : 0;
                    csvContent += `${h.label} (${h.start}-${h.end});${h.count};${h.gross.toFixed(2).replace('.', ',')};${h.discount.toFixed(2).replace('.', ',')};${h.net.toFixed(2).replace('.', ',')};${ticket.toFixed(2).replace('.', ',')};${percent.toFixed(2).replace('.', ',')}%\n`;
                });
            }
            // Generic fallback for others
            else {
                csvContent += "Relatorio nao suportado para CSV simples ainda.\n";
            }

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${reportTitle}_${startDate}_${endDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        else if (format === 'PDF') {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(reportTitle, 14, 22);
            doc.setFontSize(11);
            doc.text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`, 14, 30);

            if (currentView === 'SALES_PERIOD') {
                const tableData = salesByDay.map(row => [row.fullDate, `R$ ${row.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]);
                autoTable(doc, {
                    head: [['Data', 'Valor Total']],
                    body: tableData,
                    startY: 40,
                });
            } else if (currentView === 'ABC_PRODUCTS') {
                const productSales: Record<string, any> = {};
                filteredSales.forEach(s => s.items.forEach(i => {
                    if (!productSales[i.name]) productSales[i.name] = { value: 0, category: i.category };
                    productSales[i.name].value += (i.appliedPrice * i.qty);
                }));
                const sorted = Object.entries(productSales).sort((a, b) => b[1].value - a[1].value);
                const tableData = sorted.map(([name, data]) => [name, data.category, `R$ ${data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]);

                autoTable(doc, {
                    head: [['Produto', 'Categoria', 'Valor Total']],
                    body: tableData,
                    startY: 40,
                });
            } else if (currentView === 'SALES_BY_PRODUCT') {
                const productSales: Record<string, any> = {};
                filteredSales.forEach(s => s.items.forEach(i => {
                    if (!productSales[i.name]) productSales[i.name] = { value: 0, qty: 0, code: i.code || '-' };
                    productSales[i.name].value += (i.appliedPrice * i.qty);
                    productSales[i.name].qty += i.qty;
                }));
                const sorted = Object.entries(productSales).sort((a, b) => b[1].value - a[1].value);
                const tableData = sorted.map(([name, data]) => [name, data.code, data.qty.toString(), `R$ ${data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]);

                autoTable(doc, {
                    head: [['Produto', 'Cód.', 'Qtd.', 'Valor Total']],
                    body: tableData,
                    startY: 40,
                });
            } else if (currentView === 'HOURLY_SALES') {
                const hourlyData = timeRanges.map(range => ({
                    ...range,
                    count: 0,
                    gross: 0,
                    discount: 0,
                    net: 0
                }));

                const totalNetExport = filteredSales.reduce((acc, s) => {
                    const date = new Date(s.timestamp);
                    const dayOfWeek = date.getDay().toString();
                    if (selectedDayOfWeek !== 'ALL' && dayOfWeek !== selectedDayOfWeek) return acc;
                    if (selectedPaymentMethodFilter !== 'ALL' && s.paymentMethod !== selectedPaymentMethodFilter) return acc;
                    return acc + s.total;
                }, 0);

                filteredSales.forEach(s => {
                    const date = new Date(s.timestamp);
                    const dayOfWeek = date.getDay().toString();
                    if (selectedDayOfWeek !== 'ALL' && dayOfWeek !== selectedDayOfWeek) return;
                    if (selectedPaymentMethodFilter !== 'ALL' && s.paymentMethod !== selectedPaymentMethodFilter) return;

                    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const rangeIndex = hourlyData.findIndex(r => isTimeInRange(timeStr, r.start, r.end));
                    if (rangeIndex !== -1) {
                        const grossSale = s.items.reduce((acc, i) => acc + (i.retailPrice * i.qty), 0);
                        const netSale = s.total;
                        const discountSale = grossSale - netSale;

                        hourlyData[rangeIndex].count += 1;
                        hourlyData[rangeIndex].gross += grossSale;
                        hourlyData[rangeIndex].net += netSale;
                        hourlyData[rangeIndex].discount += discountSale;
                    }
                });

                const tableData = hourlyData.map(h => {
                    const ticket = h.count > 0 ? h.net / h.count : 0;
                    const percent = totalNetExport > 0 ? (h.net / totalNetExport) * 100 : 0;
                    return [
                        `${h.label} (${h.start}-${h.end})`,
                        h.count.toString(),
                        `R$ ${h.gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        `R$ ${h.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        `R$ ${h.net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        `R$ ${ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        `${percent.toFixed(2)}%`
                    ];
                });

                autoTable(doc, {
                    head: [['Faixa', 'Qtd', 'Bruto', 'Desc.', 'Líquido', 'Ticket Médio', '% Part.']],
                    body: tableData,
                    startY: 40,
                });
            } else {
                doc.text("Exportação detalhada em PDF não implementada para este visualização específica.", 14, 50);
            }

            doc.save(`${reportTitle}_${startDate}_${endDate}.pdf`);
        }
    };

    // --- DATA PROCESSING ---

    // 1. Filter Sales by Date & Cashier (includes COMPLETED)
    const filteredSales = useMemo(() => {
        return sales.filter(s => {
            const date = s.timestamp.substring(0, 10);
            const matchDate = date >= startDate && date <= endDate;
            const matchStatus = s.status === 'COMPLETED'; // Only valid sales
            const matchCashier = selectedCashier === 'ALL' || s.cashierId === selectedCashier;
            return matchDate && matchStatus && matchCashier;
        });
    }, [sales, startDate, endDate, selectedCashier]);

    // Extract unique cashiers for filter
    const uniqueCashiers = useMemo(() => {
        const ids = new Set(sales.map(s => s.cashierId));
        return Array.from(ids);
    }, [sales]);

    const cashierNameMap = useMemo(() => {
        const savedUsers = localStorage.getItem('mm_users_list');
        const usersList: User[] = savedUsers ? JSON.parse(savedUsers) : [];
        const nameMap = usersList.reduce((acc, u) => ({ ...acc, [u.id]: u.name }), {} as Record<string, string>);
        console.log('DEBUG - Current User:', currentUser);
        console.log('DEBUG - Cashier Name Map:', nameMap);
        return nameMap;
    }, []);

    // 2. Aggregate Data for Charts
    const salesByDay = useMemo(() => {
        const data: Record<string, number> = {};

        // Parse dates as local time to match sales date conversion
        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
        const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

        const d = new Date(startYear, startMonth - 1, startDay);
        const end = new Date(endYear, endMonth - 1, endDay);

        // Iterate ensuring we cover the full range in local time
        while (d <= end) {
            const dateStr = d.toLocaleDateString('pt-BR');
            data[dateStr] = 0;
            d.setDate(d.getDate() + 1);
        }

        filteredSales.forEach(s => {
            const date = new Date(s.timestamp).toLocaleDateString('pt-BR');
            if (data[date] !== undefined) data[date] += s.total;
        });

        return Object.keys(data).map(date => ({ name: date.slice(0, 5), value: data[date], fullDate: date }))
            .sort((a, b) => {
                const [da, ma, ya] = a.fullDate.split('/').map(Number);
                const [db, mb, yb] = b.fullDate.split('/').map(Number);
                return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
            });
    }, [filteredSales, startDate, endDate]);

    const salesByMethod = useMemo(() => {
        const data: Record<string, number> = {};
        filteredSales.forEach(s => {
            if (s.paymentMethod === 'MULTIPLE' && s.payments) {
                s.payments.forEach(p => {
                    data[p.method] = (data[p.method] || 0) + p.amount;
                });
            } else {
                data[s.paymentMethod] = (data[s.paymentMethod] || 0) + s.total;
            }
        });
        return Object.keys(data).map((name) => ({ name, value: data[name] }));
    }, [filteredSales]);

    // --- RETURN LOGIC ---
    const handleOpenManage = (sale: Sale) => {
        setManageSale(sale);
        setIsReturnMode(false);
        setReturnQuantities({});
    };

    const toggleReturnQty = (itemId: string, max: number, delta: number) => {
        setReturnQuantities(prev => {
            const current = prev[itemId] || 0;
            const newVal = Math.max(0, Math.min(max, current + delta));
            return { ...prev, [itemId]: newVal };
        });
    };

    const confirmPartialReturn = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!manageSale) return;

        const itemsToReturn = Object.entries(returnQuantities)
            .filter(([_, qty]) => (qty as number) > 0)
            .map(([itemId, qty]) => ({ itemId, qty: qty as number }));

        if (itemsToReturn.length === 0) {
            setShowReturnValidation(true);
            return;
        }

        onReturnItems(manageSale.id, itemsToReturn);
        setManageSale(null); // Close modal
        setIsReturnMode(false);
    };

    // --- TRANSLATIONS ---
    const translatePayment = (method: string) => {
        const map: Record<string, string> = {
            'CASH': 'Dinheiro',
            'CREDIT': 'Crédito',
            'DEBIT': 'Débito',
            'PIX': 'Pix',
            'FIADO': 'Fiado',
            'MULTIPLE': 'Múltiplo'
        };
        return map[method] || method;
    };

    // --- VIEW RENDERERS ---

    const renderSalesPeriod = () => {
        const totalSalesPeriod = filteredSales.reduce((acc, s) => acc + s.total, 0);

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Total Sales Summary Card */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center border-l-4 border-l-emerald-500">
                    <div>
                        <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider">Total de Vendas no Período</h3>
                        <p className="text-sm text-gray-400 mt-1">{filteredSales.length} vendas realizadas</p>
                    </div>
                    <p className="text-3xl font-black text-emerald-700">R$ {totalSalesPeriod.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                {/* Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Evolução de Vendas</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesByDay}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorSales)"
                                isAnimationActive={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Daily Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b font-bold text-gray-700">Detalhamento Diário</div>
                        <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <tbody className="divide-y divide-gray-100">
                                    {salesByDay.slice().reverse().map((day, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="p-3 pl-4">{day.fullDate}</td>
                                            <td className="p-3 text-right pr-4 font-bold text-emerald-600">
                                                {day.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Detailed Sales History List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Histórico de Vendas Detalhado</h3>
                        {searchTerm && <span className="text-xs text-blue-500 font-medium">Filtrando por: "{searchTerm}"</span>}
                    </div>
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white text-gray-500 border-b sticky top-0 z-10">
                                <tr>
                                    <th className="p-4">Cód.</th>
                                    <th className="p-4">Data / Hora</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Itens</th>
                                    <th className="p-4">Pagamento</th>
                                    <th className="p-4 text-right">Total</th>
                                    <th className="p-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSales
                                    .filter(s =>
                                        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
                                    )
                                    .slice().reverse().map(sale => (
                                        <tr key={sale.id} className="hover:bg-gray-50 group">
                                            <td className="p-4">
                                                <button
                                                    onClick={() => setViewSale(sale)}
                                                    className="font-mono text-blue-600 hover:underline hover:text-blue-800 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-100"
                                                >
                                                    #{sale.id.slice(0, 6)}
                                                </button>
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {new Date(sale.timestamp).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="p-4 font-medium text-gray-800">{sale.customerName || 'Consumidor Final'}</td>
                                            <td className="p-4 text-gray-500">{sale.items.length} itens</td>
                                            <td className="p-4">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600 uppercase">
                                                    {translatePayment(sale.paymentMethod)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-emerald-600">
                                                R$ {sale.total.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => handleOpenManage(sale)}
                                                    className="text-gray-400 hover:text-blue-600 p-2 rounded hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Gerenciar Venda"
                                                >
                                                    <Tag size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                {filteredSales.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-400">Nenhuma venda encontrada.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderSalesCosts = () => {
        // 1. Calculate Real Totals
        const totalRevenueFiltered = filteredSales.reduce((acc, s) => acc + s.total, 0); // Venda Líquida

        // 2. Identify Returns/Refunds in Expense Transactions
        const returnTransactions = transactions.filter(t =>
            t.type === 'EXPENSE' &&
            (t.category.includes('Devolução') || t.category.includes('Estorno') || t.category.includes('Reembolso')) &&
            t.date.substring(0, 10) >= startDate && t.date.substring(0, 10) <= endDate
        );
        const totalReturns = returnTransactions.reduce((acc, t) => acc + t.amount, 0);

        // 3. Gross Revenue (Venda Líquida + Devoluções)
        const grossRevenue = totalRevenueFiltered + totalReturns;

        // 4. CMV (Cost of Goods Sold)
        const totalCMV = filteredSales.reduce((acc, s) => {
            return acc + s.items.reduce((iAcc, item) => iAcc + (item.costPrice * item.qty), 0);
        }, 0);

        // 5. Promotional Performance
        const promoSales = filteredSales.reduce((acc, s) => {
            const promoItemsTotal = s.items.reduce((iAcc, item) => {
                if (item.appliedPrice < (item.retailPrice - 0.01)) {
                    return iAcc + (item.appliedPrice * item.qty);
                }
                return iAcc;
            }, 0);
            return acc + promoItemsTotal;
        }, 0);

        const promoCMV = filteredSales.reduce((acc, s) => {
            const promoItemsCost = s.items.reduce((iAcc, item) => {
                if (item.appliedPrice < (item.retailPrice - 0.01)) {
                    return iAcc + (item.costPrice * item.qty);
                }
                return iAcc;
            }, 0);
            return acc + promoItemsCost;
        }, 0);

        const promoMargin = promoSales > 0 ? ((promoSales - promoCMV) / promoSales) * 100 : 0;

        // 6. Discounts Given (Retail Price vs Sold Price)
        const totalDiscounts = filteredSales.reduce((acc, s) => {
            return acc + s.items.reduce((iAcc, item) => iAcc + ((item.retailPrice - item.appliedPrice) * item.qty), 0);
        }, 0);

        // 7. Calculate Card Fees (MDR)
        const savedRates = localStorage.getItem('mm_terminal_rates');
        const terminalRates = savedRates ? JSON.parse(savedRates) : {};

        let avgDebit = 1.99;
        let avgCredit = 3.99;
        let avgPix = 0;

        const rateKeys = Object.keys(terminalRates);
        if (rateKeys.length > 0) {
            avgDebit = rateKeys.reduce((acc, k) => acc + (terminalRates[k].debit || 0), 0) / rateKeys.length;
            avgCredit = rateKeys.reduce((acc, k) => acc + (terminalRates[k].credit || 0), 0) / rateKeys.length;
            avgPix = rateKeys.reduce((acc, k) => acc + (terminalRates[k].pix || 0), 0) / rateKeys.length;
        }

        const totalFees = filteredSales.reduce((acc, s) => {
            if (s.paymentMethod === 'CREDIT') return acc + (s.total * (avgCredit / 100));
            if (s.paymentMethod === 'DEBIT') return acc + (s.total * (avgDebit / 100));
            if (s.paymentMethod === 'PIX') return acc + (s.total * (avgPix / 100));
            return acc;
        }, 0);

        // 8. Operating Expenses
        const operatingExpenses = transactions
            .filter(t =>
                t.type === 'EXPENSE' &&
                t.status === 'PAID' &&
                t.date.substring(0, 10) >= startDate && t.date.substring(0, 10) <= endDate &&
                !t.category.includes('Devolução') &&
                !t.category.includes('Estorno') &&
                !t.category.includes('Reembolso') &&
                !t.category.includes('Fornecedores (Estoque)')
            )
            .reduce((acc, t) => acc + t.amount, 0);

        // 9. Results
        const grossProfit = totalRevenueFiltered - totalCMV;
        const netProfit = grossProfit - operatingExpenses - totalFees;
        const grossMargin = totalRevenueFiltered > 0 ? (grossProfit / totalRevenueFiltered) * 100 : 0;
        const netMargin = totalRevenueFiltered > 0 ? (netProfit / totalRevenueFiltered) * 100 : 0;

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-l-4 border-l-emerald-500 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Receita Bruta (+)</p>
                                <p className="text-xl font-bold text-gray-800">R$ {grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <TrendingUp className="text-emerald-200" size={32} />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-l-4 border-l-red-400 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Devoluções (-)</p>
                                <p className="text-xl font-bold text-red-600">R$ {totalReturns.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <RotateCcw className="text-red-200" size={32} />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-l-4 border-l-yellow-400 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Descontos Conc. (-)</p>
                                <p className="text-xl font-bold text-yellow-600">R$ {totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <Percent className="text-yellow-200" size={32} />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-l-4 border-l-emerald-600 shadow-sm bg-emerald-50">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-xs text-emerald-700 font-bold uppercase">Receita Líquida (=)</p>
                                <p className="text-xl font-black text-emerald-800">R$ {totalRevenueFiltered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <DollarSign className="text-emerald-300" size={32} />
                        </div>
                    </div>
                </div>

                {/* DRE GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Costs */}
                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-red-100 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Custo Mercadoria (CMV)</p>
                                <p className="text-2xl font-bold text-red-600">R$ {totalCMV.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs text-gray-400 mt-1">Custo dos produtos vendidos</p>
                            </div>
                            <Package className="text-red-100" size={32} />
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-red-100 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Taxas Maquininha (Est.)</p>
                                <p className="text-2xl font-bold text-red-600">R$ {totalFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs text-gray-400 mt-1">MDR Médio</p>
                            </div>
                            <CreditCard className="text-red-100" size={32} />
                        </div>
                    </div>

                    {/* Margins */}
                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Lucro Bruto</p>
                                <p className="text-2xl font-bold text-blue-600">R$ {grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs text-blue-500 font-bold mt-1">Margem: {grossMargin.toFixed(1)}%</p>
                            </div>
                            <TrendingUp className="text-blue-100" size={32} />
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-orange-100 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Despesas Operacionais</p>
                                <p className="text-2xl font-bold text-orange-600">R$ {operatingExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs text-gray-400 mt-1">Luz, Água, Aluguel, etc.</p>
                            </div>
                            <Store className="text-orange-100" size={32} />
                        </div>
                    </div>

                    {/* Result */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-sm text-slate-400 font-bold uppercase mb-2">Lucro Líquido do Período</p>
                            <p className={`text-4xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <div className={`mt-4 inline-block px-3 py-1 rounded-full text-xs font-bold ${netProfit >= 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                                Margem Líquida: {netMargin.toFixed(1)}%
                            </div>
                        </div>
                        <Coins className="absolute -bottom-4 -right-4 text-white opacity-5" size={120} />
                    </div>
                </div>

                {/* Promo Performance Card */}
                <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Gift size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-emerald-900">Performance de Promoções</h4>
                            <p className="text-xs text-emerald-600">Vendas de itens em oferta</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-emerald-700">R$ {promoSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-emerald-500 font-medium">Margem Promo: {promoMargin.toFixed(1)}%</p>
                    </div>
                </div>

                {/* Flow Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Fluxo de Resultado</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                            { name: 'Rec. Bruta', value: grossRevenue, fill: '#10b981' },
                            { name: 'Custo (CMV)', value: totalCMV, fill: '#ef4444' },
                            { name: 'Lucro Bruto', value: grossProfit, fill: '#3b82f6' },
                            { name: 'Despesas', value: operatingExpenses + totalFees, fill: '#f59e0b' },
                            { name: 'Líquido', value: netProfit, fill: netProfit >= 0 ? '#10b981' : '#ef4444' },
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis hide />
                            <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={true} barSize={40}>
                                {
                                    [grossRevenue, totalCMV, grossProfit, operatingExpenses + totalFees, netProfit].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry >= 0 ? (index === 1 || index === 3 ? '#ef4444' : '#10b981') : '#ef4444'} />
                                    ))
                                }
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    const renderPaymentMethods = () => {
        // Calculate MDR Estimates
        const savedRates = localStorage.getItem('mm_terminal_rates');
        const terminalRates = savedRates ? JSON.parse(savedRates) : {};
        // Averages
        let avgDebit = 1.99; let avgCredit = 3.99; let avgPix = 0;
        const rateKeys = Object.keys(terminalRates);
        if (rateKeys.length > 0) {
            avgDebit = rateKeys.reduce((acc, k) => acc + (terminalRates[k].debit || 0), 0) / rateKeys.length;
            avgCredit = rateKeys.reduce((acc, k) => acc + (terminalRates[k].credit || 0), 0) / rateKeys.length;
            avgPix = rateKeys.reduce((acc, k) => acc + (terminalRates[k].pix || 0), 0) / rateKeys.length;
        }

        const totalValue = salesByMethod.reduce((acc, d) => acc + d.value, 0);

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Distribuição por Método</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={salesByMethod}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    isAnimationActive={true}
                                >
                                    {salesByMethod.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} formatter={(value) => translatePayment(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <h3 className="font-bold text-gray-700 mb-4">Detalhamento Financeiro</h3>
                        <div className="space-y-3">
                            {salesByMethod.map((method, idx) => {
                                let rate = 0;
                                if (method.name === 'CREDIT') rate = avgCredit;
                                if (method.name === 'DEBIT') rate = avgDebit;
                                if (method.name === 'PIX') rate = avgPix;

                                const feeCost = method.value * (rate / 100);
                                const netValue = method.value - feeCost;
                                const percent = totalValue > 0 ? (method.value / totalValue * 100) : 0;

                                return (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                            <div>
                                                <p className="font-bold text-gray-700">{translatePayment(method.name)}</p>
                                                <p className="text-xs text-gray-400">{percent.toFixed(1)}% do total</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800">R$ {method.value.toFixed(2)}</p>
                                            {rate > 0 && (
                                                <p className="text-[10px] text-red-400">Taxa ({rate}%): -R$ {feeCost.toFixed(2)}</p>
                                            )}
                                            <p className="text-xs font-bold text-emerald-600">Liq: R$ {netValue.toFixed(2)}</p>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="pt-3 border-t mt-4 flex justify-between items-center">
                                <span className="font-bold text-gray-500 uppercase text-xs">Total Bruto</span>
                                <span className="font-black text-xl text-gray-800">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderABC = () => {
        // 1. Aggregate Sales by Product (Including Category)
        const productSales: Record<string, { value: number, qty: number, category: string }> = {};
        filteredSales.forEach(s => {
            s.items.forEach(i => {
                if (!productSales[i.name]) productSales[i.name] = { value: 0, qty: 0, category: i.category };
                productSales[i.name].value += (i.appliedPrice * i.qty);
                productSales[i.name].qty += i.qty;
            });
        });

        // 2. Sort Descending
        const sorted = Object.entries(productSales)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.value - a.value);

        const totalSales = sorted.reduce((acc, p) => acc + p.value, 0);

        // 3. Calculate Accumulation & Class
        let accumulated = 0;
        const abcData = sorted.map(p => {
            accumulated += p.value;
            const percent = totalSales > 0 ? (p.value / totalSales) * 100 : 0;
            const accPercent = totalSales > 0 ? (accumulated / totalSales) * 100 : 0;
            let classification = 'C';
            if (accPercent <= 80) classification = 'A';
            else if (accPercent <= 95) classification = 'B';

            return { ...p, percent, accumulatedPercent: accPercent, classification };
        });

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center border-l-4 border-l-purple-500">
                    <div>
                        <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider">Total Analisado (Curva ABC)</h3>
                        <p className="text-sm text-gray-400 mt-1">{abcData.length} produtos vendidos</p>
                    </div>
                    <p className="text-3xl font-black text-purple-700">R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                {/* Pareto Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Gráfico de Pareto (Top 20 Produtos)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={abcData.slice(0, 20)}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} interval={0} />
                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" fontSize={10} />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" fontSize={10} unit="%" />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar yAxisId="left" dataKey="value" name="Venda (R$)" radius={[4, 4, 0, 0]} isAnimationActive={true}>
                                {abcData.slice(0, 20).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.classification === 'A' ? '#10b981' : entry.classification === 'B' ? '#3b82f6' : '#94a3b8'} />
                                ))}
                            </Bar>
                            <Line yAxisId="right" type="monotone" dataKey="accumulatedPercent" name="Acumulado %" stroke="#ff7300" strokeWidth={2} dot={false} isAnimationActive={true} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                            <tr>
                                <th className="p-4">Class</th>
                                <th className="p-4">Produto</th>
                                <th className="p-4">Categoria</th>
                                <th className="p-4 text-right">Vendas (R$)</th>
                                <th className="p-4 text-right">% Repres.</th>
                                <th className="p-4 text-right">% Acum.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {abcData.map((p, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${p.classification === 'A' ? 'bg-emerald-100 text-emerald-700' :
                                            p.classification === 'B' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {p.classification}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-gray-700">{p.name}</td>
                                    <td className="p-4 text-gray-500">{p.category}</td>
                                    <td className="p-4 text-right font-bold text-gray-800">R$ {p.value.toFixed(2)}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500" style={{ width: `${p.percent}%` }}></div>
                                            </div>
                                            <span className="text-xs text-gray-500">{p.percent.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right text-gray-400">{p.accumulatedPercent.toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderSalesByProduct = () => {
        // Get users from local storage for name lookup
        const savedUsers = localStorage.getItem('mm_users_list');
        const usersList: User[] = savedUsers ? JSON.parse(savedUsers) : [];
        const userMap = usersList.reduce((acc, u) => ({ ...acc, [u.id]: u.name }), {} as Record<string, string>);

        // Flatten all sales items to show each sale separately
        const allItems = filteredSales.flatMap(s =>
            s.items.map(i => ({
                saleId: s.id,
                date: s.timestamp,
                name: i.name,
                code: i.code || '-',
                category: i.category || '-',
                qty: i.qty,
                unitPrice: i.appliedPrice,
                value: i.appliedPrice * i.qty,
                seller: userMap[s.cashierId] || (s.cashierId === currentUser.id ? 'Você' : `ID: ${s.cashierId.slice(0, 4)}`)
            }))
        );

        const data = allItems
            .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalValue = data.reduce((acc, d) => acc + d.value, 0);
        const totalQty = data.reduce((acc, d) => acc + d.qty, 0);

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center border-l-4 border-l-blue-500">
                    <div>
                        <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider">Total de Itens Vendidos</h3>
                        <p className="text-sm text-gray-400 mt-1">{totalQty} itens em {data.length} registros de venda</p>
                    </div>
                    <p className="text-3xl font-black text-blue-700">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Produto</th>
                                <th className="p-4">Categoria</th>
                                <th className="p-4">Vendedor</th>
                                <th className="p-4 text-right">Qtd.</th>
                                <th className="p-4 text-right">Unit.</th>
                                <th className="p-4 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-blue-50 cursor-pointer group transition-colors" onClick={() => setSelectedProductDetail(item)} title="Clique para ver detalhes desta venda">
                                    <td className="p-4 text-gray-500 text-xs">{new Date(item.date).toLocaleString('pt-BR')}</td>
                                    <td className="p-4 font-bold text-gray-700 group-hover:text-blue-700">
                                        {item.name}
                                        <span className="block text-[10px] text-gray-400 font-normal">{item.code}</span>
                                    </td>
                                    <td className="p-4 text-gray-500">{item.category}</td>
                                    <td className="p-4 text-gray-500 text-xs">{item.seller}</td>
                                    <td className="p-4 text-right">{item.qty}</td>
                                    <td className="p-4 text-right text-gray-400">R$ {item.unitPrice.toFixed(2)}</td>
                                    <td className="p-4 text-right font-bold text-emerald-600">R$ {item.value.toFixed(2)}</td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-400">Nenhum registro encontrado neste período.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderProductDetailModal = () => {
        if (!selectedProductDetail) return null;

        // Find the specific sale to get payment method details
        const sale = sales.find(s => s.id === selectedProductDetail.saleId);
        if (!sale) return null;

        // Calculate metrics for THIS specific item in THIS sale
        const savedRates = localStorage.getItem('mm_terminal_rates');
        const terminalRates = savedRates ? JSON.parse(savedRates) : {};
        let avgDebit = 1.99;
        let avgCredit = 3.99;
        let avgPix = 0;
        const rateKeys = Object.keys(terminalRates);
        if (rateKeys.length > 0) {
            avgDebit = rateKeys.reduce((acc, k) => acc + (terminalRates[k].debit || 0), 0) / rateKeys.length;
            avgCredit = rateKeys.reduce((acc, k) => acc + (terminalRates[k].credit || 0), 0) / rateKeys.length;
            avgPix = rateKeys.reduce((acc, k) => acc + (terminalRates[k].pix || 0), 0) / rateKeys.length;
        }

        const item = sale.items.find(i => i.name === selectedProductDetail.name && i.appliedPrice === selectedProductDetail.unitPrice); // Best effort match
        if (!item) return null;

        const revenue = selectedProductDetail.value;
        const cost = (item.costPrice || 0) * selectedProductDetail.qty;

        let fee = 0;
        let rateUsed = 0;

        if (sale.paymentMethod === 'CREDIT') { fee = revenue * (avgCredit / 100); rateUsed = avgCredit; }
        else if (sale.paymentMethod === 'DEBIT') { fee = revenue * (avgDebit / 100); rateUsed = avgDebit; }
        else if (sale.paymentMethod === 'PIX') { fee = revenue * (avgPix / 100); rateUsed = avgPix; }
        else if (sale.paymentMethod === 'MULTIPLE' && sale.payments) {
            const totalSale = sale.total;
            let saleFee = 0;
            sale.payments.forEach(p => {
                let rate = 0;
                if (p.method === 'CREDIT') rate = avgCredit;
                if (p.method === 'DEBIT') rate = avgDebit;
                if (p.method === 'PIX') rate = avgPix;
                saleFee += p.amount * (rate / 100);
            });
            const effectiveRate = totalSale > 0 ? (saleFee / totalSale) : 0;
            fee = revenue * effectiveRate;
            rateUsed = effectiveRate * 100;
        }

        const profit = revenue - cost - fee;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
                    <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Detalhes da Venda</h3>
                            <p className="text-sm text-gray-500">ID: #{sale.id.slice(0, 8)}</p>
                        </div>
                        <button onClick={() => setSelectedProductDetail(null)} className="text-gray-400 hover:text-gray-600"><Ban size={24} /></button>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        {/* Product Info */}
                        <div className="flex items-start gap-4 mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                <Package size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-900 text-lg">{selectedProductDetail.name}</h4>
                                <div className="flex gap-4 text-sm text-blue-700 mt-1">
                                    <span>Cód: <strong>{selectedProductDetail.code}</strong></span>
                                    <span>Cat: <strong>{selectedProductDetail.category}</strong></span>
                                </div>
                            </div>
                        </div>

                        {/* Aggregated Product Stats (Context) */}
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-indigo-600 font-bold uppercase">Total Vendido no Período</p>
                                <p className="text-sm text-indigo-400">Acumulado deste produto no filtro atual</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-indigo-700">
                                    R$ {filteredSales.reduce((acc, s) => {
                                        const i = s.items.find(item => item.name === selectedProductDetail.name);
                                        return acc + (i ? i.appliedPrice * i.qty : 0);
                                    }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-indigo-500 font-bold">
                                    {filteredSales.reduce((acc, s) => {
                                        const i = s.items.find(item => item.name === selectedProductDetail.name);
                                        return acc + (i ? i.qty : 0);
                                    }, 0)} unidades
                                </p>
                            </div>
                        </div>

                        {/* Sale Context */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-500 uppercase font-bold">Data / Hora</p>
                                <p className="font-medium text-gray-800">{new Date(sale.timestamp).toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-500 uppercase font-bold">Vendedor</p>
                                <p className="font-medium text-gray-800">{selectedProductDetail.seller}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-500 uppercase font-bold">Cliente</p>
                                <p className="font-medium text-gray-800">{sale.customerName || 'Consumidor Final'}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-500 uppercase font-bold">Pagamento</p>
                                <p className="font-medium text-gray-800">{translatePayment(sale.paymentMethod)}</p>
                            </div>
                        </div>

                        <hr className="border-gray-100 mb-6" />

                        {/* Financial Breakdown */}
                        <h4 className="font-bold text-gray-800 mb-4">Demonstrativo Financeiro do Item</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                <div>
                                    <p className="font-bold text-emerald-800">Receita de Venda</p>
                                    <p className="text-xs text-emerald-600">{selectedProductDetail.qty} x R$ {selectedProductDetail.unitPrice.toFixed(2)}</p>
                                </div>
                                <p className="text-xl font-black text-emerald-700">+ R$ {revenue.toFixed(2)}</p>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                                <div>
                                    <p className="font-bold text-red-800">Custo do Produto (CMV)</p>
                                    <p className="text-xs text-red-600">Custo Unit.: R$ {item.costPrice.toFixed(2)}</p>
                                </div>
                                <p className="text-xl font-bold text-red-700">- R$ {cost.toFixed(2)}</p>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                                <div>
                                    <p className="font-bold text-orange-800">Taxas Administrativas</p>
                                    <p className="text-xs text-orange-600">Taxa Est.: {rateUsed.toFixed(2)}%</p>
                                </div>
                                <p className="text-xl font-bold text-orange-700">- R$ {fee.toFixed(2)}</p>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-gray-900 rounded-xl text-white mt-4 shadow-lg">
                                <div>
                                    <p className="font-bold text-gray-300 uppercase text-xs">Lucro Líquido</p>
                                    <p className="text-xs text-gray-400">Margem: {margin.toFixed(1)}%</p>
                                </div>
                                <p className={`text-2xl font-black ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    R$ {profit.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderHourlySales = () => {
        // 1. Initialize Buckets
        const buckets = timeRanges.map(range => ({
            ...range,
            count: 0,
            gross: 0,
            discount: 0,
            net: 0
        }));

        let totalCount = 0;
        let totalGross = 0;
        let totalDiscount = 0;
        let totalNet = 0;

        // 2. Process Sales
        filteredSales.forEach(s => {
            // Apply Filters
            const date = new Date(s.timestamp);

            // Day of Week Filter
            const dayOfWeek = date.getDay().toString(); // 0 = Sun, 6 = Sat
            if (selectedDayOfWeek !== 'ALL' && dayOfWeek !== selectedDayOfWeek) return;

            // Payment Method Filter
            if (selectedPaymentMethodFilter !== 'ALL' && s.paymentMethod !== selectedPaymentMethodFilter) return;

            // Time Range Bucket
            const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const rangeIndex = buckets.findIndex(r => isTimeInRange(timeStr, r.start, r.end));

            if (rangeIndex !== -1) {
                // Calculate Values
                const grossSale = s.items.reduce((acc, i) => acc + (i.retailPrice * i.qty), 0);
                const netSale = s.total;
                const discountSale = grossSale - netSale;

                buckets[rangeIndex].count += 1;
                buckets[rangeIndex].gross += grossSale;
                buckets[rangeIndex].net += netSale;
                buckets[rangeIndex].discount += discountSale;

                totalCount += 1;
                totalGross += grossSale;
                totalDiscount += discountSale;
                totalNet += netSale;
            }
        });

        // 3. Prepare Data for Chart
        const chartData = buckets.map(b => ({
            name: b.label,
            Vendas: b.net
        }));

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-l-4 border-l-blue-500 shadow-sm">
                        <p className="text-xs text-gray-500 font-bold uppercase">Vendas (Qtd)</p>
                        <p className="text-2xl font-black text-blue-700">{totalCount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-l-4 border-l-emerald-500 shadow-sm">
                        <p className="text-xs text-gray-500 font-bold uppercase">Faturamento Líquido</p>
                        <p className="text-2xl font-black text-emerald-700">R$ {totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-l-4 border-l-yellow-500 shadow-sm">
                        <p className="text-xs text-gray-500 font-bold uppercase">Descontos</p>
                        <p className="text-2xl font-black text-yellow-600">R$ {totalDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-l-4 border-l-purple-500 shadow-sm">
                        <p className="text-xs text-gray-500 font-bold uppercase">Ticket Médio Geral</p>
                        <p className="text-2xl font-black text-purple-700">R$ {(totalCount > 0 ? totalNet / totalCount : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                {/* Chart and Config Button */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Performance por Faixa Horária</h3>
                        <button
                            onClick={() => setShowTimeRangeConfig(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Sliders size={16} /> Configurar Faixas
                        </button>
                    </div>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickFormatter={(val) => `R$ ${val}`} />
                            <Tooltip
                                cursor={{ fill: '#f3f4f6' }}
                                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento Líquido']}
                            />
                            <Bar dataKey="Vendas" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Detailed Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                            <tr>
                                <th className="p-4">Faixa Horária</th>
                                <th className="p-4 text-center">Qtd.</th>
                                <th className="p-4 text-right">Fat. Bruto</th>
                                <th className="p-4 text-right">Descontos</th>
                                <th className="p-4 text-right">Fat. Líquido</th>
                                <th className="p-4 text-right">Ticket Médio</th>
                                <th className="p-4 text-right">% Part.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {buckets.map((b, idx) => {
                                const ticket = b.count > 0 ? b.net / b.count : 0;
                                const percent = totalNet > 0 ? (b.net / totalNet) * 100 : 0;
                                return (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="p-4">
                                            <span className="font-bold text-gray-700">{b.label}</span>
                                            <span className="text-xs text-gray-400 block">{b.start} - {b.end}</span>
                                        </td>
                                        <td className="p-4 text-center font-medium">{b.count}</td>
                                        <td className="p-4 text-right text-gray-600">R$ {b.gross.toFixed(2)}</td>
                                        <td className="p-4 text-right text-red-500">R$ {b.discount.toFixed(2)}</td>
                                        <td className="p-4 text-right font-bold text-emerald-600">R$ {b.net.toFixed(2)}</td>
                                        <td className="p-4 text-right text-gray-600">R$ {ticket.toFixed(2)}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${percent}%` }}></div>
                                                </div>
                                                <span className="text-xs text-gray-500">{percent.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* Total Row */}
                            <tr className="bg-gray-50 font-bold border-t border-gray-200">
                                <td className="p-4 text-gray-800">TOTAL GERAL</td>
                                <td className="p-4 text-center">{totalCount}</td>
                                <td className="p-4 text-right">R$ {totalGross.toFixed(2)}</td>
                                <td className="p-4 text-right text-red-600">R$ {totalDiscount.toFixed(2)}</td>
                                <td className="p-4 text-right text-emerald-700">R$ {totalNet.toFixed(2)}</td>
                                <td className="p-4 text-right">R$ {(totalCount > 0 ? totalNet / totalCount : 0).toFixed(2)}</td>
                                <td className="p-4 text-right">100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderGenericGroupReport = (groupKey: 'category' | 'brand' | 'supplier') => {
        const dataMap: Record<string, { value: number, qty: number }> = {};

        // Use filteredSales to calculate data for specific period and filters
        filteredSales.forEach(s => {
            s.items.forEach(i => {
                const key = (i as any)[groupKey] || 'Outros';
                if (!dataMap[key]) dataMap[key] = { value: 0, qty: 0 };
                dataMap[key].value += (i.appliedPrice * i.qty);
                dataMap[key].qty += i.qty;
            });
        });

        const data = Object.entries(dataMap)
            .map(([name, stats]) => ({ name, value: stats.value, qty: stats.qty }))
            .sort((a, b) => b.value - a.value)
            .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())); // Apply text filter

        const totalValue = data.reduce((acc, d) => acc + d.value, 0);

        return (
            <div className="space-y-6 animate-fade-in" key={groupKey}>
                {/* Total Summary Card */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center border-l-4 border-l-emerald-500">
                    <div>
                        <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider">Total de Vendas ({groupKey === 'category' ? 'Categorias' : groupKey === 'brand' ? 'Marcas' : 'Fornecedores'})</h3>
                        <p className="text-sm text-gray-400 mt-1">{data.length} registros encontrados</p>
                    </div>
                    <p className="text-3xl font-black text-emerald-700">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 capitalize">Vendas por {groupKey === 'category' ? 'Categoria' : groupKey === 'brand' ? 'Marca' : 'Fornecedor'}</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.slice(0, 10)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="value"
                                fill="#8b5cf6"
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                                isAnimationActive={true}
                                animationDuration={1500}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                            <tr>
                                <th className="p-4">Grupo</th>
                                <th className="p-4 text-right">Qtd. Vendida</th>
                                <th className="p-4 text-right">Valor Total (R$)</th>
                                <th className="p-4 text-right">Percentual (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-4 font-bold text-gray-700">{item.name}</td>
                                    <td className="p-4 text-right">{item.qty}</td>
                                    <td className="p-4 text-right font-bold text-emerald-600">R$ {item.value.toFixed(2)}</td>
                                    <td className="p-4 text-right flex justify-end items-center gap-2">
                                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${totalValue > 0 ? (item.value / totalValue * 100) : 0}%` }}></div>
                                        </div>
                                        <span className="text-xs text-gray-500">{totalValue > 0 ? (item.value / totalValue * 100).toFixed(1) : 0}%</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderCancelledOrReturns = (type: 'CANCELLED' | 'RETURNS') => {
        let data = [];

        if (type === 'CANCELLED') {
            // Filter CANCELED sales
            data = sales.filter(s => {
                const date = s.timestamp.substring(0, 10);
                return date >= startDate && date <= endDate && s.status === 'CANCELED';
            });
        } else {
            // Returns logic based on Financial Transactions for precise amounts
            const returnTrans = transactions.filter(t =>
                t.type === 'EXPENSE' &&
                (t.category.includes('Devolução') || t.category.includes('Reembolso')) &&
                t.date.substring(0, 10) >= startDate && t.date.substring(0, 10) <= endDate
            );
            data = returnTrans.map(t => ({
                id: t.id,
                timestamp: t.date,
                customerName: t.description, // Usually contains sale ID
                total: t.amount,
                paymentMethod: 'REEMBOLSO'
            }));
        }

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-4">
                    <div className={`p-3 rounded-full ${type === 'CANCELLED' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                        {type === 'CANCELLED' ? <XCircle size={24} /> : <RotateCcw size={24} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">{type === 'CANCELLED' ? 'Vendas Canceladas' : 'Devoluções Registradas'}</h3>
                        <p className="text-gray-500 text-sm">Total: <span className="font-bold text-gray-800">R$ {data.reduce((acc, i: any) => acc + i.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Descrição / Cliente</th>
                                <th className="p-4 text-right">Valor Estornado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.map((item: any, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-4">{new Date(item.timestamp).toLocaleDateString('pt-BR')}</td>
                                    <td className="p-4 font-medium text-gray-700">{item.customerName}</td>
                                    <td className="p-4 text-right font-bold text-red-600">R$ {item.total.toFixed(2)}</td>
                                </tr>
                            ))}
                            {data.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-gray-400">Nenhum registro encontrado.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderPurchasesReport = () => {
        // Purchases are expense transactions with specific categories or items
        const purchaseTransactions = transactions.filter(t =>
            t.type === 'EXPENSE' &&
            t.date.substring(0, 10) >= startDate && t.date.substring(0, 10) <= endDate &&
            (t.category.includes('Fornecedores') || t.category.includes('Estoque') || t.items)
        );

        const totalPurchased = purchaseTransactions.reduce((acc, t) => acc + t.amount, 0);
        const paidPurchases = purchaseTransactions.filter(t => t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0);
        const pendingPurchases = purchaseTransactions.filter(t => t.status === 'PENDING').reduce((acc, t) => acc + t.amount, 0);

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KPICard title="Total Comprado" value={`R$ ${totalPurchased.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Truck} color="blue" />
                    <KPICard title="Pago" value={`R$ ${paidPurchases.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={CheckCircle} color="emerald" />
                    <KPICard title="Pendente / A Pagar" value={`R$ ${pendingPurchases.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Clock} color="orange" />
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Descrição / Fornecedor</th>
                                <th className="p-4">Valor</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Vencimento</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {purchaseTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="p-4">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                    <td className="p-4 font-bold text-gray-700">{t.description}</td>
                                    <td className="p-4 font-bold text-red-600">R$ {t.amount.toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {t.status === 'PAID' ? 'Pago' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center text-gray-500">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR') : '-'}</td>
                                    <td className="p-4 text-center">
                                        {t.items && t.items.length > 0 && (
                                            <button
                                                onClick={() => setViewPurchase(t)}
                                                className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"
                                                title="Ver Itens"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // --- MENU RENDERER ---

    if (currentView) {
        return (
            <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setCurrentView(null)} className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 rounded-full transition-colors shadow-md">
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {currentView === 'SALES_PERIOD' && 'Vendas por período'}
                            {currentView === 'SALES_COSTS' && 'Detalhes de vendas e custos (DRE)'}
                            {currentView === 'PAYMENT_METHODS' && 'Formas de Pagamento'}
                            {currentView === 'PRODUCT_GROUPS' && 'Vendas por Grupos / Categorias'}
                            {currentView === 'BRANDS' && 'Vendas por Marcas'}
                            {currentView === 'SUPPLIERS' && 'Vendas por Fornecedores'}
                            {currentView === 'ABC_PRODUCTS' && 'Curva ABC - Produtos Mais Vendidos'}
                            {currentView === 'SALES_BY_PRODUCT' && 'Vendas por Produtos'}
                            {currentView === 'HOURLY_SALES' && 'Relatório de Faixa Horária'}
                            {currentView === 'PURCHASES' && 'Compras no período'}
                            {currentView === 'RETURNS' && 'Vendas com Devoluções'}
                            {currentView === 'CANCELLED' && 'Vendas Canceladas'}
                        </h2>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex gap-2">
                        {/* Extra Filters for Hourly Sales */}
                        {currentView === 'HOURLY_SALES' && (
                            <>
                                <div className="flex items-center gap-2 bg-white border p-1 rounded-lg shadow-sm animate-fade-in">
                                    <Calendar className="text-gray-400 ml-2" size={16} />
                                    <select
                                        className="p-1 outline-none text-sm text-gray-600 bg-transparent"
                                        value={selectedDayOfWeek}
                                        onChange={e => setSelectedDayOfWeek(e.target.value)}
                                    >
                                        <option value="ALL">Todos os Dias</option>
                                        <option value="0">Domingo</option>
                                        <option value="1">Segunda</option>
                                        <option value="2">Terça</option>
                                        <option value="3">Quarta</option>
                                        <option value="4">Quinta</option>
                                        <option value="5">Sexta</option>
                                        <option value="6">Sábado</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 bg-white border p-1 rounded-lg shadow-sm animate-fade-in">
                                    <CreditCard className="text-gray-400 ml-2" size={16} />
                                    <select
                                        className="p-1 outline-none text-sm text-gray-600 bg-transparent"
                                        value={selectedPaymentMethodFilter}
                                        onChange={e => setSelectedPaymentMethodFilter(e.target.value)}
                                    >
                                        <option value="ALL">Todas Formas Pagto</option>
                                        <option value="CASH">Dinheiro</option>
                                        <option value="CREDIT">Crédito</option>
                                        <option value="DEBIT">Débito</option>
                                        <option value="PIX">Pix</option>
                                        <option value="FIADO">Fiado</option>
                                        <option value="MULTIPLE">Múltiplo</option>
                                    </select>
                                </div>
                            </>
                        )}
                        <div className="flex items-center gap-2 bg-white border p-1 rounded-lg shadow-sm">
                            <Search className="text-gray-400 ml-2" size={16} />
                            <input
                                type="text"
                                placeholder="Filtrar dados..."
                                className="p-1 outline-none text-sm text-gray-600 w-32"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-white border p-1 rounded-lg shadow-sm">
                            <Users className="text-gray-400 ml-2" size={16} />
                            <select
                                className="p-1 outline-none text-sm text-gray-600 bg-transparent"
                                value={selectedCashier}
                                onChange={e => setSelectedCashier(e.target.value)}
                            >
                                <option value="ALL">Todos Vendedores</option>
                                {uniqueCashiers.map(id => {
                                    const userName = id === currentUser.id
                                        ? currentUser.name
                                        : (cashierNameMap[id] || `ID: ${id.slice(0, 6)}`);
                                    return (
                                        <option key={id} value={id}>
                                            {userName}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-white border p-1 rounded-lg shadow-sm">
                            <Calendar className="text-gray-400 ml-2" size={16} />
                            <input type="date" className="p-1 outline-none text-sm text-gray-600" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            <span className="text-gray-300">até</span>
                            <input type="date" className="p-1 outline-none text-sm text-gray-600" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                className="p-2 bg-white border rounded-lg text-gray-500 hover:text-emerald-600 shadow-sm flex items-center gap-2"
                                title="Exportar"
                            >
                                <Download size={20} />
                                <ChevronDown size={14} />
                            </button>

                            {showDownloadMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                                    <button
                                        onClick={() => handleDownload('PDF')}
                                        className="w-full text-left px-4 py-3 hover:bg-red-50 text-gray-700 hover:text-red-600 flex items-center gap-3 transition-colors"
                                    >
                                        <FileText size={18} /> Exportar PDF
                                    </button>
                                    <button
                                        onClick={() => handleDownload('CSV')}
                                        className="w-full text-left px-4 py-3 hover:bg-green-50 text-gray-700 hover:text-green-600 flex items-center gap-3 transition-colors border-t border-gray-50"
                                    >
                                        <FileText size={18} /> Exportar CSV
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 pb-10">
                    {currentView === 'SALES_PERIOD' && renderSalesPeriod()}
                    {currentView === 'SALES_COSTS' && renderSalesCosts()}
                    {currentView === 'PAYMENT_METHODS' && renderPaymentMethods()}
                    {currentView === 'PRODUCT_GROUPS' && renderGenericGroupReport('category')}
                    {currentView === 'BRANDS' && renderGenericGroupReport('brand')}
                    {currentView === 'SUPPLIERS' && renderGenericGroupReport('supplier')}
                    {currentView === 'ABC_PRODUCTS' && renderABC()}
                    {currentView === 'SALES_BY_PRODUCT' && renderSalesByProduct()}
                    {currentView === 'HOURLY_SALES' && renderHourlySales()}
                    {currentView === 'PURCHASES' && renderPurchasesReport()}
                    {currentView === 'RETURNS' && renderCancelledOrReturns('RETURNS')}
                    {currentView === 'CANCELLED' && renderCancelledOrReturns('CANCELLED')}
                </div>

                {/* Manage Sale Modal */}
                {manageSale && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in">
                            <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                                <h3 className="font-bold text-gray-800">Gerenciar Venda #{manageSale.id.slice(0, 6)}</h3>
                                <button onClick={() => { setManageSale(null); setIsReturnMode(false); }} className="text-gray-400 hover:text-gray-600"><Ban size={20} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                                    <p><strong>Cliente:</strong> {manageSale.customerName || 'N/A'}</p>
                                    <p><strong>Total:</strong> R$ {manageSale.total.toFixed(2)}</p>
                                    <p><strong>Pagamento:</strong> {translatePayment(manageSale.paymentMethod)}</p>
                                </div>

                                {isReturnMode ? (
                                    <div className="space-y-4">
                                        <p className="text-sm font-bold text-gray-700">Selecione os itens para devolver:</p>
                                        <div className="max-h-60 overflow-y-auto border rounded-lg">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-100 text-gray-500 sticky top-0">
                                                    <tr>
                                                        <th className="p-2">Produto</th>
                                                        <th className="p-2 text-center">Comprado</th>
                                                        <th className="p-2 text-center">Devolver</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {manageSale.items.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="p-2">{item.name}</td>
                                                            <td className="p-2 text-center">{item.qty}</td>
                                                            <td className="p-2 flex justify-center items-center gap-2">
                                                                <button type="button" onClick={() => toggleReturnQty(item.cartItemId || item.id, item.qty, -1)} className="bg-gray-200 w-6 h-6 rounded font-bold hover:bg-gray-300">-</button>
                                                                <span className="w-8 text-center font-bold text-red-600">{returnQuantities[item.cartItemId || item.id] || 0}</span>
                                                                <button type="button" onClick={() => toggleReturnQty(item.cartItemId || item.id, item.qty, 1)} className="bg-gray-200 w-6 h-6 rounded font-bold hover:bg-gray-300">+</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="bg-red-50 p-3 rounded-lg flex justify-between items-center border border-red-100">
                                            <div>
                                                <p className="text-red-700 font-bold">Total Reembolso:</p>
                                                <p className="text-xs text-red-500">{Object.values(returnQuantities).reduce((a: number, b: number) => a + b, 0)} itens selecionados</p>
                                            </div>
                                            <p className="text-xl font-black text-red-600">
                                                R$ {Object.entries(returnQuantities).reduce((acc: number, [id, qty]) => {
                                                    const item = manageSale.items.find(i => (i.cartItemId || i.id) === id);
                                                    return acc + (item ? item.appliedPrice * (qty as number) : 0);
                                                }, 0).toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setIsReturnMode(false)} className="flex-1 py-3 border rounded-lg text-gray-500 hover:bg-gray-50 font-bold">Voltar</button>
                                            <button
                                                type="button"
                                                onClick={confirmPartialReturn}
                                                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-lg shadow-red-200"
                                            >
                                                Confirmar Devolução
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') {
                                                    setIsReturnMode(true);
                                                } else {
                                                    setShowPermissionDenied(true);
                                                }
                                            }}
                                            className="p-4 border-2 border-orange-100 bg-orange-50 rounded-xl hover:bg-orange-100 hover:border-orange-300 transition-all text-orange-700 font-bold flex flex-col items-center gap-2"
                                        >
                                            <RotateCcw size={24} className="pointer-events-none" /> Devolução de Produtos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();

                                                if (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') {
                                                    // Removed confirm dialog to ensure execution if browser blocks it
                                                    if (onVoidSale) {
                                                        onVoidSale(manageSale.id);
                                                        setManageSale(null);
                                                    } else {
                                                        console.error("Função de cancelamento indisponível");
                                                    }
                                                } else {
                                                    setShowPermissionDenied(true);
                                                }
                                            }}
                                            className="p-4 border-2 border-red-100 bg-red-50 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all text-red-700 font-bold flex flex-col items-center gap-2"
                                        >
                                            <Ban size={24} className="pointer-events-none" /> Cancelar Venda (Estorno)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* View Sale Details Modal (Read Only) */}
                {viewSale && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
                            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-800">Detalhes da Venda</h3>
                                <button onClick={() => setViewSale(null)} className="text-gray-400 hover:text-gray-600"><Ban size={20} /></button>
                            </div>
                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                <div className="space-y-2 mb-4">
                                    {viewSale.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm border-b pb-2">
                                            <div>
                                                <p className="font-bold text-gray-700">{item.name}</p>
                                                <p className="text-xs text-gray-500">{item.qty} x R$ {item.appliedPrice.toFixed(2)}</p>
                                            </div>
                                            <p className="font-bold text-gray-800">R$ {(item.qty * item.appliedPrice).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t font-bold text-lg">
                                    <span>Total</span>
                                    <span className="text-emerald-600">R$ {viewSale.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Purchase Details Modal */}
                {viewPurchase && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
                            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-800">Itens da Compra</h3>
                                <button onClick={() => setViewPurchase(null)} className="text-gray-400 hover:text-gray-600"><Ban size={20} /></button>
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
                {renderProductDetailModal()}
                <TimeRangeConfigModal
                    isOpen={showTimeRangeConfig}
                    onClose={() => setShowTimeRangeConfig(false)}
                    ranges={timeRanges}
                    setRanges={setTimeRanges}
                />
            </div>
        );
    }

    // Return Validation Modal
    const renderReturnValidationModal = () => {
        if (!showReturnValidation) return null;
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-scale-in border-2 border-orange-100">
                    <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Atenção</h3>
                    <p className="text-gray-600 mb-6">Selecione pelo menos um item para devolver.</p>
                    <button
                        onClick={() => setShowReturnValidation(false)}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        );
    };

    // Permission Denied Modal
    const renderPermissionDeniedModal = () => {
        if (!showPermissionDenied) return null;
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-scale-in border-2 border-red-100">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ban size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Acesso Negado</h3>
                    <p className="text-gray-600 mb-6">Apenas Gerentes/Admins podem realizar esta ação.</p>
                    <button
                        onClick={() => setShowPermissionDenied(false)}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        );
    };

    // --- MAIN MENU RENDERER ---
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Central de Relatórios</h2>
                    <p className="text-gray-500 text-sm">Selecione um relatório para visualizar</p>
                </div>
                <div className="flex items-center gap-2 bg-white border p-1 rounded-lg">
                    <Calendar className="text-gray-400 ml-2" size={16} />
                    <input type="date" className="p-1 outline-none text-sm text-gray-600" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <span className="text-gray-300">|</span>
                    <input type="date" className="p-1 outline-none text-sm text-gray-600" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
            </div>

            <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                <ReportMenuCard
                    title="Vendas no período"
                    description="Somatório das vendas em um período, podendo ser agrupadas por dia, mês ou ano."
                    icon={TrendingUp}
                    onClick={() => setCurrentView('SALES_PERIOD')}
                />
                <ReportMenuCard
                    title="Detalhes de vendas e custos no período"
                    description="Somatório das vendas, detalhando custos, comissões, lucros e taxas em um período, podendo ser agrupadas por dia, mês ou ano."
                    icon={Calculator}
                    onClick={() => setCurrentView('SALES_COSTS')}
                />
                <ReportMenuCard
                    title="Gráfico por forma de pagamento no período"
                    description="Percentual de formas de pagamentos nas vendas de um período."
                    icon={Receipt}
                    onClick={() => setCurrentView('PAYMENT_METHODS')}
                />
                <ReportMenuCard
                    title="Gráfico de vendas por grupos de produtos no período"
                    description="Percentual de grupos de produtos nas vendas de um período."
                    icon={Package}
                    onClick={() => setCurrentView('PRODUCT_GROUPS')}
                />
                <ReportMenuCard
                    title="Vendas por Produtos"
                    description="Listagem detalhada de produtos vendidos no período."
                    icon={Package}
                    onClick={() => setCurrentView('SALES_BY_PRODUCT')}
                />
                <ReportMenuCard
                    title="Relatório de Faixa Horária"
                    description="Análise de vendas por horário do dia."
                    icon={Clock}
                    onClick={() => setCurrentView('HOURLY_SALES')}
                />
                <ReportMenuCard
                    title="Gráfico de vendas por fornecedores de produtos no período"
                    description="Percentual de fornecedores de produtos nas vendas de um período."
                    icon={Truck}
                    onClick={() => setCurrentView('SUPPLIERS')}
                />
                <ReportMenuCard
                    title="Gráfico de vendas por marcas de produtos no período"
                    description="Percentual de marcas de produtos nas vendas de um período."
                    icon={Tag}
                    onClick={() => setCurrentView('BRANDS')}
                />
                <ReportMenuCard
                    title="Curva ABC - Produtos Mais Vendidos"
                    description="Percentual de cada produto mais vendidos de um período"
                    icon={TrendingDown}
                    onClick={() => setCurrentView('ABC_PRODUCTS')}
                />
                <ReportMenuCard
                    title="Relatórios Avançados"
                    description="Análises detalhadas, comparativos e tendências."
                    icon={TrendingUp}
                    onClick={onNavigateToAdvancedReports}
                />

                {/* Separator for other reports not in image but existing in system */}
                <div className="my-4 border-t border-gray-100"></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Outros Relatórios</p>

                <ReportMenuCard
                    title="Compras no período"
                    description="Análise de entrada de mercadorias e contas a pagar."
                    icon={Truck}
                    onClick={() => setCurrentView('PURCHASES')}
                />
                <ReportMenuCard
                    title="Vendas com Devoluções"
                    description="Detalhamento das vendas que possuem alguma devolução e que foi gerado vale compra."
                    icon={RotateCcw}
                    onClick={() => setCurrentView('RETURNS')}
                />
                <ReportMenuCard
                    title="Vendas Canceladas"
                    description="Detalhamento das vendas canceladas que foram estornado o valor pago."
                    icon={XCircle}
                    onClick={() => setCurrentView('CANCELLED')}
                />
            </div>
            {renderReturnValidationModal()}
            {renderPermissionDeniedModal()}
            {renderProductDetailModal()}
        </div>
    );
};

export default Reports;
