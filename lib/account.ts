import type { SupabaseClient } from "@supabase/supabase-js";

// 自己アカウントを削除する。auth.users の削除と、無人になったグループの
// 削除を 1 トランザクションで行う RPC（SECURITY DEFINER）を呼ぶ。
// 詳細は 006 マイグレーション参照。
export async function deleteMyAccount(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw new Error(error.message);
}
