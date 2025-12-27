# 🖨️ Sistema de Impressão Térmica - MarketMaster AI

## 📋 Visão Geral

Sistema completo de impressão de cupons não fiscais para impressoras térmicas de 58mm e 80mm, com suporte a comandos ESC/POS padrão.

## ✨ Funcionalidades Implementadas

### ✅ Impressão de Cupons
- ✅ Cabeçalho com dados da loja (Nome, CNPJ, Endereço, Telefone)
- ✅ Identificação do cupom (ID, Data, Hora)
- ✅ Informações do operador e cliente
- ✅ Lista detalhada de itens com quantidade e valores
- ✅ Total da venda destacado
- ✅ Forma de pagamento
- ✅ Mensagem de rodapé personalizável
- ✅ Corte automático de papel

### ✅ Configurações da Loja
- ✅ Cadastro completo dos dados do estabelecimento
- ✅ Personalização da mensagem de rodapé
- ✅ Seleção de largura da impressora (58mm/80mm)
- ✅ Escolha do método de impressão
- ✅ Cupom de teste para validação
- ✅ Teste de abertura de gaveta

### ✅ Métodos de Impressão
- ✅ **Janela de Impressão**: Compatível com todos os navegadores
- ✅ **USB Serial (Web Serial API)**: Chrome/Edge, impressão direta

### ✅ Comandos ESC/POS
- ✅ Inicialização
- ✅ Alinhamento (esquerda, centro, direita)
- ✅ Negrito
- ✅ Tamanhos de fonte (normal, grande)
- ✅ Corte de papel
- ✅ Abertura de gaveta de dinheiro

## 📁 Arquivos Criados

```
marketmaster-ai/
├── src/
│   ├── utils/
│   │   └── thermalPrinter.ts          # Utilitário principal de impressão
│   └── hooks/
│       └── useThermalPrinter.ts       # Hook React para integração
├── components/
│   └── Settings.tsx                   # Tela de configurações
├── INTEGRACAO_IMPRESSAO.md           # Guia completo de integração
├── EXEMPLO_INTEGRACAO_POS.md         # Exemplos práticos
└── README_IMPRESSAO.md               # Este arquivo
```

## 🚀 Como Usar

### 1. Configuração Inicial

1. Acesse **Configurações** no menu lateral
2. Preencha os dados da sua loja:
   - Nome da Loja (obrigatório)
   - CNPJ
   - Endereço
   - Telefone
   - Mensagem de Rodapé

3. Configure a impressora:
   - Selecione a largura (58mm ou 80mm)
   - Escolha o método de impressão
   - Teste com o cupom de teste

4. Salve as configurações

### 2. Integração no POS

Siga as instruções em `INTEGRACAO_IMPRESSAO.md` para adicionar a funcionalidade de impressão ao PDV.

### 3. Teste

Use o botão **"Imprimir Cupom de Teste"** nas Configurações para validar:
- Formatação do cupom
- Dados da loja
- Largura correta
- Método de impressão

## 🔧 Requisitos Técnicos

### Navegadores Suportados

| Método | Chrome | Edge | Firefox | Safari |
|--------|--------|------|---------|--------|
| Janela de Impressão | ✅ | ✅ | ✅ | ✅ |
| USB Serial | ✅ | ✅ | ❌ | ❌ |

### Impressoras Compatíveis

Qualquer impressora térmica que suporte comandos ESC/POS:
- Bematech MP-4200 TH
- Elgin i9
- Epson TM-T20
- Daruma DR-800
- E muitas outras...

## 📊 Formato do Cupom

```
================================
        MEU MERCADO
    CNPJ: 12.345.678/0001-90
   Rua Exemplo, 123 - Centro
      Tel: (11) 98765-4321
================================
      CUPOM NAO FISCAL
================================
Data: 05/12/2024  Hora: 12:40
Cupom: A1B2C3D4
Operador: João Silva
Cliente: Maria Santos
================================
ITEM  DESCRICAO         QTD  VALOR
================================
001  Coca Cola 2L
     2,000 x R$ 9,00    R$ 18,00
002  Arroz 5kg Camil
     1,000 x R$ 24,90   R$ 24,90
003  Detergente Ype
     3,000 x R$ 2,99    R$ 8,97
================================
TOTAL:                  R$ 51,87
================================
Forma Pagto: Dinheiro
================================
  Obrigado pela preferencia!
       Volte sempre!
```

## 🎯 Casos de Uso

### Impressão Automática
```typescript
// Após finalizar venda
await printSaleReceipt(sale, 'Nome do Operador');
```

### Reimpressão de Cupom
```typescript
// Em relatórios ou histórico
<button onClick={() => printSaleReceipt(sale)}>
  Reimprimir
</button>
```

### Abertura de Gaveta
```typescript
// Ao receber pagamento em dinheiro
const drawerCommand = openCashDrawer();
await printViaWebSerial(drawerCommand);
```

## ⚙️ Configurações Avançadas

### Personalização da Mensagem de Rodapé

Suporta múltiplas linhas:
```
Obrigado pela preferencia!
Volte sempre!
Siga-nos no Instagram: @meumercado
```

### Ajuste de Largura

- **58mm (32 caracteres)**: Impressoras compactas
- **80mm (48 caracteres)**: Impressoras padrão (recomendado)

## 🐛 Solução de Problemas

### Impressora não imprime

**Problema**: Nada acontece ao clicar em imprimir

**Soluções**:
1. Verifique se a impressora está ligada
2. Confirme a conexão USB
3. Teste com o cupom de teste
4. Verifique o método de impressão selecionado

### Formatação incorreta

**Problema**: Texto cortado ou desalinhado

**Soluções**:
1. Verifique a largura configurada (58mm vs 80mm)
2. Teste com ambas as opções
3. Alguns modelos podem ter larguras diferentes

### Gaveta não abre

**Problema**: Comando não funciona

**Soluções**:
1. Use método USB Serial (não funciona com Janela de Impressão)
2. Verifique se a gaveta está conectada à impressora
3. Teste com o botão específico nas Configurações
4. Confirme que a impressora suporta o comando

### Erro de permissão (USB Serial)

**Problema**: "Acesso negado" ou similar

**Soluções**:
1. Permita o acesso quando o navegador solicitar
2. Verifique as configurações de segurança do navegador
3. Tente desconectar e reconectar a impressora

## 🔮 Próximas Funcionalidades

- [ ] Impressão de 2 vias (cliente + estabelecimento)
- [ ] QR Code no cupom para consulta online
- [ ] Impressão de relatórios de fechamento
- [ ] Suporte para impressoras de etiquetas
- [ ] Logo da loja no cabeçalho
- [ ] Código de barras do cupom
- [ ] Impressão de comprovante de fiado

## 📝 Notas Importantes

1. **Cupom Não Fiscal**: Este sistema gera cupons não fiscais. Para emissão de documentos fiscais (NFC-e, SAT), é necessário integração com sistema fiscal homologado.

2. **Armazenamento Local**: As configurações são salvas no localStorage do navegador. Faça backup regularmente.

3. **Segurança**: Não armazene dados sensíveis nas mensagens de rodapé.

4. **Performance**: A impressão não bloqueia a interface. Vendas são registradas mesmo se a impressão falhar.

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte `INTEGRACAO_IMPRESSAO.md` para guia completo
2. Veja `EXEMPLO_INTEGRACAO_POS.md` para exemplos práticos
3. Teste sempre com o cupom de teste antes de usar em produção

---

**Desenvolvido para MarketMaster AI** 🚀
Sistema de Gestão Comercial Inteligente
