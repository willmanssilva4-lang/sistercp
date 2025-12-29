
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, StockMovement } from '../types';
import { Plus, Edit, Trash2, Search, Package, Tags, X, Check, Pencil, CreditCard, History, ArrowDown, ArrowUp, ArrowRight, ArrowLeftRight, Scan, Save, Calculator, Upload, FileSpreadsheet, AlertCircle, Layers, AlertTriangle } from 'lucide-react';
import ExpiryAlerts from './ExpiryAlerts';

interface InventoryProps {
    products: Product[];
    stockMovements: StockMovement[];
    onAddProduct: (p: Product) => void;
    onUpdateProduct: (p: Product) => void;
    onDeleteProduct: (id: string) => void;
    onStockAdjustment: (productId: string, type: 'ENTRY' | 'EXIT', qty: number, reason: string) => void;
    onNavigate?: (view: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, stockMovements, onAddProduct, onUpdateProduct, onDeleteProduct, onStockAdjustment, onNavigate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- INVENTORY / ADJUSTMENT MODAL STATE ---
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [adjustSearchTerm, setAdjustSearchTerm] = useState('');

    // --- IMPORT MODAL STATE ---
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPreview, setImportPreview] = useState<any[]>([]);
    const [importErrors, setImportErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

    // Inventory List Item Structure
    interface InventoryItem {
        product: Product;
        type: 'BALANCE' | 'ENTRY' | 'EXIT'; // BALANCE = Contagem Física (Set Stock), ENTRY/EXIT = Delta
        qty: number; // The input value (either the count or the movement amount)
        reason: string;
    }
    const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);

    // --- AUXILIARY DATA STATES (LAZY INITIALIZATION) ---
    const [categories, setCategories] = useState<string[]>(() => {
        const saved = localStorage.getItem('mm_categories');
        return saved ? JSON.parse(saved) : ['Geral', 'Bebidas', 'Mercearia', 'Limpeza', 'Hortifruti', 'Padaria', 'Açougue'];
    });

    const [subcategories, setSubcategories] = useState<string[]>(() => {
        const saved = localStorage.getItem('mm_subcategories');
        return saved ? JSON.parse(saved) : ['Refrigerantes', 'Grãos', 'Laticínios', 'Lava Louças'];
    });

    const [brands, setBrands] = useState<string[]>(() => {
        const saved = localStorage.getItem('mm_brands');
        return saved ? JSON.parse(saved) : ['Coca-Cola', 'Camil', 'Ypê', 'Itambé'];
    });

    const [suppliers, setSuppliers] = useState<string[]>(() => {
        const saved = localStorage.getItem('mm_suppliers');
        return saved ? JSON.parse(saved) : ['Coca-Cola FEMSA', 'Camil Alimentos', 'Química Amparo', 'Itambé Laticínios'];
    });

    const [terminals, setTerminals] = useState<string[]>(() => {
        const saved = localStorage.getItem('mm_terminals');
        return saved ? JSON.parse(saved) : [];
    });

