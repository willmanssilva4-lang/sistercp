# Migração para Cadastros Auxiliares no Supabase

Para que os Cadastros Auxiliares (Categorias, Subcategorias, Marcas, Terminais) sejam salvos corretamente no Supabase, é necessário criar as tabelas no banco de dados.

## Instruções

1. Acesse o painel do seu projeto no Supabase.
2. Vá para o **SQL Editor**.
3. Copie o conteúdo do arquivo `migration_auxiliary_tables.sql` localizado na raiz do projeto.
4. Cole no editor SQL do Supabase e clique em **Run**.

Isso criará as tabelas necessárias e inserirá os valores padrão.

## O que mudou?

- O arquivo `Inventory.tsx` foi atualizado para ler e gravar nessas novas tabelas em vez de usar o `localStorage`.
- Os fornecedores agora são sincronizados com o módulo de Pessoas (tabela `suppliers`), garantindo consistência em todo o sistema.
