// Utilitário para impressão em impressoras térmicas (58mm/80mm)
// Suporta ESC/POS commands para impressoras térmicas padrão

export interface StoreSettings {
    name: string;
    cnpj?: string;
    address?: string;
    phone?: string;
    footerMessage?: string;
}

export interface ReceiptItem {
    name: string;
    qty: number;
    price: number;
    total: number;
}

export interface ReceiptData {
    id: string;
    timestamp: string;
    items: ReceiptItem[];
    subtotal: number;
    discount?: number;
    total: number;
    paymentMethod: string;
    cashierName?: string;
    customerName?: string;
}

// Comandos ESC/POS básicos
const ESC = '\x1B';
const GS = '\x1D';

const COMMANDS = {
    INIT: ESC + '@',
    ALIGN_CENTER: ESC + 'a' + '1',
    ALIGN_LEFT: ESC + 'a' + '0',
    ALIGN_RIGHT: ESC + 'a' + '2',
    BOLD_ON: ESC + 'E' + '1',
    BOLD_OFF: ESC + 'E' + '0',
    FONT_LARGE: GS + '!' + '\x11',
    FONT_NORMAL: GS + '!' + '\x00',
    CUT: GS + 'V' + '1',
    FEED: ESC + 'd' + '3',
    DRAWER_OPEN: ESC + 'p' + '0' + '\x19' + '\xFA'
};

/**
 * Formata uma linha de texto para caber na largura da impressora
 */
function formatLine(text: string, width: number = 32): string {
    if (text.length > width) {
        return text.substring(0, width);
    }
    return text.padEnd(width, ' ');
}

/**
 * Formata uma linha com texto à esquerda e valor à direita
 */
function formatItemLine(left: string, right: string, width: number = 32): string {
    const maxLeft = width - right.length - 1;
    const leftTrimmed = left.length > maxLeft ? left.substring(0, maxLeft) : left;
    const spaces = width - leftTrimmed.length - right.length;
    return leftTrimmed + ' '.repeat(spaces) + right;
}

/**
 * Gera linha separadora
 */
function separator(width: number = 32, char: string = '-'): string {
    return char.repeat(width);
}

/**
 * Gera o conteúdo do recibo em formato ESC/POS
 */
