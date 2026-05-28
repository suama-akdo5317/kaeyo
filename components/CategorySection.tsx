"use client";
import type { Category, Item } from "@/lib/types";

type Props = {
  category: Category | null;
  items: Item[];
  onToggleItem: (id: string, isActive: boolean) => void;
};

export function CategorySection({ category, items, onToggleItem }: Props) {
  return (
    <div className="mb-4">
      {category && (
        <h2 className="text-sm font-semibold text-gray-500 px-2 mb-1">
          {category.name}
        </h2>
      )}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onToggleItem(item.id, !item.is_active)}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${
                item.is_active
                  ? "bg-white"
                  : "bg-gray-50 text-gray-400 line-through"
              }`}
            >
              <span
                className={`w-4 h-4 border-2 rounded flex-shrink-0 flex items-center justify-center ${
                  item.is_active
                    ? "border-gray-300"
                    : "border-gray-300 bg-gray-300"
                }`}
              >
                {!item.is_active && (
                  <span className="text-white text-xs">✓</span>
                )}
              </span>
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
