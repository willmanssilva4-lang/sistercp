/**
 * Utilitários para gerenciamento de estoque usando método PEPS (Primeiro que Entra, Primeiro que Sai)
 * FIFO - First In, First Out
 */

import { StockBatch } from '../../types';
import { supabase } from '../../lib/supabaseClient';

/**
 * Cria um novo lote de estoque quando uma compra é registrada
 */
export async function createStockBatch(
    productId: string,
    transactionId: string,
    qty: number,
    costPrice: number,
    purchaseDate: string,
    expiryDate?: string
): Promise<StockBatch | null> {
    console.log('🔵 Criando lote PEPS:', { productId, transactionId, qty, costPrice, purchaseDate, expiryDate });

    const batch = {
        product_id: productId,
        transaction_id: transactionId,
        qty_original: qty,
        qty_remaining: qty,
        cost_price: costPrice,
        purchase_date: purchaseDate,
        expiry_date: expiryDate || null
    };

    const { data, error } = await supabase
        .from('stock_batches')
        .insert([batch])
        .select()
        .single();

    if (error) {
        console.error('❌ Erro ao criar lote PEPS:', error);
        return null;
    }

    console.log('✅ Lote PEPS criado com sucesso:', data);

    return {
        id: data.id,
        productId: data.product_id,
        transactionId: data.transaction_id,
        qtyOriginal: Number(data.qty_original),
        qtyRemaining: Number(data.qty_remaining),
        costPrice: Number(data.cost_price),
        purchaseDate: data.purchase_date,
        expiryDate: data.expiry_date
    };
}

/**
 * Consome quantidade de um produto seguindo o método PEPS
 * Retorna o custo médio ponderado dos itens consumidos
 */
export async function consumeStockPEPS(
    productId: string,
    qtyToConsume: number
): Promise<{ success: boolean; averageCost: number; batches: StockBatch[] }> {
    // Buscar lotes disponíveis ordenados por data de compra (PEPS)
    const { data: batchesData, error } = await supabase
        .from('stock_batches')
        .select('*')
        .eq('product_id', productId)
        .gt('qty_remaining', 0)
        .order('purchase_date', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Erro ao buscar lotes:', error);
        return { success: false, averageCost: 0, batches: [] };
    }

    if (!batchesData || batchesData.length === 0) {
        console.warn('Nenhum lote disponível para o produto');
        return { success: false, averageCost: 0, batches: [] };
    }

    // Mapear dados do banco para interface
    const batches: StockBatch[] = batchesData.map(b => ({
        id: b.id,
        productId: b.product_id,
        transactionId: b.transaction_id,
        qtyOriginal: Number(b.qty_original),
        qtyRemaining: Number(b.qty_remaining),
        costPrice: Number(b.cost_price),
        purchaseDate: b.purchase_date,
        expiryDate: b.expiry_date
    }));

    let remainingToConsume = qtyToConsume;
    let totalCost = 0;
    const consumedBatches: StockBatch[] = [];

    // Consumir lotes seguindo PEPS
    for (const batch of batches) {
        if (remainingToConsume <= 0) break;

        const qtyFromThisBatch = Math.min(batch.qtyRemaining, remainingToConsume);
        const newRemaining = batch.qtyRemaining - qtyFromThisBatch;

        // Atualizar lote no banco
        await supabase
            .from('stock_batches')
            .update({ qty_remaining: newRemaining })
            .eq('id', batch.id);

        // Calcular custo
        totalCost += qtyFromThisBatch * batch.costPrice;
        remainingToConsume -= qtyFromThisBatch;

        consumedBatches.push({
            ...batch,
            qtyRemaining: newRemaining
        });
    }

    const averageCost = qtyToConsume > 0 ? totalCost / qtyToConsume : 0;

    return {
        success: remainingToConsume <= 0,
        averageCost,
        batches: consumedBatches
    };
}

/**
 * Restaura quantidade em lotes (usado em cancelamentos/devoluções)
 * Restaura nos lotes mais recentes primeiro (inverso do PEPS)
 */
