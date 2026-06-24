import {
  seedDemoState,
  addItemToState,
  toggleItemInState,
  deleteItemFromState,
  addCategoryToState,
  reactivateInState,
  DEMO_GROUP_ID,
} from "@/lib/demo";

test("seed はデフォルトカテゴリとサンプルアイテム・履歴を生成する", () => {
  const s = seedDemoState();
  expect(s.categories.length).toBeGreaterThan(0);
  expect(s.items.length).toBeGreaterThan(0);
  expect(s.history.length).toBeGreaterThan(0);
  // 全レコードがデモグループに属する
  expect(s.categories.every((c) => c.group_id === DEMO_GROUP_ID)).toBe(true);
  expect(s.items.every((i) => i.group_id === DEMO_GROUP_ID)).toBe(true);
});

test("アイテムを追加すると items と履歴に反映される", () => {
  const s = seedDemoState();
  const next = addItemToState(s, "ヨーグルト", null);
  expect(next.items.some((i) => i.name === "ヨーグルト")).toBe(true);
  expect(next.history.some((h) => h.name === "ヨーグルト")).toBe(true);
  // 元の状態は変更されない（イミュータブル）
  expect(s.items.some((i) => i.name === "ヨーグルト")).toBe(false);
});

test("同名の履歴は重複追加されない", () => {
  const s = seedDemoState();
  const added = addItemToState(s, "ヨーグルト", null);
  const before = added.history.filter((h) => h.name === "ヨーグルト").length;
  const again = addItemToState(added, "ヨーグルト", null);
  const after = again.history.filter((h) => h.name === "ヨーグルト").length;
  expect(before).toBe(1);
  expect(after).toBe(1);
});

test("アイテムの完了状態を切り替えられる", () => {
  const s = addItemToState(seedDemoState(), "パン", null);
  const target = s.items.find((i) => i.name === "パン")!;
  const next = toggleItemInState(s, target.id, false);
  expect(next.items.find((i) => i.id === target.id)!.is_active).toBe(false);
});

test("アイテムを削除できる", () => {
  const s = addItemToState(seedDemoState(), "パン", null);
  const target = s.items.find((i) => i.name === "パン")!;
  const next = deleteItemFromState(s, target.id);
  expect(next.items.some((i) => i.id === target.id)).toBe(false);
});

test("カテゴリを追加できる", () => {
  const s = seedDemoState();
  const next = addCategoryToState(s, "冷凍食品", "#4a90c2");
  const added = next.categories.find((c) => c.name === "冷凍食品");
  expect(added).toBeDefined();
  expect(added!.position).toBe(s.categories.length);
});

test("履歴から再追加すると未分類の新規アイテムになる", () => {
  const s = seedDemoState();
  const next = reactivateInState(s, "食パン");
  const item = next.items.find((i) => i.name === "食パン");
  expect(item).toBeDefined();
  expect(item!.category_id).toBeNull();
  expect(item!.is_active).toBe(true);
});