    // --- METADATA STATES ---
    const [supplierTerms, setSupplierTerms] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('mm_supplier_terms');
        return saved ? JSON.parse(saved) : {};
    });

    const [categoryMargins, setCategoryMargins] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('mm_category_margins');
        return saved ? JSON.parse(saved) : {};
    });

    const [categoryMarkups, setCategoryMarkups] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('mm_category_markups');
        return saved ? JSON.parse(saved) : {};
    });

    const [terminalRates, setTerminalRates] = useState<Record<string, { debit: number, credit: number, pix: number }>>(() => {
        const saved = localStorage.getItem('mm_terminal_rates');
        return saved ? JSON.parse(saved) : {};
    });

    // --- AUTOMATIC PERSISTENCE ---
    useEffect(() => localStorage.setItem('mm_categories', JSON.stringify(categories)), [categories]);
    useEffect(() => localStorage.setItem('mm_subcategories', JSON.stringify(subcategories)), [subcategories]);
    useEffect(() => localStorage.setItem('mm_brands', JSON.stringify(brands)), [brands]);
    useEffect(() => localStorage.setItem('mm_suppliers', JSON.stringify(suppliers)), [suppliers]);
    useEffect(() => localStorage.setItem('mm_terminals', JSON.stringify(terminals)), [terminals]);

    useEffect(() => localStorage.setItem('mm_supplier_terms', JSON.stringify(supplierTerms)), [supplierTerms]);
    useEffect(() => localStorage.setItem('mm_category_margins', JSON.stringify(categoryMargins)), [categoryMargins]);
    useEffect(() => localStorage.setItem('mm_category_markups', JSON.stringify(categoryMarkups)), [categoryMarkups]);
    useEffect(() => localStorage.setItem('mm_terminal_rates', JSON.stringify(terminalRates)), [terminalRates]);

    const [isAuxModalOpen, setIsAuxModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);
    const [auxTab, setAuxTab] = useState<'categories' | 'subcategories' | 'brands' | 'suppliers' | 'terminals'>('categories');

    // Aux Inputs
    const [auxInput, setAuxInput] = useState('');
    const [auxTermInput, setAuxTermInput] = useState('');
    const [auxMarginInput, setAuxMarginInput] = useState('');
    const [auxMarkupInput, setAuxMarkupInput] = useState('');

    const [auxDebitInput, setAuxDebitInput] = useState('');
    const [auxCreditInput, setAuxCreditInput] = useState('');
    const [auxPixInput, setAuxPixInput] = useState('');

    const [editingAuxItem, setEditingAuxItem] = useState<string | null>(null);

    // --- AUX ACTIONS ---
    const currentAuxList = useMemo(() => {
        switch (auxTab) {
            case 'categories': return categories;
            case 'subcategories': return subcategories;
            case 'brands': return brands;
            case 'suppliers': return suppliers;
            case 'terminals': return terminals;
            default: return [];
        }
    }, [auxTab, categories, subcategories, brands, suppliers, terminals]);

    const getSetter = () => {
        switch (auxTab) {
            case 'categories': return setCategories;
            case 'subcategories': return setSubcategories;
            case 'brands': return setBrands;
            case 'suppliers': return setSuppliers;
            case 'terminals': return setTerminals;
            default: return setCategories;
        }
    };

    const updateMetadata = (key: string, isDelete = false) => {
        if (auxTab === 'suppliers') {
            setSupplierTerms(prev => {
                const newTerms = { ...prev };
                if (isDelete) {
                    delete newTerms[key];
                } else if (auxTermInput) {
                    newTerms[key] = auxTermInput;
                }
                return newTerms;
            });
        }
        if (auxTab === 'categories') {
            setCategoryMargins(prev => {
                const newMargins = { ...prev };
                if (isDelete) {
                    delete newMargins[key];
                } else if (auxMarginInput) {
                    const val = parseFloat(auxMarginInput.replace(',', '.'));
                    if (!isNaN(val)) newMargins[key] = val;
                }
                return newMargins;
            });
            setCategoryMarkups(prev => {
                const newMarkups = { ...prev };
                if (isDelete) {
                    delete newMarkups[key];
                } else if (auxMarkupInput) {
                    const val = parseFloat(auxMarkupInput.replace(',', '.'));
                    if (!isNaN(val)) newMarkups[key] = val;
                }
                return newMarkups;
            });
        }
        if (auxTab === 'terminals') {
            setTerminalRates(prev => {
                const newRates = { ...prev };
                if (isDelete) {
                    delete newRates[key];
                } else {
                    const d = parseFloat(auxDebitInput.replace(',', '.')) || 0;
                    const c = parseFloat(auxCreditInput.replace(',', '.')) || 0;
                    const p = parseFloat(auxPixInput.replace(',', '.')) || 0;
                    newRates[key] = { debit: d, credit: c, pix: p };
                }
                return newRates;
            });
        }
    };

    const handleSaveAux = (e: React.FormEvent) => {
        e.preventDefault();
        const val = auxInput.trim();
        if (!val) return;

        const setter = getSetter();

        if (editingAuxItem) {
            if (val.toLowerCase() !== editingAuxItem.toLowerCase() && currentAuxList.some(item => item.toLowerCase() === val.toLowerCase())) {
                alert('Já existe um item com este nome.');
                return;
            }

            setter(prev => prev.map(item => item === editingAuxItem ? val : item).sort());

            if (auxTab === 'suppliers') {
                setSupplierTerms(prev => {
                    const copy = { ...prev };
                    const oldTerm = copy[editingAuxItem];
                    delete copy[editingAuxItem];
                    if (auxTermInput) copy[val] = auxTermInput;
                    else if (oldTerm && val === editingAuxItem) copy[val] = oldTerm;
                    else if (auxTermInput === '') delete copy[val];
                    return copy;
                });
            }
            if (auxTab === 'categories') {
                setCategoryMargins(prev => {
                    const copy = { ...prev };
                    const oldData = copy[editingAuxItem];
                    delete copy[editingAuxItem];
                    const marginVal = parseFloat(auxMarginInput.replace(',', '.'));
                    if (!isNaN(marginVal) && auxMarginInput) copy[val] = marginVal;
                    else if (oldData && !auxMarginInput) copy[val] = oldData;
                    return copy;
                });
                setCategoryMarkups(prev => {
                    const copy = { ...prev };
                    const oldData = copy[editingAuxItem];
                    delete copy[editingAuxItem];
                    const markupVal = parseFloat(auxMarkupInput.replace(',', '.'));
                    if (!isNaN(markupVal) && auxMarkupInput) copy[val] = markupVal;
                    else if (oldData && !auxMarkupInput) copy[val] = oldData;
                    return copy;
                });
            }
            if (auxTab === 'terminals') {
                setTerminalRates(prev => {
                    const copy = { ...prev };
                    delete copy[editingAuxItem];
                    const d = parseFloat(auxDebitInput.replace(',', '.')) || 0;
                    const c = parseFloat(auxCreditInput.replace(',', '.')) || 0;
                    const p = parseFloat(auxPixInput.replace(',', '.')) || 0;
                    copy[val] = { debit: d, credit: c, pix: p };
                    return copy;
                });
            }

            setEditingAuxItem(null);
        } else {
            if (currentAuxList.some(item => item.toLowerCase() === val.toLowerCase())) {
                alert('Este item já está cadastrado.');
                return;
            }
            setter(prev => [...prev, val].sort());
            updateMetadata(val);
        }

        setAuxInput('');
        setAuxTermInput('');
        setAuxMarginInput('');
        setAuxMarkupInput('');
        setAuxDebitInput('');
        setAuxCreditInput('');
        setAuxPixInput('');
    };

    const startEditAux = (item: string) => {
        setEditingAuxItem(item);
        setAuxInput(item);
        if (auxTab === 'suppliers') {
            setAuxTermInput(supplierTerms[item] || '');
        }
        if (auxTab === 'categories') {
            setAuxMarginInput(categoryMargins[item]?.toString() || '');
            setAuxMarkupInput(categoryMarkups[item]?.toString() || '');
        }
        if (auxTab === 'terminals') {
            const rates = terminalRates[item] || { debit: 0, credit: 0, pix: 0 };
            setAuxDebitInput(rates.debit.toString());
            setAuxCreditInput(rates.credit.toString());
            setAuxPixInput(rates.pix.toString());
        }
    };

    const cancelEditAux = () => {
        setEditingAuxItem(null);
        setAuxInput('');
        setAuxTermInput('');
        setAuxMarginInput('');
        setAuxMarkupInput('');
        setAuxDebitInput('');
        setAuxCreditInput('');
        setAuxPixInput('');
    };

    const handleDeleteAux = (itemToDelete: string) => {
        const setter = getSetter();
        setter(prev => prev.filter(i => i !== itemToDelete));
        updateMetadata(itemToDelete, true);
        if (editingAuxItem === itemToDelete) {
            cancelEditAux();
        }
    };

    // --- PRODUCT FORM STATE ---
    const initialForm = {
        name: '', code: '', category: 'Geral', subcategory: '', brand: '', supplier: '', unit: 'UN',
        costPrice: '0,000', retailPrice: '0,000', wholesalePrice: '0,000', wholesaleMinQty: 10,
        stock: 0, minStock: 5, expiryDate: ''
    };
    const [formData, setFormData] = useState<any>(initialForm);

    const parseCurrency = (value: string | number) => {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        return parseFloat(value.toString().replace(/\./g, '').replace(',', '.'));
    };

    const formatCurrencyInput = (value: number) => {
        if (value === undefined || value === null) return '0,000';
        return value.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    };

    const handleMoneyInput = (field: string, value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits === '') {
            setFormData((prev: any) => ({ ...prev, [field]: '0,000' }));
            return;
        }
        const numberValue = parseInt(digits, 10) / 1000;
        const formatted = numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
        setFormData((prev: any) => ({ ...prev, [field]: formatted }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const product: Product = {
            ...formData,
            id: editingId || crypto.randomUUID(),
            costPrice: parseCurrency(formData.costPrice),
            retailPrice: parseCurrency(formData.retailPrice),
            wholesalePrice: parseCurrency(formData.wholesalePrice),
            wholesaleMinQty: Number(formData.wholesaleMinQty),
            stock: Number(formData.stock),
            minStock: Number(formData.minStock),
        };

        if (editingId) {
            onUpdateProduct(product);
        } else {
            onAddProduct(product);
        }
        closeModal();
    };

    const openEdit = (product: Product) => {
        setFormData({
            ...product,
            costPrice: formatCurrencyInput(product.costPrice),
            retailPrice: formatCurrencyInput(product.retailPrice),
            wholesalePrice: formatCurrencyInput(product.wholesalePrice),
        });
        setEditingId(product.id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData(initialForm);
    };

    // --- INVENTORY / ADJUSTMENT LOGIC ---

    const openAdjustment = (product?: Product) => {
        setInventoryList([]);
        if (product) {
            addDeviceToInventory(product);
        }
        setAdjustSearchTerm('');
        setIsAdjustmentModalOpen(true);
    };

    const addDeviceToInventory = (p: Product) => {
        // Check if already in list
        if (inventoryList.some(i => i.product.id === p.id)) {
            alert("Produto já está na lista.");
            return;
        }

        const newItem: InventoryItem = {
            product: p,
            type: 'BALANCE', // Default to 'Stock Count' (Balanço)
            qty: p.stock, // Default to current stock for easy confirmation
            reason: 'Inventário / Contagem'
        };
        setInventoryList(prev => [...prev, newItem]);
        setAdjustSearchTerm('');
    };

    const updateInventoryItem = (index: number, updates: Partial<InventoryItem>) => {
        setInventoryList(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
    };

    const removeInventoryItem = (index: number) => {
        setInventoryList(prev => prev.filter((_, i) => i !== index));
    };

    const handleInventorySubmit = () => {
        if (inventoryList.length === 0) {
            alert("Adicione produtos à lista.");
            return;
        }

        inventoryList.forEach(item => {
            let type: 'ENTRY' | 'EXIT' = 'ENTRY';
            let qty = 0;

            if (item.type === 'BALANCE') {
                // Calculate diff
                const diff = item.qty - item.product.stock;
                if (diff === 0) return; // No change
                type = diff > 0 ? 'ENTRY' : 'EXIT';
                qty = Math.abs(diff);
            } else {
                type = item.type as 'ENTRY' | 'EXIT';
                qty = item.qty;
            }

            if (qty > 0) {
                onStockAdjustment(item.product.id, type, qty, item.reason);
            }
        });

        setIsAdjustmentModalOpen(false);
        setInventoryList([]);
    };

    // --- IMPORT FUNCTIONS ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportFile(file);
        setImportErrors([]);
        setImportPreview([]);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                parseCSV(text);
            } catch (error) {
                setImportErrors(['Erro ao ler o arquivo. Verifique se é um CSV válido.']);
            }
        };
        reader.readAsText(file);
    };

    const parseCSV = (text: string) => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            setImportErrors(['Arquivo vazio ou sem dados.']);
            return;
        }

        // Parse header
        const header = lines[0].split(/[,;]/);
        const preview: any[] = [];
        const errors: string[] = [];

        // Expected columns (flexible order)
        const requiredFields = ['codigo', 'nome', 'categoria'];

        // Check if required fields exist
        const headerLower = header.map(h => h.toLowerCase().trim());
        const missingFields = requiredFields.filter(f => !headerLower.some(h => h.includes(f)));

        if (missingFields.length > 0) {
            errors.push(`Colunas obrigatórias faltando: ${missingFields.join(', ')}`);
            setImportErrors(errors);
            return;
        }

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(/[,;]/);
            if (values.length < 3) continue; // Skip invalid rows

            const row: any = {};
            header.forEach((col, idx) => {
                const colName = col.toLowerCase().trim();
                const value = values[idx]?.trim() || '';

                if (colName.includes('codigo') || colName.includes('código')) row.code = value;
                else if (colName.includes('nome')) row.name = value;
                else if (colName.includes('categoria')) row.category = value;
                else if (colName.includes('subcategoria')) row.subcategory = value;
                else if (colName.includes('marca')) row.brand = value;
                else if (colName.includes('fornecedor')) row.supplier = value;
                else if (colName.includes('unidade')) row.unit = value.toUpperCase();
                else if (colName.includes('custo')) row.costPrice = parseFloat(value.replace(',', '.')) || 0;
                else if (colName.includes('venda') || colName.includes('varejo')) row.retailPrice = parseFloat(value.replace(',', '.')) || 0;
                else if (colName.includes('atacado')) row.wholesalePrice = parseFloat(value.replace(',', '.')) || 0;
                else if (colName.includes('qtd') && colName.includes('atacado')) row.wholesaleMinQty = parseInt(value) || 10;
                else if (colName.includes('estoque')) row.stock = parseFloat(value.replace(',', '.')) || 0;
                else if (colName.includes('minimo') || colName.includes('mínimo')) row.minStock = parseInt(value) || 5;
                else if (colName.includes('validade')) row.expiryDate = value;
            });

            // Validate required fields
            if (!row.code || !row.name || !row.category) {
                errors.push(`Linha ${i + 1}: Campos obrigatórios faltando (código, nome ou categoria)`);
                continue;
            }

            // Set defaults
            if (!row.unit) row.unit = 'UN';
            if (!row.costPrice) row.costPrice = 0;
            if (!row.retailPrice) row.retailPrice = 0;
            if (!row.wholesalePrice) row.wholesalePrice = row.retailPrice;
            if (!row.wholesaleMinQty) row.wholesaleMinQty = 10;
            if (row.stock === undefined) row.stock = 0;
            if (!row.minStock) row.minStock = 5;

            preview.push(row);
        }

        setImportPreview(preview);
        setImportErrors(errors);
    };

    const handleImportConfirm = () => {
        if (importPreview.length === 0) {
            alert('Nenhum produto para importar.');
            return;
        }

        let imported = 0;
        importPreview.forEach(row => {
            const product: Product = {
                id: crypto.randomUUID(),
                code: row.code,
                name: row.name,
                category: row.category,
                subcategory: row.subcategory || '',
                brand: row.brand || '',
                supplier: row.supplier || '',
                unit: row.unit || 'UN',
                costPrice: row.costPrice || 0,
                retailPrice: row.retailPrice || 0,
                wholesalePrice: row.wholesalePrice || row.retailPrice || 0,
                wholesaleMinQty: row.wholesaleMinQty || 10,
                stock: row.stock || 0,
                minStock: row.minStock || 5,
                expiryDate: row.expiryDate || undefined
            };

            onAddProduct(product);
            imported++;
        });

        setImportSuccessMessage(`${imported} produto(s) importado(s) com sucesso!`);
        setIsImportModalOpen(false);
        setImportFile(null);
        setImportPreview([]);
        setImportErrors([]);
    };

    const downloadTemplate = () => {
        const template = `codigo,nome,categoria,subcategoria,marca,fornecedor,unidade,custo,venda,atacado,qtd_atacado,estoque,minimo,validade
7891234567890,Coca Cola 2L,Bebidas,Refrigerantes,Coca-Cola,Coca-Cola FEMSA,UN,5.50,9.00,8.00,6,45,10,2025-12-01
7891234567891,Arroz 5kg,Mercearia,Grãos,Camil,Camil Alimentos,PCT,18.00,24.90,23.50,10,20,5,`;

        const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'modelo_importacao_produtos.csv';
        link.click();
    };

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.includes(searchTerm)
    );

    const filteredAdjustProducts = adjustSearchTerm.trim().length >= 2
        ? products.filter(p => p.name.toLowerCase().includes(adjustSearchTerm.toLowerCase()) || p.code.includes(adjustSearchTerm))
        : [];

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Estoque de Produtos</h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => openAdjustment()}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700 transition-colors shadow-sm"
                    >
                        <ArrowLeftRight size={18} /> Ajuste Rápido / Inventário
                    </button>
                    <button
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <History size={18} /> Movimentações
                    </button>
                    <button
                        onClick={() => setIsExpiryModalOpen(true)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors shadow-sm"
                    >
                        <AlertTriangle size={18} /> Validades
                    </button>
                    <button
                        onClick={() => onNavigate && onNavigate('peps')}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-700 transition-colors shadow-sm"
                    >
                        <Layers size={18} /> Lotes PEPS
                    </button>
                    <button
                        onClick={() => setIsAuxModalOpen(true)}
                        className="bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        <Tags size={18} /> Cadastros Auxiliares
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Upload size={18} /> Importar Produtos
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                    >
                        <Plus size={18} /> Novo Produto
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou código..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-gray-50 text-gray-600 font-semibold text-sm">
                            <tr>
                                <th className="p-4">Produto</th>
                                <th className="p-4">Categoria / Marca</th>
                                <th className="p-4">Preço (Varejo)</th>
                                <th className="p-4">Estoque</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-800">{p.name}</div>
                                        <div className="text-xs text-gray-500">Cod: {p.code}</div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        <div className="flex flex-col gap-1">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs uppercase font-bold w-fit">
                                                {p.category} {p.subcategory && <span className="text-gray-500 font-normal">/ {p.subcategory}</span>}
                                            </span>
                                            {p.brand && <span className="text-xs text-gray-400">{p.brand}</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm font-bold text-gray-800">R$ {p.retailPrice.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                                    <td className="p-4">
                                        <div className={`flex items-center gap-2 text-sm font-bold ${p.stock <= p.minStock ? 'text-red-600' : 'text-emerald-600'}`}>
                                            <Package size={16} />
                                            {p.stock} {p.unit}
                                        </div>
                                    </td>
                                    <td className="p-4 flex justify-center gap-2 md:opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => openAdjustment(p)}
                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                                            title="Ajuste Manual / Baixa de Estoque"
                                        >
                                            <ArrowLeftRight size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openEdit(p)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                            title="Editar Cadastro"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onDeleteProduct(p.id); }}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg pointer-events-auto"
                                            title="Excluir Produto"
                                        >
                                            <Trash2 size={18} className="pointer-events-none" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="p-8 text-center text-gray-500">Nenhum produto encontrado.</div>
                )}
            </div>

            {/* --- STOCK MOVEMENT HISTORY MODAL --- */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 bg-slate-800 text-white flex justify-between items-center">
                            <h3 className="font-bold text-xl flex items-center gap-2"><History size={20} /> Histórico de Movimentações</h3>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0">
                                    <tr>
                                        <th className="p-4">Data / Hora</th>
                                        <th className="p-4">Produto</th>
                                        <th className="p-4">Tipo</th>
                                        <th className="p-4">Qtd.</th>
                                        <th className="p-4">Motivo / Origem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {stockMovements.slice().reverse().map(move => (
                                        <tr key={move.id} className="hover:bg-gray-50">
                                            <td className="p-4 whitespace-nowrap">{new Date(move.date).toLocaleString('pt-BR')}</td>
                                            <td className="p-4 font-medium text-gray-700">{move.productName}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit ${move.type === 'ENTRY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {move.type === 'ENTRY' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                    {move.type === 'ENTRY' ? 'Entrada' : 'Saída'}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold">{move.qty}</td>
                                            <td className="p-4 text-gray-500">{move.reason}</td>
                                        </tr>
                                    ))}
                                    {stockMovements.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhuma movimentação registrada.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- COMPREHENSIVE INVENTORY MODAL --- */}
            {isAdjustmentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
                    <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl animate-scale-in flex flex-col max-h-[95vh]">
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Calculator className="text-orange-500" /> Gestão de Inventário & Ajustes
                                </h3>
                                <p className="text-xs text-gray-500">Adicione produtos à lista para contagem ou ajuste.</p>
                            </div>
                            <button onClick={() => setIsAdjustmentModalOpen(false)}><X className="text-gray-400 hover:text-gray-600" size={24} /></button>
                        </div>

                        <div className="p-5 border-b bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Buscar produto para adicionar à lista..."
                                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                                    value={adjustSearchTerm}
                                    onChange={e => setAdjustSearchTerm(e.target.value)}
                                />
                                {filteredAdjustProducts.length > 0 && adjustSearchTerm.length >= 2 && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                                        {filteredAdjustProducts.map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => addDeviceToInventory(p)}
                                                className="p-3 border-b hover:bg-emerald-50 cursor-pointer flex justify-between items-center"
                                            >
                                                <div>
                                                    <p className="font-bold text-gray-700">{p.name}</p>
                                                    <p className="text-xs text-gray-500">{p.code}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded ${p.stock <= p.minStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                        Est: {p.stock}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0 bg-gray-50">
                            {inventoryList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-10">
                                    <Package size={48} className="mb-2 opacity-50" />
                                    <p>Nenhum produto na lista de ajuste.</p>
                                    <p className="text-sm">Busque acima para começar.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0 shadow-sm">
                                        <tr>
                                            <th className="p-3">Produto</th>
                                            <th className="p-3 text-center">Est. Sist.</th>
                                            <th className="p-3">Ação</th>
                                            <th className="p-3 w-24">Qtd / Contagem</th>
                                            <th className="p-3">Motivo</th>
                                            <th className="p-3 text-center">Diferença</th>
                                            <th className="p-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {inventoryList.map((item, idx) => {
                                            let diff = 0;
                                            let result = item.product.stock;

                                            if (item.type === 'BALANCE') {
                                                diff = item.qty - item.product.stock;
                                                result = item.qty;
                                            } else if (item.type === 'ENTRY') {
                                                diff = item.qty;
                                                result = item.product.stock + item.qty;
                                            } else {
                                                diff = -item.qty;
                                                result = item.product.stock - item.qty;
                                            }

                                            return (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="p-3">
                                                        <div className="font-bold text-gray-700">{item.product.name}</div>
                                                        <div className="text-xs text-gray-400">{item.product.code}</div>
                                                    </td>
                                                    <td className="p-3 text-center font-mono font-medium text-gray-600">
                                                        {item.product.stock}
                                                    </td>
                                                    <td className="p-3">
                                                        <select
                                                            className="border rounded p-1 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-blue-500"
                                                            value={item.type}
                                                            onChange={(e) => updateInventoryItem(idx, { type: e.target.value as any })}
                                                        >
                                                            <option value="BALANCE">Balanço (=)</option>
                                                            <option value="ENTRY">Entrada (+)</option>
                                                            <option value="EXIT">Saída (-)</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            type="number" step="0.001"
                                                            className="w-full border p-1.5 rounded text-center font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                                                            value={item.qty}
                                                            onChange={(e) => updateInventoryItem(idx, { qty: parseFloat(e.target.value) || 0 })}
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            type="text"
                                                            className="w-full border p-1.5 rounded text-xs text-gray-600 outline-none focus:ring-1 focus:ring-blue-500"
                                                            value={item.reason}
                                                            placeholder="Motivo..."
                                                            onChange={(e) => updateInventoryItem(idx, { reason: e.target.value })}
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <div className={`text-xs font-bold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                            {diff > 0 ? '+' : ''}{diff}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400">Final: {result}</div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => removeInventoryItem(idx)} className="text-gray-400 hover:text-red-500">
                                                            <X size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsAdjustmentModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-100">
                                Cancelar
                            </button>
                            <button
                                onClick={handleInventorySubmit}
                                disabled={inventoryList.length === 0}
                                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Save size={18} /> Processar Inventário
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- AUXILIARY DATA MODAL --- */}
            {isAuxModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Tags className="text-emerald-400" />
                                <h3 className="font-bold text-xl">Cadastros Auxiliares</h3>
                            </div>
                            <button onClick={() => { setIsAuxModalOpen(false); cancelEditAux(); }} className="text-slate-400 hover:text-white"><X size={24} /></button>
                        </div>

                        <div className="flex bg-gray-100 p-1 border-b overflow-x-auto">
                            <button onClick={() => { setAuxTab('categories'); cancelEditAux(); }} className={`flex-1 py-3 px-2 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${auxTab === 'categories' ? 'bg-white text-emerald-600 border-t-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-200'}`}>Categorias</button>
                            <button onClick={() => { setAuxTab('subcategories'); cancelEditAux(); }} className={`flex-1 py-3 px-2 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${auxTab === 'subcategories' ? 'bg-white text-emerald-600 border-t-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-200'}`}>Subcategorias</button>
                            <button onClick={() => { setAuxTab('brands'); cancelEditAux(); }} className={`flex-1 py-3 px-2 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${auxTab === 'brands' ? 'bg-white text-emerald-600 border-t-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-200'}`}>Marcas</button>
                            <button onClick={() => { setAuxTab('suppliers'); cancelEditAux(); }} className={`flex-1 py-3 px-2 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${auxTab === 'suppliers' ? 'bg-white text-emerald-600 border-t-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-200'}`}>Fornecedores</button>
                            <button onClick={() => { setAuxTab('terminals'); cancelEditAux(); }} className={`flex-1 py-3 px-2 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${auxTab === 'terminals' ? 'bg-white text-emerald-600 border-t-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-200'}`}>Maquininhas</button>
                        </div>

                        <div className="p-6 flex-1 overflow-hidden flex flex-col">
                            <form onSubmit={handleSaveAux} className="flex gap-2 mb-4 flex-wrap">
                                <div className="flex-1 flex gap-2 min-w-[200px]">
                                    <div className="relative flex-1">
                                        <input
                                            autoFocus
                                            type="text"
                                            className={`w-full border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none ${editingAuxItem ? 'border-blue-400 ring-2 ring-blue-100' : ''}`}
                                            placeholder={`Novo item em ${auxTab}...`}
                                            value={auxInput}
                                            onChange={e => setAuxInput(e.target.value)}
                                        />
                                        {editingAuxItem && <span className="absolute right-3 top-3 text-xs font-bold text-blue-500 bg-blue-50 px-2 rounded pointer-events-none">Editando</span>}
                                    </div>

                                    {auxTab === 'suppliers' && (
                                        <select
                                            className="border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none bg-white w-32 text-sm"
                                            value={auxTermInput}
                                            onChange={e => setAuxTermInput(e.target.value)}
                                        >
                                            <option value="">Prazo...</option>
                                            <option value="7 dias">7 dias</option>
                                            <option value="14 dias">14 dias</option>
                                            <option value="21 dias">21 dias</option>
                                            <option value="30 dias">30 dias</option>
                                            <option value="7/14/21">7/14/21</option>
                                            <option value="30/60">30/60</option>
                                            <option value="30/60/90">30/60/90</option>
                                        </select>
                                    )}

                                    {auxTab === 'categories' && (
                                        <>
                                            <input
                                                type="number"
                                                className="border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none bg-white w-24 text-sm"
                                                placeholder="Margem %"
                                                value={auxMarginInput}
                                                onChange={e => setAuxMarginInput(e.target.value)}
                                            />
                                            <input
                                                type="number"
                                                className="border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none bg-white w-24 text-sm"
                                                placeholder="Markup %"
                                                value={auxMarkupInput}
                                                onChange={e => setAuxMarkupInput(e.target.value)}
                                            />
                                        </>
                                    )}

                                    {auxTab === 'terminals' && (
                                        <>
                                            <input
                                                type="number" step="0.01"
                                                className="border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none bg-white w-20 text-sm"
                                                placeholder="Déb %"
                                                title="Taxa Débito"
                                                value={auxDebitInput}
                                                onChange={e => setAuxDebitInput(e.target.value)}
                                            />
                                            <input
                                                type="number" step="0.01"
                                                className="border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none bg-white w-20 text-sm"
                                                placeholder="Créd %"
                                                title="Taxa Crédito"
                                                value={auxCreditInput}
                                                onChange={e => setAuxCreditInput(e.target.value)}
                                            />
                                            <input
                                                type="number" step="0.01"
                                                className="border p-2.5 rounded-lg focus:ring-emerald-500 focus:outline-none bg-white w-20 text-sm"
                                                placeholder="Pix %"
                                                title="Taxa Pix"
                                                value={auxPixInput}
                                                onChange={e => setAuxPixInput(e.target.value)}
                                            />
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button type="submit" className={`px-4 py-2.5 rounded-lg font-bold text-white transition-colors ${editingAuxItem ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                        {editingAuxItem ? 'Salvar' : 'Adicionar'}
                                    </button>
                                    {editingAuxItem && (
                                        <button type="button" onClick={cancelEditAux} className="px-3 py-2.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100">
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>

                            <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50 p-2">
                                {currentAuxList.length === 0 ? (
                                    <p className="text-center text-gray-400 mt-4">Nenhum item cadastrado.</p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {currentAuxList.map((item) => (
                                            <div key={item} className={`p-3 rounded border flex justify-between items-center group transition-colors ${editingAuxItem === item ? 'bg-blue-50 border-blue-200' : 'bg-white hover:border-emerald-200 hover:shadow-sm'}`}>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                                    <div className="flex items-center gap-2">
                                                        {auxTab === 'terminals' && <CreditCard size={16} className="text-gray-400" />}
                                                        <span className={`font-medium ${editingAuxItem === item ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>{item}</span>
                                                    </div>

                                                    {auxTab === 'suppliers' && supplierTerms[item] && (
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded border border-gray-200 font-medium w-fit">
                                                            {supplierTerms[item]}
                                                        </span>
                                                    )}
                                                    {auxTab === 'categories' && (
                                                        <div className="flex gap-1">
                                                            {categoryMargins[item] && (
                                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded border border-green-200 font-bold">
                                                                    Mg: {categoryMargins[item]}%
                                                                </span>
                                                            )}
                                                            {categoryMarkups[item] && (
                                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded border border-purple-200 font-bold">
                                                                    Mk: {categoryMarkups[item]}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {auxTab === 'terminals' && terminalRates[item] && (
                                                        <div className="flex gap-1 flex-wrap">
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded border border-blue-200 font-bold" title="Taxa Débito">
                                                                D: {terminalRates[item].debit}%
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded border border-purple-200 font-bold" title="Taxa Crédito">
                                                                C: {terminalRates[item].credit}%
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded border border-emerald-200 font-bold" title="Taxa Pix">
                                                                P: {terminalRates[item].pix}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEditAux(item); }}
                                                        className="text-gray-400 hover:text-blue-600 p-2 rounded hover:bg-blue-50 transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={18} className="pointer-events-none" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteAux(item); }}
                                                        className="text-gray-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors"
                                                        title="Remover"
                                                    >
                                                        <Trash2 size={18} className="pointer-events-none" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ADD/EDIT PRODUCT MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl p-6 w-[600px] my-10 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                                <input required type="text" className="w-full border p-2 rounded focus:ring-emerald-500 focus:outline-none"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Código de Barras</label>
                                <input required type="text" className="w-full border p-2 rounded focus:ring-emerald-500 focus:outline-none"
                                    value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Categoria</label>
                                <select className="w-full border p-2 rounded focus:ring-emerald-500 focus:outline-none bg-white"
                                    value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Subcategory */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subcategoria</label>
                                <input type="text" list="subcategories-list" className="w-full border p-2 rounded focus:ring-emerald-500 focus:outline-none"
                                    placeholder="Ex: Refrigerantes"
                                    value={formData.subcategory} onChange={e => setFormData({ ...formData, subcategory: e.target.value })} />
                                <datalist id="subcategories-list">
                                    {subcategories.map(s => <option key={s} value={s} />)}
                                </datalist>
                            </div>

                            {/* Brand & Supplier Fields */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Marca</label>
                                <input type="text" list="brands-list" className="w-full border p-2 rounded focus:ring-emerald-500 focus:outline-none"
                                    placeholder="Ex: Coca-Cola"
                                    value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                                <datalist id="brands-list">
                                    {brands.map(b => <option key={b} value={b} />)}
                                </datalist>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                                <input type="text" list="suppliers-list" className="w-full border p-2 rounded focus:ring-emerald-500 focus:outline-none"
                                    placeholder="Ex: FEMSA Distribuidora"
                                    value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
                                <datalist id="suppliers-list">
                                    {suppliers.map(s => <option key={s} value={s} />)}
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Preço Custo</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="w-full border p-2 rounded focus:ring-emerald-500 focus:outline-none"
                                    placeholder="0,000"
                                    value={formData.costPrice}
                                    onChange={e => handleMoneyInput('costPrice', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Preço Venda (Varejo)</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="w-full border p-2 rounded focus:ring-emerald-500 focus:outline-none"
                                    placeholder="0,000"
                                    value={formData.retailPrice}
                                    onChange={e => handleMoneyInput('retailPrice', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Preço Atacado</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="w-full border p-2 rounded focus:ring-emerald-500 focus:outline-none"
                                    placeholder="0,000"
                                    value={formData.wholesalePrice}
                                    onChange={e => handleMoneyInput('wholesalePrice', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Qtd Mín. Atacado</label>
                                <input type="number" className="w-full border p-2 rounded focus:ring-emerald-500 focus:outline-none"
                                    value={formData.wholesaleMinQty} onChange={e => setFormData({ ...formData, wholesaleMinQty: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Estoque Atual</label>
                                <input type="number" className="w-full border p-2 rounded focus:ring-emerald-500 focus:outline-none"
                                    value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Estoque Mínimo (Alerta)</label>
                                <input type="number" className="w-full border p-2 rounded focus:ring-emerald-500 focus:outline-none"
                                    placeholder="Qtd mínima para alerta"
                                    value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Validade (Opcional)</label>
                                <input type="date" className="w-full border p-2 rounded focus:ring-emerald-500 focus:outline-none"
                                    value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
                            </div>

                            <div className="col-span-2 flex justify-end gap-3 mt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- IMPORT MODAL --- */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
                        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-xl flex items-center gap-2">
                                    <Upload className="text-blue-200" /> Importar Produtos
                                </h3>
                                <p className="text-blue-100 text-sm mt-1">
                                    Faça upload de um arquivo CSV para cadastrar produtos em massa
                                </p>
                            </div>
                            <button onClick={() => {
                                setIsImportModalOpen(false);
                                setImportFile(null);
                                setImportPreview([]);
                                setImportErrors([]);
                            }} className="text-blue-200 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 border-b bg-gray-50">
                            <div className="flex gap-4 items-start">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Selecione o arquivo CSV
                                    </label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,.txt"
                                        onChange={handleFileSelect}
                                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Formato: CSV com separador vírgula (,) ou ponto-e-vírgula (;)
                                    </p>
                                </div>
                                <button
                                    onClick={downloadTemplate}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <FileSpreadsheet size={18} />
                                    Baixar Modelo
                                </button>
                            </div>

                            {importErrors.length > 0 && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-red-800 text-sm mb-1">Erros encontrados:</h4>
                                            <ul className="text-xs text-red-700 space-y-1">
                                                {importErrors.map((err, idx) => (
                                                    <li key={idx}>• {err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-white">
                            {importPreview.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                                    <FileSpreadsheet size={64} className="mb-4 opacity-50" />
                                    <p className="text-lg font-medium">Nenhum arquivo carregado</p>
                                    <p className="text-sm">Selecione um arquivo CSV para visualizar a prévia</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="mb-4 flex items-center justify-between">
                                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                            <Check className="text-emerald-600" size={20} />
                                            Prévia da Importação ({importPreview.length} produtos)
                                        </h4>
                                    </div>
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-100 text-gray-600 font-bold">
                                                    <tr>
                                                        <th className="p-3 whitespace-nowrap">Código</th>
                                                        <th className="p-3 whitespace-nowrap">Nome</th>
                                                        <th className="p-3 whitespace-nowrap">Categoria</th>
                                                        <th className="p-3 whitespace-nowrap">Marca</th>
                                                        <th className="p-3 whitespace-nowrap">Unidade</th>
                                                        <th className="p-3 whitespace-nowrap text-right">Custo</th>
                                                        <th className="p-3 whitespace-nowrap text-right">Venda</th>
                                                        <th className="p-3 whitespace-nowrap text-center">Estoque</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {importPreview.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="p-3 font-mono text-xs">{row.code}</td>
                                                            <td className="p-3 font-medium text-gray-800">{row.name}</td>
                                                            <td className="p-3 text-gray-600">
                                                                {row.category}
                                                                {row.subcategory && <span className="text-gray-400 text-xs"> / {row.subcategory}</span>}
                                                            </td>
                                                            <td className="p-3 text-gray-600">{row.brand || '-'}</td>
                                                            <td className="p-3 text-center">
                                                                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-bold">{row.unit}</span>
                                                            </td>
                                                            <td className="p-3 text-right font-medium">R$ {row.costPrice.toFixed(2)}</td>
                                                            <td className="p-3 text-right font-bold text-emerald-700">R$ {row.retailPrice.toFixed(2)}</td>
                                                            <td className="p-3 text-center font-medium">{row.stock}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                {importPreview.length > 0 && (
                                    <span className="font-medium">
                                        {importPreview.length} produto(s) pronto(s) para importar
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsImportModalOpen(false);
                                        setImportFile(null);
                                        setImportPreview([]);
                                        setImportErrors([]);
                                    }}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleImportConfirm}
                                    disabled={importPreview.length === 0}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Upload size={18} />
                                    Importar {importPreview.length > 0 && `(${importPreview.length})`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SUCCESS MODAL --- */}
            {importSuccessMessage && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="bg-emerald-50 p-6 flex flex-col items-center text-center border-b border-emerald-100">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                <Check className="text-emerald-600" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-emerald-900">Sucesso!</h3>
                        </div>
                        <div className="p-6 text-center">
                            <p className="text-gray-700 text-lg mb-6">{importSuccessMessage}</p>
                            <button
                                onClick={() => setImportSuccessMessage(null)}
                                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                            >
                                Ótimo, continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* --- EXPIRY ALERTS MODAL --- */}
            {isExpiryModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
                    <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 bg-slate-800 text-white flex justify-between items-center">
                            <h3 className="font-bold text-xl flex items-center gap-2"><AlertTriangle size={20} /> Alertas de Vencimento</h3>
                            <button onClick={() => setIsExpiryModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            <ExpiryAlerts products={products} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
