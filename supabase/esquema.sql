-- Greentech · Portal del equipo técnico
-- Esquema de la base de datos en Supabase. Se ejecuta una sola vez en
-- Supabase → SQL Editor. Se puede volver a ejecutar sin perder datos.

-- Perfil de cada persona del equipo y su rol:
--   admin    ve y edita todo, y da permisos a los demás
--   editor   ve y edita registros
--   lector   solo consulta
--   pendiente  cuenta creada, sin acceso hasta que un admin la habilite
create table if not exists public.perfiles (
  user_id uuid primary key references auth.users on delete cascade,
  email   text,
  nombre  text,
  rol     text not null default 'pendiente'
          check (rol in ('admin', 'editor', 'lector', 'pendiente')),
  creado  timestamptz not null default now()
);

-- Todos los registros del portal. "coleccion" es la sección
-- (productos, proveedores, cotizaciones, instalaciones, eventos, pqr,
-- aliados, config) y "datos" guarda los campos del formulario.
create table if not exists public.registros (
  coleccion   text not null,
  id          text not null,
  datos       jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now(),
  autor       uuid default auth.uid(),
  primary key (coleccion, id)
);

-- Rol de quien hace la consulta (security definer para que las
-- políticas puedan leer perfiles sin recursión).
create or replace function public.mi_rol() returns text
language sql stable security definer set search_path = public as $$
  select rol from public.perfiles where user_id = auth.uid()
$$;

-- Cada cuenta nueva (creada o invitada desde Supabase) recibe un perfil
-- pendiente. El primer usuario que exista queda como admin.
create or replace function public.nuevo_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (user_id, email, rol)
  values (new.id, new.email,
          case when exists (select 1 from public.perfiles) then 'pendiente' else 'admin' end)
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario after insert on auth.users
  for each row execute function public.nuevo_perfil();

-- Perfiles de cuentas que ya existían antes de crear el trigger.
insert into public.perfiles (user_id, email, rol)
select u.id, u.email, 'pendiente' from auth.users u
on conflict (user_id) do nothing;

-- ---------- Seguridad por filas ----------
alter table public.perfiles  enable row level security;
alter table public.registros enable row level security;

drop policy if exists "ver mi perfil o todos si admin" on public.perfiles;
create policy "ver mi perfil o todos si admin" on public.perfiles
  for select to authenticated
  using (user_id = auth.uid() or public.mi_rol() = 'admin');

drop policy if exists "admin cambia perfiles" on public.perfiles;
create policy "admin cambia perfiles" on public.perfiles
  for update to authenticated
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');

drop policy if exists "equipo lee" on public.registros;
create policy "equipo lee" on public.registros
  for select to authenticated
  using (public.mi_rol() in ('admin', 'editor', 'lector'));

drop policy if exists "editores crean" on public.registros;
create policy "editores crean" on public.registros
  for insert to authenticated
  with check (public.mi_rol() in ('admin', 'editor'));

drop policy if exists "editores cambian" on public.registros;
create policy "editores cambian" on public.registros
  for update to authenticated
  using (public.mi_rol() in ('admin', 'editor'))
  with check (public.mi_rol() in ('admin', 'editor'));

drop policy if exists "editores borran" on public.registros;
create policy "editores borran" on public.registros
  for delete to authenticated
  using (public.mi_rol() in ('admin', 'editor'));

-- Nadie sin sesión puede leer ni escribir nada.
revoke all on public.registros, public.perfiles from anon;

-- Cambios en vivo: lo que guarda un técnico aparece al instante a los demás.
do $$ begin
  alter publication supabase_realtime add table public.registros;
exception when duplicate_object then null; end $$;
