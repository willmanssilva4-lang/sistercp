import React, { useState, useEffect } from 'react';
import { Download, Upload, Database, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

interface BackupRecord {
    id: string;
    timestamp: string;
    size: number;
    type: 'AUTO' | 'MANUAL';
    status: 'SUCCESS' | 'FAILED';
}

export default function BackupManager() {
    const [backups, setBackups] = useState<BackupRecord[]>([]);
    const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
    const [backupFrequency, setBackupFrequency] = useState<'daily' | 'weekly'>('daily');
    const [lastBackup, setLastBackup] = useState<string | null>(null);

    useEffect(() => {
        loadBackupHistory();
        loadBackupSettings();

        // Check if auto backup is needed
        if (autoBackupEnabled) {
            checkAndPerformAutoBackup();
        }
    }, []);

    useEffect(() => {
        saveBackupSettings();
    }, [autoBackupEnabled, backupFrequency]);

    const loadBackupHistory = () => {
        const saved = localStorage.getItem('backupHistory');
        if (saved) {
            setBackups(JSON.parse(saved));
        }
    };

    const saveBackupHistory = (newBackups: BackupRecord[]) => {
        localStorage.setItem('backupHistory', JSON.stringify(newBackups));
        setBackups(newBackups);
    };

    const loadBackupSettings = () => {
        const enabled = localStorage.getItem('autoBackupEnabled');
        const frequency = localStorage.getItem('backupFrequency');
        const last = localStorage.getItem('lastBackupDate');

        if (enabled !== null) setAutoBackupEnabled(enabled === 'true');
        if (frequency) setBackupFrequency(frequency as 'daily' | 'weekly');
        if (last) setLastBackup(last);
    };

    const saveBackupSettings = () => {
        localStorage.setItem('autoBackupEnabled', autoBackupEnabled.toString());
        localStorage.setItem('backupFrequency', backupFrequency);
    };

    const checkAndPerformAutoBackup = () => {
        const last = localStorage.getItem('lastBackupDate');
        const now = new Date();

        if (!last) {
            performBackup('AUTO');
            return;
        }

        const lastDate = new Date(last);
        const daysSinceLastBackup = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        const shouldBackup = backupFrequency === 'daily' ? daysSinceLastBackup >= 1 : daysSinceLastBackup >= 7;

        if (shouldBackup) {
            performBackup('AUTO');
        }
    };

    const performBackup = (type: 'AUTO' | 'MANUAL') => {
        try {
            // Collect all data from localStorage
            const data = {
                products: localStorage.getItem('products') || '[]',
                sales: localStorage.getItem('sales') || '[]',
                transactions: localStorage.getItem('transactions') || '[]',
                customers: localStorage.getItem('customers') || '[]',
                suppliers: localStorage.getItem('suppliers') || '[]',
                promotions: localStorage.getItem('promotions') || '[]',
                kits: localStorage.getItem('kits') || '[]',
                stockBatches: localStorage.getItem('stockBatches') || '[]',
                stockMovements: localStorage.getItem('stockMovements') || '[]',
                users: localStorage.getItem('users') || '[]',
                storeSettings: localStorage.getItem('storeSettings') || '{}',
                cashRegisterSessions: localStorage.getItem('cashRegisterSessions') || '[]',
                backupMetadata: {
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    type
                }
            };

            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const size = blob.size;

            // Create backup record
            const record: BackupRecord = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                size,
                type,
                status: 'SUCCESS'
            };

            const newBackups = [...backups, record];
            saveBackupHistory(newBackups);

            // Update last backup date
            const now = new Date().toISOString();
            localStorage.setItem('lastBackupDate', now);
            setLastBackup(now);

            // Download backup file if manual
            if (type === 'MANUAL') {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `marketmaster_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                // For auto backups, store in localStorage with rotation (keep last 5)
                const autoBackups = JSON.parse(localStorage.getItem('autoBackups') || '[]');
                autoBackups.push({ data: jsonString, timestamp: now });

                // Keep only last 5 auto backups
                if (autoBackups.length > 5) {
                    autoBackups.shift();
                }

                localStorage.setItem('autoBackups', JSON.stringify(autoBackups));
            }

            alert(`Backup ${type === 'AUTO' ? 'automático' : 'manual'} realizado com sucesso!`);
        } catch (error) {
            console.error('Erro ao realizar backup:', error);

            const record: BackupRecord = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                size: 0,
                type,
                status: 'FAILED'
            };

            const newBackups = [...backups, record];
            saveBackupHistory(newBackups);

            alert('Erro ao realizar backup. Verifique o console para mais detalhes.');
        }
    };

    const restoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                // Confirm restoration
                if (!confirm('Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos.')) {
                    return;
                }

                // Restore all data
                Object.keys(data).forEach(key => {
                    if (key !== 'backupMetadata') {
                        localStorage.setItem(key, data[key]);
                    }
                });

                alert('Backup restaurado com sucesso! A página será recarregada.');
                window.location.reload();
            } catch (error) {
                console.error('Erro ao restaurar backup:', error);
                alert('Erro ao restaurar backup. Verifique se o arquivo é válido.');
            }
        };

        reader.readAsText(file);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
                <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Backup</h1>
                <div className="flex gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                        <Upload className="w-5 h-5" />
                        Restaurar Backup
                        <input
                            type="file"
                            accept=".json"
                            onChange={restoreBackup}
                            className="hidden"
                        />
                    </label>
                    <button
                        onClick={() => performBackup('MANUAL')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Download className="w-5 h-5" />
                        Backup Manual
                    </button>
                </div>
            </div>

            {/* Settings Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Configurações de Backup Automático
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoBackupEnabled}
                                onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Ativar backup automático
                            </span>
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Frequência
                        </label>
                        <select
                            value={backupFrequency}
                            onChange={(e) => setBackupFrequency(e.target.value as 'daily' | 'weekly')}
                            disabled={!autoBackupEnabled}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        >
                            <option value="daily">Diário</option>
                            <option value="weekly">Semanal</option>
                        </select>
                    </div>
                </div>
                {lastBackup && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <Clock className="w-4 h-4 inline mr-2" />
                            Último backup: {formatDateTime(lastBackup)}
                        </p>
                    </div>
                )}
            </div>

            {/* Backup History */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">Histórico de Backups</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamanho</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {backups.slice().reverse().map((backup) => (
                                <tr key={backup.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {formatDateTime(backup.timestamp)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${backup.type === 'AUTO'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-purple-100 text-purple-800'
                                            }`}>
                                            {backup.type === 'AUTO' ? 'Automático' : 'Manual'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium">
                                        {formatBytes(backup.size)}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {backup.status === 'SUCCESS' ? (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <CheckCircle className="w-4 h-4" />
                                                Sucesso
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-600">
                                                <AlertCircle className="w-4 h-4" />
                                                Falhou
                                            </div>
                                        )}
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
