
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Plus, Edit, Trash2, Search, User as UserIcon, Shield, Mail, CheckCircle, RefreshCw, Download, Upload, Database } from 'lucide-react';
import { resetSystemData } from '../src/utils/resetSystemData';
import { exportSystemData, restoreSystemData } from '../src/utils/backupUtils';

interface UsersProps {
  users: User[];
  onAddUser: (u: User) => void;
  onUpdateUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  userRole: UserRole;
}

const Users: React.FC<UsersProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null); // State for delete confirmation
  const [searchTerm, setSearchTerm] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form State
  const initialForm = {
    name: '',
    email: '',
    role: UserRole.CASHIER,
    password: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
      ...formData,
      id: editingId || crypto.randomUUID(),
    };

    if (editingId) {
      onUpdateUser(user);
    } else {
      onAddUser(user);
    }
    closeModal();
  };

  const openEdit = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '' // Don't show existing password
    });
    setEditingId(user.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleResetSystem = async () => {
    setResetting(true);
    const result = await resetSystemData();
    setResetting(false);
    setShowResetModal(false);

    if (result.success) {
      setShowSuccessModal(true);
    } else {
      alert('Erro ao resetar sistema: ' + result.message);
    }
  };

  const handleBackup = async () => {
    try {
      setBackupLoading(true);
      const data = await exportSystemData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `marketmaster_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccessMessage('Backup gerado e baixado com sucesso!');
    } catch (error) {
      alert('Erro ao gerar backup: ' + error);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Salvar arquivo e abrir modal de confirmação
    setPendingRestoreFile(file);
    setShowRestoreConfirm(true);

    // Limpar input para permitir selecionar o mesmo arquivo novamente se cancelar
    e.target.value = '';
  };

  const executeRestore = async () => {
    if (!pendingRestoreFile) return;
    setShowRestoreConfirm(false);

    try {
      setRestoreLoading(true);
      const text = await pendingRestoreFile.text();
      const backupData = JSON.parse(text);
      const result = await restoreSystemData(backupData);

      if (result.success) {
        setSuccessMessage('Sistema restaurado com sucesso! A página será recarregada.');
        // Adicionar delay para recarregar após fechar o modal de sucesso
        setTimeout(() => window.location.reload(), 4000);
      } else {
        alert('Erro ao restaurar: ' + result.message);
      }
    } catch (error) {
      alert('Erro ao processar arquivo de backup: ' + error);
    } finally {
      setRestoreLoading(false);
      setPendingRestoreFile(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 flex items-center gap-1 w-fit"><Shield size={10} /> Administrador</span>;
      case UserRole.MANAGER:
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1 w-fit"><Shield size={10} /> Gerente</span>;
      case UserRole.CASHIER:
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit"><UserIcon size={10} /> Caixa</span>;
      case UserRole.STOCKIST:
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 flex items-center gap-1 w-fit"><UserIcon size={10} /> Estoquista</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gerenciar Usuários</h2>
          <p className="text-gray-500 text-sm">Controle de acesso e equipe</p>
        </div>
        <div className="flex gap-3">
          {userRole === UserRole.ADMIN && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={handleBackup}
                disabled={backupLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50"
                title="Baixar Backup Completo"
              >
                {backupLoading ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                Backup
              </button>
              <button
                onClick={handleRestoreClick}
                disabled={restoreLoading}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 disabled:opacity-50"
                title="Restaurar Backup"
              >
                {restoreLoading ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
                Restaurar
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
              >
                <RefreshCw size={18} /> Resetar Sistema
              </button>
            </>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
          >
            <Plus size={18} /> Novo Usuário
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 font-semibold text-sm uppercase tracking-wider">
            <tr>
              <th className="p-4">Colaborador</th>
              <th className="p-4">Contato / Email</th>
              <th className="p-4">Função</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{u.name}</div>
                      <div className="text-xs text-gray-400">ID: {u.id.slice(0, 6)}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} /> {u.email}
                  </div>
                </td>
                <td className="p-4">
                  {getRoleBadge(u.role)}
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <CheckCircle size={10} /> Ativo
                  </span>
                </td>
                <td className="p-4 flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => setDeletingId(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <h3 className="text-xl font-bold mb-4 text-gray-800">{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input required type="text" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de Acesso</label>
                <input required type="email" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: joao@market.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permissão / Cargo</label>
                <select className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none bg-white"
                  value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}>
                  <option value={UserRole.ADMIN}>Administrador (Acesso Total)</option>
                  <option value={UserRole.MANAGER}>Gerente (Relatórios e Estoque)</option>
                  <option value={UserRole.STOCKIST}>Estoquista (Apenas Estoque)</option>
                  <option value={UserRole.CASHIER}>Caixa (Apenas PDV)</option>
                </select>

                {/* Permission Summary */}
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                  <strong>Acesso Liberado:</strong>
                  {formData.role === UserRole.ADMIN || formData.role === UserRole.MANAGER ? (
                    <span className="text-emerald-600"> Acesso Completo a todos os módulos.</span>
                  ) : formData.role === UserRole.STOCKIST ? (
                    <span className="text-orange-600"> Dashboard, Estoque e Compras.</span>
                  ) : (
                    <span className="text-blue-600"> Apenas Dashboard e PDV (Caixa).</span>
                  )}
                </div>
              </div>

              <div className="pt-2 text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-100">
                <p><strong>Nota:</strong> Para criar o login no sistema, preencha a senha abaixo.</p>
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha de Acesso</label>
                  <input required type="password" className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="******"
                    minLength={6}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-2 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">Salvar Usuário</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-scale-in text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">Remover este usuário do sistema?</p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (deletingId) onDeleteUser(deletingId);
                  setDeletingId(null);
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-lg shadow-red-200"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset System Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Resetar Sistema</h3>
            <p className="text-gray-600 mb-4 text-center">Esta ação irá deletar:</p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm">
              <ul className="space-y-2 text-red-800">
                <li>✓ Todas as vendas</li>
                <li>✓ Todas as transações financeiras</li>
                <li>✓ Todos os lotes PEPS</li>
                <li>✓ Todos os kits de produtos</li>
                <li>✓ Todas as promoções</li>
                <li>✓ Estoque de todos os produtos (resetado para 0)</li>
              </ul>
              <p className="mt-3 font-bold text-red-900">⚠️ Apenas cadastro de produtos e usuários serão mantidos</p>
            </div>

            <p className="text-center text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita!</p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetSystem}
                disabled={resetting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-lg shadow-red-200 disabled:opacity-50 flex items-center gap-2"
              >
                {resetting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Resetando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    Confirmar Reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Success Modal (Backup/Restore) */}
      {successMessage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-scale-in text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Sucesso!</h3>
            <p className="text-gray-600 text-lg mb-8">
              {successMessage}
            </p>
            <button
              onClick={() => {
                setSuccessMessage(null);
                if (successMessage.includes('restaurado')) window.location.reload();
              }}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg shadow-green-200 text-lg"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-scale-in text-center">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmar Restauração</h3>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-sm text-left">
              <p className="font-bold text-orange-800 mb-2">ATENÇÃO:</p>
              <p className="text-orange-900">
                Restaurar um backup irá <strong>SUBSTITUIR TODOS</strong> os dados atuais do sistema (vendas, produtos, estoque, etc).
              </p>
              <p className="mt-2 text-orange-900">
                Certifique-se de que o arquivo selecionado é o correto.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setShowRestoreConfirm(false);
                  setPendingRestoreFile(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={executeRestore}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold shadow-lg shadow-orange-200"
              >
                Sim, Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal (Reset Specific - Mantido para compatibilidade se necessário, ou pode ser removido se migrarmos tudo) */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-scale-in text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Reset Concluído!</h3>
            <p className="text-gray-600 text-lg mb-8">
              Todos os dados foram resetados com sucesso! Recarregue a página para ver as mudanças.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg shadow-green-200 text-lg"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
