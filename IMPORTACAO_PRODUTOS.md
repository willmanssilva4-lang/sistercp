# Importação de Produtos - MarketMaster AI

## Como Usar a Funcionalidade de Importação

A funcionalidade de importação permite cadastrar múltiplos produtos de uma só vez usando um arquivo CSV.

### Passo a Passo

1. **Acesse o módulo de Estoque**
   - No menu lateral, clique em "Produtos & Estoque"

2. **Clique no botão "Importar Produtos"**
   - Localizado na barra superior, ao lado do botão "Novo Produto"

3. **Baixe o modelo CSV**
   - Clique em "Baixar Modelo" para obter um arquivo de exemplo
   - O modelo já vem com exemplos de produtos preenchidos

4. **Prepare seu arquivo CSV**
   - Edite o arquivo no Excel, Google Sheets ou editor de texto
   - Mantenha a primeira linha (cabeçalho) intacta
   - Preencha os dados dos produtos nas linhas seguintes

5. **Faça o upload**
   - Clique em "Selecione o arquivo CSV"
   - Escolha seu arquivo preparado
   - O sistema irá validar e mostrar uma prévia

6. **Revise a prévia**
   - Verifique se os dados foram importados corretamente
   - Erros serão exibidos em vermelho, se houver

7. **Confirme a importação**
   - Clique em "Importar" para adicionar os produtos ao sistema

## Formato do Arquivo CSV

### Colunas Obrigatórias
- **codigo**: Código de barras ou identificador único do produto
- **nome**: Nome do produto
- **categoria**: Categoria do produto

### Colunas Opcionais
- **subcategoria**: Subcategoria do produto
- **marca**: Marca do produto
- **fornecedor**: Nome do fornecedor
- **unidade**: Unidade de medida (UN, KG, L, CX, PCT)
- **custo**: Preço de custo (use vírgula ou ponto para decimais)
- **venda**: Preço de venda no varejo
- **atacado**: Preço de venda no atacado
- **qtd_atacado**: Quantidade mínima para preço de atacado
- **estoque**: Quantidade em estoque
- **minimo**: Estoque mínimo
- **validade**: Data de validade (formato: AAAA-MM-DD)

### Exemplo de Arquivo CSV

```csv
codigo,nome,categoria,subcategoria,marca,fornecedor,unidade,custo,venda,atacado,qtd_atacado,estoque,minimo,validade
7891234567890,Coca Cola 2L,Bebidas,Refrigerantes,Coca-Cola,Coca-Cola FEMSA,UN,5.50,9.00,8.00,6,45,10,2025-12-01
7891234567891,Arroz 5kg,Mercearia,Grãos,Camil,Camil Alimentos,PCT,18.00,24.90,23.50,10,20,5,
7891234567892,Detergente Ypê,Limpeza,Lava Louças,Ypê,Química Amparo,UN,1.80,2.99,2.50,24,100,20,
```

## Dicas Importantes

1. **Separadores**: O sistema aceita vírgula (,) ou ponto-e-vírgula (;) como separador
2. **Encoding**: Salve o arquivo em UTF-8 para evitar problemas com acentuação
3. **Valores decimais**: Use vírgula ou ponto para separar decimais (ex: 5.50 ou 5,50)
4. **Campos vazios**: Campos opcionais podem ficar vazios, o sistema usará valores padrão
5. **Validação**: O sistema valida os dados antes de importar e mostra erros se houver

## Valores Padrão

Se algum campo opcional não for preenchido, o sistema usará:
- **unidade**: UN
- **custo**: 0
- **venda**: 0
- **atacado**: mesmo valor da venda
- **qtd_atacado**: 10
- **estoque**: 0
- **minimo**: 5

## Tratamento de Erros

O sistema validará:
- ✅ Presença dos campos obrigatórios (código, nome, categoria)
- ✅ Formato dos números
- ✅ Linhas com dados incompletos serão ignoradas
- ✅ Erros serão listados para correção

## Suporte

Se tiver dúvidas ou problemas com a importação:
1. Verifique se o arquivo está no formato CSV correto
2. Confirme que as colunas obrigatórias estão presentes
3. Baixe o modelo fornecido e use-o como base
