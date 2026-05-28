import type { SupabaseClient } from "@supabase/supabase-js";

export async function getItems(supabase: SupabaseClient, groupId: string) {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function addItem(
  supabase: SupabaseClient,
  groupId: string,
  name: string,
  categoryId: string | null,
) {
  const { data, error } = await supabase
    .from("items")
    .insert({
      group_id: groupId,
      name,
      category_id: categoryId,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;

  await supabase
    .from("item_history")
    .upsert({ group_id: groupId, name }, { onConflict: "group_id,name" });

  return data;
}

export async function toggleItem(
  supabase: SupabaseClient,
  id: string,
  isActive: boolean,
) {
  const { error } = await supabase
    .from("items")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteItem(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
}

export async function getItemHistory(
  supabase: SupabaseClient,
  groupId: string,
) {
  const { data, error } = await supabase
    .from("item_history")
    .select("*")
    .eq("group_id", groupId)
    .order("name");
  if (error) throw error;
  return data;
}
