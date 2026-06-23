import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_COLOR } from "./categoryColors";

export async function getCategories(supabase: SupabaseClient, groupId: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("group_id", groupId)
    .order("position");
  if (error) throw new Error(error.message);
  return data;
}

export async function addCategory(
  supabase: SupabaseClient,
  groupId: string,
  name: string,
  position: number,
  color: string = DEFAULT_CATEGORY_COLOR,
) {
  const { data, error } = await supabase
    .from("categories")
    .insert({ group_id: groupId, name, position, color })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** 新規グループに既定カテゴリ（色付き）をシードする */
export async function seedDefaultCategories(
  supabase: SupabaseClient,
  groupId: string,
) {
  const rows = DEFAULT_CATEGORIES.map((cat, index) => ({
    group_id: groupId,
    name: cat.name,
    position: index,
    color: cat.color,
  }));
  const { error } = await supabase.from("categories").insert(rows);
  if (error) throw new Error(error.message);
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
  if (error) throw new Error(error.message);
}

export async function deleteCategory(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
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
