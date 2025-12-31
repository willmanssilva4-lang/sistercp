
import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem, Sale, Promotion, ProductKit, Customer } from '../types';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, RotateCcw, Scan, Volume2, Percent, X, Check, Tag, Keyboard, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { useThermalPrinter } from '../src/hooks/useThermalPrinter';
import { usePeople } from '../contexts/PeopleContext';
import { UserRole } from '../types';

interface POSProps {
    products: Product[];
    promotions?: Promotion[];
    kits?: ProductKit[];
    onProcessSale: (sale: Sale) => void;
    onCashMovement: (type: 'INCOME' | 'EXPENSE', amount: number, description: string) => void;
    currentUser: string;
    customers?: Customer[];
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

const POS: React.FC<POSProps> = ({ products, promotions = [], kits = [], onProcessSale, onCashMovement, currentUser, customers = [], onError, onSuccess }) => {
    // --- THERMAL PRINTER ---
    const { printSaleReceipt } = useThermalPrinter();

    // --- STATE ---
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [mobileView, setMobileView] = useState<'SEARCH' | 'CART'>('SEARCH');

    // Selection & Focus
    const [selectedCartIndex, setSelectedCartIndex] = useState<number>(-1); // -1 means search focus, >= 0 means cart item selected

    // Modals
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

    const [itemDiscountCartId, setItemDiscountCartId] = useState<string | null>(null);
    const [cashMovementModalOpen, setCashMovementModalOpen] = useState(false);
    const [cashMovementType, setCashMovementType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
    const [cashMovementAmount, setCashMovementAmount] = useState('');
    const [cashMovementDesc, setCashMovementDesc] = useState('');

    // Inputs
    const searchInputRef = useRef<HTMLInputElement>(null);
    const quantityInputRef = useRef<HTMLInputElement>(null);
    const [quantityInput, setQuantityInput] = useState(1);

    // Discount Logic
    const [discountValue, setDiscountValue] = useState('');
    const [discountType, setDiscountType] = useState<'PERCENT' | 'VALUE'>('PERCENT');
    const [itemDiscountValue, setItemDiscountValue] = useState('');
    const [itemDiscountType, setItemDiscountType] = useState<'PERCENT' | 'VALUE'>('PERCENT');

    // Pending Product (Waiting for Qty confirmation)
    const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
    const [pendingDiscount, setPendingDiscount] = useState<number | undefined>(undefined);

    // Search List Selection
    const [searchListIndex, setSearchListIndex] = useState(0);

    // Success Modal
    const [successModal, setSuccessModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

    // --- VOID ITEM MODAL STATE ---
    const [voidModalOpen, setVoidModalOpen] = useState(false);
    const [voidItemIndexStr, setVoidItemIndexStr] = useState('');
    const [voidUsername, setVoidUsername] = useState('');
    const [voidPassword, setVoidPassword] = useState('');

    const { users } = usePeople();



    const [modalSelectedIndex, setModalSelectedIndex] = useState(0);
    const [selectingCardType, setSelectingCardType] = useState(false);
    const [terminals, setTerminals] = useState<string[]>([]);

    const handleCardChoice = (type: 'CREDIT' | 'DEBIT', terminal?: string) => {
        const methodName = terminal ? `${type === 'CREDIT' ? 'Crédito' : 'Débito'} - ${terminal}` : (type === 'CREDIT' ? 'Crédito' : 'Débito');
        setSelectingCardType(false);

        if (paymentMode === 'SIMPLE') {
            handleFinalize(type, methodName);
        } else {
            addPartialPayment(methodName);
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem('mm_terminals');
        if (saved) setTerminals(JSON.parse(saved));
    }, []);

    // --- PAYMENT STATE ---
    const [paymentMode, setPaymentMode] = useState<'SIMPLE' | 'MULTIPLE'>('SIMPLE');
    const [partialPayments, setPartialPayments] = useState<{ method: string, amount: number }[]>([]);
    const [currentPaymentAmount, setCurrentPaymentAmount] = useState('');

    const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    const totalPaid = partialPayments.reduce((acc, p) => acc + p.amount, 0);
    const remainingAmount = Math.max(0, cartTotal - totalPaid);

    useEffect(() => {
        if (paymentModalOpen) {
            setPaymentMode('SIMPLE');
            setPartialPayments([]);
            setCurrentPaymentAmount(cartTotal.toFixed(2));

            // Reload terminals to ensure we have the latest list
            const saved = localStorage.getItem('mm_terminals');
            if (saved) {
                setTerminals(JSON.parse(saved));
            }
        }
    }, [paymentModalOpen, cartTotal]);

    useEffect(() => {
        setCurrentPaymentAmount(remainingAmount.toFixed(2));
    }, [remainingAmount]);

    const addPartialPayment = (method: string) => {
        const amount = parseFloat(currentPaymentAmount);
        if (isNaN(amount) || amount <= 0) return;
        if (amount > remainingAmount + 0.01) {
            onError('Valor maior que o restante!');
            return;
        }
        setPartialPayments(prev => [...prev, { method, amount }]);
    };

    const removePartialPayment = (index: number) => {
        setPartialPayments(prev => prev.filter((_, i) => i !== index));
    };

    // --- AUDIO ---
    const playBeep = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) { console.error(e); }
    };

    // --- HELPERS ---
    const getStandardPrice = (product: Product, qty: number) => {
        // Check for Active Promotion First (Use Local Time)
        const today = new Date().toLocaleDateString('pt-BR').split('/').reverse().join('-'); // YYYY-MM-DD Local
        const activePromo = promotions.find(p => p.productCode === product.code && p.active && today >= p.startDate && today <= p.endDate);

        if (activePromo) {
            return activePromo.promotionalPrice;
        }

        // Default Wholesale/Retail Logic
        return qty >= product.wholesaleMinQty ? product.wholesalePrice : product.retailPrice;
    };

    // Combine products and kits for search with dynamic stock calculation
    const searchableItems = [
        ...products,
        ...kits.filter(k => k.active).map(k => {
            // Calculate max available kits based on component stock
            let maxKits = 9999;
            k.items.forEach(ki => {
                const prod = products.find(p => p.code === ki.productCode);
                if (prod) {
                    const possible = Math.floor(prod.stock / ki.qty);
                    if (possible < maxKits) maxKits = possible;
                } else {
                    maxKits = 0; // Component missing
                }
            });

            return {
                ...k,
                id: k.id,
                // Adapt kit to look like a product for the search logic
                category: 'Kits',
                unit: 'KIT' as any,
                costPrice: 0,
                retailPrice: k.price,
                wholesalePrice: k.price,
                wholesaleMinQty: 999,
                stock: maxKits, // Dynamic Kit Stock
                minStock: 0
            };
        })
    ];

    const filteredProducts = searchTerm.trim().length >= 3
        ? searchableItems.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm))
        : [];

    useEffect(() => { setSearchListIndex(0); }, [searchTerm]);
    useEffect(() => { if (cart.length > 0) setSelectedCartIndex(cart.length - 1); }, [cart.length]);
    useEffect(() => { searchInputRef.current?.focus(); }, []);

    // --- CART ACTIONS ---

    const addToCart = (product: Product, discountOverride?: number) => {
        playBeep();
        setLastScanned(product.name);
        const qtyToAdd = quantityInput;

        setCart(prev => {
            const newStandardPrice = getStandardPrice(product, qtyToAdd);
            let finalPrice = newStandardPrice;
            if (discountOverride !== undefined) {
                finalPrice = newStandardPrice * (1 - discountOverride / 100);
            }

            const newItem: CartItem = {
                ...product,
                cartItemId: crypto.randomUUID(),
                qty: qtyToAdd,
                appliedPrice: finalPrice,
                subtotal: finalPrice * qtyToAdd
            };
            return [...prev, newItem];
        });

        setSearchTerm('');
        setQuantityInput(1);
        setSearchListIndex(0);
        setPendingProduct(null);
        setPendingDiscount(undefined);
        setTimeout(() => searchInputRef.current?.focus(), 10);
    };

    const removeFromCart = (index: number) => {
        if (index < 0 || index >= cart.length) return;
        setCart(prev => prev.filter((_, i) => i !== index));
        if (selectedCartIndex >= cart.length - 1) {
            setSelectedCartIndex(Math.max(-1, cart.length - 2));
        }
    };

    const updateQty = (index: number, delta: number) => {
        if (index < 0 || index >= cart.length) return;
        setCart(prev => prev.map((item, i) => {
            if (i === index) {
                const newQty = Math.max(1, item.qty + delta);
                const oldStandardPrice = getStandardPrice(item, item.qty);
                const currentDiscountRatio = oldStandardPrice > 0 ? (1 - (item.appliedPrice / oldStandardPrice)) : 0;
                const newStandardPrice = getStandardPrice(item, newQty);
                const newAppliedPrice = newStandardPrice * (1 - currentDiscountRatio);
                return { ...item, qty: newQty, appliedPrice: newAppliedPrice, subtotal: newAppliedPrice * newQty };
            }
            return item;
        }));
    };

    const applyGlobalDiscount = () => {
        const val = parseFloat(discountValue);
        if (isNaN(val) || val < 0) return;

        setCart(prev => {
            const currentTotal = prev.reduce((acc, item) => acc + (getStandardPrice(item, item.qty) * item.qty), 0);
            let effectivePercent = 0;
            if (discountType === 'PERCENT') effectivePercent = val;
            else effectivePercent = currentTotal > 0 ? (val / currentTotal) * 100 : 0;

            return prev.map(item => {
                const standardPrice = getStandardPrice(item, item.qty);
                const newPrice = standardPrice * (1 - (effectivePercent / 100));
                return { ...item, appliedPrice: newPrice, subtotal: newPrice * item.qty };
            });
        });
        setDiscountValue('');
        setIsDiscountModalOpen(false);
        playBeep();
        searchInputRef.current?.focus();
    };

    const applyItemDiscount = () => {
        if (!itemDiscountCartId) return;
        const val = parseFloat(itemDiscountValue);
        if (isNaN(val) || val < 0) return;

        setCart(prev => prev.map(item => {
            if (item.cartItemId === itemDiscountCartId) {
                const standardPrice = getStandardPrice(item, item.qty);
                let newPrice = standardPrice;
                if (itemDiscountType === 'PERCENT') newPrice = standardPrice * (1 - (val / 100));
                else newPrice = Math.max(0, standardPrice - val);
                return { ...item, appliedPrice: newPrice, subtotal: newPrice * item.qty };
            }
            return item;
        }));
        setItemDiscountCartId(null);
        setItemDiscountValue('');
        playBeep();
        searchInputRef.current?.focus();
    };

    const handleFinalize = (method: Sale['paymentMethod'], specificMethodName?: string) => {
        // Validation for Fiado
        if (method === 'FIADO') {
            if (!selectedCustomer) {
                setIsCustomerModalOpen(true);
                return;
            }
            // Check Credit Limit
            const newDebt = selectedCustomer.debtBalance + cartTotal;
            if (newDebt > selectedCustomer.creditLimit) {
                onError(`Limite de crédito excedido! Disponível: R$ ${(selectedCustomer.creditLimit - selectedCustomer.debtBalance).toFixed(2)}`);
                return;
            }
        }

        const sale: Sale = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            cashierId: currentUser,
            customerId: selectedCustomer?.id,
            customerName: selectedCustomer?.name || customerName || 'Consumidor Final',
            items: cart,
            total: cart.reduce((acc, item) => acc + item.subtotal, 0),
            paymentMethod: method,
            payments: method === 'MULTIPLE' ? partialPayments : (specificMethodName ? [{ method: specificMethodName, amount: cart.reduce((acc, item) => acc + item.subtotal, 0) }] : undefined),
            status: 'COMPLETED'
        };
        onProcessSale(sale);

        // Impressão automática de cupom
        const autoPrint = localStorage.getItem('mm_auto_print') !== 'false'; // true por padrão
        if (autoPrint) {
            printSaleReceipt(sale, currentUser || 'Operador').catch(error => {
                console.error('Erro ao imprimir cupom:', error);
                // Não bloqueia a venda se a impressão falhar
            });
        }

        setCart([]);
        setCustomerName('');
        setSelectedCustomer(null);
        setLastScanned(null);
        setPaymentModalOpen(false);
        setTimeout(() => playBeep(), 0);
        setTimeout(() => playBeep(), 150);
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const handleCashMovementSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(cashMovementAmount);
        if (isNaN(amount) || amount <= 0) {
            onError('Valor inválido');
            return;
        }
        if (!cashMovementDesc.trim()) {
            onError('Informe uma descrição/motivo');
            return;
        }

        onCashMovement(cashMovementType, amount, cashMovementDesc);
        setCashMovementModalOpen(false);
        setCashMovementAmount('');
        setCashMovementDesc('');
        playBeep();
        onSuccess(`${cashMovementType === 'EXPENSE' ? 'Sangria' : 'Reforço'} realizada com sucesso!`);
        searchInputRef.current?.focus();
    };

    const handleVoidConfirm = (e: React.FormEvent) => {
        e.preventDefault();

        const inputStr = voidItemIndexStr.trim();
        let indexToRemove = -1;

        // 1. Try to find by Product Code (search from end to beginning)
        for (let i = cart.length - 1; i >= 0; i--) {
            if (cart[i].code === inputStr) {
                indexToRemove = i;
                break;
            }
        }

        // 2. If not found by code, try as Item Index
        if (indexToRemove === -1) {
            const parsedIndex = parseInt(inputStr) - 1; // User enters 1-based index
            if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < cart.length) {
                indexToRemove = parsedIndex;
            }
        }

        if (indexToRemove === -1) {
            onError('Item não encontrado (Código ou Número inválido)!');
            return;
        }

        // 3. Validate Supervisor
        const supervisor = users.find(u => u.email === voidUsername || u.name === voidUsername);
        if (!supervisor) {
            onError('Usuário supervisor não encontrado!');
            return;
        }

        // Check Role
        const role = String(supervisor.role).toUpperCase();
        if (role !== UserRole.MANAGER && role !== UserRole.ADMIN) {
            onError('Usuário não tem permissão de supervisor (Gerente/Admin)!');
            return;
        }

        // Check Password
        if (!voidPassword) {
            onError('Informe a senha!');
            return;
        }

        // 4. Remove Item
        const itemToRemove = cart[indexToRemove];
        setCart(prev => prev.filter((_, i) => i !== indexToRemove));

        setVoidModalOpen(false);
        setVoidItemIndexStr('');
        setVoidUsername('');
        setVoidPassword('');
        playBeep();
        onSuccess(`Item ${indexToRemove + 1} (${itemToRemove.name}) estornado por ${supervisor.name}.`);
        searchInputRef.current?.focus();
    };

    // --- KEYBOARD HANDLERS ---

    const prepareProductToAdd = (product: Product, discount?: number) => {
        setPendingProduct(product);
        setPendingDiscount(discount);
        setTimeout(() => {
            quantityInputRef.current?.focus();
            quantityInputRef.current?.select();
        }, 10);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        // If search is empty, allow navigation to Cart
        if (searchTerm === '' && cart.length > 0) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                // Move focus to cart (last item usually)
                setSelectedCartIndex(cart.length - 1);
                // We don't focus a DOM element, we just set the state visual
                return;
            }
        }

        // Navigation in Search Results
        if (searchTerm.length >= 3) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSearchListIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSearchListIndex(prev => Math.max(prev - 1, 0));
                return;
            }
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            let term = searchTerm.trim();
            if (!term && filteredProducts.length > 0) term = filteredProducts[searchListIndex].code;
            if (!term && filteredProducts.length > 0) {
                prepareProductToAdd(filteredProducts[searchListIndex]);
                return;
            }
            if (!term) return;

            // Discount Logic via Command
            const discountMatch = term.match(/^(.+?)[\s-](\d+)%?$/);
            let searchFor = term;
            let discountToApply: number | undefined = undefined;
            if (discountMatch) {
                searchFor = discountMatch[1].trim();
                const val = parseInt(discountMatch[2], 10);
                if (!isNaN(val) && val > 0 && val <= 100) discountToApply = val;
            }

            // 1. Try Exact Code (Product or Kit)
            const exactCodeMatch = searchableItems.find(p => p.code === searchFor);
            if (exactCodeMatch) {
                prepareProductToAdd(exactCodeMatch, discountToApply);
                return;
            }

            // 2. Try Name Match
            const matches = searchableItems.filter(p => p.name.toLowerCase().includes(searchFor.toLowerCase()) || p.code.includes(searchFor));
            if (matches.length === 1) {
                prepareProductToAdd(matches[0], discountToApply);
                return;
            }

            if (filteredProducts.length > 0) {
                prepareProductToAdd(filteredProducts[searchListIndex]);
            }
        }
    };

    const handleGlobalKeyDown = (e: React.KeyboardEvent) => {
        // Ignore if in input fields (except generic navigation keys handled specifically)
        const target = e.target as HTMLElement;

        // Card Selection Modal Keyboard Navigation
        if (selectingCardType) {
            e.preventDefault();

            if (e.key === 'Escape') {
                setSelectingCardType(false);
                return;
            }

            if (e.key === 'ArrowUp') {
                setModalSelectedIndex(prev => Math.max(0, prev - 1));
                return;
            }

            if (e.key === 'ArrowDown') {
                setModalSelectedIndex(prev => Math.min(terminals.length - 1, prev + 1));
                return;
            }

            if (e.key === 'Enter') {
                if (terminals.length > 0) {
                    handleCardChoice('CREDIT', terminals[modalSelectedIndex]);
                }
                return;
            }
            return;
        }

        // Global Shortcuts
        if (e.key === 'F2') { e.preventDefault(); setPaymentModalOpen(true); return; }
        if (e.key === 'F3') { e.preventDefault(); setIsDiscountModalOpen(true); return; }

        if (e.key === 'F4') { e.preventDefault(); searchInputRef.current?.focus(); setSelectedCartIndex(-1); return; }
        if (e.key === 'F11') {
            e.preventDefault();
            setCashMovementType('EXPENSE'); // Default to Sangria
            setCashMovementModalOpen(true);
            return;
        }

        // Void Item Shortcut (F9) - Only if NOT selecting an item (to avoid conflict with Discount)
        if (e.key === 'F9' && selectedCartIndex === -1 && !paymentModalOpen && !isDiscountModalOpen && !cashMovementModalOpen && !isCustomerModalOpen) {
            e.preventDefault();
            setVoidModalOpen(true);
            return;
        }

        // Payment Modal Shortcuts
        if (paymentModalOpen) {
            if (e.key === 'Escape') setPaymentModalOpen(false);

            const handlePaymentShortcut = (method: string) => {
                if (method === 'CARD') {
                    setSelectingCardType(true);
                    setModalSelectedIndex(0);
                    return;
                }

                if (paymentMode === 'SIMPLE') {
                    handleFinalize(method as any);
                } else {
                    addPartialPayment(method);
                }
            };

            if (e.key === 'F6') { e.preventDefault(); handlePaymentShortcut('CASH'); }
            if (e.key === 'F7') { e.preventDefault(); handlePaymentShortcut('PIX'); }
            if (e.key === 'F8') { e.preventDefault(); handlePaymentShortcut('CARD'); }
            if (e.key === 'F10') { e.preventDefault(); handlePaymentShortcut('FIADO'); }
            return;
        }

        // Modals (Discount)
        if (isDiscountModalOpen || itemDiscountCartId) {
            if (e.key === 'Escape') {
                setIsDiscountModalOpen(false);
                setItemDiscountCartId(null);
                setItemDiscountValue('');
                setDiscountValue('');
                searchInputRef.current?.focus();
            }
            // Horizontal Navigation for Discount Type
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (isDiscountModalOpen) setDiscountType('PERCENT');
                if (itemDiscountCartId) setItemDiscountType('PERCENT');
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (isDiscountModalOpen) setDiscountType('VALUE');
                if (itemDiscountCartId) setItemDiscountType('VALUE');
            }
            return;
        }

        if (cashMovementModalOpen) {
            if (e.key === 'Escape') {
                setCashMovementModalOpen(false);
                searchInputRef.current?.focus();
            }
            return;
        }

        if (isCustomerModalOpen) {
            if (e.key === 'Escape') {
                setIsCustomerModalOpen(false);
            }
            return;
        }

        if (voidModalOpen) {
            if (e.key === 'Escape') {
                setVoidModalOpen(false);
                searchInputRef.current?.focus();
            }
            return;
        }

        // Pending Qty Mode
        if (pendingProduct) return;

        // CART NAVIGATION & MANIPULATION (When Search input is NOT focused OR Search is empty and user pressed Down)
        // Actually, let's make it so if SelectedCartIndex > -1, we capture keys
        if (selectedCartIndex !== -1) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedCartIndex(prev => Math.max(0, prev - 1));
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedCartIndex(prev => Math.min(cart.length - 1, prev + 1));
            }
            if (e.key === 'Delete') {
                e.preventDefault();
                removeFromCart(selectedCartIndex);
            }
            if (e.key === '+' || e.key === '=') { // Numpad + or Standard +
                e.preventDefault();
                updateQty(selectedCartIndex, 1);
            }
            if (e.key === '-') { // Numpad - or Standard -
                e.preventDefault();
                updateQty(selectedCartIndex, -1);
            }
            if (e.key.toLowerCase() === 'd') {
                e.preventDefault();
                if (cart[selectedCartIndex]) {
                    setItemDiscountCartId(cart[selectedCartIndex].cartItemId);
                    setItemDiscountValue('');
                }
            }
            if (e.key === 'ArrowLeft' || e.key === 'Escape') {
                // Return to search
                setSelectedCartIndex(-1);
                searchInputRef.current?.focus();
            }
        }
    };

    const handleQuantityKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (pendingProduct) addToCart(pendingProduct, pendingDiscount);
        }
        if (e.key === 'Escape') {
            setPendingProduct(null);
            searchInputRef.current?.focus();
        }
    };



    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Focus the container on mount to capture keyboard events
        // But if search input is present, focus that instead (already handled by another useEffect)
        // If we focus container, search input focus might be lost?
        // The existing useEffect focuses searchInputRef.
        // Let's just ensure if focus is lost, we can still catch events?
        // No, let's use window listener for F4 specifically as it's the requested fix and safest.
    }, []);

    // F4 Global Listener
    useEffect(() => {
        const handleF4 = (e: KeyboardEvent) => {
            if (e.key === 'F4') {
                e.preventDefault();
                e.stopPropagation();
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                    searchInputRef.current.select();
                }
                setSelectedCartIndex(-1);
            }
        };
        window.addEventListener('keydown', handleF4, true); // Use capture to ensure it runs first
        return () => window.removeEventListener('keydown', handleF4, true);
    }, []);

    return (
        <div className="flex h-screen bg-gray-100 flex-col overflow-hidden" onKeyDown={handleGlobalKeyDown}>
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* Left: Search & Products */}
                <div className={`w-full md:w-1/2 p-4 flex flex-col gap-4 h-full ${mobileView === 'SEARCH' ? 'flex' : 'hidden md:flex'}`}>
                    {/* Search Box */}
                    <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 transition-all ${selectedCartIndex === -1 ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-300 opacity-80'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                <Scan size={14} /> Busca de Produtos (F4)
                            </label>
                            {lastScanned && (
                                <span className="text-xs font-bold text-emerald-600 animate-pulse">
                                    Último: {lastScanned}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-3.5 text-gray-400" size={24} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Nome, Código ou 'Coca -10%'"
                                    className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none"
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setSelectedCartIndex(-1); }}
                                    onKeyDown={handleSearchKeyDown}
                                    autoComplete="off"
                                />
                            </div>

                            {/* Quantity Input (Popup style when pending) */}
                            <div className="flex gap-2">
                                <div className={`flex items-center bg-white border-2 rounded-xl overflow-hidden w-24 sm:w-32 transition-all ${pendingProduct ? 'border-emerald-600 ring-4 ring-emerald-100 shadow-xl scale-105 z-10' : 'border-gray-200 opacity-60'}`}>
                                    <span className="bg-gray-100 text-gray-500 px-2 sm:px-3 h-full flex items-center text-[10px] sm:text-sm font-bold border-r">QTD</span>
                                    <input
                                        ref={quantityInputRef}
                                        type="number"
                                        min="1"
                                        value={quantityInput}
                                        onChange={(e) => setQuantityInput(Math.max(1, parseInt(e.target.value) || 1))}
                                        onKeyDown={handleQuantityKeyDown}
                                        className="w-full px-1 sm:px-2 py-1 outline-none font-bold text-xl sm:text-2xl text-gray-800 text-center"
                                        disabled={!pendingProduct}
                                    />
                                </div>
                                {pendingProduct && (
                                    <button
                                        onClick={() => addToCart(pendingProduct, pendingDiscount)}
                                        className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg flex items-center justify-center"
                                        title="Confirmar"
                                    >
                                        <Check size={24} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Results List */}
                    <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                        {searchTerm.length < 3 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                <Keyboard size={64} className="mb-4" />
                                <p className="text-lg font-medium">Digite para buscar...</p>
                                <p className="text-sm">Use as setas para navegar no carrinho quando vazio</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {filteredProducts.map((product, index) => {
                                    const isSelected = index === searchListIndex;
                                    const isKit = product.unit === 'KIT';
                                    const stdPrice = getStandardPrice(product, 1);
                                    const hasActivePromo = stdPrice !== product.retailPrice && !isKit;

                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => prepareProductToAdd(product)}
                                            onMouseEnter={() => setSearchListIndex(index)}
                                            className={`p-3 rounded-lg flex justify-between items-center border-l-4 cursor-pointer transition-all ${isSelected ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    {isKit && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 rounded">KIT</span>}
                                                    {hasActivePromo && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 rounded flex items-center gap-1"><Tag size={10} /> OFERTA</span>}
                                                    <p className="font-bold text-gray-800">{product.name}</p>
                                                </div>
                                                <p className="text-xs text-gray-500">{product.code} • {product.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${hasActivePromo ? 'text-green-600 text-lg' : 'text-emerald-600'}`}>R$ {stdPrice.toFixed(2)}</p>
                                                {hasActivePromo && <span className="text-xs text-gray-400 line-through mr-1">R$ {product.retailPrice.toFixed(2)}</span>}
                                                {!isKit && product.stock <= product.minStock && <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1 rounded block">Estoque Baixo: {product.stock}</span>}
                                                {isKit && <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1 rounded block">Disp: {product.stock}</span>}
                                            </div>
                                        </div>
                                    )
                                })}
                                {filteredProducts.length === 0 && <p className="text-center text-gray-400 py-10">Nenhum produto encontrado.</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Cart */}
                <div className={`w-full md:w-1/2 bg-white border-l shadow-xl flex flex-col z-10 transition-colors h-full ${mobileView === 'CART' ? 'flex' : 'hidden md:flex'} ${selectedCartIndex !== -1 ? 'ring-4 ring-inset ring-blue-400/50' : ''}`}>
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-5 shadow-md">

                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="text-emerald-400" /> Caixa Aberto</h2>
                            <button
                                onClick={() => setCashMovementModalOpen(true)}
                                className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 px-2 py-1 rounded text-slate-300 flex items-center gap-1 transition-colors"
                                title="Sangria / Reforço (F11)"
                            >
                                <Banknote size={14} /> Mov. Caixa
                            </button>
                        </div>
                        <input

                            className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm px-3 py-2 rounded border border-slate-700 focus:border-emerald-500 outline-none"
                            placeholder="Identificar Cliente (Opcional)"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                        />
                    </div>

                    {/* Cart List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50 relative">
                        {cart.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 opacity-60">
                                <ShoppingCart size={48} className="mb-2" />
                                <p>Carrinho Vazio</p>
                            </div>
                        ) : (
                            cart.map((item, index) => {
                                const isSelected = index === selectedCartIndex;
                                const stdPrice = getStandardPrice(item, item.qty);
                                const discountRatio = 1 - (item.appliedPrice / stdPrice);
                                const hasDiscount = discountRatio >= 0.005;

                                return (
                                    <div key={item.cartItemId}
                                        onClick={() => setSelectedCartIndex(index)}
                                        className={`p-2 rounded-lg border flex flex-col transition-all cursor-pointer
                                ${isSelected ? 'bg-blue-50 border-blue-500 shadow-md scale-[1.02] z-10' : 'bg-white border-gray-100'}
                            `}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 text-sm mb-1">
                                                    <span className="font-bold text-gray-500 font-mono">{String(index + 1).padStart(3, '0')}</span>
                                                    <span className="text-xs text-gray-400">{item.code}</span>
                                                    <span className="font-bold text-gray-800 line-clamp-1">{item.name}</span>
                                                    {item.unit === 'KIT' && <span className="bg-purple-100 text-purple-600 text-[10px] font-bold px-1 rounded">KIT</span>}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm font-mono text-gray-600 pl-8">
                                                    <span>{item.qty.toFixed(3)} {item.unit}</span>
                                                    <span className="text-gray-400">x</span>
                                                    <span>{item.appliedPrice.toFixed(2)}</span>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setItemDiscountCartId(item.cartItemId); setItemDiscountValue(''); }}
                                                        className={`ml-2 p-0.5 rounded text-[10px] flex items-center gap-1 ${hasDiscount ? 'bg-green-100 text-green-700' : 'text-gray-300 hover:text-gray-500'}`}
                                                        title="Desconto Individual"
                                                    >
                                                        <Tag size={10} />
                                                        {hasDiscount && <span>-{Math.round(discountRatio * 100)}%</span>}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="font-bold text-gray-900 text-sm">{item.subtotal.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="flex justify-end items-center gap-2 mt-2 pt-2 border-t border-blue-200">
                                                <button onClick={(e) => { e.stopPropagation(); updateQty(index, -1); }} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><Minus size={14} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); updateQty(index, 1); }} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><Plus size={14} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); removeFromCart(index); }} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={14} /></button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer Totals */}
                    <div className="p-5 bg-white border-t border-gray-200 shadow-up">
                        <div className="flex justify-between text-sm text-gray-500 mb-2">
                            <span>Itens: {cart.reduce((a, b) => a + b.qty, 0)}</span>
                            {selectedCartIndex !== -1 && <span className="text-blue-600 font-bold text-xs">Modo Edição (Setas / +/- / Del)</span>}
                        </div>
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-gray-400 font-medium">TOTAL</span>
                            <span className="text-4xl font-extrabold text-slate-800">R$ {cartTotal.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={() => setPaymentModalOpen(true)}
                            disabled={cart.length === 0}
                            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-xl shadow-lg shadow-emerald-200 flex justify-center items-center gap-3 disabled:opacity-50"
                        >
                            <CreditCard /> FINALIZAR (F2)
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Bar */}
            <div className="md:hidden flex border-t bg-white h-16 shrink-0">
                <button
                    onClick={() => setMobileView('SEARCH')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 ${mobileView === 'SEARCH' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500'}`}
                >
                    <Search size={20} />
                    <span className="text-[10px] font-bold uppercase">Produtos</span>
                </button>
                <button
                    onClick={() => setMobileView('CART')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 relative ${mobileView === 'CART' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}
                >
                    <ShoppingCart size={20} />
                    <span className="text-[10px] font-bold uppercase">Carrinho</span>
                    {cart.length > 0 && (
                        <span className="absolute top-2 right-1/3 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[18px] text-center">
                            {cart.reduce((a, b) => a + b.qty, 0)}
                        </span>
                    )}
                </button>
            </div>

            {/* FOOTER SHORTCUTS LEGEND */}
            <div className="hidden md:flex bg-slate-800 text-slate-400 text-xs py-2 px-4 justify-between items-center border-t border-slate-700">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><kbd className="bg-slate-700 px-1.5 rounded text-white font-mono border border-slate-600">F1</kbd> Sair</span>
                    <span className="flex items-center gap-1"><kbd className="bg-slate-700 px-1.5 rounded text-white font-mono border border-slate-600">F2</kbd> Pagar</span>
                    <span className="flex items-center gap-1"><kbd className="bg-slate-700 px-1.5 rounded text-white font-mono border border-slate-600">F3</kbd> Desc. Global</span>
                    <span className="flex items-center gap-1"><kbd className="bg-slate-700 px-1.5 rounded text-white font-mono border border-slate-600">F4</kbd> Busca</span>
                    <span className="flex items-center gap-1"><kbd className="bg-slate-700 px-1.5 rounded text-white font-mono border border-slate-600">F9</kbd> Estornar</span>
                    <span className="flex items-center gap-1"><kbd className="bg-slate-700 px-1.5 rounded text-white font-mono border border-slate-600">Setas</kbd> Navegar</span>
                </div>
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><kbd className="bg-slate-700 px-1.5 rounded text-white font-mono border border-slate-600">+</kbd> <kbd className="bg-slate-700 px-1.5 rounded text-white font-mono border border-slate-600">-</kbd> Qtd Item</span>
                    <span className="flex items-center gap-1"><kbd className="bg-slate-700 px-1.5 rounded text-white font-mono border border-slate-600">DEL</kbd> Remover</span>
                    <span className="flex items-center gap-1"><kbd className="bg-slate-700 px-1.5 rounded text-white font-mono border border-slate-600">D</kbd> Desc. Item</span>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Payment Modal (Split Payment Support) */}
            {paymentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
                    <div className="bg-white rounded-2xl p-4 md:p-8 w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[95vh] overflow-y-auto">

                        {/* Header / Tabs */}
                        <div className="flex justify-center mb-6 bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => { setPaymentMode('SIMPLE'); setPartialPayments([]); }}
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${paymentMode === 'SIMPLE' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Pagamento Simples
                            </button>
                            <button
                                onClick={() => { setPaymentMode('MULTIPLE'); setPartialPayments([]); }}
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${paymentMode === 'MULTIPLE' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Pagamento Múltiplo
                            </button>
                        </div>

                        <div className="text-center mb-6">
                            <p className="text-gray-500 uppercase tracking-widest text-sm font-bold">Total a Pagar</p>
                            <p className="text-5xl font-black text-slate-800">R$ {cartTotal.toFixed(2)}</p>
                        </div>

                        {paymentMode === 'SIMPLE' ? (
                            <>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {[
                                        { key: 'F6', label: 'Dinheiro', icon: Banknote, color: 'emerald', method: 'CASH' },
                                        { key: 'F7', label: 'PIX', icon: RotateCcw, color: 'teal', method: 'PIX' },
                                        { key: 'F8', label: 'Cartões', icon: CreditCard, color: 'blue', method: 'CARD' },
                                        { key: 'F10', label: 'Fiado', icon: Banknote, color: 'red', method: 'FIADO' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.key}
                                            onClick={() => {
                                                if (opt.method === 'CARD') {
                                                    setSelectingCardType(true);
                                                    setModalSelectedIndex(0);
                                                } else {
                                                    handleFinalize(opt.method as any);
                                                }
                                            }}
                                            className={`flex items-center justify-between p-4 border-2 rounded-xl hover:bg-gray-50 transition-all border-gray-100 group`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`text-${opt.color}-600 bg-${opt.color}-50 p-2 rounded-lg`}>
                                                    <opt.icon size={24} />
                                                </div>
                                                <span className="font-bold text-gray-700 text-lg">{opt.label}</span>
                                            </div>
                                            <kbd className="bg-gray-800 text-white px-2.5 py-1 rounded text-sm font-bold shadow-sm">{opt.key}</kbd>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-center text-gray-400 text-sm">Pressione <kbd className="bg-gray-200 px-1 rounded">ESC</kbd> para cancelar</p>
                            </>
                        ) : (
                            <div className="flex flex-col flex-1 overflow-hidden">
                                {/* Multiple Payment Logic */}
                                <div className="flex gap-4 mb-4">
                                    <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Restante</p>
                                        <p className={`text-2xl font-black ${remainingAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            R$ {remainingAmount.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Pago</p>
                                        <p className="text-2xl font-black text-emerald-600">
                                            R$ {totalPaid.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-4">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-3 top-3 text-gray-400 font-bold">R$</span>
                                        <input
                                            type="number"
                                            className="w-full pl-10 pr-4 py-3 border-2 border-blue-100 focus:border-blue-500 rounded-xl outline-none font-bold text-xl"
                                            placeholder="0.00"
                                            value={currentPaymentAmount}
                                            onChange={e => setCurrentPaymentAmount(e.target.value)}
                                            onFocus={e => e.target.select()}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    {[
                                        { label: 'Dinheiro (F6)', method: 'CASH', color: 'emerald' },
                                        { label: 'PIX (F7)', method: 'PIX', color: 'teal' },
                                        { label: 'Cartões (F8)', method: 'CARD', color: 'blue' },
                                        { label: 'Fiado (F10)', method: 'FIADO', color: 'red' },
                                    ].map(m => (
                                        <button
                                            key={m.method}
                                            onClick={() => {
                                                if (m.method === 'CARD') {
                                                    setSelectingCardType(true);
                                                    setModalSelectedIndex(0);
                                                } else {
                                                    addPartialPayment(m.method);
                                                }
                                            }}
                                            disabled={remainingAmount <= 0.01}
                                            className={`py-2 rounded-lg font-bold text-sm border-2 transition-all
                                    ${remainingAmount <= 0.01
                                                    ? 'border-gray-100 text-gray-300 bg-gray-50'
                                                    : `border-${m.color}-100 bg-${m.color}-50 text-${m.color}-700 hover:border-${m.color}-300`
                                                }
                                `}
                                        >
                                            + {m.label}
                                        </button>
                                    ))}
                                </div>

                                {/* List of Payments */}
                                <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-2 mb-4 border border-gray-100">
                                    {partialPayments.length === 0 ? (
                                        <p className="text-center text-gray-400 text-sm py-4">Nenhum pagamento adicionado</p>
                                    ) : (
                                        partialPayments.map((p, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border border-gray-100 mb-1">
                                                <span className="font-bold text-gray-700 text-sm">{p.method}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-gray-800">R$ {p.amount.toFixed(2)}</span>
                                                    <button onClick={() => removePartialPayment(idx)} className="text-red-400 hover:text-red-600">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <button
                                    onClick={() => handleFinalize('MULTIPLE')}
                                    disabled={remainingAmount > 0.01}
                                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xl shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
                                >
                                    FINALIZAR VENDA
                                </button>
                                <button onClick={() => setPaymentModalOpen(false)} className="mt-2 w-full text-gray-400 text-sm font-bold py-2">CANCELAR (ESC)</button>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* Terminal Selection Modal */}
            {selectingCardType && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[60] p-2 md:p-4 animate-fade-in transition-all duration-300">
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 md:p-8 w-full max-w-lg shadow-2xl animate-scale-in flex flex-col max-h-[90vh] border border-gray-100">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3 animate-pulse">
                                <CreditCard size={32} className="text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-1">
                                Selecione a Maquininha
                            </h3>
                            <p className="text-sm text-gray-500">Use as setas ↑↓ e Enter para confirmar</p>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 mb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                            <div className="flex flex-col gap-3">
                                {terminals.map((term, idx) => (
                                    <button
                                        key={term}
                                        onClick={() => handleCardChoice('CREDIT', term)}
                                        className={`group relative p-5 rounded-xl border-2 text-left font-bold flex items-center gap-4 transition-all duration-200 transform
                                            ${idx === modalSelectedIndex
                                                ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 shadow-lg scale-[1.03] ring-2 ring-blue-200'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:scale-[1.01] hover:shadow-md'
                                            }
                                        `}
                                    >
                                        <div className={`p-3 rounded-lg transition-all duration-200 ${idx === modalSelectedIndex ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-200 group-hover:text-blue-600'}`}>
                                            <CreditCard size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <span className="block text-lg">{term}</span>
                                            {idx === modalSelectedIndex && (
                                                <span className="text-xs text-blue-600 font-normal animate-pulse">Pressione Enter para confirmar</span>
                                            )}
                                        </div>
                                        {idx === modalSelectedIndex && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <Check size={24} className="text-blue-600 animate-bounce" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setSelectingCardType(false);
                            }}
                            className="w-full py-3 text-gray-500 font-bold hover:text-gray-700 hover:bg-gray-100 rounded-xl border-t border-gray-200 transition-all duration-200 hover:scale-[1.01]"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <X size={18} />
                                Cancelar (ESC)
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Global Discount Modal */}
            {isDiscountModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Percent className="text-emerald-500" /> Desconto Global
                        </h3>
                        <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                            <button
                                onClick={() => setDiscountType('PERCENT')}
                                className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${discountType === 'PERCENT' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}
                            >
                                % Porcentagem
                            </button>
                            <button
                                onClick={() => setDiscountType('VALUE')}
                                className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${discountType === 'VALUE' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}
                            >
                                $ Valor
                            </button>
                        </div>
                        <input
                            type="number"
                            autoFocus
                            className="w-full border-2 border-emerald-100 focus:border-emerald-500 rounded-xl p-3 text-2xl font-bold text-center outline-none mb-4"
                            placeholder="0.00"
                            value={discountValue}
                            onChange={e => setDiscountValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyGlobalDiscount()}
                        />
                        <button
                            onClick={applyGlobalDiscount}
                            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                            Aplicar Desconto
                        </button>
                    </div>
                </div>
            )}

            {/* Item Discount Modal */}
            {itemDiscountCartId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Tag className="text-blue-500" /> Desconto no Item
                        </h3>
                        <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                            <button
                                onClick={() => setItemDiscountType('PERCENT')}
                                className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${itemDiscountType === 'PERCENT' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                            >
                                % Porcentagem
                            </button>
                            <button
                                onClick={() => setItemDiscountType('VALUE')}
                                className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${itemDiscountType === 'VALUE' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                            >
                                $ Valor
                            </button>
                        </div>
                        <input
                            type="number"
                            autoFocus
                            className="w-full border-2 border-blue-100 focus:border-blue-500 rounded-xl p-3 text-2xl font-bold text-center outline-none mb-4"
                            placeholder="0.00"
                            value={itemDiscountValue}
                            onChange={e => setItemDiscountValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyItemDiscount()}
                        />
                        <button
                            onClick={applyItemDiscount}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            Aplicar no Item
                        </button>
                    </div>
                </div>
            )}

            {/* Cash Movement Modal (Sangria/Reforço) */}
            {cashMovementModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Banknote className="text-gray-600" /> Movimentação de Caixa
                            </h3>
                            <button onClick={() => setCashMovementModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                        </div>

                        <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                            <button
                                onClick={() => setCashMovementType('EXPENSE')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${cashMovementType === 'EXPENSE' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}
                            >
                                <TrendingDown size={16} /> Sangria (Saída)
                            </button>
                            <button
                                onClick={() => setCashMovementType('INCOME')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${cashMovementType === 'INCOME' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}
                            >
                                <TrendingUp size={16} /> Reforço (Entrada)
                            </button>
                        </div>

                        <form onSubmit={handleCashMovementSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Valor (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    autoFocus
                                    className="w-full border-2 border-gray-200 focus:border-gray-500 rounded-xl p-3 text-2xl font-bold text-center outline-none"
                                    placeholder="0.00"
                                    value={cashMovementAmount}
                                    onChange={e => setCashMovementAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Motivo / Descrição</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gray-500"
                                    placeholder={cashMovementType === 'EXPENSE' ? "Ex: Pagamento de Fornecedor, Retirada..." : "Ex: Troco inicial, Aporte..."}
                                    value={cashMovementDesc}
                                    onChange={e => setCashMovementDesc(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className={`w-full text-white font-bold py-3 rounded-xl transition-colors shadow-lg ${cashMovementType === 'EXPENSE' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}
                            >
                                Confirmar {cashMovementType === 'EXPENSE' ? 'Sangria' : 'Reforço'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Customer Selection Modal */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in p-6 flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Selecionar Cliente</h3>
                            <button onClick={() => setIsCustomerModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar por nome ou CPF..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={customerSearchTerm}
                                onChange={e => setCustomerSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto border rounded-lg">
                            {customers
                                .filter(c => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || c.cpf?.includes(customerSearchTerm))
                                .map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            setSelectedCustomer(c);
                                            setCustomerName(c.name);
                                            setIsCustomerModalOpen(false);
                                            // If payment modal is open and method is FIADO, we might want to re-trigger finalize? 
                                            // Better let user click Fiado again or handle it manually.
                                        }}
                                        className="w-full text-left p-3 hover:bg-emerald-50 border-b last:border-0 flex justify-between items-center"
                                    >
                                        <div>
                                            <p className="font-bold text-gray-800">{c.name}</p>
                                            <p className="text-xs text-gray-500">{c.cpf || 'Sem CPF'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Limite Disponível</p>
                                            <p className={`font-bold ${c.creditLimit - c.debtBalance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                R$ {(c.creditLimit - c.debtBalance).toFixed(2)}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            }
                            {customers.length === 0 && (
                                <div className="p-4 text-center text-gray-500">Nenhum cliente cadastrado.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Void Item Modal */}
            {voidModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                                <Trash2 size={20} /> Estornar Item
                            </h3>
                            <button onClick={() => setVoidModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                        </div>

                        <form onSubmit={handleVoidConfirm} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Número do Item ou Código</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    className="w-full border-2 border-gray-200 focus:border-red-500 rounded-xl p-2 text-xl font-bold text-center outline-none"
                                    placeholder="Ex: 1 ou 789..."
                                    value={voidItemIndexStr}
                                    onChange={e => setVoidItemIndexStr(e.target.value)}
                                />
                                <p className="text-xs text-gray-400 mt-1 text-center">Digite o número do item na lista ou leia o código de barras</p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-3">
                                <p className="text-xs font-bold text-gray-500 uppercase text-center mb-2">Autorização do Supervisor</p>
                                <div>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-gray-500 text-sm"
                                        placeholder="Usuário / Email"
                                        value={voidUsername}
                                        onChange={e => setVoidUsername(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="password"
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-gray-500 text-sm"
                                        placeholder="Senha"
                                        value={voidPassword}
                                        onChange={e => setVoidPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                            >
                                Confirmar Estorno
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Success Modal - Removed local state, using prop */}


        </div>
    );
};

export default POS;

