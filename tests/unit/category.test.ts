import { vi } from "vitest";
import { addCategory, updateCategory, deleteCategory } from "@/lib/category";

const catResult = {
  data: { id: "c1", name: "野菜", position: 0 },
  error: null,
};

function makeMock() {
  return {
    from: vi.fn().mockImplementation(() => ({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(catResult),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })),
  } as any;
}

test("カテゴリを追加できる", async () => {
  const cat = await addCategory(makeMock(), "g1", "野菜", 0);
  expect(cat.name).toBe("野菜");
});

test("カテゴリを更新できる", async () => {
  await expect(updateCategory(makeMock(), "c1", "果物")).resolves.not.toThrow();
});

test("カテゴリを削除できる", async () => {
  await expect(deleteCategory(makeMock(), "c1")).resolves.not.toThrow();
});
