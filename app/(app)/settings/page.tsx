"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCategories, addCategory, deleteCategory } from "@/lib/category";
import { getMyGroups, generateInviteToken } from "@/lib/group";
import type { Category, Group } from "@/lib/types";

export default function SettingsPage() {
  const supabase = createClient();
  const [group, setGroup] = useState<Group | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const groups = await getMyGroups(supabase);
      if (!groups || groups.length === 0) return;
      setGroup(groups[0]);
      setCategories(await getCategories(supabase, groups[0].id));
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddCategory = async () => {
    if (!group || !newCatName.trim()) return;
    await addCategory(supabase, group.id, newCatName.trim(), categories.length);
    setCategories(await getCategories(supabase, group.id));
    setNewCatName("");
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(supabase, id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleGenerateInvite = async () => {
    if (!group) return;
    const token = await generateInviteToken(group.id);
    setInviteUrl(`${window.location.origin}/invite/${token}`);
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold">設定</h1>

      <section>
        <h2 className="font-semibold mb-2">カテゴリ</h2>
        <ul className="space-y-1 mb-2">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="flex justify-between items-center bg-white border rounded px-3 py-2"
            >
              <span>{cat.name}</span>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="text-red-400 text-sm"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="新しいカテゴリ名"
            className="flex-1 border rounded px-3 py-1"
          />
          <button
            onClick={handleAddCategory}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            追加
          </button>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">メンバー招待</h2>
        <button
          onClick={handleGenerateInvite}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          招待リンクを生成
        </button>
        {inviteUrl && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-sm break-all">
            <p className="text-gray-600 mb-1">
              このリンクをシェアしてください：
            </p>
            <p className="font-mono">{inviteUrl}</p>
            <button
              onClick={() => navigator.clipboard.writeText(inviteUrl)}
              className="mt-1 text-blue-500 text-xs underline"
            >
              コピー
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
