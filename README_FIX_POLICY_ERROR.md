# Correção: Erro de Política Existente

Se você encontrou o erro `ERROR: 42710: policy "Allow read access to all users" for table "departments" already exists`, isso significa que a política já foi criada anteriormente.

O arquivo `migration_create_departments_table.sql` foi atualizado para corrigir isso, adicionando comandos para remover as políticas antigas antes de recriá-las.

## Instruções

1. Copie NOVAMENTE todo o conteúdo do arquivo `migration_create_departments_table.sql`.
2. Cole no editor SQL do Supabase.
3. Execute novamente.

Agora o script deve rodar sem erros.
