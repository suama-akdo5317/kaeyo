# 買い物メモアプリ 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 家族と共有できる買い物メモWebアプリをNext.js + Supabaseで構築する

**Architecture:** Supabase Auth + PostgreSQL + Realtimeで認証・DB・リアルタイム同期をワンストップ提供。Next.js App RouterでSSR/CSRを使い分け、RLSでグループ単位のデータ分離を実現する。

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (Auth / PostgreSQL / Realtime), Vitest, React Testing Library, Playwright

---

## ディレクトリ構造

```
kaeyo/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx          # 認証ガード
│   │   ├── page.tsx            # メインリスト
│   │   └── settings/page.tsx
│   ├── invite/[token]/page.tsx
│   └── layout.tsx
├── components/
│   ├── ItemInput.tsx
│   ├── ItemList.tsx
│   ├── CategorySection.tsx
│   └── HistoryPanel.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # ブラウザ用クライアント
│   │   └── server.ts           # サーバーコンポーネント用クライアント
│   └── types.ts                # DB型定義
├── supabase/migrations/
│   └── 001_initial.sql
├── middleware.ts               # 認証リダイレクト
└── tests/
    ├── unit/
    └── e2e/
```

---

## Task 1: プロジェクト初期化

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `.env.local.example`

### Step 1: Next.jsプロジェクトを作成

```bash
cd /Users/kwuz/private/kaeyo
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

Expected: Next.jsプロジェクトが生成される

### Step 2: Supabase関連パッケージをインストール

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
npm install -D @playwright/test
```

### Step 3: `.env.local.example` を作成

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 4: `vitest.config.ts` を作成

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
})
```

### Step 5: `tests/setup.ts` を作成

```typescript
import '@testing-library/jest-dom'
```

### Step 6: `package.json` にスクリプトを追加

```json
{
  "scripts": {
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

### Step 7: コミット

```bash
git init
git add .
git commit -m "chore: Next.js + Supabase プロジェクト初期化"
```

---

## Task 2: Supabase型定義・クライアント設定

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/types.ts`
- Create: `middleware.ts`

### Step 1: `lib/types.ts` を作成（DB型定義）

```typescript
export type Group = {
  id: string
  name: string
  created_at: string
}

export type GroupMember = {
  group_id: string
  user_id: string
  role: 'owner' | 'member'
}

export type Category = {
  id: string
  group_id: string
  name: string
  position: number
}

export type Item = {
  id: string
  group_id: string
  category_id: string | null
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ItemHistory = {
  id: string
  group_id: string
  name: string
}
```

### Step 2: `lib/supabase/client.ts` を作成

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Step 3: `lib/supabase/server.ts` を作成

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Step 4: `middleware.ts` を作成（認証リダイレクト）

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isInvitePage = request.nextUrl.pathname.startsWith('/invite')

  if (!user && !isAuthPage && !isInvitePage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### Step 5: コミット

```bash
git add .
git commit -m "feat: Supabaseクライアント設定・型定義・認証ミドルウェア"
```

---

## Task 3: データベースマイグレーション（Supabase）

**Files:**
- Create: `supabase/migrations/001_initial.sql`

### Step 1: Supabase CLIをインストール

```bash
npm install -D supabase
npx supabase init
```

### Step 2: `supabase/migrations/001_initial.sql` を作成

```sql
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
```

### Step 3: Supabaseプロジェクトにマイグレーション適用

```bash
# Supabase Dashboardでプロジェクト作成後、.env.localにURLとキーを設定してから:
npx supabase db push
# またはDashboard > SQL EditorでSQLを直接実行
```

### Step 4: コミット

```bash
git add .
git commit -m "feat: データベーススキーマ・RLSポリシー追加"
```

---

## Task 4: ログイン画面

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `tests/unit/LoginPage.test.tsx`

### Step 1: テストを書く（RED）

```typescript
// tests/unit/LoginPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import LoginPage from '@/app/(auth)/login/page'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}))

test('メールとパスワードの入力フィールドが表示される', () => {
  render(<LoginPage />)
  expect(screen.getByPlaceholderText('メールアドレス')).toBeInTheDocument()
  expect(screen.getByPlaceholderText('パスワード')).toBeInTheDocument()
})

test('ログインボタンが表示される', () => {
  render(<LoginPage />)
  expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument()
})
```

### Step 2: テストを実行して失敗を確認

```bash
npx vitest run tests/unit/LoginPage.test.tsx
```

Expected: FAIL（ファイルが存在しない）

### Step 3: `app/(auth)/login/page.tsx` を実装

```typescript
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) { setError(error.message); return }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-center">買い物メモ</h1>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-blue-500 text-white rounded py-2">
          {isSignUp ? '新規登録' : 'ログイン'}
        </button>
        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-sm text-gray-500 underline">
          {isSignUp ? 'ログインに戻る' : '新規登録はこちら'}
        </button>
      </form>
    </div>
  )
}
```

### Step 4: テストを実行してパスを確認

```bash
npx vitest run tests/unit/LoginPage.test.tsx
```

Expected: PASS

### Step 5: コミット

```bash
git add .
git commit -m "feat: ログイン・新規登録画面を実装"
```

---

## Task 5: グループ作成・招待機能

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `lib/group.ts`
- Create: `tests/unit/group.test.ts`

### Step 1: テストを書く（RED）

```typescript
// tests/unit/group.test.ts
import { createGroup, getMyGroups } from '@/lib/group'

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ data: [{ id: 'g1', name: 'テスト家族' }], error: null }),
  select: vi.fn().mockResolvedValue({ data: [{ id: 'g1', name: 'テスト家族' }], error: null }),
}

