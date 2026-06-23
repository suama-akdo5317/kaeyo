# グループ作成時の RLS エラー修正記録

- **日付:** 2026-06-23
- **症状:** グループ作成時に `new row violates row-level security policy for table "groups"`（HTTP 403 / PostgreSQL 42501）
- **対象フロー:** 初回ログイン後のメイン画面で「マイリスト」を自動作成する処理（`app/(app)/page.tsx`）

## 症状

メイン画面ロード時、`getMyGroups`（SELECT）が空を返したため新規グループ作成に進み、
`POST https://<project>.supabase.co/rest/v1/groups?select=*` が **403 Forbidden** で失敗していた。

## 調査経過（切り分け）

| 仮説 | 検証 | 結果 |
|---|---|---|
| マイグレーション 002/003 が未適用 | `supabase migration list` | **否定**。002/003 は適用済み（未適用は 004 のみ） |
| INSERT 時に未認証で `auth.uid()` が null（anon 送信） | 失敗リクエストの `Authorization` JWT をデコード | **否定**。`role: authenticated` / `is_anonymous: false` / `exp` 有効。トークンは正常 |
| `.select()`（returning）が SELECT ポリシーに弾かれている | 失敗 URL が `...?select=*` であること＋ポリシー定義から演繹 | **確定** |

## 根本原因

`lib/group.ts` の `createGroup` が `.insert({ name }).select().single()` を実行していた。

1. INSERT 本体は `groups` の INSERT ポリシー `with check (auth.uid() is not null)` を**通過する**（認証済みのため）。
2. しかし `.select()`（PostgREST の `Prefer: return=representation`）が挿入行を返す際、`groups` の **SELECT ポリシー**が評価される:

   ```sql
   using ( id in (select group_id from group_members where user_id = auth.uid()) )
   ```

3. グループ作成直後はまだ `group_members` に行が無い（メンバー登録は次のステップ）ため、
   作ったばかりの自分のグループが SELECT で見えず、PostgREST が `42501` を返す。

→ マイグレーション未適用でもトークン不正でもなく、**RLS ポリシー設計とクライアント処理（INSERT + returning）の噛み合わせ**が原因。Supabase で頻出の「自己参照グループ作成」問題。

## 修正内容

グループ作成と作成者の owner 登録を、`SECURITY DEFINER` の RPC で 1 トランザクションにまとめた。
returning SELECT 問題の回避に加え、途中失敗による孤児グループも防止する。

### 1. `supabase/migrations/005_create_group_with_owner.sql`（新規）

```sql
create or replace function create_group_with_owner(group_name text)
returns groups
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group groups;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  insert into groups (name)
    values (group_name)
    returning * into new_group;

  insert into group_members (group_id, user_id, role)
    values (new_group.id, auth.uid(), 'owner');

  return new_group;
end;
$$;

revoke all on function create_group_with_owner(text) from public;
grant execute on function create_group_with_owner(text) to authenticated;
```

### 2. `lib/group.ts`

```ts
export async function createGroup(supabase: SupabaseClient, name: string) {
  const { data, error } = await supabase.rpc("create_group_with_owner", {
    group_name: name,
  });
  if (error) throw new Error(error.message);
  return data;
}
```

`userId` 引数は RPC 内で `auth.uid()` を使うため不要になった。

### 3. `app/(app)/page.tsx`

```ts
const newGroup = await createGroup(supabase, "マイリスト");
```

### 4. `tests/unit/group.test.ts`

RPC `create_group_with_owner` を呼ぶことを検証する形に更新（全ユニットテスト通過）。

## 適用手順

```bash
supabase db push   # 004（categories.color 追加）と 005 を適用
```

適用後、メイン画面リロードでグループ作成が成功し 403 が解消することを確認済み。

## 学び・予防

- Supabase で `INSERT + .select()` を使う場合、INSERT ポリシー（`with check`）だけでなく
  **SELECT ポリシー（`using`）も挿入行に対して評価される**。所有判定が「作成後に登録される別テーブル」に依存する設計では、作成直後の returning が弾かれる。
- 「作成と関連付けが多段になる」操作は、`SECURITY DEFINER` の RPC でアトミックに行うのが堅牢。
- エラーの URL に `?select=*` が含まれていたら、INSERT 本体ではなく **returning の SELECT** を疑う。
