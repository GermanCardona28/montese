-- Móntese: esquema inicial de transporte público (área metropolitana de Bucaramanga)

create extension if not exists postgis;

create type tipo_empresa as enum ('masivo', 'colectivo', 'buseta');
create type sentido as enum ('ida', 'vuelta');
create type tipo_dia as enum ('lunes_viernes', 'sabado', 'domingo_festivo');
create type tipo_incidente as enum ('trancon', 'retraso', 'cierre_via', 'accidente', 'otro');

create table companies (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  tipo tipo_empresa not null,
  telefono text,
  sitio_web text,
  creado_en timestamptz not null default now()
);

create table routes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  color text,
  tarifa_cop integer,
  activa boolean not null default true,
  trazado geography(linestring, 4326),
  creado_en timestamptz not null default now(),
  unique (company_id, codigo)
);

create table stops (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  municipio text,
  ubicacion geography(point, 4326) not null
);
create index stops_ubicacion_idx on stops using gist (ubicacion);

create table route_stops (
  route_id uuid not null references routes(id) on delete cascade,
  stop_id uuid not null references stops(id) on delete cascade,
  sentido sentido not null,
  orden integer not null,
  primary key (route_id, sentido, orden)
);

create table schedules (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id) on delete cascade,
  sentido sentido not null,
  dia tipo_dia not null,
  primera_salida time not null,
  ultima_salida time not null,
  unique (route_id, sentido, dia)
);

create table frequencies (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id) on delete cascade,
  sentido sentido not null,
  dia tipo_dia not null,
  hora_inicio time not null,
  hora_fin time not null,
  minutos_entre_buses integer not null check (minutos_entre_buses > 0),
  es_hora_pico boolean not null default false
);

create table incidents (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references routes(id) on delete cascade,
  stop_id uuid references stops(id) on delete set null,
  tipo tipo_incidente not null,
  descripcion text,
  ubicacion geography(point, 4326),
  reportado_por uuid references auth.users(id) on delete set null,
  creado_en timestamptz not null default now(),
  expira_en timestamptz not null default now() + interval '2 hours'
);

-- Seguridad: datos de transporte públicos para lectura; incidentes los crean usuarios autenticados.
alter table companies enable row level security;
alter table routes enable row level security;
alter table stops enable row level security;
alter table route_stops enable row level security;
alter table schedules enable row level security;
alter table frequencies enable row level security;
alter table incidents enable row level security;

create policy "lectura publica" on companies for select using (true);
create policy "lectura publica" on routes for select using (true);
create policy "lectura publica" on stops for select using (true);
create policy "lectura publica" on route_stops for select using (true);
create policy "lectura publica" on schedules for select using (true);
create policy "lectura publica" on frequencies for select using (true);
create policy "lectura incidentes vigentes" on incidents for select using (expira_en > now());
create policy "usuarios reportan incidentes" on incidents for insert
  to authenticated with check (reportado_por = auth.uid());