test('グループを作成できる', async () => {
  const group = await createGroup(mockSupabase as any, 'テスト家族', 'user1')
  expect(group.name).toBe('テスト家族')
})
```

### Step 2: テストを実行して失敗を確認

```bash
npx vitest run tests/unit/group.test.ts
```

Expected: FAIL

### Step 3: `lib/group.ts` を実装

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

export async function createGroup(supabase: SupabaseClient, name: string, userId: string) {
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name })
    .select()
    .single()
  if (groupError) throw groupError

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId, role: 'owner' })
  if (memberError) throw memberError

  return group
}

export async function getMyGroups(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
  if (error) throw error
  return data
}

export async function generateInviteToken(groupId: string): Promise<string> {
  // base64エンコードでシンプルなトークン生成
  return btoa(`${groupId}:${Date.now()}`)
}

export function decodeInviteToken(token: string): { groupId: string } {
  const decoded = atob(token)
  const [groupId] = decoded.split(':')
  return { groupId }
}
```

### Step 4: テストを実行してパスを確認

```bash
npx vitest run tests/unit/group.test.ts
```

Expected: PASS

### Step 5: `app/(app)/layout.tsx` を作成（認証ガード）

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <>{children}</>
}
```

### Step 6: コミット

```bash
git add .
git commit -m "feat: グループ作成・招待トークン生成を実装"
```

---

## Task 6: カテゴリCRUD

**Files:**
- Create: `lib/category.ts`
- Create: `tests/unit/category.test.ts`
- Create: `components/CategorySection.tsx`

### Step 1: テストを書く（RED）

```typescript
// tests/unit/category.test.ts
import { addCategory, updateCategory, deleteCategory, reorderCategories } from '@/lib/category'

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ data: { id: 'c1', name: '野菜', position: 0 }, error: null }),
  update: vi.fn().mockResolvedValue({ error: null }),
  delete: vi.fn().mockResolvedValue({ error: null }),
  eq: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: { id: 'c1', name: '野菜', position: 0 }, error: null }),
}

