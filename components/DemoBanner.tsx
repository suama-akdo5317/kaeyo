"use client";
import Link from "next/link";

type Props = {
  onReset: () => void;
};

/** デモモードであることを伝え、ログインへ誘導するバナー */
export function DemoBanner({ onReset }: Props) {
  return (
    <div className="mb-[26px] bg-[#fbe7df] border border-[#f0cdbf] rounded-[18px] px-[18px] py-4 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[200px]">
        <p className="font-display font-bold text-[15px] text-[#b8482c]">
          これはデモです
        </p>
        <p className="text-[13px] text-muted-strong mt-0.5">
          編集内容はこの端末にのみ保存されます。保存してみんなで共有するにはログインしてください。
        </p>
      </div>
      <div className="flex items-center gap-2.5 flex-none">
        <button
          type="button"
          onClick={onReset}
          className="text-[13px] text-muted-strong hover:text-accent transition-colors px-2 py-2"
        >
          デモをリセット
        </button>
        <Link
          href="/login"
          className="px-[18px] py-2.5 rounded-xl bg-accent text-white text-[14px] font-bold whitespace-nowrap shadow-[0_9px_20px_-8px_rgba(216,89,58,.7)] transition hover:bg-accent-hover"
        >
          ログイン / 新規登録
        </Link>
      </div>
    </div>
  );
}
