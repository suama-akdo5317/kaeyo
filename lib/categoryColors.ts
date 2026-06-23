// index.html の TAG_COLORS / TAG_ORDER を踏襲した共有定数

/** カテゴリ色のパレット（設定画面の色選択・フォールバックに利用） */
export const CATEGORY_COLORS = [
  "#5aa469", // 緑
  "#e0902f", // 橙
  "#d0594f", // 赤
  "#4a90c2", // 青
  "#b07a3a", // 茶
  "#b06bb0", // 紫
  "#c98a3a", // 黄土
  "#948a7c", // グレー（その他）
] as const;

/** 既定カテゴリ色（未分類・フォールバック用） */
export const DEFAULT_CATEGORY_COLOR = "#948a7c";

/** 新規グループ作成時にシードする初期カテゴリ（index.html の固定タグ相当） */
export const DEFAULT_CATEGORIES: { name: string; color: string }[] = [
  { name: "野菜", color: "#5aa469" },
  { name: "果物", color: "#e0902f" },
  { name: "肉・魚", color: "#d0594f" },
  { name: "飲み物", color: "#4a90c2" },
  { name: "調味料", color: "#b07a3a" },
  { name: "お菓子", color: "#b06bb0" },
  { name: "日用品", color: "#c98a3a" },
];

/** position からパレットを循環選択（色未指定時のフォールバック） */
export function pickColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}