test('カテゴリを追加できる', async () => {
  const cat = await addCategory(mockSupabase as any, 'g1', '野菜', 0)
  expect(cat.name).toBe('野菜')
})
```

### Step 2: テストを実行して失敗を確認

```bash
npx vitest run tests/unit/category.test.ts
```

### Step 3: `lib/category.ts` を実装

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getCategories(supabase: SupabaseClient, groupId: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('group_id', groupId)
    .order('position')
  if (error) throw error
  return data
}

export async function addCategory(supabase: SupabaseClient, groupId: string, name: string, position: number) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ group_id: groupId, name, position })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(supabase: SupabaseClient, id: string, name: string) {
  const { error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
  if (error) throw error
}

export async function deleteCategory(supabase: SupabaseClient, id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function reorderCategories(supabase: SupabaseClient, ids: string[]) {
  await Promise.all(
    ids.map((id, index) =>
      supabase.from('categories').update({ position: index }).eq('id', id)
    )
  )
}
```

### Step 4: テストを実行してパスを確認

```bash
npx vitest run tests/unit/category.test.ts
```

Expected: PASS

### Step 5: `components/CategorySection.tsx` を実装

```typescript
'use client'
import type { Category, Item } from '@/lib/types'

type Props = {
  category: Category | null
  items: Item[]
  onToggleItem: (id: string, isActive: boolean) => void
}

export function CategorySection({ category, items, onToggleItem }: Props) {
  return (
    <div className="mb-4">
      {category && (
        <h2 className="text-sm font-semibold text-gray-500 px-2 mb-1">{category.name}</h2>
      )}
      <ul className="space-y-1">
        {items.map(item => (
          <li key={item.id}>
            <button
              onClick={() => onToggleItem(item.id, !item.is_active)}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${
                item.is_active ? 'bg-white' : 'bg-gray-50 text-gray-400 line-through'
              }`}
            >
              <span className={`w-4 h-4 border-2 rounded flex-shrink-0 flex items-center justify-center ${
                item.is_active ? 'border-gray-300' : 'border-gray-300 bg-gray-300'
              }`}>
                {!item.is_active && <span className="text-white text-xs">✓</span>}
              </span>
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Step 6: コミット

```bash
git add .
git commit -m "feat: カテゴリCRUD・CategorySectionコンポーネント実装"
```

---

## Task 7: アイテムCRUD・履歴機能

**Files:**
- Create: `lib/item.ts`
- Create: `tests/unit/item.test.ts`
- Create: `components/ItemInput.tsx`
- Create: `components/HistoryPanel.tsx`

### Step 1: テストを書く（RED）

```typescript
// tests/unit/item.test.ts
import { addItem, toggleItem, deleteItem } from '@/lib/item'

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ data: { id: 'i1', name: '牛乳', is_active: true }, error: null }),
  update: vi.fn().mockResolvedValue({ error: null }),
  delete: vi.fn().mockResolvedValue({ error: null }),
  upsert: vi.fn().mockResolvedValue({ error: null }),
  eq: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: { id: 'i1', name: '牛乳', is_active: true }, error: null }),
}

test('アイテムを追加できる', async () => {
  const item = await addItem(mockSupabase as any, 'g1', '牛乳', null)
  expect(item.name).toBe('牛乳')
  expect(item.is_active).toBe(true)
})

test('アイテムのアクティブ状態を切り替えられる', async () => {
  await expect(toggleItem(mockSupabase as any, 'i1', false)).resolves.not.toThrow()
})
```

### Step 2: テストを実行して失敗を確認

```bash
npx vitest run tests/unit/item.test.ts
```

### Step 3: `lib/item.ts` を実装

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getItems(supabase: SupabaseClient, groupId: string) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function addItem(
  supabase: SupabaseClient,
  groupId: string,
  name: string,
  categoryId: string | null
) {
  const { data, error } = await supabase
    .from('items')
    .insert({ group_id: groupId, name, category_id: categoryId, is_active: true })
    .select()
    .single()
  if (error) throw error

  // 履歴にupsert（重複は無視）
  await supabase
    .from('item_history')
    .upsert({ group_id: groupId, name }, { onConflict: 'group_id,name' })

  return data
}

export async function toggleItem(supabase: SupabaseClient, id: string, isActive: boolean) {
  const { error } = await supabase
    .from('items')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) throw error
}

