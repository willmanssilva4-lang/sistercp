-- Migration: Habilitar RLS na tabela users e configurar políticas de segurança
-- Data: 2025-12-07
-- Descrição: Resolve o aviso de segurança do Supabase sobre a tabela public.users ser pública

-- 1. Criar função auxiliar para obter o papel do usuário atual de forma segura
-- Esta função roda como 'SECURITY DEFINER' para evitar recursão infinita nas políticas RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- 2. Habilitar RLS na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Definir Políticas (Policies)

-- SELECT (Leitura)
-- Usuários podem ver seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Admins e Gerentes podem ver todos os perfis
CREATE POLICY "Admins e Gerentes podem ver todos os perfis" ON public.users
FOR SELECT
USING (
  get_current_user_role() IN ('ADMIN', 'MANAGER')
);

-- INSERT (Criação)
-- Admins e Gerentes podem criar novos usuários
CREATE POLICY "Admins e Gerentes podem criar usuários" ON public.users
FOR INSERT
WITH CHECK (
  get_current_user_role() IN ('ADMIN', 'MANAGER')
);

-- Usuários podem criar seu próprio perfil (Auto-cadastro / Primeiro login)
CREATE POLICY "Usuários podem criar seu próprio perfil" ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE (Atualização)
-- Admins e Gerentes podem atualizar usuários
CREATE POLICY "Admins e Gerentes podem atualizar usuários" ON public.users
FOR UPDATE
USING (
  get_current_user_role() IN ('ADMIN', 'MANAGER')
);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- DELETE (Exclusão)
-- Apenas Admins podem excluir usuários
CREATE POLICY "Apenas Admins podem excluir usuários" ON public.users
FOR DELETE
USING (
  get_current_user_role() = 'ADMIN'
);
