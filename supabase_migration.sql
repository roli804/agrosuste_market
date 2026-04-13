-- =============================================
-- AgroSuste — Script Final Completo
-- Colunas reais: posto_administrativo, localidade_bairro, isapproved
-- Execute no Supabase > SQL Editor
-- =============================================

-- =============================================
-- 1. PERMISSÕES BASE (GRANTS) — CRÍTICO
-- =============================================
grant usage on schema public to anon, authenticated;

-- Anónimo pode SELECT apenas (para parceiros na home)
grant select on public.profiles to anon;

-- Autenticado tem acesso completo às suas tabelas
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.products to authenticated;
grant select on public.products to anon;
grant select, insert, update on public.orders to authenticated;
grant select, insert on public.delivery_requests to authenticated;
grant select, insert on public.activity_logs to authenticated;

-- =============================================
-- 2. TRIGGER CORRIGIDO (exception-safe)
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  begin
    insert into public.profiles (
      id, email, full_name, phone, country, role, entity_type, isapproved, status, balance, linked_accounts
    ) values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', 'Utilizador'),
      coalesce(new.raw_user_meta_data->>'phone', ''),
      coalesce(new.raw_user_meta_data->>'country', 'Moçambique'),
      coalesce(new.raw_user_meta_data->>'role', 'comprador'),
      coalesce(new.raw_user_meta_data->>'entity_type', 'individual'),
      false,
      'offline',
      0,
      '[]'::jsonb
    )
    on conflict (id) do update set
      full_name  = excluded.full_name,
      country    = excluded.country,
      role       = excluded.role;
  exception when others then
    raise warning '[AgroSuste] handle_new_user error: %', sqlerrm;
  end;
  return new;
end;
$$ language plpgsql security definer;

-- Recriar trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- 3. POLÍTICAS RLS — remover tudo antes de criar
-- =============================================
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies where tablename = 'profiles' and schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.profiles', pol.policyname);
  end loop;
end $$;

-- Anónimo pode ler parceiros estratégicos (home pública)
create policy "profiles_public_partners" on public.profiles
  for select to anon using (role = 'parceiro_estrategico');

-- Autenticado lê TODOS os perfis (admin dashboard funciona)
create policy "profiles_auth_select" on public.profiles
  for select to authenticated using (true);

-- Utilizador pode inserir o seu próprio perfil
create policy "profiles_self_insert" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- Utilizador pode actualizar o seu próprio perfil
create policy "profiles_self_update" on public.profiles
  for update to authenticated using (auth.uid() = id);