export async function deleteItem(supabase: SupabaseClient, id: string) {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getItemHistory(supabase: SupabaseClient, groupId: string) {
  const { data, error } = await supabase
    .from('item_history')
    .select('*')
    .eq('group_id', groupId)
    .order('name')
  if (error) throw error
  return data
}
```

### Step 4: テストを実行してパスを確認

```bash
npx vitest run tests/unit/item.test.ts
```

Expected: PASS

### Step 5: `components/ItemInput.tsx` を実装

```typescript
'use client'
import { useState } from 'react'
import type { Category } from '@/lib/types'

type Props = {
  categories: Category[]
  onAdd: (name: string, categoryId: string | null) => Promise<void>
}

export function ItemInput({ categories, onAdd }: Props) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await onAdd(name.trim(), categoryId)
    setName('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 bg-white border-b">
      <select
        value={categoryId ?? ''}
        onChange={e => setCategoryId(e.target.value || null)}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="">カテゴリなし</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="品名を入力..."
        className="flex-1 border rounded px-3 py-1"
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded">
        追加
      </button>
    </form>
  )
}
```

### Step 6: `components/HistoryPanel.tsx` を実装

```typescript
'use client'
import type { ItemHistory } from '@/lib/types'

type Props = {
  history: ItemHistory[]
  activeItemNames: Set<string>
  onReactivate: (name: string) => Promise<void>
}

export function HistoryPanel({ history, activeItemNames, onReactivate }: Props) {
  const available = history.filter(h => !activeItemNames.has(h.name))
  if (available.length === 0) return null

  return (
    <div className="p-3 bg-gray-50 border-t">
      <p className="text-xs text-gray-400 mb-2">履歴から追加</p>
      <div className="flex flex-wrap gap-2">
        {available.map(h => (
          <button
            key={h.id}
            onClick={() => onReactivate(h.name)}
            className="text-sm bg-white border rounded-full px-3 py-1 hover:bg-blue-50"
          >
            {h.name}
          </button>
        ))}
      </div>
    </div>
  )
}
```

### Step 7: コミット

```bash
git add .
git commit -m "feat: アイテムCRUD・履歴機能・関連コンポーネント実装"
```

---

## Task 8: メイン画面（`/`）

**Files:**
- Create: `app/(app)/page.tsx`

### Step 1: `app/(app)/page.tsx` を実装

```typescript
'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getItems, addItem, toggleItem, getItemHistory } from '@/lib/item'
import { getCategories } from '@/lib/category'
import { getMyGroups } from '@/lib/group'
import { ItemInput } from '@/components/ItemInput'
import { CategorySection } from '@/components/CategorySection'
import { HistoryPanel } from '@/components/HistoryPanel'
import type { Category, Item, ItemHistory, Group } from '@/lib/types'

