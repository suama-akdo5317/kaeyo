import type { SupabaseClient } from "@supabase/supabase-js";

export function subscribeToGroupChanges(
  supabase: SupabaseClient,
  groupId: string,
  onItemChange: () => void,
  onCategoryChange: () => void,
) {
  const channel = supabase
    .channel(`group:${groupId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "items",
        filter: `group_id=eq.${groupId}`,
      },
      () => onItemChange(),
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "categories",
        filter: `group_id=eq.${groupId}`,
      },
      () => onCategoryChange(),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
