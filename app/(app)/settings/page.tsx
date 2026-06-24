"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCategories, addCategory, deleteCategory } from "@/lib/category";
import {
  getMyGroups,
  generateInviteToken,
  updateGroup,
  SELECTED_GROUP_KEY,
} from "@/lib/group";
import { deleteMyAccount } from "@/lib/account";
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from "@/lib/categoryColors";
import { GroupSwitcher } from "@/components/GroupSwitcher";
import type { Category, Group } from "@/lib/types";

// アカウント削除の確認に入力させる文字列。一致したときのみ削除を有効化する。
const DELETE_CONFIRM_WORD = "削除";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState<string>(CATEGORY_COLORS[0]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // アカウント削除用の状態。
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 選択したグループを編集対象に切り替える（名前入力・タグ一覧も連動）。
  const selectGroup = async (g: Group) => {
    setGroup(g);
    setGroupName(g.name);
    setNameSaved(false);
    setInviteUrl(null);
    setCategories(await getCategories(supabase, g.id));
  };

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? "");
      const myGroups = await getMyGroups(supabase);
      if (!myGroups || myGroups.length === 0) return;
      setGroups(myGroups);
      // メイン画面と同じ選択グループを優先する。
      const savedId =
        typeof window !== "undefined"
          ? localStorage.getItem(SELECTED_GROUP_KEY)
          : null;
      const g = myGroups.find((x) => x.id === savedId) ?? myGroups[0];
      await selectGroup(g);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSwitchGroup = async (groupId: string) => {
    const g = groups.find((x) => x.id === groupId);
    if (!g || g.id === group?.id) return;
    if (typeof window !== "undefined") {
      localStorage.setItem(SELECTED_GROUP_KEY, g.id);
    }
    setError(null);
    await selectGroup(g);
  };

  const handleSaveName = async () => {
    if (!group) return;
    const name = groupName.trim();
    if (!name || name === group.name) return;
    setError(null);
    setSavingName(true);
    try {
      await updateGroup(supabase, group.id, name);
      const updated = { ...group, name };
      setGroup(updated);
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setGroupName(name);
      setNameSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingName(false);
    }
  };

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

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSaved(false);
    if (newPassword.length < 6) {
      setPasswordError("パスワードは6文字以上で入力してください");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("パスワードが一致しません");
      return;
    }
    setSavingPassword(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setPasswordError(updateError.message);
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleGenerateInvite = async () => {
    if (!group) return;
    const token = await generateInviteToken(group.id);
    setInviteUrl(`${window.location.origin}/invite/${token}`);
  };

  const cancelDeleteAccount = () => {
    setConfirmingDelete(false);
    setDeleteConfirmText("");
    setDeleteError(null);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== DELETE_CONFIRM_WORD) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteMyAccount(supabase);
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
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

      {groups.length > 1 && (
        <section className="bg-card border border-line rounded-[18px] p-[18px] shadow-[0_12px_32px_-22px_rgba(80,50,20,.35)]">
          <h2 className="font-display font-bold text-[15px] mb-3">
            編集するリスト
          </h2>
          <GroupSwitcher
            groups={groups}
            currentGroupId={group?.id ?? ""}
            onChange={handleSwitchGroup}
          />
        </section>
      )}

      <section className="bg-card border border-line rounded-[18px] p-[18px] shadow-[0_12px_32px_-22px_rgba(80,50,20,.35)]">
        <h2 className="font-display font-bold text-[15px] mb-3">リスト名</h2>
        <div className="flex gap-2">
          <input
            value={groupName}
            onChange={(e) => {
              setGroupName(e.target.value);
              setNameSaved(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveName();
            }}
            placeholder="リストの名前"
            className="flex-1 min-w-0 px-3.5 py-2.5 border-[1.5px] border-line rounded-xl text-[15px] bg-input focus:border-accent focus:bg-white focus:outline-none"
          />
          <button
            onClick={handleSaveName}
            disabled={savingName}
            className="flex-none whitespace-nowrap px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-[14px] hover:bg-accent-hover transition disabled:opacity-50"
          >
            保存
          </button>
        </div>
        {nameSaved && <p className="text-done text-sm mt-2">保存しました</p>}
      </section>

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
            className="flex-1 min-w-0 px-3.5 py-2.5 border-[1.5px] border-line rounded-xl text-[15px] bg-input focus:border-accent focus:bg-white focus:outline-none"
          />
          <button
            onClick={handleAddCategory}
            className="flex-none whitespace-nowrap px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-[14px] hover:bg-accent-hover transition"
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

      <section className="bg-card border border-line rounded-[18px] p-[18px] shadow-[0_12px_32px_-22px_rgba(80,50,20,.35)]">
        <h2 className="font-display font-bold text-[15px] mb-3">
          登録メールアドレス
        </h2>
        <div className="bg-input border border-line rounded-xl px-3.5 py-2.5 text-[15px] break-all">
          {email || "—"}
        </div>
      </section>

      <section className="bg-card border border-line rounded-[18px] p-[18px] shadow-[0_12px_32px_-22px_rgba(80,50,20,.35)]">
        <h2 className="font-display font-bold text-[15px] mb-3">
          パスワード変更
        </h2>
        <label className="block text-[12px] font-bold text-muted-strong mb-1.5">
          新しいパスワード
        </label>
        <input
          type="password"
          placeholder="6文字以上"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setPasswordSaved(false);
          }}
          className="w-full px-3.5 py-[13px] border-[1.5px] border-line rounded-xl text-[15px] bg-input mb-3.5 transition focus:border-accent focus:bg-white focus:outline-none"
          disabled={savingPassword}
        />
        <label className="block text-[12px] font-bold text-muted-strong mb-1.5">
          パスワード（確認）
        </label>
        <input
          type="password"
          placeholder="もう一度入力"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setPasswordSaved(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleChangePassword();
          }}
          className="w-full px-3.5 py-[13px] border-[1.5px] border-line rounded-xl text-[15px] bg-input mb-3.5 transition focus:border-accent focus:bg-white focus:outline-none"
          disabled={savingPassword}
        />
        <button
          onClick={handleChangePassword}
          disabled={savingPassword}
          className="px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-[14px] hover:bg-accent-hover transition disabled:opacity-50"
        >
          {savingPassword ? "処理中..." : "変更"}
        </button>
        {passwordSaved && (
          <p className="text-done text-sm mt-2">変更しました</p>
        )}
        {passwordError && (
          <p className="text-[#d0594f] text-sm mt-2">{passwordError}</p>
        )}
      </section>

      <section className="bg-card border border-[#e7c3bd] rounded-[18px] p-[18px] shadow-[0_12px_32px_-22px_rgba(80,50,20,.35)]">
        <h2 className="font-display font-bold text-[15px] mb-3 text-[#c4493e]">
          アカウント削除
        </h2>
        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="px-4 py-2.5 rounded-xl border-[1.5px] border-[#d0594f] text-[#d0594f] font-bold text-[14px] transition hover:bg-[#d0594f] hover:text-white"
          >
            アカウントを削除
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px] text-muted-strong leading-relaxed">
              アカウントを削除すると元に戻せません。あなただけが参加している
              リストとその中身（アイテム・タグ）もすべて削除されます。他のメンバーが
              いるリストはそのまま残ります。
            </p>
            <p className="text-[13px] text-muted-strong">
              確認のため{" "}
              <span className="font-bold">{DELETE_CONFIRM_WORD}</span>{" "}
              と入力してください。
            </p>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={DELETE_CONFIRM_WORD}
              className="w-full px-3.5 py-2.5 border-[1.5px] border-line rounded-xl text-[15px] bg-input focus:border-[#d0594f] focus:bg-white focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={cancelDeleteAccount}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border-[1.5px] border-line bg-input text-[14px] font-bold transition hover:bg-[#f1e9da] disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== DELETE_CONFIRM_WORD}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#d0594f] text-white font-bold text-[14px] transition hover:opacity-90 disabled:opacity-40"
              >
                {deleting ? "削除中..." : "削除する"}
              </button>
            </div>
            {deleteError && (
              <p className="text-[#d0594f] text-sm">{deleteError}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
