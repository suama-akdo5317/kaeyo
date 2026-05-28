"use client";
import type { ItemHistory } from "@/lib/types";

type Props = {
  history: ItemHistory[];
  activeItemNames: Set<string>;
  onReactivate: (name: string) => Promise<void>;
};

export function HistoryPanel({
  history,
  activeItemNames,
  onReactivate,
}: Props) {
  const available = history.filter((h) => !activeItemNames.has(h.name));
  if (available.length === 0) return null;

  return (
    <div className="p-3 bg-gray-50 border-t">
      <p className="text-xs text-gray-400 mb-2">履歴から追加</p>
      <div className="flex flex-wrap gap-2">
        {available.map((h) => (
          <button
            key={h.id}
            onClick={() => onReactivate(h.name)}
            className="text-sm bg-white border rounded-full px-3 py-1 hover:bg-blue-50"
          >
            {h.name}
          </button>
        ))}
      </div>
    </div>
  );
}
