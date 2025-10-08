-- cars table
create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text check (category in ('sedan','suv','luxury','vintage','other')) default 'sedan',
  base_price integer not null check (base_price >= 0),
  per_km integer default 0 check (per_km >= 0),
  image_url text,
  active boolean default true,
  created_at timestamptz default now()
);

-- price_rules table
create table if not exists public.price_rules (
  id uuid primary key default gen_random_uuid(),
  rule_name text not null,
  type text check (type in ('discount','surcharge','multiplier')) not null,
  scope text check (scope in ('srinagar','outside_srinagar','weekend','custom')) not null,
  value numeric not null,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.cars enable row level security;
alter table public.price_rules enable row level security;

create policy if not exists "public read cars" on public.cars for select using (true);
create policy if not exists "public read price_rules" on public.price_rules for select using (true);
