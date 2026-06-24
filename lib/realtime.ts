import type { SupabaseClient } from "@supabase/supabase-js";

export function subscribeToGroupChanges(
  supabase: SupabaseClient,
  groupId: string,
  onItemChange: () => void,
  onCategoryChange: () => void,
  onGroupChange?: () => void,
) {
  let channel = supabase
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
    );

  // グループ名などの変更を他メンバーへ反映する（呼び出し側が必要なときのみ）。
  if (onGroupChange) {
    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "groups",
        filter: `id=eq.${groupId}`,
      },
      () => onGroupChange(),
    );
  }

  channel.subscribe((status, err) => {
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      console.error("[realtime] subscription failed:", status, err);
    }
  });

  return () => {
    supabase.removeChannel(channel);
  };
}
