
import React, { useState } from 'react';
import { Customer, Transaction } from '../types';
import { Plus, Edit, Trash2, Search, User, Phone, MapPin, CreditCard, DollarSign, CheckCircle, Wallet, History } from 'lucide-react';

interface CustomersProps {
    customers: Customer[];
    onAddCustomer: (c: Customer) => void;
    onUpdateCustomer: (c: Customer) => void;
    onDeleteCustomer: (id: string) => void;
    onPayDebt: (customerId: string, amount: number) => void;
    onNavigate: (view: string) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer, onPayDebt, onNavigate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [payAmount, setPayAmount] = useState('');

    // Form State
    const initialForm = {
        name: '',
        cpf: '',
        phone: '',
        email: '',
        address: '',
        creditLimit: '0,00',
        debtBalance: 0 // Read-only in form mostly
    };
    const [formData, setFormData] = useState(initialForm);

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const parseCurrency = (value: string) => {
        if (!value) return 0;
        return parseFloat(value.replace(/\./g, '').replace(',', '.'));
    };

    const handleMoneyInput = (value: string) => {
        const digits = value.replace(/\D/g, '');
        const numberValue = parseInt(digits, 10) / 100;
        return numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const customer: Customer = {
            id: editingId || crypto.randomUUID(),
            name: formData.name,
            cpf: formData.cpf,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            creditLimit: parseCurrency(formData.creditLimit),
            debtBalance: formData.debtBalance
        };

        if (editingId) {
            onUpdateCustomer(customer);
        } else {
            onAddCustomer(customer);
        }
        closeModal();
    };

    const handlePayDebtSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer) return;
        const amount = parseCurrency(payAmount);
        if (amount <= 0) {
            alert('Valor inválido');
            return;
        }
        if (amount > selectedCustomer.debtBalance) {
            alert('Valor maior que a dívida atual.');
            return;
        }

        onPayDebt(selectedCustomer.id, amount);
        closePayModal();
    };

    const openEdit = (c: Customer) => {
        setFormData({
            name: c.name,
            cpf: c.cpf || '',
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            creditLimit: formatCurrency(c.creditLimit),
            debtBalance: c.debtBalance
        });
        setEditingId(c.id);
        setIsModalOpen(true);
    };

    const openPayModal = (c: Customer) => {
        setSelectedCustomer(c);
        setPayAmount(formatCurrency(c.debtBalance)); // Sugerir valor total
        setIsPayModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData(initialForm);
    };

    const closePayModal = () => {
        setIsPayModalOpen(false);
        setSelectedCustomer(null);
        setPayAmount('');
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.cpf && c.cpf.includes(searchTerm)) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestão de Clientes (CRM)</h2>
                    <p className="text-gray-500 text-sm">Cadastros, histórico e controle de fiado</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => onNavigate('customer-history')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                        <History size={18} /> Histórico
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                    >
                        <Plus size={18} /> Novo Cliente
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b flex gap-4 bg-gray-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, CPF ou telefone..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-gray-50 text-gray-600 font-semibold text-sm uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Contato</th>
                                <th className="p-4">Limite Crédito</th>
                                <th className="p-4">Saldo Devedor</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCustomers.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-800">{c.name}</div>
                                                {c.cpf && <div className="text-xs text-gray-400">CPF: {c.cpf}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {c.phone && <div className="flex items-center gap-1"><Phone size={12} /> {c.phone}</div>}
                                        {c.address && <div className="flex items-center gap-1 mt-1 text-xs text-gray-400"><MapPin size={12} /> {c.address.slice(0, 20)}...</div>}
                                    </td>
                                    <td className="p-4 font-medium text-gray-700">
                                        R$ {formatCurrency(c.creditLimit)}
                                    </td>
                                    <td className="p-4">
                                        <div className={`font-bold ${c.debtBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            R$ {formatCurrency(c.debtBalance)}
                                        </div>
                                        {c.debtBalance > 0 && (
                                            <div className="text-xs text-red-400 mt-1">
                                                {(c.debtBalance / c.creditLimit * 100).toFixed(0)}% do limite
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                        {c.debtBalance > 0 && (
                                            <button
                                                onClick={() => openPayModal(c)}
                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                title="Receber Dívida"
                                            >
                                                <DollarSign size={18} />
                                            </button>
                                        )}
                                        <button onClick={() => openEdit(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => onDeleteCustomer(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredCustomers.length === 0 && (
                    <div className="p-8 text-center text-gray-500">Nenhum cliente encontrado.</div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl animate-scale-in">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <input required type="text" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Maria Oliveira"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                                    <input type="text" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                                        value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                                    <input type="text" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="cliente@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                                <input type="text" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Rua, Número, Bairro"
                                />
                            </div>

                            <div className="pt-4 border-t mt-4">
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><CreditCard size={18} /> Configuração de Fiado</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Limite de Crédito (R$)</label>
                                        <input type="text" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none font-bold text-emerald-700"
                                            value={formData.creditLimit}
                                            onChange={e => setFormData({ ...formData, creditLimit: handleMoneyInput(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Devedor Atual</label>
                                        <input type="text" disabled className="w-full border p-2.5 rounded-lg bg-gray-100 text-gray-500 font-bold"
                                            value={`R$ ${formatCurrency(formData.debtBalance)}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-2 border-t">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">Salvar Cliente</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pay Debt Modal */}
            {isPayModalOpen && selectedCustomer && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wallet size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Receber Dívida</h3>
                            <p className="text-gray-500">{selectedCustomer.name}</p>
                        </div>

                        <form onSubmit={handlePayDebtSubmit} className="space-y-4">
                            <div className="bg-red-50 p-4 rounded-lg text-center border border-red-100">
                                <p className="text-sm text-red-600 mb-1">Dívida Total</p>
                                <p className="text-2xl font-bold text-red-700">R$ {formatCurrency(selectedCustomer.debtBalance)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor a Receber (R$)</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full border p-3 rounded-lg focus:ring-emerald-500 focus:outline-none text-xl font-bold text-center text-emerald-700"
                                    value={payAmount}
                                    onChange={e => setPayAmount(handleMoneyInput(e.target.value))}
                                />
                            </div>

                            <div className="flex justify-center gap-3 mt-6">
                                <button type="button" onClick={closePayModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-200">
                                    Confirmar Recebimento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
