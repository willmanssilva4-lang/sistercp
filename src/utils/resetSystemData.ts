/**
 * Utilitário para resetar dados do sistema para testes
 */

import { supabase } from '../../lib/supabaseClient';

export async function resetSystemData(): Promise<{ success: boolean; message: string }> {
    console.log('🔄 Iniciando reset dos dados do sistema...');

    try {
        // 1. Deletar itens de vendas
        console.log('📦 Deletando itens de vendas...');
        const { error: saleItemsError } = await supabase
            .from('sale_items')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (saleItemsError) throw new Error(`Erro ao deletar sale_items: ${saleItemsError.message}`);

        // 2. Deletar vendas
        console.log('💰 Deletando vendas...');
        const { error: salesError } = await supabase
            .from('sales')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (salesError) throw new Error(`Erro ao deletar sales: ${salesError.message}`);

        // 3. Deletar transações financeiras
        console.log('💵 Deletando transações...');
        const { error: transactionsError } = await supabase
            .from('transactions')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (transactionsError) throw new Error(`Erro ao deletar transactions: ${transactionsError.message}`);

        // 4. Deletar lotes PEPS
        console.log('📊 Deletando lotes PEPS...');
        const { error: batchesError } = await supabase
            .from('stock_batches')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (batchesError) throw new Error(`Erro ao deletar stock_batches: ${batchesError.message}`);

        // 5. Deletar itens de transações (compras/despesas)
        console.log('🧾 Deletando itens de transações...');
        const { error: transItemsError } = await supabase
            .from('transaction_items')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (transItemsError) throw new Error(`Erro ao deletar transaction_items: ${transItemsError.message}`);

        // 6. Deletar movimentos de estoque
        console.log('📉 Deletando movimentos de estoque...');
        const { error: movementsError } = await supabase
            .from('stock_movements')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (movementsError) throw new Error(`Erro ao deletar stock_movements: ${movementsError.message}`);

        // 7. Deletar itens de kits
        console.log('🎁 Deletando itens de kits...');
        const { error: kitItemsError } = await supabase
            .from('product_kit_items')
            .delete()
            .neq('kit_id', '00000000-0000-0000-0000-000000000000');

        if (kitItemsError) throw new Error(`Erro ao deletar product_kit_items: ${kitItemsError.message}`);

        // 8. Deletar kits
        console.log('🎁 Deletando kits...');
        const { error: kitsError } = await supabase
            .from('product_kits')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (kitsError) throw new Error(`Erro ao deletar product_kits: ${kitsError.message}`);

        // 9. Deletar promoções
        console.log('🏷️ Deletando promoções...');
        const { error: promosError } = await supabase
            .from('promotions')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (promosError) throw new Error(`Erro ao deletar promotions: ${promosError.message}`);

        // 10. Resetar estoque de todos os produtos para 0
        console.log('📦 Resetando estoque dos produtos...');
        const { error: stockResetError } = await supabase
            .from('products')
            .update({ stock: 0 })
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (stockResetError) throw new Error(`Erro ao resetar estoque: ${stockResetError.message}`);

        // 11. Limpar localStorage para remover qualquer cache
        console.log('🧹 Limpando cache local...');
        localStorage.removeItem('mm_sales');
        localStorage.removeItem('mm_products');
        localStorage.removeItem('mm_transactions');
        localStorage.removeItem('mm_promotions');
        localStorage.removeItem('mm_kits');
        localStorage.removeItem('mm_reports_date_filter'); // Força reset dos filtros de data dos relatórios

        console.log('✅ Reset concluído com sucesso!');

        return {
            success: true,
            message: 'Todos os dados foram resetados com sucesso! Recarregue a página para ver as mudanças.'
        };

    } catch (error) {
        console.error('❌ Erro durante o reset:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Erro desconhecido ao resetar dados'
        };
    }
}