export function generateReceipt(
    receiptData: ReceiptData,
    storeSettings: StoreSettings,
    printerWidth: 32 | 48 = 32
): string {
    let receipt = '';

    // Inicializar impressora
    receipt += COMMANDS.INIT;

    // Cabeçalho - Nome da Loja
    receipt += COMMANDS.ALIGN_CENTER;
    receipt += COMMANDS.FONT_LARGE;
    receipt += COMMANDS.BOLD_ON;
    receipt += formatLine(storeSettings.name, printerWidth) + '\n';
    receipt += COMMANDS.FONT_NORMAL;
    receipt += COMMANDS.BOLD_OFF;

    // Dados da loja
    if (storeSettings.cnpj) {
        receipt += formatLine(`CNPJ: ${storeSettings.cnpj}`, printerWidth) + '\n';
    }
    if (storeSettings.address) {
        receipt += formatLine(storeSettings.address, printerWidth) + '\n';
    }
    if (storeSettings.phone) {
        receipt += formatLine(`Tel: ${storeSettings.phone}`, printerWidth) + '\n';
    }

    receipt += COMMANDS.ALIGN_LEFT;
    receipt += separator(printerWidth) + '\n';

    // Cupom Não Fiscal
    receipt += COMMANDS.ALIGN_CENTER;
    receipt += COMMANDS.BOLD_ON;
    receipt += formatLine('CUPOM NAO FISCAL', printerWidth) + '\n';
    receipt += COMMANDS.BOLD_OFF;
    receipt += COMMANDS.ALIGN_LEFT;
    receipt += separator(printerWidth) + '\n';

    // Data e Hora
    const dateTime = new Date(receiptData.timestamp);
    const dateStr = dateTime.toLocaleDateString('pt-BR');
    const timeStr = dateTime.toLocaleTimeString('pt-BR');
    receipt += formatLine(`Data: ${dateStr}  Hora: ${timeStr}`, printerWidth) + '\n';
    receipt += formatLine(`Cupom: ${receiptData.id.substring(0, 8).toUpperCase()}`, printerWidth) + '\n';

    if (receiptData.cashierName) {
        receipt += formatLine(`Operador: ${receiptData.cashierName}`, printerWidth) + '\n';
    }

    if (receiptData.customerName) {
        receipt += formatLine(`Cliente: ${receiptData.customerName}`, printerWidth) + '\n';
    }

    receipt += separator(printerWidth) + '\n';

    // Itens
    receipt += COMMANDS.BOLD_ON;
    receipt += formatLine('ITEM  DESCRICAO         QTD  VALOR', printerWidth) + '\n';
    receipt += COMMANDS.BOLD_OFF;
    receipt += separator(printerWidth) + '\n';

    receiptData.items.forEach((item, index) => {
        const itemNum = String(index + 1).padStart(3, '0');
        receipt += formatLine(`${itemNum}  ${item.name}`, printerWidth) + '\n';

        const qtyStr = `${item.qty.toFixed(3).replace('.', ',')} x`;
        const priceStr = `R$ ${item.price.toFixed(2).replace('.', ',')}`;
        const totalStr = `R$ ${item.total.toFixed(2).replace('.', ',')}`;

        receipt += formatItemLine(`     ${qtyStr} ${priceStr}`, totalStr, printerWidth) + '\n';
    });

    receipt += separator(printerWidth) + '\n';

    // Totais
    receipt += COMMANDS.FONT_LARGE;
    receipt += COMMANDS.BOLD_ON;
    receipt += formatItemLine('TOTAL:', `R$ ${receiptData.total.toFixed(2).replace('.', ',')}`, printerWidth) + '\n';
    receipt += COMMANDS.FONT_NORMAL;
    receipt += COMMANDS.BOLD_OFF;

    receipt += separator(printerWidth) + '\n';

    // Forma de Pagamento
    const paymentMethodMap: Record<string, string> = {
        'CASH': 'Dinheiro',
        'CREDIT': 'Cartao Credito',
        'DEBIT': 'Cartao Debito',
        'PIX': 'PIX',
        'FIADO': 'Fiado'
    };

    const paymentLabel = paymentMethodMap[receiptData.paymentMethod] || receiptData.paymentMethod;
    receipt += formatLine(`Forma Pagto: ${paymentLabel}`, printerWidth) + '\n';

    receipt += separator(printerWidth) + '\n';

    // Rodapé
    if (storeSettings.footerMessage) {
        receipt += COMMANDS.ALIGN_CENTER;
        const footerLines = storeSettings.footerMessage.split('\n');
        footerLines.forEach(line => {
            receipt += formatLine(line, printerWidth) + '\n';
        });
        receipt += COMMANDS.ALIGN_LEFT;
    }

    receipt += COMMANDS.ALIGN_CENTER;
    receipt += formatLine('Obrigado pela preferencia!', printerWidth) + '\n';
    receipt += formatLine('Volte sempre!', printerWidth) + '\n';

    // Alimentar papel e cortar
    receipt += COMMANDS.FEED;
    receipt += COMMANDS.CUT;

    return receipt;
}

/**
 * Envia comando para abrir gaveta de dinheiro
 */
export function openCashDrawer(): string {
    return COMMANDS.INIT + COMMANDS.DRAWER_OPEN;
}

/**
 * Imprime via Web Serial API (Chrome/Edge)
 */
export async function printViaWebSerial(content: string): Promise<void> {
    if (!('serial' in navigator)) {
        throw new Error('Web Serial API não suportada neste navegador. Use Chrome ou Edge.');
    }

    try {
        // @ts-ignore - Web Serial API
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });

        const writer = port.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(content));
        writer.releaseLock();

        await port.close();
    } catch (error) {
        console.error('Erro ao imprimir:', error);
        throw new Error('Falha ao conectar com a impressora');
    }
}

/**
 * Imprime via janela de impressão do navegador (fallback)
 */
export function printViaWindow(content: string, storeSettings: StoreSettings): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        throw new Error('Não foi possível abrir janela de impressão');
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Cupom - ${storeSettings.name}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          margin: 0;
          padding: 10px;
          width: 80mm;
        }
        pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
      </style>
    </head>
    <body>
      <pre>${content.replace(/\x1B\[[0-9;]*m/g, '').replace(/[\x00-\x1F\x7F]/g, '')}</pre>
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 100);
        };
      </script>
    </body>
    </html>
  `;

    printWindow.document.write(html);
    printWindow.document.close();
}
