
import { supabase } from '../../lib/supabaseClient';

export interface BackupData {
    version: string;
    timestamp: string;
    database: {
        users: any[];
        products: any[];
        sales: any[];
        sale_items: any[];
        transactions: any[];
        transaction_items: any[];
        stock_movements: any[];
        stock_batches: any[];
        promotions: any[];
        product_kits: any[];
        product_kit_items: any[];
    };
    localStorage: Record<string, string | null>;
}

/**
 * Exporta todos os dados do sistema para um objeto JSON
 */
export async function exportSystemData(): Promise<BackupData> {
    console.log('📦 Iniciando exportação de backup...');

    // Helper para buscar dados de uma tabela
    const fetchTable = async (table: string) => {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw new Error(`Erro ao exportar tabela ${table}: ${error.message}`);
        return data || [];
    };

    try {
        const [
            users,
            products,
            sales,
            sale_items,
            transactions,
            transaction_items,
            stock_movements,
            stock_batches,
            promotions,
            product_kits,
            product_kit_items
        ] = await Promise.all([
            fetchTable('users'),
            fetchTable('products'),
            fetchTable('sales'),
            fetchTable('sale_items'),
            fetchTable('transactions'),
            fetchTable('transaction_items'),
            fetchTable('stock_movements'),
            fetchTable('stock_batches'),
            fetchTable('promotions'),
            fetchTable('product_kits'),
            fetchTable('product_kit_items')
        ]);

        // Coletar localStorage relevante
        const localStorageKeys = [
            'mm_categories', 'mm_subcategories', 'mm_brands', 'mm_suppliers',
            'mm_terminals', 'mm_supplier_terms', 'mm_category_margins',
            'mm_category_markups', 'mm_terminal_rates', 'mm_reports_date_filter'
        ];

        const localData: Record<string, string | null> = {};
        localStorageKeys.forEach(key => {
            localData[key] = localStorage.getItem(key);
        });

        const backup: BackupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            database: {
                users,
                products,
                sales,
                sale_items,
                transactions,
                transaction_items,
                stock_movements,
                stock_batches,
                promotions,
                product_kits,
                product_kit_items
            },
            localStorage: localData
        };

        console.log('✅ Backup gerado com sucesso!');
        return backup;

    } catch (error) {
        console.error('❌ Erro ao gerar backup:', error);
        throw error;
    }
}

/**
 * Restaura os dados do sistema a partir de um objeto JSON
 */
export async function restoreSystemData(backup: BackupData): Promise<{ success: boolean; message: string }> {
    console.log('🔄 Iniciando restauração de backup...');

    try {
        // 1. Validar versão (básico)
        if (!backup.version || !backup.database) {
            throw new Error('Arquivo de backup inválido ou corrompido.');
        }

        // 2. Limpar dados atuais (Ordem reversa de dependência)
        // Usamos uma lógica similar ao reset, mas para TUDO (incluindo users e products se quisermos restaurar o estado exato)
        // ATENÇÃO: Restaurar backup substitui TUDO.

        const tables = [
            'sale_items', 'sales', 'transaction_items', 'transactions',
            'stock_movements', 'stock_batches', 'product_kit_items',
            'product_kits', 'promotions', 'products', 'users'
        ];

        for (const table of tables) {
            const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw new Error(`Erro ao limpar tabela ${table}: ${error.message}`);
        }

        // 3. Inserir dados do backup (Ordem de dependência)
        // Users -> Products -> Outros

        const insertBatch = async (table: string, data: any[]) => {
            if (!data || data.length === 0) return;
            const { error } = await supabase.from(table).insert(data);
            if (error) throw new Error(`Erro ao restaurar tabela ${table}: ${error.message}`);
        };

        await insertBatch('users', backup.database.users);
        await insertBatch('products', backup.database.products);
        await insertBatch('promotions', backup.database.promotions);
        await insertBatch('product_kits', backup.database.product_kits);
        await insertBatch('product_kit_items', backup.database.product_kit_items);
        await insertBatch('sales', backup.database.sales);
        await insertBatch('sale_items', backup.database.sale_items);
        await insertBatch('transactions', backup.database.transactions);
        await insertBatch('transaction_items', backup.database.transaction_items);
        await insertBatch('stock_movements', backup.database.stock_movements);
        await insertBatch('stock_batches', backup.database.stock_batches);

        // 4. Restaurar localStorage
        if (backup.localStorage) {
            Object.entries(backup.localStorage).forEach(([key, value]) => {
                if (value !== null) {
                    localStorage.setItem(key, value);
                } else {
                    localStorage.removeItem(key);
                }
            });
        }

        console.log('✅ Restauração concluída com sucesso!');
        return { success: true, message: 'Backup restaurado com sucesso!' };

    } catch (error) {
        console.error('❌ Erro ao restaurar backup:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Erro desconhecido na restauração.'
        };
    }
}
