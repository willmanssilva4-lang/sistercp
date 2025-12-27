
import React, { useState, useEffect } from 'react';
import { Store, Save, Printer, TestTube, Database } from 'lucide-react';
import { StoreSettings } from '../src/utils/thermalPrinter';
import { generateReceipt, printViaWebSerial, printViaWindow, openCashDrawer } from '../src/utils/thermalPrinter';

interface SettingsProps {
    onSave?: (settings: StoreSettings) => void;
    onNavigate?: (view: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ onSave, onNavigate }) => {
    const [settings, setSettings] = useState<StoreSettings>({
        name: 'Meu Mercado',
        cnpj: '',
        address: '',
        phone: '',
        footerMessage: 'Obrigado pela preferencia!\nVolte sempre!'
    });

    const [printerWidth, setPrinterWidth] = useState<32 | 48>(32);
    const [useCustomWidth, setUseCustomWidth] = useState(false);
    const [customWidth, setCustomWidth] = useState<number>(32);
    const [printMethod, setPrintMethod] = useState<'serial' | 'window'>('window');
    const [printEnabled, setPrintEnabled] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Carregar configurações do localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem('mm_store_settings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }

        const savedPrinterWidth = localStorage.getItem('mm_printer_width');
        const savedUseCustom = localStorage.getItem('mm_use_custom_width');

        if (savedUseCustom === 'true') {
            setUseCustomWidth(true);
            if (savedPrinterWidth) {
                setCustomWidth(parseInt(savedPrinterWidth));
            }
        } else if (savedPrinterWidth) {
            setPrinterWidth(parseInt(savedPrinterWidth) as 32 | 48);
        }

        const savedPrintMethod = localStorage.getItem('mm_print_method');
        if (savedPrintMethod) {
            setPrintMethod(savedPrintMethod as 'serial' | 'window');
        }

        const savedPrintEnabled = localStorage.getItem('mm_print_enabled');
        if (savedPrintEnabled !== null) {
            setPrintEnabled(savedPrintEnabled === 'true');
        }
    }, []);

    const handleSave = () => {
        setIsSaving(true);

        // Salvar no localStorage
        localStorage.setItem('mm_store_settings', JSON.stringify(settings));
        localStorage.setItem('mm_use_custom_width', useCustomWidth.toString());

        if (useCustomWidth) {
            localStorage.setItem('mm_printer_width', customWidth.toString());
        } else {
            localStorage.setItem('mm_printer_width', printerWidth.toString());
        }

        localStorage.setItem('mm_print_method', printMethod);
        localStorage.setItem('mm_print_enabled', printEnabled.toString());

        // Callback opcional
        if (onSave) {
            onSave(settings);
        }

        setTimeout(() => {
            setIsSaving(false);
            setSuccessMessage('Configurações salvas com sucesso!');
            setTimeout(() => setSuccessMessage(null), 3000);
        }, 500);
    };

    const handleTestPrint = async () => {
        const testReceipt = {
            id: 'TEST-' + Date.now(),
            timestamp: new Date().toISOString(),
            items: [
                { name: 'Produto Teste 1', qty: 2, price: 10.50, total: 21.00 },
                { name: 'Produto Teste 2', qty: 1, price: 5.99, total: 5.99 }
            ],
            subtotal: 26.99,
            total: 26.99,
            paymentMethod: 'CASH',
            cashierName: 'Operador Teste',
            customerName: 'Cliente Teste'
        };

        try {
            const widthToUse = useCustomWidth ? customWidth : printerWidth;
            const receiptContent = generateReceipt(testReceipt, settings, widthToUse as any);


            if (printMethod === 'serial') {
                await printViaWebSerial(receiptContent);
                alert('Cupom de teste enviado para a impressora!');
            } else {
                printViaWindow(receiptContent, settings);
            }
        } catch (error) {
            alert('Erro ao imprimir cupom de teste: ' + (error as Error).message);
        }
    };

    const handleTestDrawer = async () => {
        try {
            const drawerCommand = openCashDrawer();
            if (printMethod === 'serial') {
                await printViaWebSerial(drawerCommand);
                alert('Comando enviado para abrir gaveta!');
            } else {
                alert('Abertura de gaveta só funciona via conexão serial (USB)');
            }
        } catch (error) {
            alert('Erro ao abrir gaveta: ' + (error as Error).message);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h2>
                    <p className="text-gray-500 text-sm">Dados da loja e configurações de impressão</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
                >
                    <Save size={20} />
                    {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>

            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {successMessage}
                </div>
            )}

            {/* Dados da Loja */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Store className="text-blue-600" size={24} />
                    <h3 className="text-lg font-bold text-gray-800">Dados da Loja</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja *</label>
                        <input
                            type="text"
                            className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                            placeholder="Ex: Mercado São José"
                            value={settings.name}
                            onChange={e => setSettings({ ...settings, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                            <input
                                type="text"
                                className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                                placeholder="00.000.000/0000-00"
                                value={settings.cnpj}
                                onChange={e => setSettings({ ...settings, cnpj: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                            <input
                                type="text"
                                className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                                placeholder="(00) 0000-0000"
                                value={settings.phone}
                                onChange={e => setSettings({ ...settings, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                        <input
                            type="text"
                            className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                            placeholder="Rua, Número, Bairro - Cidade/UF"
                            value={settings.address}
                            onChange={e => setSettings({ ...settings, address: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem de Rodapé do Cupom</label>
                        <textarea
                            className="w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none"
                            rows={3}
                            placeholder="Mensagem que aparecerá no final do cupom"
                            value={settings.footerMessage}
                            onChange={e => setSettings({ ...settings, footerMessage: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Use quebras de linha para separar mensagens</p>
                    </div>
                </div>
            </div>

            {/* Configurações de Impressão */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Printer className="text-purple-600" size={24} />
                    <h3 className="text-lg font-bold text-gray-800">Configurações de Impressão</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Largura da Impressora</label>
                        <div className="space-y-3">
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="printerWidth"
                                        value="32"
                                        checked={!useCustomWidth && printerWidth === 32}
                                        onChange={() => {
                                            setUseCustomWidth(false);
                                            setPrinterWidth(32);
                                        }}
                                        className="w-4 h-4 text-emerald-600"
                                    />
                                    <span className="text-sm">58mm (32 caracteres)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="printerWidth"
                                        value="48"
                                        checked={!useCustomWidth && printerWidth === 48}
                                        onChange={() => {
                                            setUseCustomWidth(false);
                                            setPrinterWidth(48);
                                        }}
                                        className="w-4 h-4 text-emerald-600"
                                    />
                                    <span className="text-sm">80mm (48 caracteres)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="printerWidth"
                                        value="custom"
                                        checked={useCustomWidth}
                                        onChange={() => setUseCustomWidth(true)}
                                        className="w-4 h-4 text-emerald-600"
                                    />
                                    <span className="text-sm">Personalizado</span>
                                </label>
                            </div>

                            {useCustomWidth && (
                                <div className="ml-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Largura Customizada (caracteres por linha)
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="20"
                                            max="60"
                                            value={customWidth}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value);
                                                if (value >= 20 && value <= 60) {
                                                    setCustomWidth(value);
                                                }
                                            }}
                                            className="w-24 border border-gray-300 p-2 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                        <span className="text-sm text-gray-600">
                                            caracteres (min: 20, max: 60)
                                        </span>
                                    </div>
                                    <p className="text-xs text-blue-700 mt-2">
                                        💡 Ajuste conforme o tamanho real da sua bobina. Teste sempre após alterar!
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Método de Impressão</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="printMethod"
                                    value="window"
                                    checked={printMethod === 'window'}
                                    onChange={() => setPrintMethod('window')}
                                    className="w-4 h-4 text-emerald-600"
                                />
                                <span className="text-sm">Janela de Impressão (Compatível)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="printMethod"
                                    value="serial"
                                    checked={printMethod === 'serial'}
                                    onChange={() => setPrintMethod('serial')}
                                    className="w-4 h-4 text-emerald-600"
                                />
                                <span className="text-sm">USB Serial (Chrome/Edge)</span>
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {printMethod === 'serial'
                                ? '⚠️ Requer Chrome ou Edge. Permite abertura de gaveta e impressão direta.'
                                : 'Funciona em qualquer navegador. Abre janela de impressão do sistema.'}
                        </p>
                    </div>

                    <div className="pt-4 border-t">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Impressão Automática</label>
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${printEnabled ? 'bg-emerald-500' : 'bg-gray-400'} transition-colors`}>
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        {printEnabled ? '✅ Impressão Ativada' : '❌ Impressão Desativada'}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {printEnabled
                                            ? 'Cupons serão impressos automaticamente após cada venda'
                                            : 'Cupons NÃO serão impressos (modo silencioso)'}
                                    </p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={printEnabled}
                                    onChange={(e) => setPrintEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 border-t flex gap-3">
                        <button
                            onClick={handleTestPrint}
                            className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                        >
                            <TestTube size={18} />
                            Imprimir Cupom de Teste
                        </button>
                        <button
                            onClick={handleTestDrawer}
                            className="flex-1 bg-orange-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
                        >
                            <Printer size={18} />
                            Testar Abertura de Gaveta
                        </button>
                    </div>
                </div>
            </div>

            {/* Manutenção e Segurança */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Database className="text-red-600" size={24} />
                    <h3 className="text-lg font-bold text-gray-800">Manutenção e Segurança</h3>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Gerencie os backups do sistema para garantir a segurança dos seus dados.
                    </p>
                    <button
                        onClick={() => onNavigate && onNavigate('backup')}
                        className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors shadow-lg shadow-slate-200"
                    >
                        <Database size={18} />
                        Acessar Gerenciador de Backups
                    </button>
                </div>
            </div>

            {/* Informações */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 mb-2">ℹ️ Informações Importantes</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• As configurações são salvas localmente no navegador</li>
                    <li>• Para impressão USB Serial, conecte a impressora e permita o acesso quando solicitado</li>
                    <li>• A impressora deve ser compatível com comandos ESC/POS (padrão para impressoras térmicas)</li>
                    <li>• Teste sempre antes de usar em produção</li>
                </ul>
            </div>
        </div>
    );
};

export default Settings;
