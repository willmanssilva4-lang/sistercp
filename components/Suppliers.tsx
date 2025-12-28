import React, { useState } from 'react';
import { Supplier } from '../types';
import { Truck, Plus, Edit2, Trash2, Search, CheckCircle, XCircle, User, Phone, Mail, MapPin, FileText, DollarSign } from 'lucide-react';

interface SuppliersProps {
    suppliers: Supplier[];
    onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
    onUpdateSupplier: (id: string, supplier: Partial<Supplier>) => void;
    onDeleteSupplier: (id: string) => void;
}

const Suppliers: React.FC<SuppliersProps> = ({
    suppliers,
    onAddSupplier,
    onUpdateSupplier,
    onDeleteSupplier
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

    const [formData, setFormData] = useState({
        name: '',
        cnpj: '',
        phone: '',
        email: '',
        address: '',
        contactPerson: '',
        paymentTerms: '',
        notes: '',
        active: true
    });

    const resetForm = () => {
        setFormData({
            name: '',
            cnpj: '',
            phone: '',
            email: '',
            address: '',
            contactPerson: '',
            paymentTerms: '',
            notes: '',
            active: true
        });
        setEditingSupplier(null);
    };

    const handleOpenModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                cnpj: supplier.cnpj || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                address: supplier.address || '',
                contactPerson: supplier.contactPerson || '',
                paymentTerms: supplier.paymentTerms || '',
                notes: supplier.notes || '',
                active: supplier.active
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Nome do fornecedor é obrigatório!');
            return;
        }

        if (editingSupplier) {
            onUpdateSupplier(editingSupplier.id, formData);
        } else {
            onAddSupplier(formData);
        }

        handleCloseModal();
    };

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Tem certeza que deseja excluir o fornecedor "${name}"?`)) {
            onDeleteSupplier(id);
        }
    };

    const handleToggleActive = (supplier: Supplier) => {
        onUpdateSupplier(supplier.id, { active: !supplier.active });
    };

    const filteredSuppliers = suppliers.filter(supplier => {
        const matchesSearch =
            supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            filterActive === 'all' ||
            (filterActive === 'active' && supplier.active) ||
            (filterActive === 'inactive' && !supplier.active);

        return matchesSearch && matchesFilter;
    });

    const activeCount = suppliers.filter(s => s.active).length;
    const inactiveCount = suppliers.filter(s => !s.active).length;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Truck className="text-blue-600" size={32} />
                        Gestão de Fornecedores
                    </h2>
                    <p className="text-gray-500 text-sm">Cadastro e gerenciamento de fornecedores</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all w-full sm:w-auto justify-center"
                >
                    <Plus size={20} />
                    Novo Fornecedor
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Total de Fornecedores</p>
                            <p className="text-3xl font-bold mt-1">{suppliers.length}</p>
                        </div>
                        <Truck size={40} className="opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Fornecedores Ativos</p>
                            <p className="text-3xl font-bold mt-1">{activeCount}</p>
                        </div>
                        <CheckCircle size={40} className="opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-500 to-gray-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-100 text-sm">Fornecedores Inativos</p>
                            <p className="text-3xl font-bold mt-1">{inactiveCount}</p>
                        </div>
                        <XCircle size={40} className="opacity-80" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, CNPJ ou pessoa de contato..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterActive('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterActive === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Todos ({suppliers.length})
                        </button>
                        <button
                            onClick={() => setFilterActive('active')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterActive === 'active'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Ativos ({activeCount})
                        </button>
                        <button
                            onClick={() => setFilterActive('inactive')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterActive === 'inactive'
                                ? 'bg-gray-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Inativos ({inactiveCount})
                        </button>
                    </div>
                </div>
            </div>

            {/* Suppliers List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredSuppliers.length === 0 ? (
                    <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <Truck size={64} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">Nenhum fornecedor encontrado</p>
                        <p className="text-gray-400 text-sm mt-2">
                            {searchTerm ? 'Tente ajustar sua busca' : 'Clique em "Novo Fornecedor" para começar'}
                        </p>
                    </div>
                ) : (
                    filteredSuppliers.map((supplier) => (
                        <div
                            key={supplier.id}
                            className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all hover:shadow-md ${supplier.active ? 'border-green-200' : 'border-gray-200 opacity-75'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-gray-800">{supplier.name}</h3>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${supplier.active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {supplier.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                    {supplier.cnpj && (
                                        <p className="text-sm text-gray-600">CNPJ: {supplier.cnpj}</p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleActive(supplier)}
                                        className={`p-2 rounded-lg transition-colors ${supplier.active
                                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                                            }`}
                                        title={supplier.active ? 'Desativar' : 'Ativar'}
                                    >
                                        {supplier.active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                    </button>
                                    <button
                                        onClick={() => handleOpenModal(supplier)}
                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(supplier.id, supplier.name)}
                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {supplier.contactPerson && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <User size={16} className="text-gray-400" />
                                        <span>{supplier.contactPerson}</span>
                                    </div>
                                )}
                                {supplier.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone size={16} className="text-gray-400" />
                                        <span>{supplier.phone}</span>
                                    </div>
                                )}
                                {supplier.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail size={16} className="text-gray-400" />
                                        <span>{supplier.email}</span>
                                    </div>
                                )}
                                {supplier.address && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin size={16} className="text-gray-400" />
                                        <span>{supplier.address}</span>
                                    </div>
                                )}
                                {supplier.paymentTerms && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <DollarSign size={16} className="text-gray-400" />
                                        <span>Prazo: {supplier.paymentTerms}</span>
                                    </div>
                                )}
                                {supplier.notes && (
                                    <div className="flex items-start gap-2 text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg">
                                        <FileText size={16} className="text-gray-400 mt-0.5" />
                                        <span className="flex-1">{supplier.notes}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                                <Truck size={28} />
                                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nome do Fornecedor *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: Distribuidora ABC"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                                    <input
                                        type="text"
                                        value={formData.cnpj}
                                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="contato@fornecedor.com"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Rua, Número, Bairro - Cidade/UF"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pessoa de Contato
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Nome do contato"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Condições de Pagamento
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.paymentTerms}
                                        onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: 30 dias, À vista"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Observações
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                        placeholder="Informações adicionais sobre o fornecedor..."
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Fornecedor Ativo</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-200"
                                >
                                    {editingSupplier ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
