import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Product, Sale, Transaction } from '../types';

// Helper to calculate basic stats
const getStatsString = (sales: Sale[], products: Product[], transactions: Transaction[]) => {
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalSalesCount = sales.length;
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  // Group sales by product to find top sellers
  const productSales: Record<string, number> = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      productSales[item.name] = (productSales[item.name] || 0) + item.qty;
    });
  });
  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, qty]) => `${name} (${qty})`)
    .join(', ');

  return `
    Total Revenue: R$ ${totalRevenue.toFixed(2)}
    Total Transactions: ${totalSalesCount}
    Low Stock Items: ${lowStockCount}
    Top Selling Products: ${topProducts}
  `;
};

export const generateBusinessInsight = async (
  sales: Sale[],
  products: Product[],
  transactions: Transaction[]
): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return "Chave de API do Gemini não configurada. Verifique o arquivo .env";
    }

    const ai = new GoogleGenAI({ apiKey });
    const dataContext = getStatsString(sales, products, transactions);

    const prompt = `
      Você é um consultor especialista em gestão de supermercados.
      Analise os seguintes dados resumidos da loja:
      ${dataContext}

      Forneça um insight estratégico curto (máximo 3 frases) em Português do Brasil.
      Foque em sugestões para aumentar o lucro ou melhorar o estoque.
      Use emojis para tornar a leitura agradável.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao conectar com a IA. Verifique sua conexão.";
  }
};
