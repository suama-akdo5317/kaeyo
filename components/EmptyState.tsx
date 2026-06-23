export function EmptyState() {
  return (
    <div className="text-center py-16 px-5 text-muted">
      <svg
        width="56"
        height="56"
        viewBox="0 0 32 32"
        fill="none"
        className="mx-auto opacity-50"
      >
        <path
          d="M5 11.5h22l-2.2 14.2a2.4 2.4 0 0 1-2.37 2.05H9.57A2.4 2.4 0 0 1 7.2 25.7L5 11.5Z"
          fill="none"
          stroke="#b7a890"
          strokeWidth="2.1"
          strokeLinejoin="round"
        />
        <path
          d="M11 11.5 14.5 4M21 11.5 17.5 4"
          stroke="#b7a890"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
      <div className="font-display font-bold text-[17px] text-muted-strong mt-3">
        リストはまだ空っぽです
      </div>
      <div className="text-[13px] mt-1.5">
        上の入力欄から買うものを追加しましょう。
      </div>
    </div>
  );
}
