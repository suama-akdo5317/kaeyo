-- group_membersのRLSポリシーを修正（無限再帰を解消）
-- 旧ポリシーは group_members を参照しながら group_members のRLSチェックを行うため再帰していた
drop policy if exists "group_members can access group_members" on group_members;

-- 自分自身のレコードのみ直接判定（再帰しない）
create policy "group_members can access group_members"
  on group_members for all using (
    user_id = auth.uid()
  );
