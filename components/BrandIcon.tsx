type Props = { size?: number };

/** Kaeyo の買い物カゴロゴ（ヘッダー共通） */
export function BrandIcon({ size = 22 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
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
  );
}
