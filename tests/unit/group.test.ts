import { vi } from "vitest";
import { createGroup, getMyGroups } from "@/lib/group";

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
