create extension if not exists pgcrypto;

create table if not exists public.tutores (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nome_completo text not null check (length(trim(nome_completo)) > 1),
  cpf text not null,
  telefone text not null,
  email text,
  endereco text,
  criado_em timestamptz not null default now(),
  unique (usuario_id, cpf),
  unique (id, usuario_id)
);

create table if not exists public.animais (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tutor_id uuid not null references public.tutores(id) on delete restrict,
  nome text not null,
  especie text not null check (especie in ('cachorro','gato','ave','reptil','outros')),
  raca text,
  sexo text check (sexo in ('macho','femea','desconhecido')),
  data_nascimento date,
  peso numeric(7,2) check (peso is null or peso > 0),
  cor text,
  observacoes text,
  criado_em timestamptz not null default now(),
  constraint animais_tutor_usuario_fk foreign key (tutor_id, usuario_id)
    references public.tutores(id, usuario_id) on delete restrict,
  unique (id, usuario_id)
);

create table if not exists public.consultas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  animal_id uuid not null,
  veterinario text not null,
  data_consulta date not null,
  horario time not null,
  tipo text not null check (tipo in ('consulta de rotina','vacinação','emergência','retorno','exames','cirurgia')),
  sintomas text,
  diagnostico text,
  tratamento text,
  observacoes text,
  status text not null default 'agendada' check (status in ('agendada','em andamento','concluída','cancelada')),
  criado_em timestamptz not null default now(),
  constraint consultas_animal_usuario_fk foreign key (animal_id, usuario_id)
    references public.animais(id, usuario_id) on delete restrict
);

create index if not exists tutores_usuario_criado_idx on public.tutores(usuario_id, criado_em desc);
create index if not exists animais_usuario_criado_idx on public.animais(usuario_id, criado_em desc);
create index if not exists consultas_usuario_data_idx on public.consultas(usuario_id, data_consulta, horario);

alter table public.tutores enable row level security;
alter table public.animais enable row level security;
alter table public.consultas enable row level security;

drop policy if exists tutores_select_own on public.tutores;
create policy tutores_select_own on public.tutores for select to authenticated using (usuario_id = (select auth.uid()));
drop policy if exists tutores_insert_own on public.tutores;
create policy tutores_insert_own on public.tutores for insert to authenticated with check (usuario_id = (select auth.uid()));
drop policy if exists tutores_update_own on public.tutores;
create policy tutores_update_own on public.tutores for update to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
drop policy if exists tutores_delete_own on public.tutores;
create policy tutores_delete_own on public.tutores for delete to authenticated using (usuario_id = (select auth.uid()));

drop policy if exists animais_select_own on public.animais;
create policy animais_select_own on public.animais for select to authenticated using (usuario_id = (select auth.uid()));
drop policy if exists animais_insert_own on public.animais;
create policy animais_insert_own on public.animais for insert to authenticated with check (usuario_id = (select auth.uid()));
drop policy if exists animais_update_own on public.animais;
create policy animais_update_own on public.animais for update to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
drop policy if exists animais_delete_own on public.animais;
create policy animais_delete_own on public.animais for delete to authenticated using (usuario_id = (select auth.uid()));

drop policy if exists consultas_select_own on public.consultas;
create policy consultas_select_own on public.consultas for select to authenticated using (usuario_id = (select auth.uid()));
drop policy if exists consultas_insert_own on public.consultas;
create policy consultas_insert_own on public.consultas for insert to authenticated with check (usuario_id = (select auth.uid()));
drop policy if exists consultas_update_own on public.consultas;
create policy consultas_update_own on public.consultas for update to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
drop policy if exists consultas_delete_own on public.consultas;
create policy consultas_delete_own on public.consultas for delete to authenticated using (usuario_id = (select auth.uid()));




grant select, insert, update, delete on public.tutores to authenticated;
grant select, insert, update, delete on public.animais to authenticated;
grant select, insert, update, delete on public.consultas to authenticated;
