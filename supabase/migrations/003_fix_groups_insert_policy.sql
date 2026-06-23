-- groups テーブルのINSERTポリシーを修正
-- USING句はSELECT/UPDATE/DELETEに使われ、INSERTにはWITH CHECKが必要
-- 認証済みユーザーがグループを作成し、その後group_membersへ登録する流れを許可する

drop policy if exists "group_members can access groups" on groups;

-- INSERT: 認証済みユーザーなら誰でもグループ作成可能
create policy "authenticated users can insert groups"
  on groups for insert
  with check (auth.uid() is not null);

-- SELECT/UPDATE/DELETE: 自分がメンバーのグループのみアクセス可
create policy "group_members can select groups"
  on groups for select
  using (
    id in (select group_id from group_members where user_id = auth.uid())
  );

create policy "group_members can update groups"
  on groups for update
  using (
    id in (select group_id from group_members where user_id = auth.uid())
  );

create policy "group_members can delete groups"
  on groups for delete
  using (
    id in (select group_id from group_members where user_id = auth.uid())
  );
