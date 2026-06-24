"use client";
import { useSyncExternalStore } from "react";
import { ItemInput } from "@/components/ItemInput";
import { CategorySection } from "@/components/CategorySection";
import { HistoryPanel } from "@/components/HistoryPanel";
import { EmptyState } from "@/components/EmptyState";
import { MainSkeleton } from "@/components/MainSkeleton";
import { BrandIcon } from "@/components/BrandIcon";
import { DemoBanner } from "@/components/DemoBanner";
import {
  subscribeDemo,
  getDemoSnapshot,
  getDemoServerSnapshot,
  DEMO_INITIAL_SNAPSHOT,
  demoAddItem,
  demoToggleItem,
  demoDeleteItem,
  demoAddCategory,
  demoReactivate,
  demoReset,
} from "@/lib/demo";

export function DemoApp() {
  // localStorage を外部ストアとして購読。SSR/ハイドレーション初回は
  // 固定スナップショット（DEMO_INITIAL_SNAPSHOT）を共有し、ミスマッチを防ぐ。
  const state = useSyncExternalStore(
    subscribeDemo,
    getDemoSnapshot,
    getDemoServerSnapshot,
  );
  const hydrating = state === DEMO_INITIAL_SNAPSHOT;

  const { categories, items, history } = state;
  const activeNames = new Set(
    items.filter((i) => i.is_active).map((i) => i.name),
  );
  const categorizedItems = (catId: string | null) =>
    items.filter((i) => i.category_id === catId);
  const uncategorized = categorizedItems(null);

  const handleAdd = async (name: string, categoryId: string | null) => {
    demoAddItem(name, categoryId);
  };
  const handleAddCategory = async (name: string, color: string) => {
    demoAddCategory(name, color);
  };
  const handleReactivate = async (name: string) => {
    demoReactivate(name);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-20 bg-[rgba(244,238,226,.86)] backdrop-blur-[10px] border-b border-line">
        <div className="max-w-[1000px] mx-auto px-5 py-[13px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-[11px] bg-[#fbe7df] flex items-center justify-center flex-none">
              <BrandIcon />
            </span>
            <span className="font-display font-bold text-[19px]">Kaeyo</span>
            <span className="text-[11px] font-bold tracking-[.06em] text-[#b8482c] bg-[#fbe7df] border border-[#f0cdbf] rounded-full px-2 py-0.5">
              DEMO
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-5 pt-6 pb-16 w-full">
        {hydrating ? (
          <MainSkeleton />
        ) : (
          <>
            <DemoBanner onReset={demoReset} />

            <ItemInput
              categories={categories}
              history={history}
              onAdd={handleAdd}
              onAddCategory={handleAddCategory}
            />

            {items.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-4 items-start">
                {categories.map((cat) => {
                  const its = categorizedItems(cat.id);
                  if (its.length === 0) return null;
                  return (
                    <CategorySection
                      key={cat.id}
                      category={cat}
                      items={its}
                      onToggleItem={demoToggleItem}
                      onDeleteItem={demoDeleteItem}
                    />
                  );
                })}
                {uncategorized.length > 0 && (
                  <CategorySection
                    category={null}
                    items={uncategorized}
                    onToggleItem={demoToggleItem}
                    onDeleteItem={demoDeleteItem}
                  />
                )}
              </div>
            )}

            <HistoryPanel
              history={history}
              activeItemNames={activeNames}
              onReactivate={handleReactivate}
            />
          </>
        )}
      </main>
    </div>
  );
}
