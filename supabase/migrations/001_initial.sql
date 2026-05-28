-- groups
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- group_members
create table group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  primary key (group_id, user_id)
);

-- categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  name text not null,
  position int not null default 0
);

-- items
create table items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- item_history
create table item_history (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  name text not null,
  unique(group_id, name)
);

-- updated_at自動更新トリガー
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger items_updated_at before update on items
  for each row execute function update_updated_at();

-- RLSを有効化
alter table groups enable row level security;
alter table group_members enable row level security;
alter table categories enable row level security;
alter table items enable row level security;
alter table item_history enable row level security;

-- RLSポリシー: グループメンバーのみアクセス可
create policy "group_members can access groups"
  on groups for all using (
    id in (select group_id from group_members where user_id = auth.uid())
  );

create policy "group_members can access group_members"
  on group_members for all using (
    group_id in (select group_id from group_members where user_id = auth.uid())
  );

create policy "group_members can access categories"
  on categories for all using (
    group_id in (select group_id from group_members where user_id = auth.uid())
  );

create policy "group_members can access items"
  on items for all using (
    group_id in (select group_id from group_members where user_id = auth.uid())
  );

create policy "group_members can access item_history"
  on item_history for all using (
    group_id in (select group_id from group_members where user_id = auth.uid())
  );
