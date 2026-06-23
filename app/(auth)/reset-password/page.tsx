"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }
    if (password !== confirm) {
      setError("パスワードが一致しません");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[380px] bg-card border border-line rounded-[22px] px-8 py-[38px] shadow-[0_22px_56px_-26px_rgba(80,50,20,.4)]"
      >
        <div className="text-center mb-7">
          <div className="font-display font-bold text-[23px]">
            新しいパスワードを設定
          </div>
          <div className="text-[13px] text-muted mt-1.5">
            新しいパスワードを入力してください。
          </div>
        </div>

        <label className="block text-[12px] font-bold text-muted-strong mb-1.5">
          新しいパスワード
        </label>
        <input
          type="password"
          placeholder="6文字以上"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3.5 py-[13px] border-[1.5px] border-line rounded-xl text-[15px] bg-input mb-3.5 transition focus:border-accent focus:bg-white focus:outline-none"
          required
          disabled={loading}
        />
        <label className="block text-[12px] font-bold text-muted-strong mb-1.5">
          パスワード（確認）
        </label>
        <input
          type="password"
          placeholder="もう一度入力"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-3.5 py-[13px] border-[1.5px] border-line rounded-xl text-[15px] bg-input mb-1.5 transition focus:border-accent focus:bg-white focus:outline-none"
          required
          disabled={loading}
        />

        {error && (
          <p className="text-[12.5px] text-[#d0594f] mt-2 font-medium">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2.5 py-3.5 rounded-xl bg-accent text-white text-[15px] font-bold shadow-[0_10px_22px_-8px_rgba(216,89,58,.75)] transition hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "処理中..." : "パスワードを変更"}
        </button>
      </form>
    </div>
  );
}
