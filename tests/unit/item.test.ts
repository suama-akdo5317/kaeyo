import { vi } from "vitest";
import { addItem, toggleItem, deleteItem } from "@/lib/item";

const itemResult = {
  data: { id: "i1", name: "牛乳", is_active: true },
  error: null,
};

function makeMock() {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "items") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(itemResult),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
    }),
  } as any;
}

test("アイテムを追加できる", async () => {
  const item = await addItem(makeMock(), "g1", "牛乳", null);
  expect(item.name).toBe("牛乳");
  expect(item.is_active).toBe(true);
});

test("アイテムのアクティブ状態を切り替えられる", async () => {
  await expect(toggleItem(makeMock(), "i1", false)).resolves.not.toThrow();
});

test("アイテムを削除できる", async () => {
  await expect(deleteItem(makeMock(), "i1")).resolves.not.toThrow();
});
