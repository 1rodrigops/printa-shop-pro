/*
  # Corrigir Recursão Infinita nas Políticas RLS de user_roles
  
  1. Problema
    - A política "SuperAdmin pode gerenciar todos os roles" causa recursão infinita
    - Ela verifica user_roles para ver se o usuário é superadmin
    - Mas para ler user_roles, precisa passar pela mesma política
  
  2. Solução
    - Remover a política problemática do SuperAdmin
    - Manter apenas a política simples que permite usuários verem suas próprias roles
    - SuperAdmins conseguirão ver suas próprias roles através da política básica
    - Para operações administrativas, usaremos service role ou edge functions
  
  3. Segurança
    - Usuários autenticados podem ler APENAS suas próprias roles
    - Nenhum usuário pode inserir, atualizar ou deletar roles (apenas via service role)
*/

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "SuperAdmin pode gerenciar todos os roles" ON user_roles;
DROP POLICY IF EXISTS "Usuários podem ver próprios roles" ON user_roles;

-- Criar política simples e sem recursão para leitura
CREATE POLICY "Usuários podem ver apenas suas próprias roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Não criar políticas para INSERT, UPDATE ou DELETE
-- Essas operações devem ser feitas via service role ou edge functions
