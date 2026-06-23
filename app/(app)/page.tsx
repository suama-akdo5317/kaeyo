"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getItems,
  addItem,
  toggleItem,
  deleteItem,
  getItemHistory,
} from "@/lib/item";
import {
  getCategories,
  addCategory,
  seedDefaultCategories,
} from "@/lib/category";
import { getMyGroups, createGroup, SELECTED_GROUP_KEY } from "@/lib/group";
import { ItemInput } from "@/components/ItemInput";
import { CategorySection } from "@/components/CategorySection";
import { HistoryPanel } from "@/components/HistoryPanel";
import { EmptyState } from "@/components/EmptyState";
import { GroupSwitcher } from "@/components/GroupSwitcher";
import { subscribeToGroupChanges } from "@/lib/realtime";
import type { Category, Item, ItemHistory, Group } from "@/lib/types";

const BrandIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path
      d="M5 11.5h22l-2.2 14.2a2.4 2.4 0 0 1-2.37 2.05H9.57A2.4 2.4 0 0 1 7.2 25.7L5 11.5Z"
      fill="#fff"
      stroke="#d8593a"
      strokeWidth="2.1"
      strokeLinejoin="round"
    />
    <path
      d="M11 11.5 14.5 4M21 11.5 17.5 4"
      stroke="#d8593a"
      strokeWidth="2.1"
      strokeLinecap="round"
    />
    <path
      d="M13 16.5v6M19 16.5v6"
      stroke="#d8593a"
      strokeWidth="2.1"
      strokeLinecap="round"
    />
  </svg>
);

export default function MainPage() {
  const supabase = createClient();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<ItemHistory[]>([]);
  const [userName, setUserName] = useState("ゲスト");
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadGroupData = useCallback(async (g: Group) => {
    const [cats, its, hist] = await Promise.all([
      getCategories(supabase, g.id),
      getItems(supabase, g.id),
      getItemHistory(supabase, g.id),
    ]);
    setCategories(cats);
    setItems(its);
    setHistory(hist);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setUserName(user.email.split("@")[0] || "ゲスト");

      let myGroups = await getMyGroups(supabase);
      if (!myGroups || myGroups.length === 0) {
        if (!user) return;
        const newGroup = await createGroup(supabase, "マイリスト");
        await seedDefaultCategories(supabase, newGroup.id);
        myGroups = [newGroup];
      }
      setGroups(myGroups);

      // localStorage に保存された選択グループを優先（招待参加直後の表示に対応）
      const savedId =
        typeof window !== "undefined"
          ? localStorage.getItem(SELECTED_GROUP_KEY)
          : null;
      const g = myGroups.find((x) => x.id === savedId) ?? myGroups[0];
      setGroup(g);
      await loadGroupData(g);
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      setLoadError(message);
    }
  }, [loadGroupData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSwitchGroup = async (groupId: string) => {
    const g = groups.find((x) => x.id === groupId);
    if (!g || g.id === group?.id) return;
    setGroup(g);
    if (typeof window !== "undefined") {
      localStorage.setItem(SELECTED_GROUP_KEY, g.id);
    }
    try {
      await loadGroupData(g);
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      setLoadError(message);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!group) return;
    return subscribeToGroupChanges(
      supabase,
      group.id,
      () =>
        getItems(supabase, group.id)
          .then(setItems)
          .catch(() => {}),
      () =>
        getCategories(supabase, group.id)
          .then(setCategories)
          .catch(() => {}),
      // 他メンバーによるリスト名変更を反映する
      () =>
        getMyGroups(supabase)
          .then((myGroups) => {
            setGroups(myGroups);
            const updated = myGroups.find((x) => x.id === group.id);
            if (updated) setGroup(updated);
          })
          .catch(() => {}),
    );
  }, [group]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async (name: string, categoryId: string | null) => {
    if (!group) return;
    await addItem(supabase, group.id, name, categoryId);
    await load();
  };

  const handleAddCategory = async (name: string, color: string) => {
    if (!group) return;
    await addCategory(supabase, group.id, name, categories.length, color);
    setCategories(await getCategories(supabase, group.id));
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleItem(supabase, id, isActive);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_active: isActive } : i)),
    );
  };

  const handleDelete = async (id: string) => {
    await deleteItem(supabase, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
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
  const uncategorized = categorizedItems(null);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-20 bg-[rgba(244,238,226,.86)] backdrop-blur-[10px] border-b border-line">
        <div className="max-w-[1000px] mx-auto px-5 py-[13px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-[11px] bg-[#fbe7df] flex items-center justify-center flex-none">
              <BrandIcon />
            </span>
            <span className="font-display font-bold text-[19px]">
              かいものメモ
            </span>
          </div>
          <div className="flex items-center gap-3">
            <GroupSwitcher
              groups={groups}
              currentGroupId={group?.id ?? ""}
              onChange={handleSwitchGroup}
            />
            <div className="flex items-center gap-2">
              <span className="w-[30px] h-[30px] rounded-full bg-accent text-white flex items-center justify-center font-bold text-[13px] flex-none">
                {userName.charAt(0)}
              </span>
              <span className="text-[13px] text-muted-strong hidden sm:inline">
                {userName}
              </span>
            </div>
            <Link
              href="/settings"
              className="text-muted-strong opacity-80 hover:opacity-100 text-xl leading-none"
              aria-label="設定"
            >
              ⚙
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="px-[13px] py-[7px] border-[1.5px] border-[#e3d9c7] rounded-[10px] text-muted-strong text-[13px] font-medium hover:bg-[#f1e9da] transition"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-5 pt-6 pb-16 w-full">
        <ItemInput
          categories={categories}
          history={history}
          onAdd={handleAdd}
          onAddCategory={handleAddCategory}
        />

        {loadError && (
          <p className="text-[#d0594f] text-sm mb-4">{loadError}</p>
        )}

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-4 items-start">
            {categories.map((cat) => {
              const its = categorizedItems(cat.id);
              if (its.length === 0) return null;
              return (
                <CategorySection
                  key={cat.id}
                  category={cat}
                  items={its}
                  onToggleItem={handleToggle}
                  onDeleteItem={handleDelete}
                />
              );
            })}
            {uncategorized.length > 0 && (
              <CategorySection
                category={null}
                items={uncategorized}
                onToggleItem={handleToggle}
                onDeleteItem={handleDelete}
              />
            )}
          </div>
        )}

        <HistoryPanel
          history={history}
          activeItemNames={activeNames}
          onReactivate={handleReactivate}
        />
      </main>
    </div>
  );
}
