import type { SupabaseClient } from "@supabase/supabase-js";

export async function getCategories(supabase: SupabaseClient, groupId: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("group_id", groupId)
    .order("position");
  if (error) throw error;
  return data;
}

export async function addCategory(
  supabase: SupabaseClient,
  groupId: string,
  name: string,
  position: number,
) {
  const { data, error } = await supabase
    .from("categories")
    .insert({ group_id: groupId, name, position })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(
  supabase: SupabaseClient,
  id: string,
  name: string,
) {
  const { error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderCategories(
  supabase: SupabaseClient,
  ids: string[],
) {
  await Promise.all(
    ids.map((id, index) =>
      supabase.from("categories").update({ position: index }).eq("id", id),
    ),
  );
}
