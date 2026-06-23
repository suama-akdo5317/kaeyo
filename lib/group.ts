import type { SupabaseClient } from "@supabase/supabase-js";

export async function createGroup(supabase: SupabaseClient, name: string) {
  // グループ作成と作成者の owner 登録は RPC（SECURITY DEFINER）で
  // アトミックに行う。クライアントからの INSERT + returning では
  // RLS の SELECT ポリシーに弾かれるため（005 マイグレーション参照）。
  const { data, error } = await supabase.rpc("create_group_with_owner", {
    group_name: name,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function getMyGroups(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("groups").select("*");
  if (error) throw new Error(error.message);
  return data;
}

export async function generateInviteToken(groupId: string): Promise<string> {
  return btoa(`${groupId}:${Date.now()}`);
}

export function decodeInviteToken(token: string): { groupId: string } {
  const decoded = atob(token);
  const [groupId] = decoded.split(":");
  return { groupId };
}
