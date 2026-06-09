create extension if not exists "pgcrypto";

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price numeric(10, 2) not null check (price >= 0),
  specs jsonb not null default '{}'::jsonb,
  images text[] not null default '{}',
  supplier text not null,
  source_url text not null unique,
  bundle_items uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer jsonb not null default '{}'::jsonb,
  product_id uuid references products(id) on delete set null,
  status text not null default 'pending_manual_fulfillment',
  supplier text not null default 'manual',
  fulfillment_notes text,
  created_at timestamptz not null default now()
);

create table if not exists bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  products uuid[] not null,
  total_price numeric(10, 2) not null check (total_price >= 0),
  margin numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  original_price numeric(10, 2) not null check (original_price >= 0),
  sale_price numeric(10, 2) not null check (sale_price >= 0),
  score integer not null check (score between 0 and 100),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists products_supplier_created_at_idx on products (supplier, created_at desc);
create index if not exists orders_status_created_at_idx on orders (status, created_at desc);
create index if not exists deals_created_at_idx on deals (created_at desc);
create index if not exists bundles_created_at_idx on bundles (created_at desc);

alter table products enable row level security;
alter table orders enable row level security;
alter table bundles enable row level security;
alter table deals enable row level security;

create policy "Public can read products" on products for select using (true);
create policy "Public can read bundles" on bundles for select using (true);
create policy "Public can read deals" on deals for select using (true);

create policy "Paul can read orders" on orders
  for select
  using ((auth.jwt() ->> 'email') = 'paul@sentinelprime.org');

create policy "Paul can manage products" on products
  for all
  using ((auth.jwt() ->> 'email') = 'paul@sentinelprime.org')
  with check ((auth.jwt() ->> 'email') = 'paul@sentinelprime.org');

create policy "Paul can manage orders" on orders
  for all
  using ((auth.jwt() ->> 'email') = 'paul@sentinelprime.org')
  with check ((auth.jwt() ->> 'email') = 'paul@sentinelprime.org');

create policy "Paul can manage bundles" on bundles
  for all
  using ((auth.jwt() ->> 'email') = 'paul@sentinelprime.org')
  with check ((auth.jwt() ->> 'email') = 'paul@sentinelprime.org');

create policy "Paul can manage deals" on deals
  for all
  using ((auth.jwt() ->> 'email') = 'paul@sentinelprime.org')
  with check ((auth.jwt() ->> 'email') = 'paul@sentinelprime.org');
