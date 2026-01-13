# Migração: Adicionar campo Departamento aos Produtos

Para que o novo campo "Departamento" funcione corretamente, é necessário adicionar a coluna correspondente na tabela de produtos do Supabase.

## Instruções

1. Acesse o painel do seu projeto no Supabase.
2. Vá para o **SQL Editor**.
3. Copie o conteúdo do arquivo `migration_add_department_to_products.sql` localizado na raiz do projeto.
4. Cole no editor SQL do Supabase e clique em **Run**.

Isso adicionará a coluna `department` à tabela `products`.

## O que mudou?

- O arquivo `types.ts` foi atualizado para incluir o campo `department` na interface `Product`.
- O arquivo `Inventory.tsx` foi atualizado para incluir o campo "Departamento" no formulário de Novo/Editar Produto.