export default function MainPage() {
  const supabase = createClient()
  const [group, setGroup] = useState<Group | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [history, setHistory] = useState<ItemHistory[]>([])

  const load = useCallback(async () => {
    const groups = await getMyGroups(supabase)
    if (!groups || groups.length === 0) return
    const g = groups[0]
    setGroup(g)
    const [cats, its, hist] = await Promise.all([
      getCategories(supabase, g.id),
      getItems(supabase, g.id),
      getItemHistory(supabase, g.id),
    ])
    setCategories(cats)
    setItems(its)
    setHistory(hist)
  }, [])

  useEffect(() => { load() }, [load])

  // Supabase RealtimeのセットアップはTask 9で追加

  const handleAdd = async (name: string, categoryId: string | null) => {
    if (!group) return
    await addItem(supabase, group.id, name, categoryId)
    await load()
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleItem(supabase, id, isActive)
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: isActive } : i))
  }

  const handleReactivate = async (name: string) => {
    if (!group) return
    await addItem(supabase, group.id, name, null)
    await load()
  }

  const activeNames = new Set(items.filter(i => i.is_active).map(i => i.name))

  const categorizedItems = (catId: string | null) =>
    items.filter(i => i.category_id === catId)

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      <header className="bg-blue-500 text-white px-4 py-3 flex justify-between items-center">
        <span className="font-bold">{group?.name ?? '読み込み中...'}</span>
      </header>
      <ItemInput categories={categories} onAdd={handleAdd} />
      <main className="flex-1 overflow-y-auto p-2">
        {categories.map(cat => {
          const its = categorizedItems(cat.id)
          if (its.length === 0) return null
          return <CategorySection key={cat.id} category={cat} items={its} onToggleItem={handleToggle} />
        })}
        {categorizedItems(null).length > 0 && (
          <CategorySection category={null} items={categorizedItems(null)} onToggleItem={handleToggle} />
        )}
      </main>
      <HistoryPanel history={history} activeItemNames={activeNames} onReactivate={handleReactivate} />
    </div>
  )
}
```

### Step 2: コミット

```bash
git add .
git commit -m "feat: メイン画面を実装"
```

---

## Task 9: Supabase Realtimeによるリアルタイム同期

**Files:**
- Modify: `app/(app)/page.tsx`
- Create: `lib/realtime.ts`

### Step 1: `lib/realtime.ts` を作成

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

export function subscribeToGroupChanges(
  supabase: SupabaseClient,
  groupId: string,
  onItemChange: () => void,
  onCategoryChange: () => void,
) {
  const channel = supabase
    .channel(`group:${groupId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'items', filter: `group_id=eq.${groupId}` },
      () => onItemChange()
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'categories', filter: `group_id=eq.${groupId}` },
      () => onCategoryChange()
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}
```

### Step 2: `app/(app)/page.tsx` にRealtimeを追加

`useEffect` の中で `subscribeToGroupChanges` を呼び出す:

```typescript
// load() 後に追加
useEffect(() => {
  if (!group) return
  return subscribeToGroupChanges(
    supabase,
    group.id,
    () => getItems(supabase, group.id).then(setItems),
    () => getCategories(supabase, group.id).then(setCategories),
  )
}, [group])
```

### Step 3: 動作確認

1. `npm run dev` でアプリ起動
2. 2つのブラウザタブで同じアカウントにログイン
3. 片方でアイテムを追加 → もう片方に即時反映されることを確認

### Step 4: コミット

```bash
git add .
git commit -m "feat: Supabase Realtimeでリアルタイム同期を実装"
```

---

## Task 10: 設定画面・招待機能

**Files:**
- Create: `app/(app)/settings/page.tsx`
- Create: `app/invite/[token]/page.tsx`

### Step 1: `app/(app)/settings/page.tsx` を実装

カテゴリの追加・編集・削除と、招待リンクの生成UIを実装:

```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCategories, addCategory, updateCategory, deleteCategory } from '@/lib/category'
import { getMyGroups, generateInviteToken } from '@/lib/group'
import type { Category, Group } from '@/lib/types'

