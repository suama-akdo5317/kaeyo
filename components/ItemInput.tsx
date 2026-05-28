"use client";
import { useState } from "react";
import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  onAdd: (name: string, categoryId: string | null) => Promise<void>;
};

export function ItemInput({ categories, onAdd }: Props) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd(name.trim(), categoryId);
    setName("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 bg-white border-b">
      <select
        value={categoryId ?? ""}
        onChange={(e) => setCategoryId(e.target.value || null)}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="">カテゴリなし</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="品名を入力..."
        className="flex-1 border rounded px-3 py-1"
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-1 rounded"
      >
        追加
      </button>
    </form>
  );
}
