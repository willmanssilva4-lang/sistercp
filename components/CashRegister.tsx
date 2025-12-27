import React, { useState, useEffect } from 'react';
import { DollarSign, Lock, Unlock, TrendingUp, TrendingDown, Clock, User, Calendar } from 'lucide-react';

interface CashRegisterSession {
    id: string;
    userId: string;
    userName: string;
    openingDate: string;
    closingDate?: string;
    openingBalance: number;
    closingBalance?: number;
    expectedBalance?: number;
    difference?: number;
    status: 'OPEN' | 'CLOSED';
    notes?: string;
}

interface CashRegisterProps {
    currentUser: { id: string; name: string } | null;
}

export default function CashRegister({ currentUser }: CashRegisterProps) {
    const [sessions, setSessions] = useState<CashRegisterSession[]>([]);
    const [currentSession, setCurrentSession] = useState<CashRegisterSession | null>(null);
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [openingBalance, setOpeningBalance] = useState('0');
    const [closingBalance, setClosingBalance] = useState('0');
    const [closingNotes, setClosingNotes] = useState('');

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = () => {
        const saved = localStorage.getItem('cashRegisterSessions');
        if (saved) {
            const parsed = JSON.parse(saved);
            setSessions(parsed);
            const open = parsed.find((s: CashRegisterSession) => s.status === 'OPEN');
            setCurrentSession(open || null);
        }
    };

    const saveSessions = (newSessions: CashRegisterSession[]) => {
        localStorage.setItem('cashRegisterSessions', JSON.stringify(newSessions));
        setSessions(newSessions);
    };

    const handleOpenRegister = () => {
        if (!currentUser) return;

        const newSession: CashRegisterSession = {
            id: Date.now().toString(),
            userId: currentUser.id,
            userName: currentUser.name,
            openingDate: new Date().toISOString(),
            openingBalance: parseFloat(openingBalance) || 0,
            status: 'OPEN'
        };

        const updated = [...sessions, newSession];
        saveSessions(updated);
        setCurrentSession(newSession);
        setShowOpenModal(false);
        setOpeningBalance('0');
    };

    const handleCloseRegister = () => {
        if (!currentSession) return;

        // Calculate expected balance from sales
        const sales = JSON.parse(localStorage.getItem('sales') || '[]');
        const salesInSession = sales.filter((sale: any) =>
            new Date(sale.timestamp) >= new Date(currentSession.openingDate) &&
            (sale.paymentMethod === 'CASH' || sale.paymentMethod === 'FIADO')
        );

        const salesTotal = salesInSession.reduce((sum: number, sale: any) => sum + sale.total, 0);
        const expectedBalance = currentSession.openingBalance + salesTotal;
        const actualBalance = parseFloat(closingBalance) || 0;
        const difference = actualBalance - expectedBalance;

        const updatedSession: CashRegisterSession = {
            ...currentSession,
            closingDate: new Date().toISOString(),
            closingBalance: actualBalance,
            expectedBalance,
            difference,
            status: 'CLOSED',
            notes: closingNotes
        };

        const updated = sessions.map(s => s.id === currentSession.id ? updatedSession : s);
        saveSessions(updated);
        setCurrentSession(null);
        setShowCloseModal(false);
        setClosingBalance('0');
        setClosingNotes('');
    };

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

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Controle de Caixa</h1>
                {currentSession ? (
                    <button
                        onClick={() => setShowCloseModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        <Lock className="w-5 h-5" />
                        Fechar Caixa
                    </button>
                ) : (
                    <button
                        onClick={() => setShowOpenModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <Unlock className="w-5 h-5" />
                        Abrir Caixa
                    </button>
                )}
            </div>

            {/* Current Session Card */}
            {currentSession && (
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 mb-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <Unlock className="w-8 h-8" />
                        <div>
                            <h2 className="text-xl font-bold">Caixa Aberto</h2>
                            <p className="text-green-100">Operador: {currentSession.userName}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-green-100 text-sm">Abertura</p>
                            <p className="text-lg font-semibold">{formatDateTime(currentSession.openingDate)}</p>
                        </div>
                        <div>
                            <p className="text-green-100 text-sm">Saldo Inicial</p>
                            <p className="text-lg font-semibold">{formatCurrency(currentSession.openingBalance)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Sessions History */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">Histórico de Sessões</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operador</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abertura</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fechamento</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo Inicial</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo Final</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Esperado</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diferença</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sessions.slice().reverse().map((session) => (
                                <tr key={session.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            {session.userName}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{formatDateTime(session.openingDate)}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {session.closingDate ? formatDateTime(session.closingDate) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium">
                                        {formatCurrency(session.openingBalance)}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium">
                                        {session.closingBalance !== undefined ? formatCurrency(session.closingBalance) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {session.expectedBalance !== undefined ? formatCurrency(session.expectedBalance) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {session.difference !== undefined ? (
                                            <span className={session.difference >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                                {formatCurrency(session.difference)}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {session.status === 'OPEN' ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                Aberto
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                                                Fechado
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Open Register Modal */}
            {showOpenModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Unlock className="w-6 h-6 text-green-600" />
                            Abrir Caixa
                        </h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Saldo Inicial
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowOpenModal(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleOpenRegister}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Abrir Caixa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Close Register Modal */}
            {showCloseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Lock className="w-6 h-6 text-red-600" />
                            Fechar Caixa
                        </h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Saldo Final (Contagem)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={closingBalance}
                                onChange={(e) => setClosingBalance(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Observações (opcional)
                            </label>
                            <textarea
                                value={closingNotes}
                                onChange={(e) => setClosingNotes(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                                rows={3}
                                placeholder="Observações sobre o fechamento..."
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCloseModal(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCloseRegister}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Fechar Caixa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
