"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getItems, addItem, toggleItem, getItemHistory } from "@/lib/item";
import { getCategories } from "@/lib/category";
import { getMyGroups } from "@/lib/group";
import { ItemInput } from "@/components/ItemInput";
import { CategorySection } from "@/components/CategorySection";
import { HistoryPanel } from "@/components/HistoryPanel";
import { subscribeToGroupChanges } from "@/lib/realtime";
import type { Category, Item, ItemHistory, Group } from "@/lib/types";

export default function MainPage() {
  const supabase = createClient();
  const [group, setGroup] = useState<Group | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<ItemHistory[]>([]);

  const load = useCallback(async () => {
    const groups = await getMyGroups(supabase);
    if (!groups || groups.length === 0) return;
    const g = groups[0];
    setGroup(g);
    const [cats, its, hist] = await Promise.all([
      getCategories(supabase, g.id),
      getItems(supabase, g.id),
      getItemHistory(supabase, g.id),
    ]);
    setCategories(cats);
    setItems(its);
    setHistory(hist);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!group) return;
    return subscribeToGroupChanges(
      supabase,
      group.id,
      () => getItems(supabase, group.id).then(setItems),
      () => getCategories(supabase, group.id).then(setCategories),
    );
  }, [group]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async (name: string, categoryId: string | null) => {
    if (!group) return;
    await addItem(supabase, group.id, name, categoryId);
    await load();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleItem(supabase, id, isActive);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_active: isActive } : i)),
    );
  };

  const handleReactivate = async (name: string) => {
    if (!group) return;
    await addItem(supabase, group.id, name, null);
    await load();
  };

  const activeNames = new Set(
    items.filter((i) => i.is_active).map((i) => i.name),
  );
  const categorizedItems = (catId: string | null) =>
    items.filter((i) => i.category_id === catId);

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      <header className="bg-blue-500 text-white px-4 py-3 flex justify-between items-center">
        <span className="font-bold">{group?.name ?? "読み込み中..."}</span>
      </header>
      <ItemInput categories={categories} onAdd={handleAdd} />
      <main className="flex-1 overflow-y-auto p-2">
        {categories.map((cat) => {
          const its = categorizedItems(cat.id);
          if (its.length === 0) return null;
          return (
            <CategorySection
              key={cat.id}
              category={cat}
              items={its}
              onToggleItem={handleToggle}
            />
          );
        })}
        {categorizedItems(null).length > 0 && (
          <CategorySection
            category={null}
            items={categorizedItems(null)}
            onToggleItem={handleToggle}
          />
        )}
      </main>
      <HistoryPanel
        history={history}
        activeItemNames={activeNames}
        onReactivate={handleReactivate}
      />
    </div>
  );
}