export async function restoreStockPEPS(
    productId: string,
    qtyToRestore: number
): Promise<boolean> {
    // Buscar lotes ordenados por data de compra (mais recentes primeiro para restauração)
    const { data: batchesData, error } = await supabase
        .from('stock_batches')
        .select('*')
        .eq('product_id', productId)
        .order('purchase_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar lotes para restauração:', error);
        return false;
    }

    if (!batchesData || batchesData.length === 0) {
        console.warn('Nenhum lote encontrado para restauração');
        return false;
    }

    let remainingToRestore = qtyToRestore;

    // Restaurar nos lotes mais recentes primeiro
    for (const batch of batchesData) {
        if (remainingToRestore <= 0) break;

        const qtyOriginal = Number(batch.qty_original);
        const qtyRemaining = Number(batch.qty_remaining);
        const maxCanRestore = qtyOriginal - qtyRemaining;

        if (maxCanRestore > 0) {
            const qtyToRestoreInBatch = Math.min(maxCanRestore, remainingToRestore);
            const newRemaining = qtyRemaining + qtyToRestoreInBatch;

            await supabase
                .from('stock_batches')
                .update({ qty_remaining: newRemaining })
                .eq('id', batch.id);

            remainingToRestore -= qtyToRestoreInBatch;
        }
    }

    return remainingToRestore <= 0;
}

/**
 * Busca todos os lotes de um produto
 */
export async function getProductBatches(productId: string): Promise<StockBatch[]> {
    console.log('🔍 Buscando lotes para produto:', productId);

    const { data, error } = await supabase
        .from('stock_batches')
        .select('*')
        .eq('product_id', productId)
        .order('purchase_date', { ascending: true });

    if (error) {
        console.error('❌ Erro ao buscar lotes:', error);
        return [];
    }

    console.log('📦 Lotes encontrados para produto', productId, ':', data?.length || 0, data);

    return (data || []).map(b => ({
        id: b.id,
        productId: b.product_id,
        transactionId: b.transaction_id,
        qtyOriginal: Number(b.qty_original),
        qtyRemaining: Number(b.qty_remaining),
        costPrice: Number(b.cost_price),
        purchaseDate: b.purchase_date,
        expiryDate: b.expiry_date
    }));
}

/**
 * Calcula o custo médio ponderado atual do estoque de um produto
 */
export async function getAverageCost(productId: string): Promise<number> {
    const batches = await getProductBatches(productId);

    if (batches.length === 0) return 0;

    let totalQty = 0;
    let totalCost = 0;

    batches.forEach(batch => {
        totalQty += batch.qtyRemaining;
        totalCost += batch.qtyRemaining * batch.costPrice;
    });

    return totalQty > 0 ? totalCost / totalQty : 0;
}

/**
 * Calcula o valor total do estoque (custo) baseado nos lotes PEPS
 * Para produtos sem lotes PEPS, usa o costPrice do produto como fallback
 * @param products Lista de produtos para fallback
 */
export async function getTotalStockValue(products: Array<{ id: string; stock: number; costPrice: number }>): Promise<number> {
    // 1. Buscar todos os lotes PEPS com estoque
    const { data: batchesData, error } = await supabase
        .from('stock_batches')
        .select('product_id, qty_remaining, cost_price')
        .gt('qty_remaining', 0);

    if (error) {
        console.error('Erro ao calcular valor total do estoque:', error);
        return 0;
    }

    // 2. Calcular valor dos lotes PEPS e rastrear produtos com lotes
    const productsWithBatches = new Set<string>();
    let totalValueFromBatches = 0;

    if (batchesData && batchesData.length > 0) {
        batchesData.forEach(batch => {
            productsWithBatches.add(batch.product_id);
            totalValueFromBatches += Number(batch.qty_remaining) * Number(batch.cost_price);
        });
    }

    // 3. Para produtos SEM lotes PEPS, usar stock × costPrice como fallback
    let totalValueFromFallback = 0;
    products.forEach(product => {
        if (!productsWithBatches.has(product.id) && product.stock > 0) {
            totalValueFromFallback += product.stock * product.costPrice;
        }
    });

    const totalValue = totalValueFromBatches + totalValueFromFallback;

    console.log('📊 Valor do Estoque:', {
        comLotesPEPS: totalValueFromBatches.toFixed(2),
        semLotesPEPS: totalValueFromFallback.toFixed(2),
        total: totalValue.toFixed(2)
    });

    return totalValue;
}
