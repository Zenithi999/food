-- Хүнс маркет — Supabase схем
-- Ажиллуулах: Supabase Dashboard → SQL Editor → New query → энэ бүх кодыг буулгаад "Run"

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text not null default '',
  password_hash text not null,
  role text not null default 'CUSTOMER',
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  created_at timestamptz not null default now()
);

alter table categories add column if not exists image_url text;

create table if not exists subcategories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_id uuid not null references categories(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric not null,
  unit text not null,
  category_id uuid not null references categories(id),
  subcategory_id uuid references subcategories(id),
  image_url text not null,
  stock integer not null default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- `stock` баганыг цаашид "лангуун дээр" (борлуулалтад бэлэн) нөөц гэж тооцно;
-- `stock_warehouse` нь "агуулахад" байгаа нөөц — лангуу дуусахад эндээс шилжүүлнэ.
alter table products add column if not exists stock_warehouse integer not null default 0;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  status text not null default 'PENDING',
  total numeric not null,
  address text not null default '',
  phone text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null,
  price numeric not null
);

-- Байгууллагууд (B2B захиалагчид) — admin талаас бүртгэдэг, өөрөө бүртгүүлдэггүй.
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_phone text not null default '',
  contact_email text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table users add column if not exists company_id uuid references companies(id);
alter table orders add column if not exists company_id uuid references companies(id);
alter table orders add column if not exists payment_type text not null default 'CASH'
  check (payment_type in ('CASH', 'CREDIT', 'QPAY'));
alter table orders add column if not exists idempotency_key text;

-- Кассын (POS) захиалгыг онлайн захиалгаас ялгахад ашиглана.
alter table orders add column if not exists source text not null default 'ONLINE'
  check (source in ('ONLINE', 'POS'));

-- Дансаар (банкны шилжүүлгээр) төлбөрийг нэмж зөвшөөрнө.
alter table orders drop constraint if exists orders_payment_type_check;
alter table orders add constraint orders_payment_type_check
  check (payment_type in ('CASH', 'CREDIT', 'QPAY', 'BANK'));

create unique index if not exists idx_orders_idempotency_key
  on orders(idempotency_key) where idempotency_key is not null;

-- Захиалга бүрийн төлбөрийн бичлэг: бэлнээр/зээлээр гэвэл шууд SUCCESS,
-- QPay бол PENDING-ээс эхэлж webhook/polling-оор баталгаажина.
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  type text not null check (type in ('CASH', 'CREDIT', 'QPAY', 'BANK')),
  amount numeric not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'SUCCESS', 'FAILED')),
  qpay_invoice_id text,
  qpay_transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Byl (byl.mn) онлайн төлбөрийн нэхэмжлэх.
alter table payments add column if not exists byl_invoice_id text;
alter table payments add column if not exists byl_invoice_url text;
create index if not exists idx_payments_byl_invoice_id on payments(byl_invoice_id);

create index if not exists idx_subcategories_category_id on subcategories(category_id);
create index if not exists idx_products_category_id on products(category_id);
create index if not exists idx_products_subcategory_id on products(subcategory_id);
create index if not exists idx_products_stock on products(stock);
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_orders_company_id on orders(company_id);
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_payments_order_id on payments(order_id);

-- Row Level Security — сервер тал маань зөвхөн service_role түлхүүрээр хандах тул
-- (service_role нь RLS-ийг үргэлж алгасдаг), энгийн клиент (anon)-аас шууд бичихийг хаана.
alter table users enable row level security;
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table companies enable row level security;
alter table payments enable row level security;

-- Бүтээгдэхүүн, ангиллыг хэн ч (anon) уншиж болно (дэлгүүрийн жагсаалт нээлттэй байх ёстой тул)
drop policy if exists "Public read categories" on categories;
create policy "Public read categories" on categories for select using (true);

drop policy if exists "Public read subcategories" on subcategories;
create policy "Public read subcategories" on subcategories for select using (true);

drop policy if exists "Public read products" on products;
create policy "Public read products" on products for select using (true);

-- users/orders/order_items нь зөвхөн service_role-оор (манай Next.js сервер) хандана,
-- тиймээс энд public select/write policy зориудаар нэмээгүй болно.

