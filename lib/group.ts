import type { SupabaseClient } from "@supabase/supabase-js";

// 選択中グループの localStorage キー。メイン画面と設定画面で共有する。
export const SELECTED_GROUP_KEY = "kaeyo:selectedGroupId";

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

// グループ名を更新する。RLS ポリシー（003 マイグレーション）により
// owner/member を問わずメンバーであれば UPDATE できる。
export async function updateGroup(
  supabase: SupabaseClient,
  groupId: string,
  name: string,
) {
  const { error } = await supabase
    .from("groups")
    .update({ name })
    .eq("id", groupId);
  if (error) throw new Error(error.message);
}

// 標準 Base64 には URL で問題になる文字（+ / =）が含まれるため、
// URL セーフな Base64URL（+→-, /→_, パディング除去）に変換する。
// これをしないと token に "/" が混ざり、/invite/[token] の単一動的
// セグメントが分割されてリンクが開けなくなる。
function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(base64url: string): string {
  const replaced = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (replaced.length % 4)) % 4;
  return replaced + "=".repeat(padding);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateInviteToken(groupId: string): Promise<string> {
  return toBase64Url(btoa(`${groupId}:${Date.now()}`));
}

export function decodeInviteToken(token: string): { groupId: string } {
  let decoded: string;
  try {
    decoded = atob(fromBase64Url(token));
  } catch {
    throw new Error("招待リンクが不正です");
  }
  const [groupId] = decoded.split(":");
  if (!groupId || !UUID_RE.test(groupId)) {
    throw new Error("招待リンクが不正です");
  }
  return { groupId };
}
