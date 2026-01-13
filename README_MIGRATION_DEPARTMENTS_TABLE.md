# Migração: Adicionar Tabela de Departamentos

Para que a nova funcionalidade de "Departamentos" funcione corretamente nos Cadastros Auxiliares, é necessário criar a tabela `departments` no Supabase.

## Instruções

1. Acesse o painel do seu projeto no Supabase.
2. Vá para o **SQL Editor**.
3. Copie o conteúdo do arquivo `migration_create_departments_table.sql` localizado na raiz do projeto.
4. Cole no editor SQL do Supabase e clique em **Run**.

Isso criará a tabela `departments` e inserirá valores padrão.

## O que mudou?

- O arquivo `Inventory.tsx` foi atualizado para incluir a aba "Departamentos" no modal de Cadastros Auxiliares.
- O campo "Departamento" no formulário de produto agora é uma lista de seleção (dropdown) alimentada por essa nova tabela.
