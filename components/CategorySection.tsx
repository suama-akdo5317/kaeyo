"use client";
import type { Category, Item } from "@/lib/types";
import { DEFAULT_CATEGORY_COLOR } from "@/lib/categoryColors";

type Props = {
  category: Category | null;
  items: Item[];
  onToggleItem: (id: string, isActive: boolean) => void;
  onDeleteItem: (id: string) => void;
};

export function CategorySection({
  category,
  items,
  onToggleItem,
  onDeleteItem,
}: Props) {
  // 未完了を上に、完了を下に
  const sorted = [...items].sort(
    (a, b) => (a.is_active ? 0 : 1) - (b.is_active ? 0 : 1),
  );
  const remaining = items.filter((i) => i.is_active).length;
  const color = category?.color ?? DEFAULT_CATEGORY_COLOR;
  const name = category?.name ?? "その他";

  return (
    <div className="bg-card border border-line rounded-2xl overflow-hidden">
      <div className="flex items-center gap-[9px] px-4 py-[13px] border-b border-[#f1e9da]">
        <span
          className="flex-none w-2.5 h-2.5 rounded-full"
          style={{ background: color }}
        />
        <span className="font-display font-bold text-[15px]">{name}</span>
        <span className="ml-auto text-[12px] text-muted tabular-nums">
          残り {remaining} / {items.length}
        </span>
      </div>
      <div>
        {sorted.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-[11px] px-4 py-[11px] border-b border-[#f5efe3] last:border-b-0"
          >
            <button
              type="button"
              onClick={() => onToggleItem(item.id, !item.is_active)}
              className={`flex-none w-[22px] h-[22px] rounded-[7px] flex items-center justify-center transition-all ${
                item.is_active
                  ? "border-2 border-[#d7cab4] bg-transparent"
                  : "border-0 bg-done"
              }`}
              aria-label="完了切り替え"
            >
              {!item.is_active && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="#fff"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <span
              onClick={() => onToggleItem(item.id, !item.is_active)}
              className={`flex-1 text-[15px] cursor-pointer transition-colors ${
                item.is_active
                  ? "text-foreground"
                  : "text-[#b8ad9c] line-through"
              }`}
            >
              {item.name}
            </span>
            <button
              type="button"
              onClick={() => onDeleteItem(item.id)}
              className="ml-auto text-[#cdbfa9] hover:text-[#a0917e] text-[19px] leading-none px-[3px] transition-colors"
              aria-label="削除"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