-- Захиалга үүсгэх функц: нөөц шалгах, дүн тооцох, захиалга+мөрүүд үүсгэх,
-- нөөц хасахыг НЭГ Postgres гүйлгээ (transaction) дотор атомик байдлаар хийнэ.
create or replace function create_order(
  p_user_id uuid,
  p_address text,
  p_phone text,
  p_note text,
  p_items jsonb, -- [{"product_id": "uuid", "quantity": 2}, ...]
  p_payment_type text default 'CASH',
  p_company_id uuid default null,
  p_idempotency_key text default null,
  p_source text default 'ONLINE'
) returns uuid
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product products%rowtype;
  v_subtotal numeric := 0;
  v_vat numeric;
  v_total numeric;
  v_payment_status text;
begin
  if p_idempotency_key is not null then
    select id into v_order_id from orders where idempotency_key = p_idempotency_key;
    if found then
      return v_order_id;
    end if;
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from products where id = (v_item->>'product_id')::uuid for update;
    if not found then
      raise exception 'Зарим бараа боломжгүй боллоо.';
    end if;
    if v_product.stock < (v_item->>'quantity')::int then
      raise exception '% барааны нөөц хүрэлцэхгүй байна.', v_product.name;
    end if;
    v_subtotal := v_subtotal + v_product.price * (v_item->>'quantity')::int;
  end loop;

  v_vat := v_subtotal * 0.1;
  v_total := v_subtotal + v_vat;

  insert into orders (user_id, status, total, address, phone, note, payment_type, company_id, idempotency_key, source)
  values (p_user_id, 'PENDING', v_total, p_address, p_phone, p_note, p_payment_type, p_company_id, p_idempotency_key, p_source)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from products where id = (v_item->>'product_id')::uuid;

    insert into order_items (order_id, product_id, quantity, price)
    values (v_order_id, v_product.id, (v_item->>'quantity')::int, v_product.price);

    update products set stock = stock - (v_item->>'quantity')::int where id = v_product.id;
  end loop;

  -- QPay: төлбөр баталгаажих хүртэл PENDING. Зээл: байгууллага эргэн төлөх хүртэл PENDING.
  v_payment_status := case when p_payment_type in ('QPAY', 'CREDIT') then 'PENDING' else 'SUCCESS' end;
  insert into payments (order_id, type, amount, status)
  values (v_order_id, p_payment_type, v_total, v_payment_status);

  return v_order_id;
end;
$$;

-- Байгууллага + түүний нэвтрэх хэрэглэгчийг нэг гүйлгээнд атомик үүсгэнэ.
create or replace function create_company_with_user(
  p_company_name text,
  p_contact_phone text,
  p_contact_email text,
  p_user_name text,
  p_user_email text,
  p_user_phone text,
  p_password_hash text
) returns uuid
language plpgsql
security definer
as $$
declare
  v_company_id uuid;
begin
  insert into companies (name, contact_phone, contact_email)
  values (p_company_name, p_contact_phone, p_contact_email)
  returning id into v_company_id;

  insert into users (name, email, phone, password_hash, role, company_id)
  values (p_user_name, p_user_email, p_user_phone, p_password_hash, 'COMPANY', v_company_id);

  return v_company_id;
end;
$$;

-- Агуулахаас лангуун дээр (эсвэл эсрэгээр) нөөц шилжүүлэхийг атомик хийнэ.
create or replace function transfer_stock(
  p_product_id uuid,
  p_quantity int -- эерэг бол агуулах->лангуу, сөрөг бол лангуу->агуулах
) returns void
language plpgsql
security definer
as $$
declare
  v_product products%rowtype;
begin
  select * into v_product from products where id = p_product_id for update;
  if not found then
    raise exception 'Бараа олдсонгүй.';
  end if;

  if p_quantity > 0 and v_product.stock_warehouse < p_quantity then
    raise exception 'Агуулахын нөөц хүрэлцэхгүй байна.';
  end if;
  if p_quantity < 0 and v_product.stock < -p_quantity then
    raise exception 'Лангуун дээрх нөөц хүрэлцэхгүй байна.';
  end if;

  update products
  set stock = stock + p_quantity,
      stock_warehouse = stock_warehouse - p_quantity,
      updated_at = now()
  where id = p_product_id;
end;
$$;
