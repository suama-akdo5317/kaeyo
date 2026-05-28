import type { SupabaseClient } from "@supabase/supabase-js";

export async function createGroup(
  supabase: SupabaseClient,
  name: string,
  userId: string,
) {
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({ name })
    .select()
    .single();
  if (groupError) throw groupError;

  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: userId, role: "owner" });
  if (memberError) throw memberError;

  return group;
}

export async function getMyGroups(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("groups").select("*");
  if (error) throw error;
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
