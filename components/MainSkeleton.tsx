// 初回データ読み込み中に表示するスケルトン。空状態のチラ見えを防ぐ。
export function MainSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden>
      {/* 入力カード */}
      <div className="bg-card border border-line rounded-[18px] p-[18px] mb-[26px] shadow-[0_12px_32px_-22px_rgba(80,50,20,.35)]">
        <div className="h-[46px] rounded-xl bg-[#efe7d8] mb-3" />
        <div className="h-[46px] w-32 rounded-xl bg-[#efe7d8]" />
      </div>

      {/* タグ別ブロック */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-4 items-start">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-card border border-line rounded-2xl overflow-hidden"
          >
            <div className="flex items-center gap-[9px] px-4 py-[13px] border-b border-[#f1e9da]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e3d9c7] flex-none" />
              <span className="h-3.5 w-24 rounded bg-[#e3d9c7]" />
            </div>
            <div className="px-4 py-[15px] space-y-3.5">
              <div className="h-4 w-3/4 rounded bg-[#efe7d8]" />
              <div className="h-4 w-2/3 rounded bg-[#efe7d8]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
