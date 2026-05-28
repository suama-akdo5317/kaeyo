import { vi } from "vitest";
import { createGroup, getMyGroups } from "@/lib/group";

const singleResult = { data: { id: "g1", name: "テスト家族" }, error: null };
const listResult = { data: [{ id: "g1", name: "テスト家族" }], error: null };

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue(singleResult),
} as any;

mockSupabase.from.mockImplementation((table: string) => {
  if (table === "groups") {
    return {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(singleResult),
        }),
      }),
      select: vi.fn().mockResolvedValue(listResult),
    };
  }
  return {
    insert: vi.fn().mockResolvedValue({ error: null }),
  };
});

test("グループを作成できる", async () => {
  const group = await createGroup(mockSupabase, "テスト家族", "user1");
  expect(group.name).toBe("テスト家族");
});

test("グループ一覧を取得できる", async () => {
  const groups = await getMyGroups(mockSupabase);
  expect(groups).toHaveLength(1);
});
