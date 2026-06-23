"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup" | "forgot";

function toJapaneseError(message: string): string {
  if (message.includes("Invalid login credentials"))
    return "メールアドレスまたはパスワードが正しくありません";
  if (message.includes("Email not confirmed"))
    return "メールアドレスの確認が完了していません。届いたメールをご確認ください";
  if (message.includes("User already registered"))
    return "このメールアドレスはすでに登録されています";
  if (message.includes("Password should be at least"))
    return "パスワードは6文字以上で入力してください";
  if (message.includes("invalid format") || message.includes("invalid email"))
    return "メールアドレスの形式が正しくありません";
  if (message.includes("Email rate limit exceeded"))
    return "メール送信の上限に達しました。しばらく経ってからお試しください";
  if (message.includes("over_email_send_rate_limit"))
    return "メール送信の上限に達しました。しばらく経ってからお試しください";
  return message;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
        });
        if (error) {
          setError(toJapaneseError(error.message));
        } else {
          setMessage(
            "パスワードリセット用のメールを送信しました。メールをご確認ください。",
          );
        }
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setError(toJapaneseError(error.message));
          return;
        }
        // session が null の場合はメール確認待ち
        if (!data.session) {
          setMessage(
            "確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。",
          );
          return;
        }
        router.push("/");
        router.refresh();
        return;
      }

      // login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(toJapaneseError(error.message));
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "signup"
      ? "新規登録"
      : mode === "forgot"
        ? "パスワードをリセット"
        : "ログイン";
  const subtitle =
    mode === "signup"
      ? "はじめましょう。"
      : mode === "forgot"
        ? "登録メールに再設定リンクを送ります。"
        : "買うものを、わすれない。";

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[380px] bg-card border border-line rounded-[22px] px-8 py-[38px] shadow-[0_22px_56px_-26px_rgba(80,50,20,.4)]"
      >
        <div className="flex flex-col items-center gap-3.5 mb-7">
          <span className="w-16 h-16 rounded-[20px] bg-[#fbe7df] flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <path
                d="M5 11.5h22l-2.2 14.2a2.4 2.4 0 0 1-2.37 2.05H9.57A2.4 2.4 0 0 1 7.2 25.7L5 11.5Z"
                fill="#fff"
                stroke="#d8593a"
                strokeWidth="2.1"
                strokeLinejoin="round"
              />
              <path
                d="M11 11.5 14.5 4M21 11.5 17.5 4"
                stroke="#d8593a"
                strokeWidth="2.1"
                strokeLinecap="round"
              />
              <path
                d="M13 16.5v6M19 16.5v6"
                stroke="#d8593a"
                strokeWidth="2.1"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div className="text-center">
            <div className="font-display font-bold text-[25px] tracking-[.04em]">
              {mode === "login" ? "かいものメモ" : title}
            </div>
            <div className="text-[13px] text-muted mt-1.5">{subtitle}</div>
          </div>
        </div>

        <label className="block text-[12px] font-bold text-muted-strong mb-1.5">
          メールアドレス
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3.5 py-[13px] border-[1.5px] border-line rounded-xl text-[15px] bg-input mb-3.5 transition focus:border-accent focus:bg-white focus:outline-none"
          required
          disabled={loading}
        />

        {mode !== "forgot" && (
          <>
            <label className="block text-[12px] font-bold text-muted-strong mb-1.5">
              パスワード
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-[13px] border-[1.5px] border-line rounded-xl text-[15px] bg-input mb-1.5 transition focus:border-accent focus:bg-white focus:outline-none"
              required
              disabled={loading}
            />
          </>
        )}

        {error && (
          <p className="text-[12.5px] text-[#d0594f] mt-2 font-medium">
            {error}
          </p>
        )}
        {message && (
          <p className="text-[12.5px] text-done mt-2 font-medium">{message}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2.5 py-3.5 rounded-xl bg-accent text-white text-[15px] font-bold shadow-[0_10px_22px_-8px_rgba(216,89,58,.75)] transition hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "処理中..." : title}
        </button>

        <div className="text-center mt-[18px] text-[13px] text-muted">
          {mode === "login" && (
            <>
              <div>
                アカウントがない？&nbsp;
                <span
                  onClick={() => switchMode("signup")}
                  className="text-accent font-bold cursor-pointer"
                >
                  新規登録
                </span>
              </div>
              <div className="mt-2">
                <span
                  onClick={() => switchMode("forgot")}
                  className="text-muted underline cursor-pointer"
                >
                  パスワードをお忘れの方
                </span>
              </div>
            </>
          )}
          {mode !== "login" && (
            <span
              onClick={() => switchMode("login")}
              className="text-accent font-bold cursor-pointer"
            >
              ログインに戻る
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
