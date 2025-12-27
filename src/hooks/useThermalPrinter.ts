// Hook para integração de impressão de cupons no POS
import { useCallback } from 'react';
import { Sale } from '../../types';
import { StoreSettings, ReceiptData, ReceiptItem, generateReceipt, printViaWebSerial, printViaWindow } from '../utils/thermalPrinter';

export const useThermalPrinter = () => {
    const getStoreSettings = useCallback((): StoreSettings => {
        const savedSettings = localStorage.getItem('mm_store_settings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
        return {
            name: 'Meu Mercado',
            footerMessage: 'Obrigado pela preferencia!\nVolte sempre!'
        };
    }, []);

    const getPrinterConfig = useCallback(() => {
        const width = localStorage.getItem('mm_printer_width');
        const method = localStorage.getItem('mm_print_method');
        return {
            width: width ? parseInt(width) : 32,
            method: (method || 'window') as 'serial' | 'window'
        };
    }, []);

    const printSaleReceipt = useCallback(async (sale: Sale, cashierName?: string): Promise<void> => {
        try {
            // Verificar se impressão está ativada
            const printEnabled = localStorage.getItem('mm_print_enabled');
            if (printEnabled === 'false') {
                console.log('Impressão desativada - cupom não será impresso');
                return; // Retorna silenciosamente sem imprimir
            }

            const storeSettings = getStoreSettings();
            const { width, method } = getPrinterConfig();

            // Converter Sale para ReceiptData
            const receiptItems: ReceiptItem[] = sale.items.map(item => ({
                name: item.name,
                qty: item.qty,
                price: item.appliedPrice,
                total: item.subtotal
            }));

            const receiptData: ReceiptData = {
                id: sale.id,
                timestamp: sale.timestamp,
                items: receiptItems,
                subtotal: sale.total,
                total: sale.total,
                paymentMethod: sale.paymentMethod,
                cashierName: cashierName,
                customerName: sale.customerName
            };

            const receiptContent = generateReceipt(receiptData, storeSettings, width);

            if (method === 'serial') {
                await printViaWebSerial(receiptContent);
            } else {
                printViaWindow(receiptContent, storeSettings);
            }
        } catch (error) {
            console.error('Erro ao imprimir cupom:', error);
            throw error;
        }
    }, [getStoreSettings, getPrinterConfig]);

    return {
        printSaleReceipt,
        getStoreSettings,
        getPrinterConfig
    };
};