export default function SettingsPage() {
  const supabase = createClient()
  const [group, setGroup] = useState<Group | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const groups = await getMyGroups(supabase)
      if (!groups || groups.length === 0) return
      setGroup(groups[0])
      setCategories(await getCategories(supabase, groups[0].id))
    }
    load()
  }, [])

  const handleAddCategory = async () => {
    if (!group || !newCatName.trim()) return
    await addCategory(supabase, group.id, newCatName.trim(), categories.length)
    setCategories(await getCategories(supabase, group.id))
    setNewCatName('')
  }

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(supabase, id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const handleGenerateInvite = async () => {
    if (!group) return
    const token = await generateInviteToken(group.id)
    setInviteUrl(`${window.location.origin}/invite/${token}`)
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold">設定</h1>

      <section>
        <h2 className="font-semibold mb-2">カテゴリ</h2>
        <ul className="space-y-1 mb-2">
          {categories.map(cat => (
            <li key={cat.id} className="flex justify-between items-center bg-white border rounded px-3 py-2">
              <span>{cat.name}</span>
              <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 text-sm">削除</button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="新しいカテゴリ名" className="flex-1 border rounded px-3 py-1" />
          <button onClick={handleAddCategory} className="bg-blue-500 text-white px-3 py-1 rounded">追加</button>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">メンバー招待</h2>
        <button onClick={handleGenerateInvite} className="bg-green-500 text-white px-4 py-2 rounded">招待リンクを生成</button>
        {inviteUrl && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-sm break-all">
            <p className="text-gray-600 mb-1">このリンクをシェアしてください：</p>
            <p className="font-mono">{inviteUrl}</p>
            <button onClick={() => navigator.clipboard.writeText(inviteUrl)} className="mt-1 text-blue-500 text-xs underline">コピー</button>
          </div>
        )}
      </section>
    </div>
  )
}
```

### Step 2: `app/invite/[token]/page.tsx` を実装

```typescript
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { decodeInviteToken } from '@/lib/group'

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    async function acceptInvite() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/login?redirect=/invite/${token}`); return }

      try {
        const { groupId } = decodeInviteToken(token)
        await supabase.from('group_members').upsert(
          { group_id: groupId, user_id: user.id, role: 'member' },
          { onConflict: 'group_id,user_id' }
        )
        setStatus('success')
        setTimeout(() => router.push('/'), 1500)
      } catch {
        setStatus('error')
      }
    }
    acceptInvite()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center">
      {status === 'loading' && <p>招待を処理中...</p>}
      {status === 'success' && <p className="text-green-500">グループに参加しました！リダイレクト中...</p>}
      {status === 'error' && <p className="text-red-500">エラーが発生しました。リンクを確認してください。</p>}
    </div>
  )
}
```

### Step 3: コミット

```bash
git add .
git commit -m "feat: 設定画面・招待リンク受け入れページを実装"
```

---

## Task 11: E2Eテスト

**Files:**
- Create: `tests/e2e/shopping.spec.ts`
- Create: `playwright.config.ts`

### Step 1: `playwright.config.ts` を作成

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
})
```

### Step 2: `tests/e2e/shopping.spec.ts` を作成

```typescript
import { test, expect } from '@playwright/test'

test('ログインしてアイテムを追加できる', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[placeholder="メールアドレス"]', process.env.TEST_EMAIL!)
  await page.fill('[placeholder="パスワード"]', process.env.TEST_PASSWORD!)
  await page.click('button:has-text("ログイン")')
  await expect(page).toHaveURL('/')

  await page.fill('[placeholder="品名を入力..."]', 'テスト牛乳')
  await page.click('button:has-text("追加")')
  await expect(page.locator('text=テスト牛乳')).toBeVisible()
})

test('アイテムをタップしてアクティブ/非アクティブを切り替えられる', async ({ page }) => {
  await page.goto('/')
  const item = page.locator('text=テスト牛乳').first()
  await item.click()
  await expect(item).toHaveCSS('text-decoration-line', 'line-through')
})
```

### Step 3: E2Eテストを実行

```bash
npm run dev &
npx playwright test
```

Expected: PASS（事前にテスト用アカウントをSupabaseに作成しておく）

### Step 4: コミット

```bash
git add .
git commit -m "test: E2Eテストを追加"
```

---

## Task 12: Vercelデプロイ

### Step 1: Vercel CLIをインストール

```bash
npm install -g vercel
```

### Step 2: デプロイ

```bash
vercel
```

### Step 3: 環境変数をVercelに設定

Vercel Dashboard > Settings > Environment Variables に追加:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 4: Supabase DashboardでURLを追加

Authentication > URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/**`

### Step 5: 本番デプロイ

```bash
vercel --prod
```

---

## チェックリスト

- [ ] Task 1: プロジェクト初期化
- [ ] Task 2: Supabaseクライアント・型定義・ミドルウェア
- [ ] Task 3: DBマイグレーション
- [ ] Task 4: ログイン画面
- [ ] Task 5: グループ作成・招待
- [ ] Task 6: カテゴリCRUD
- [ ] Task 7: アイテムCRUD・履歴機能
- [ ] Task 8: メイン画面
- [ ] Task 9: リアルタイム同期
- [ ] Task 10: 設定画面・招待受け入れ
- [ ] Task 11: E2Eテスト
- [ ] Task 12: Vercelデプロイ
