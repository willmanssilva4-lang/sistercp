
import React, { useState, useEffect } from 'react';
import { Product, Sale, Transaction } from '../types';
import { generateBusinessInsight } from '../services/geminiService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { TrendingUp, AlertTriangle, DollarSign, Package, Sparkles, CalendarClock } from 'lucide-react';
import { getTotalStockValue } from '../src/utils/pepsUtils';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ products, sales, transactions }) => {
  const [insight, setInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [totalStockValueCost, setTotalStockValueCost] = useState<number>(0);

  // Derived Stats
  const totalRevenue = sales
    .filter(s => s.status === 'COMPLETED')
    .reduce((acc, curr) => acc + curr.total, 0);

  const lowStockItems = products.filter(p => p.stock <= p.minStock);

  // Calculate Expiring Items
  const expiringItems = products.filter(p => {
    if (!p.expiryDate) return false;

    // Usar apenas a data (sem hora) para comparação precisa
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse da data de validade evitando problemas de timezone
    // Se a data vier como "YYYY-MM-DD", criar a data localmente
    const [year, month, day] = p.expiryDate.split('-').map(Number);
    const expiryDate = new Date(year, month - 1, day); // month é 0-indexed
    expiryDate.setHours(0, 0, 0, 0);

    const daysUntil = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  });

  // Calculate Bills Due Today (Local Time Logic)
  // Convert local date to YYYY-MM-DD for comparison with transaction dueDate
  const todayLocalYMD = new Date().toLocaleDateString('pt-BR').split('/').reverse().join('-');

  const billsDueToday = transactions.filter(t =>
    t.type === 'EXPENSE' &&
    t.status === 'PENDING' &&
    t.dueDate === todayLocalYMD
  );

  // Novos indicadores
  const salesTodayCount = sales.filter(s =>
    s.status === 'COMPLETED' &&
    new Date(s.timestamp).toLocaleDateString('pt-BR') === new Date().toLocaleDateString('pt-BR')
  ).length;

  const pendingBills = transactions.filter(t =>
    t.type === 'EXPENSE' &&
    t.status === 'PENDING'
  );

  const totalPendingBills = pendingBills.reduce((acc, t) => acc + t.amount, 0);

  // Lucro estimado (baseado nas vendas completadas)
  const estimatedProfit = sales
    .filter(s => s.status === 'COMPLETED')
    .reduce((acc, sale) => {
      const saleProfit = sale.items.reduce((itemAcc, item) => {
        const profit = (item.appliedPrice - item.costPrice) * item.qty;
        return itemAcc + profit;
      }, 0);
      return acc + saleProfit;
    }, 0);

  // Valor total em estoque (venda) - calculado com base no preço de venda
  const totalStockValueRetail = products.reduce((acc, p) => {
    return acc + (p.stock * p.retailPrice);
  }, 0);

  // Buscar valor total em estoque (custo) usando lotes PEPS
  useEffect(() => {
    const fetchStockValue = async () => {
      const value = await getTotalStockValue(products);
      setTotalStockValueCost(value);
    };
    fetchStockValue();
  }, [products]);

  // Prepare Chart Data (Last 7 days sales)
  const getLast7DaysData = () => {
    // Se não houver vendas (sistema resetado ou novo), mostrar apenas o dia de hoje
    if (sales.length === 0) {
      const d = new Date();
      const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      return [{ name: diasSemana[d.getDay()], vendas: 0 }];
    }

    const data = [];
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('pt-BR'); // DD/MM/YYYY
      const dayName = diasSemana[d.getDay()]; // Nome do dia da semana

      const daySales = sales
        .filter(s => s.status === 'COMPLETED' && new Date(s.timestamp).toLocaleDateString('pt-BR') === dateStr)
        .reduce((acc, s) => acc + s.total, 0);
      data.push({ name: dayName, vendas: daySales });
    }
    return data;
  };

  const chartData = getLast7DaysData();

  const handleGetInsight = async () => {
    setLoadingInsight(true);
    const text = await generateBusinessInsight(sales, products, transactions);
    setInsight(text);
    setLoadingInsight(false);
  };

  // Sales Today Calculation (Local Time Match)
  const salesTodayValue = sales
    .filter(s => s.status === 'COMPLETED' && new Date(s.timestamp).toLocaleDateString('pt-BR') === new Date().toLocaleDateString('pt-BR'))
    .reduce((a, b) => a + b.total, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl z-50">
          <p className="font-bold text-gray-700 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Painel Gerencial</h2>
        <button
          onClick={handleGetInsight}
          disabled={loadingInsight}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 w-full sm:w-auto justify-center"
        >
          <Sparkles size={18} />
          {loadingInsight ? 'Analisando...' : 'IA Insight'}
        </button>
      </div>

      {insight && (
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl text-purple-900 shadow-sm animate-fade-in">
          <p className="font-medium flex items-start gap-2">
            <Sparkles className="mt-1 flex-shrink-0 text-purple-600" size={16} />
            {insight}
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Vendas Hoje</p>
            <p className="text-2xl font-bold text-gray-900">
              R$ {salesTodayValue.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{salesTodayCount} vendas</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Faturamento Total</p>
            <p className="text-2xl font-bold text-gray-900">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Lucro Estimado</p>
            <p className="text-2xl font-bold text-emerald-600">R$ {estimatedProfit.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">Margem bruta</p>
          </div>
          <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Contas a Pagar</p>
            <p className="text-2xl font-bold text-red-600">R$ {totalPendingBills.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">{pendingBills.length} pendentes</p>
          </div>
          <div className="bg-red-100 p-3 rounded-full text-red-600">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Estoque Baixo</p>
            <p className="text-2xl font-bold text-orange-600">{lowStockItems.length}</p>
          </div>
          <div className="bg-orange-100 p-3 rounded-full text-orange-600">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Produtos Vencendo</p>
            <p className="text-2xl font-bold text-red-600">{expiringItems.length}</p>
            <p className="text-xs text-gray-400 mt-1">Próximos 7 dias</p>
          </div>
          <div className="bg-red-100 p-3 rounded-full text-red-600">
            <CalendarClock size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Produtos Totais</p>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Contas Hoje</p>
            <p className="text-2xl font-bold text-yellow-600">{billsDueToday.length}</p>
            <p className="text-xs text-gray-400 mt-1">Vencem hoje</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
            <CalendarClock size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Valor em Estoque (Custo)</p>
            <p className="text-2xl font-bold text-purple-600">R$ {totalStockValueCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-gray-400 mt-1">Investimento total</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-full text-purple-600">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Valor em Estoque (Venda)</p>
            <p className="text-2xl font-bold text-cyan-600">R$ {totalStockValueRetail.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-gray-400 mt-1">Potencial de venda</p>
          </div>
          <div className="bg-cyan-100 p-3 rounded-full text-cyan-600">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Vendas (Últimos 7 Dias)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="vendas"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Alertas Operacionais</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">

            {/* ALERTAS DE CONTAS VENCENDO HOJE */}
            {billsDueToday.length > 0 && (
              billsDueToday.map(bill => (
                <div key={bill.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200 animate-pulse">
                  <div className="flex items-center gap-2">
                    <CalendarClock size={16} className="text-yellow-600" />
                    <span className="text-sm font-bold text-gray-700">Vence Hoje: {bill.description}</span>
                  </div>
                  <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded border border-yellow-200">
                    R$ {bill.amount.toFixed(2)}
                  </span>
                </div>
              ))
            )}

            {expiringItems.length > 0 ? (
              expiringItems.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-sm font-medium text-gray-700">{p.name}</span>
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                    Vence: {(() => {
                      const [year, month, day] = p.expiryDate!.split('-').map(Number);
                      return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
                    })()}
                  </span>
                </div>
              ))
            ) : null}

            {lowStockItems.length > 0 && (
              lowStockItems.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <span className="text-sm font-medium text-gray-700">{p.name}</span>
                  <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                    Estoque: {p.stock}
                  </span>
                </div>
              ))
            )}

            {billsDueToday.length === 0 && expiringItems.length === 0 && lowStockItems.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum alerta operacional no momento.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
