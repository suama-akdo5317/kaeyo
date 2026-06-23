-- グループ作成と作成者の owner 登録をアトミックに実行する RPC
--
-- 背景: クライアントから groups へ INSERT + .select()（returning）すると、
-- INSERT 自体は with_check (auth.uid() is not null) を通過するが、
-- 返却時の SELECT ポリシー
--   id in (select group_id from group_members where user_id = auth.uid())
-- がまだ満たされず（メンバー登録前）、PostgREST が 42501
-- "new row violates row-level security policy" を返してしまう。
--
-- SECURITY DEFINER 関数内で groups 作成と group_members への owner 登録を
-- 1 トランザクションで行い、RLS の returning 問題と孤児グループを同時に防ぐ。
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

-- 認証済みユーザーのみ実行可能にする
revoke all on function create_group_with_owner(text) from public;
grant execute on function create_group_with_owner(text) to authenticated;
