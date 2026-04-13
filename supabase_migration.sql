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

-- =============================================
-- 4. FUNÇÃO ADMIN COM AUTO-SYNC (SECURITY DEFINER)
-- Detecta auth.users sem profile, cria os que faltam,
-- depois devolve TODOS — nunca mais falta nenhum
-- =============================================
create or replace function public.get_all_profiles()
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Auto-sync: criar perfil para qualquer auth.user sem linha em profiles
  insert into public.profiles (
    id, email, full_name, status, role, entity_type,
    isapproved, balance, linked_accounts, country
  )
  select
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'Utilizador'),
    'offline',
    coalesce(u.raw_user_meta_data->>'role', 'comprador'),
    coalesce(u.raw_user_meta_data->>'entity_type', 'individual'),
    false,
    0,
    '[]'::jsonb,
    coalesce(u.raw_user_meta_data->>'country', 'Moçambique')
  from auth.users u
  left join public.profiles p on p.id = u.id
  where p.id is null
  on conflict (id) do nothing;

  -- Devolver TODOS os perfis ordenados por data de criação
  return query select * from public.profiles order by created_at desc;
end;
$$;

-- Permitir que utilizadores autenticados chamem esta função
grant execute on function public.get_all_profiles() to authenticated;

-- =============================================
-- 4b. FUNÇÃO APROVAR UTILIZADOR (SECURITY DEFINER)
-- O RLS blocks updates entre users — isto contorna
-- =============================================
create or replace function public.approve_profile(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set isapproved = true, status = 'active'
  where id = target_user_id;
end;
$$;

grant execute on function public.approve_profile(uuid) to authenticated;

-- =============================================
-- 5. REALTIME — activar para profiles e products
-- =============================================
alter table public.profiles replica identity full;
alter table public.products replica identity full;

do $$
begin
  begin alter publication supabase_realtime add table public.profiles; exception when others then null; end;
  begin alter publication supabase_realtime add table public.products; exception when others then null; end;
end $$;
