import { vi } from "vitest";
import {
  addCategory,
  updateCategory,
  deleteCategory,
  seedDefaultCategories,
} from "@/lib/category";
import { DEFAULT_CATEGORIES } from "@/lib/categoryColors";

const catResult = {
  data: { id: "c1", name: "野菜", position: 0, color: "#5aa469" },
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

test("カテゴリを色付きで追加できる", async () => {
  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue(catResult),
    }),
  });
  const supabase = { from: vi.fn().mockReturnValue({ insert }) } as any;
  const cat = await addCategory(supabase, "g1", "野菜", 0, "#5aa469");
  expect(cat.name).toBe("野菜");
  expect(insert).toHaveBeenCalledWith({
    group_id: "g1",
    name: "野菜",
    position: 0,
    color: "#5aa469",
  });
});

test("色未指定時は既定色が使われる", async () => {
  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue(catResult),
    }),
  });
  const supabase = { from: vi.fn().mockReturnValue({ insert }) } as any;
  await addCategory(supabase, "g1", "その他", 0);
  expect(insert).toHaveBeenCalledWith(
    expect.objectContaining({ color: "#948a7c" }),
  );
});

test("既定カテゴリをシードできる", async () => {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const supabase = { from: vi.fn().mockReturnValue({ insert }) } as any;
  await expect(seedDefaultCategories(supabase, "g1")).resolves.not.toThrow();
  const rows = insert.mock.calls[0][0];
  expect(rows).toHaveLength(DEFAULT_CATEGORIES.length);
  expect(rows[0]).toMatchObject({ group_id: "g1", position: 0 });
});

test("カテゴリを更新できる", async () => {
  await expect(updateCategory(makeMock(), "c1", "果物")).resolves.not.toThrow();
});

test("カテゴリを削除できる", async () => {
  await expect(deleteCategory(makeMock(), "c1")).resolves.not.toThrow();
});
