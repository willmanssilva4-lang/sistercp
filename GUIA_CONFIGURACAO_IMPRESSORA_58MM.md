# 🖨️ Guia de Configuração - Impressora 58mm (Bobina de Maquininha)

## 📌 O que você vai aprender

Este guia mostra como configurar o MarketMaster AI para imprimir cupons em **bobinas de maquininha de cartão (58mm)**.

---

## ✅ Passo a Passo

### 1️⃣ Acesse as Configurações

1. Abra o MarketMaster AI no navegador
2. No menu lateral, clique em **⚙️ Configurações**
3. Você verá a tela de configurações do sistema

### 2️⃣ Configure os Dados da Loja

Preencha as informações da sua loja (aparecerão no topo do cupom):

- **Nome da Loja** *(obrigatório)*: Ex: "Mercadinho São José"
- **CNPJ** *(opcional)*: Ex: "12.345.678/0001-90"
- **Telefone** *(opcional)*: Ex: "(11) 98765-4321"
- **Endereço** *(opcional)*: Ex: "Rua das Flores, 123 - Centro"
- **Mensagem de Rodapé** *(opcional)*: Ex: "Obrigado pela preferência!\nVolte sempre!"

### 3️⃣ Configure a Impressora para 58mm

Na seção **"Configurações de Impressão"**:

#### 📏 Largura da Impressora
Selecione: **✅ 58mm (32 caracteres)**

> ⚠️ **Importante**: Esta é a opção para bobinas de maquininha de cartão!

#### 🔌 Método de Impressão

Escolha um dos métodos:

**Opção 1: Janela de Impressão (Recomendado para iniciantes)**
- ✅ Funciona em qualquer navegador
- ✅ Mais fácil de configurar
- ❌ Não abre gaveta de dinheiro
- ❌ Requer configuração manual da impressora no Windows

**Opção 2: USB Serial (Avançado)**
- ✅ Impressão direta, sem janela
- ✅ Abre gaveta de dinheiro
- ✅ Mais rápido
- ❌ Só funciona no Chrome ou Edge
- ❌ Precisa permitir acesso USB

### 4️⃣ Salve as Configurações

1. Clique no botão verde **"Salvar Configurações"** no topo da página
2. Aguarde a mensagem de sucesso: ✅ "Configurações salvas com sucesso!"

### 5️⃣ Teste a Impressão

1. Clique no botão **"Imprimir Cupom de Teste"**
2. Verifique se o cupom está formatado corretamente
3. Confirme que todas as informações aparecem

---

## 🖨️ Como Ficará o Cupom (58mm)

```
================================
      MERCADINHO SÃO JOSÉ
  CNPJ: 12.345.678/0001-90
   Rua das Flores, 123 - Centro
     Tel: (11) 98765-4321
================================
      CUPOM NAO FISCAL
================================
Data: 05/12/2024  Hora: 14:30
Cupom: A1B2C3D4
Operador: João Silva
Cliente: Maria Santos
================================
ITEM  DESCRICAO       QTD  VALOR
================================
001  Coca Cola 2L
     2,000 x R$ 9,00  R$ 18,00
002  Arroz 5kg
     1,000 x R$ 24,90 R$ 24,90
================================
TOTAL:                R$ 42,90
================================
Forma Pagto: Dinheiro
================================
  Obrigado pela preferência!
       Volte sempre!
```

---

## 🔧 Configuração da Impressora no Windows

### Para Método "Janela de Impressão"

1. **Conecte a impressora** via USB
2. **Instale os drivers** do fabricante
3. **Configure o tamanho do papel**:
   - Abra: `Painel de Controle` → `Dispositivos e Impressoras`
   - Clique com botão direito na impressora → `Preferências de Impressão`
   - Configure:
     - **Tamanho do papel**: 58mm ou Custom (58mm x 297mm)
     - **Orientação**: Retrato
     - **Margens**: 0mm em todos os lados

### Para Método "USB Serial"

1. **Conecte a impressora** via USB
2. **Instale os drivers** do fabricante
3. **Use Chrome ou Edge**
4. Ao imprimir pela primeira vez:
   - O navegador pedirá permissão para acessar a porta USB
   - Selecione sua impressora na lista
   - Clique em **"Conectar"**

---

## ✅ Checklist de Configuração

- [ ] Dados da loja preenchidos
- [ ] Largura configurada para **58mm (32 caracteres)**
- [ ] Método de impressão escolhido
- [ ] Configurações salvas
- [ ] Cupom de teste impresso com sucesso
- [ ] Formatação do cupom está correta
- [ ] Todas as informações aparecem no cupom

---

## 🐛 Problemas Comuns

### ❌ Texto cortado ou desalinhado

**Solução**: 
- Verifique se selecionou **58mm (32 caracteres)**
- Confirme o tamanho do papel nas configurações da impressora

### ❌ Cupom muito largo

**Solução**: 
- Você pode estar usando **80mm (48 caracteres)**
- Mude para **58mm (32 caracteres)** nas Configurações

### ❌ Impressora não imprime

**Solução**:
1. Verifique se a impressora está ligada
2. Confirme a conexão USB
3. Teste com o cupom de teste
4. Reinstale os drivers da impressora

### ❌ "Acesso negado" (USB Serial)

**Solução**:
1. Use Chrome ou Edge
2. Permita o acesso quando solicitado
3. Tente desconectar e reconectar a impressora

---

## 📱 Impressoras Compatíveis (58mm)

Exemplos de impressoras térmicas de 58mm compatíveis:

- ✅ Bematech MP-2800 TH
- ✅ Elgin i7
- ✅ Epson TM-T20X
- ✅ Daruma DR-700
- ✅ Nitere NPOS-58
- ✅ E muitas outras com suporte ESC/POS

---

## 💡 Dicas Importantes

1. **Teste sempre** antes de usar em produção
2. **Mantenha papel suficiente** na bobina
3. **Limpe a cabeça de impressão** regularmente
4. **Faça backup** das configurações periodicamente
5. **Use bobinas de qualidade** para melhor resultado

---

## 🎯 Próximos Passos

Após configurar a impressora:

1. ✅ Vá para o **PDV (Ponto de Venda)**
2. ✅ Faça uma venda de teste
3. ✅ Finalize o pagamento
4. ✅ O cupom será impresso automaticamente!

---

## 📞 Precisa de Ajuda?

Consulte também:
- 📖 `README_IMPRESSAO.md` - Documentação completa
- 🔧 `INTEGRACAO_IMPRESSAO.md` - Guia técnico
- 💻 `EXEMPLO_INTEGRACAO_POS.md` - Exemplos de código

---

**MarketMaster AI** 🚀  
Sistema de Gestão Comercial Inteligente
