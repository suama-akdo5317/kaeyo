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
    <div className="mt-[26px] bg-card border border-line rounded-[18px] p-[18px]">
      <p className="text-[12px] text-muted mb-2.5">履歴から追加</p>
      <div className="flex flex-wrap gap-[7px]">
        {available.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => onReactivate(h.name)}
            className="text-[12.5px] px-[11px] py-[5px] rounded-full border-[1.5px] border-line bg-white text-muted-strong font-medium hover:border-accent hover:text-accent transition-all"
          >
            {h.name}
          </button>
        ))}
      </div>
    </div>
  );
}
