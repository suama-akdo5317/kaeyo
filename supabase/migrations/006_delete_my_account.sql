-- 自己アカウント削除を行う RPC
--
-- 背景: Supabase は「自分自身のアカウントを削除する」クライアント API を
-- 提供しておらず、auth.users の削除には管理者権限が必要。このプロジェクトは
-- service role key を使わず anon key + RLS + SECURITY DEFINER RPC で運用して
-- いるため（005 マイグレーション参照）、同じ流儀で自己削除 RPC を用意する。
--
-- group_members.user_id は auth.users(id) on delete cascade のため、ユーザーを
-- 削除すればメンバーシップは自動で消えるが、無人になったグループ本体は残存
-- （孤児化）する。そこで「自分が抜けた結果メンバー0人になったグループ」だけを
-- 明示的に削除する。他メンバーが残るグループは not exists 条件で除外されるため
-- 一切影響を受けない。categories / items / item_history は group_id の
-- on delete cascade で連鎖削除される。
create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  affected_group_ids uuid[];
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- ユーザーが所属するグループを収集
  select array_agg(group_id) into affected_group_ids
    from group_members
    where user_id = uid;

  -- このユーザーの全メンバーシップを削除
  delete from group_members where user_id = uid;

  -- 自分が抜けた結果、メンバーが0人になったグループのみ削除する。
  -- 他メンバーが残るグループは not exists で除外される。
  delete from groups g
    where g.id = any(affected_group_ids)
      and not exists (
        select 1 from group_members m where m.group_id = g.id
      );

  -- 最後にユーザー本体を削除
  delete from auth.users where id = uid;
end;
$$;

-- 認証済みユーザーのみ実行可能にする
revoke all on function delete_my_account() from public;
grant execute on function delete_my_account() to authenticated;
