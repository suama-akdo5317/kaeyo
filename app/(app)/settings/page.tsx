"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getCategories, addCategory, deleteCategory } from "@/lib/category";
import { getMyGroups, generateInviteToken } from "@/lib/group";
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from "@/lib/categoryColors";
import type { Category, Group } from "@/lib/types";

export default function SettingsPage() {
  const supabase = createClient();
  const [group, setGroup] = useState<Group | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState<string>(CATEGORY_COLORS[0]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      await addCategory(
        supabase,
        group.id,
        newCatName.trim(),
        categories.length,
        newCatColor,
      );
      setCategories(await getCategories(supabase, group.id));
      setNewCatName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
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
    <div className="max-w-[560px] mx-auto px-5 py-6 w-full space-y-7">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-muted-strong hover:text-accent text-xl leading-none"
          aria-label="戻る"
        >
          ←
        </Link>
        <h1 className="font-display font-bold text-[22px]">設定</h1>
      </div>

      <section className="bg-card border border-line rounded-[18px] p-[18px] shadow-[0_12px_32px_-22px_rgba(80,50,20,.35)]">
        <h2 className="font-display font-bold text-[15px] mb-3">タグ</h2>
        <ul className="space-y-2 mb-3.5">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="flex justify-between items-center bg-input border border-line rounded-xl px-3.5 py-2.5"
            >
              <span className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-none"
                  style={{ background: cat.color ?? DEFAULT_CATEGORY_COLOR }}
                />
                <span className="text-[15px]">{cat.name}</span>
              </span>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="text-[#cdbfa9] hover:text-[#a0917e] text-[19px] leading-none px-1 transition-colors"
                aria-label="削除"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setNewCatColor(color)}
              className={`w-7 h-7 rounded-full transition-all ${
                newCatColor === color
                  ? "ring-2 ring-offset-2 ring-offset-card"
                  : ""
              }`}
              style={{
                background: color,
                ...(newCatColor === color
                  ? ({ "--tw-ring-color": color } as React.CSSProperties)
                  : {}),
              }}
              aria-label={`色 ${color}`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddCategory();
            }}
            placeholder="新しいタグ名"
            className="flex-1 px-3.5 py-2.5 border-[1.5px] border-line rounded-xl text-[15px] bg-input focus:border-accent focus:bg-white focus:outline-none"
          />
          <button
            onClick={handleAddCategory}
            className="px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-[14px] hover:bg-accent-hover transition"
          >
            追加
          </button>
        </div>
        {error && <p className="text-[#d0594f] text-sm mt-2">{error}</p>}
      </section>

      <section className="bg-card border border-line rounded-[18px] p-[18px] shadow-[0_12px_32px_-22px_rgba(80,50,20,.35)]">
        <h2 className="font-display font-bold text-[15px] mb-3">
          メンバー招待
        </h2>
        <button
          onClick={handleGenerateInvite}
          className="px-4 py-2.5 rounded-xl bg-done text-white font-bold text-[14px] transition hover:opacity-90"
        >
          招待リンクを生成
        </button>
        {inviteUrl && (
          <div className="mt-3 p-3 bg-input border border-line rounded-xl text-sm break-all">
            <p className="text-muted mb-1">このリンクをシェアしてください：</p>
            <p className="font-mono text-[13px]">{inviteUrl}</p>
            <button
              onClick={() => navigator.clipboard.writeText(inviteUrl)}
              className="mt-1.5 text-accent text-xs font-bold underline"
            >
              コピー
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
