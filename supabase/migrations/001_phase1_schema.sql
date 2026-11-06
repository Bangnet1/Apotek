-- Mantri Gemoy | Tahap 1
-- Jalankan pada project Supabase KHUSUS Mantri Gemoy.
create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('owner','cashier','pharmacist');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'cashier',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  barcode text unique,
  name text not null,
  brand text,
  category_id uuid references public.categories(id) on delete set null,
  medicine_type text not null check (medicine_type in ('Obat Bebas','Obat Bebas Terbatas','Obat Keras','Suplemen','Alat Kesehatan','Produk Lain')),
  unit text not null,
  purchase_price numeric(14,2) not null default 0 check (purchase_price >= 0),
  selling_price numeric(14,2) not null default 0 check (selling_price >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  bpom_number text,
  requires_prescription boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  license_reference text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_batches (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  supplier_id uuid references public.suppliers(id),
  batch_number text not null,
  expiry_date date not null,
  quantity_received integer not null check (quantity_received >= 0),
  quantity_available integer not null check (quantity_available >= 0),
  purchase_price numeric(14,2) not null check (purchase_price >= 0),
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(product_id,batch_number)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  batch_id uuid references public.product_batches(id),
  movement_type text not null check (movement_type in ('opening','purchase','sale','sale_return','purchase_return','adjustment','expired','damage')),
  quantity_change integer not null,
  reference_id uuid,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_batches_expiry on public.product_batches(expiry_date);
create index if not exists idx_batches_product on public.product_batches(product_id);
create index if not exists idx_products_name on public.products(name);
create index if not exists idx_stock_movements_product on public.stock_movements(product_id,created_at desc);

-- Private helper avoids recursive RLS evaluation on profiles.
-- It is SECURITY DEFINER only for this narrowly scoped role lookup,
-- checks auth.uid() internally, and is not placed in the exposed public schema.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.has_any_role(allowed public.app_role[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
     and exists (
       select 1 from public.profiles p
       where p.id = (select auth.uid()) and p.role = any(allowed)
     );
$$;
revoke all on function private.has_any_role(public.app_role[]) from public;
grant execute on function private.has_any_role(public.app_role[]) to authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.suppliers enable row level security;
alter table public.product_batches enable row level security;
alter table public.stock_movements enable row level security;

-- Profiles: user may read own profile; owner may read all profiles.
create policy "profiles_select_self_or_owner" on public.profiles
for select to authenticated
using (id = (select auth.uid()) or private.has_any_role(array['owner']::public.app_role[]));

create policy "profiles_owner_insert" on public.profiles
for insert to authenticated
with check (private.has_any_role(array['owner']::public.app_role[]));

create policy "profiles_owner_update" on public.profiles
for update to authenticated
using (private.has_any_role(array['owner']::public.app_role[]))
with check (private.has_any_role(array['owner']::public.app_role[]));

-- Categories: staff can read; owner/pharmacist can maintain.
create policy "categories_read_staff" on public.categories
for select to authenticated
using (private.has_any_role(array['owner','cashier','pharmacist']::public.app_role[]));
create policy "categories_write_owner_pharmacist" on public.categories
for all to authenticated
using (private.has_any_role(array['owner','pharmacist']::public.app_role[]))
with check (private.has_any_role(array['owner','pharmacist']::public.app_role[]));

-- Products: all signed-in staff can read; only owner/pharmacist can write.
create policy "products_read_staff" on public.products
for select to authenticated
using (private.has_any_role(array['owner','cashier','pharmacist']::public.app_role[]));
create policy "products_write_owner_pharmacist" on public.products
for all to authenticated
using (private.has_any_role(array['owner','pharmacist']::public.app_role[]))
with check (private.has_any_role(array['owner','pharmacist']::public.app_role[]));

-- Supplier and batch records: owner/pharmacist maintain; all staff read.
create policy "suppliers_read_staff" on public.suppliers
for select to authenticated
using (private.has_any_role(array['owner','cashier','pharmacist']::public.app_role[]));
create policy "suppliers_write_owner_pharmacist" on public.suppliers
for all to authenticated
using (private.has_any_role(array['owner','pharmacist']::public.app_role[]))
with check (private.has_any_role(array['owner','pharmacist']::public.app_role[]));

create policy "batches_read_staff" on public.product_batches
for select to authenticated
using (private.has_any_role(array['owner','cashier','pharmacist']::public.app_role[]));
create policy "batches_write_owner_pharmacist" on public.product_batches
for all to authenticated
using (private.has_any_role(array['owner','pharmacist']::public.app_role[]))
with check (private.has_any_role(array['owner','pharmacist']::public.app_role[]));

create policy "movements_read_staff" on public.stock_movements
for select to authenticated
using (private.has_any_role(array['owner','cashier','pharmacist']::public.app_role[]));
create policy "movements_write_owner_pharmacist" on public.stock_movements
for insert to authenticated
with check (private.has_any_role(array['owner','pharmacist']::public.app_role[]));

-- Explicit table privileges complement RLS.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.categories, public.products, public.suppliers, public.product_batches to authenticated;
grant select, insert on public.stock_movements to authenticated;
grant select, insert, update on public.profiles to authenticated;
