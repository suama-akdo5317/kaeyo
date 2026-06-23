import { vi } from "vitest";
import {
  createGroup,
  getMyGroups,
  updateGroup,
  generateInviteToken,
  decodeInviteToken,
} from "@/lib/group";

const groupRow = { id: "g1", name: "テスト家族" };
const listResult = { data: [groupRow], error: null };

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockResolvedValue(listResult),
  rpc: vi.fn().mockResolvedValue({ data: groupRow, error: null }),
} as any;

test("グループを作成できる（RPC create_group_with_owner を呼ぶ）", async () => {
  const group = await createGroup(mockSupabase, "テスト家族");
  expect(mockSupabase.rpc).toHaveBeenCalledWith("create_group_with_owner", {
    group_name: "テスト家族",
  });
  expect(group.name).toBe("テスト家族");
});

test("グループ一覧を取得できる", async () => {
  const groups = await getMyGroups(mockSupabase);
  expect(groups).toHaveLength(1);
});

test("グループ名を更新できる", async () => {
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq });
  const supabase = { from: vi.fn().mockReturnValue({ update }) } as any;

  await updateGroup(supabase, "g1", "新しい名前");

  expect(supabase.from).toHaveBeenCalledWith("groups");
  expect(update).toHaveBeenCalledWith({ name: "新しい名前" });
  expect(eq).toHaveBeenCalledWith("id", "g1");
});

test("グループ名更新でエラーが返ると例外を投げる", async () => {
  const eq = vi.fn().mockResolvedValue({ error: { message: "更新失敗" } });
  const update = vi.fn().mockReturnValue({ eq });
  const supabase = { from: vi.fn().mockReturnValue({ update }) } as any;

  await expect(updateGroup(supabase, "g1", "新しい名前")).rejects.toThrow(
    "更新失敗",
  );
});

test("招待トークンを生成・デコードできる（round-trip）", async () => {
  const groupId = "550e8400-e29b-41d4-a716-446655440000";
  const token = await generateInviteToken(groupId);
  expect(decodeInviteToken(token)).toEqual({ groupId });
});

test("招待トークンは URL セーフ（/ + = を含まない）", async () => {
  // / + = を生みやすい複数の UUID で検証
  const ids = [
    "ffffffff-ffff-ffff-ffff-ffffffffffff",
    "0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
    "12345678-90ab-cdef-1234-567890abcdef",
  ];
  for (const id of ids) {
    const token = await generateInviteToken(id);
    expect(token).not.toMatch(/[/+=]/);
    expect(decodeInviteToken(token)).toEqual({ groupId: id });
  }
});

test("不正な招待トークンは例外を投げる", () => {
  expect(() => decodeInviteToken("!!!not-base64!!!")).toThrow();
  // UUID 形式でない groupId
  const badToken = btoa("not-a-uuid:123")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  expect(() => decodeInviteToken(badToken)).toThrow();
});
