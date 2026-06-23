"use client";
import { useState } from "react";
import type { Category, ItemHistory } from "@/lib/types";
import { pickColor } from "@/lib/categoryColors";

type Props = {
  categories: Category[];
  history: ItemHistory[];
  onAdd: (name: string, categoryId: string | null) => Promise<void>;
  onAddCategory: (name: string, color: string) => Promise<void>;
};

export function ItemInput({
  categories,
  history,
  onAdd,
  onAddCategory,
}: Props) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [catError, setCatError] = useState<string | null>(null);

  const query = name.trim();
  const suggestions =
    focused && query
      ? history
          .filter((h) => h.name.includes(query) && h.name !== query)
          .slice(0, 6)
      : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd(name.trim(), categoryId);
    setName("");
    setCategoryId(null);
    setFocused(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatError(null);
    try {
      await onAddCategory(newCatName.trim(), pickColor(categories.length));
      setNewCatName("");
      setAddingCat(false);
    } catch (err) {
      setCatError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="bg-card border border-line rounded-[18px] p-[18px] shadow-[0_12px_32px_-22px_rgba(80,50,20,.35)] mb-[26px]">
      <form
        onSubmit={handleSubmit}
        className="flex gap-2.5 flex-wrap items-start"
      >
        <div className="relative flex-[2_1_220px] min-w-0">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 130)}
            placeholder="牛乳、たまご、トマト…"
            className="w-full px-3.5 py-[13px] border-[1.5px] border-line rounded-xl text-[15px] bg-input transition focus:border-accent focus:bg-white focus:outline-none"
          />
          {suggestions.length > 0 && (
            <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-line rounded-[13px] shadow-[0_16px_36px_-16px_rgba(80,50,20,.45)] overflow-hidden z-30">
              <div className="px-3.5 pt-[7px] pb-[5px] text-[10.5px] font-bold tracking-[.08em] text-[#bcae99]">
                これまでの入力
              </div>
              {suggestions.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setName(h.name);
                    setFocused(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-[14.5px] flex items-center gap-2.5 hover:bg-[#fdf6ee] transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="#c3b59f"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 7.5v5l3 1.8"
                      stroke="#c3b59f"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {h.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          className="flex-none px-[22px] py-[13px] rounded-xl bg-accent text-white text-[15px] font-bold flex items-center gap-[7px] shadow-[0_9px_20px_-8px_rgba(216,89,58,.7)] transition hover:bg-accent-hover whitespace-nowrap"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
          追加
        </button>
      </form>

      <div className="flex flex-wrap gap-[7px] mt-[13px] items-center">
        <span className="text-[12px] text-muted mr-0.5 whitespace-nowrap flex-none">
          タグ:
        </span>
        {categories.map((cat) => {
          const active = categoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(active ? null : cat.id)}
              className="text-[12.5px] px-[11px] py-[5px] rounded-full cursor-pointer font-medium border-[1.5px] transition-all"
              style={
                active
                  ? {
                      borderColor: cat.color,
                      background: cat.color,
                      color: "#fff",
                    }
                  : {
                      borderColor: "#e8dfce",
                      background: "#fff",
                      color: "#6f665a",
                    }
              }
            >
              {cat.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setAddingCat((v) => !v);
            setCatError(null);
          }}
          className="text-[12.5px] px-[11px] py-[5px] rounded-full border-[1.5px] border-dashed border-[#d7c9b3] text-muted hover:border-accent hover:text-accent transition-all"
          title="カテゴリを追加"
        >
          ＋タグ
        </button>
      </div>

      {addingCat && (
        <form
          onSubmit={handleAddCategory}
          className="flex gap-2 mt-2.5 items-center"
        >
          <input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="新しいタグ名"
            className="flex-1 px-3 py-2 border-[1.5px] border-line rounded-xl text-sm bg-input focus:border-accent focus:bg-white focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-done text-white text-sm font-bold"
          >
            作成
          </button>
          <button
            type="button"
            onClick={() => {
              setAddingCat(false);
              setNewCatName("");
              setCatError(null);
            }}
            className="text-muted text-sm px-2"
          >
            キャンセル
          </button>
          {catError && <p className="text-[#d0594f] text-xs">{catError}</p>}
        </form>
      )}
    </div>
  );
}
