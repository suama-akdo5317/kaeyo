// 非ログイン時のデモモード用ローカルデータ層。
// Supabase に一切依存せず、状態は localStorage（kaeyo:demo:*）に保持する。
// 状態変換は純関数（イミュータブル）として実装し、localStorage I/O は別途ラップする。
import type { Category, Item, ItemHistory } from "@/lib/types";
import { DEFAULT_CATEGORIES, pickColor } from "@/lib/categoryColors";

/** デモのダミーグループ ID（全レコード共通） */
export const DEMO_GROUP_ID = "demo";

const STORAGE_KEYS = {
  categories: "kaeyo:demo:categories",
  items: "kaeyo:demo:items",
  history: "kaeyo:demo:history",
} as const;

export type DemoState = {
  categories: Category[];
  items: Item[];
  history: ItemHistory[];
};

function newId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

/** デフォルトカテゴリ＋数件のサンプルアイテムで初期状態を生成する */
export function seedDemoState(): DemoState {
  const categories: Category[] = DEFAULT_CATEGORIES.map((c, i) => ({
    id: newId(),
    group_id: DEMO_GROUP_ID,
    name: c.name,
    position: i,
    color: c.color,
  }));

  const byName = (name: string) =>
    categories.find((c) => c.name === name)?.id ?? null;

  // name: カテゴリ名, active: 未完了なら true
  const sampleDefs: { name: string; category: string; active: boolean }[] = [
    { name: "トマト", category: "野菜", active: true },
    { name: "にんじん", category: "野菜", active: true },
    { name: "鶏むね肉", category: "肉・魚", active: true },
    { name: "牛乳", category: "飲み物", active: false },
    { name: "ティッシュ", category: "日用品", active: true },
  ];

  const items: Item[] = sampleDefs.map((d) => ({
    id: newId(),
    group_id: DEMO_GROUP_ID,
    category_id: byName(d.category),
    name: d.name,
    is_active: d.active,
    created_at: now(),
    updated_at: now(),
  }));

  // 履歴: サンプルアイテム名＋過去入力例（HistoryPanel に表示させる）
  const historyNames = [...sampleDefs.map((d) => d.name), "たまご", "食パン"];
  const history: ItemHistory[] = historyNames.map((name) => ({
    id: newId(),
    group_id: DEMO_GROUP_ID,
    name,
  }));

  return { categories, items, history };
}

/** name が履歴に無ければ追加（lib/item.ts の item_history upsert 相当） */
function withHistory(history: ItemHistory[], name: string): ItemHistory[] {
  if (history.some((h) => h.name === name)) return history;
  return [...history, { id: newId(), group_id: DEMO_GROUP_ID, name }];
}

export function addItemToState(
  state: DemoState,
  name: string,
  categoryId: string | null,
): DemoState {
  const item: Item = {
    id: newId(),
    group_id: DEMO_GROUP_ID,
    category_id: categoryId,
    name,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  };
  return {
    ...state,
    items: [...state.items, item],
    history: withHistory(state.history, name),
  };
}

export function toggleItemInState(
  state: DemoState,
  id: string,
  isActive: boolean,
): DemoState {
  return {
    ...state,
    items: state.items.map((i) =>
      i.id === id ? { ...i, is_active: isActive, updated_at: now() } : i,
    ),
  };
}

export function deleteItemFromState(state: DemoState, id: string): DemoState {
  return { ...state, items: state.items.filter((i) => i.id !== id) };
}

export function addCategoryToState(
  state: DemoState,
  name: string,
  color: string,
): DemoState {
  const category: Category = {
    id: newId(),
    group_id: DEMO_GROUP_ID,
    name,
    position: state.categories.length,
    color: color || pickColor(state.categories.length),
  };
  return { ...state, categories: [...state.categories, category] };
}

/** 履歴からの再追加（未分類の新規アイテムとして追加） */
export function reactivateInState(state: DemoState, name: string): DemoState {
  return addItemToState(state, name, null);
}

// --- localStorage I/O ---------------------------------------------------

function readKey<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveDemoState(state: DemoState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.categories,
      JSON.stringify(state.categories),
    );
    window.localStorage.setItem(
      STORAGE_KEYS.items,
      JSON.stringify(state.items),
    );
    window.localStorage.setItem(
      STORAGE_KEYS.history,
      JSON.stringify(state.history),
    );
  } catch {
    // localStorage 不可（プライベートモード等）でもデモ自体は動かす
  }
}

/** 保存済み状態を読み込む。未保存・破損時は seed して保存する。 */
export function loadDemoState(): DemoState {
  const categories = readKey<Category[]>(STORAGE_KEYS.categories);
  const items = readKey<Item[]>(STORAGE_KEYS.items);
  const history = readKey<ItemHistory[]>(STORAGE_KEYS.history);

  if (categories && items && history) {
    return { categories, items, history };
  }

  const seeded = seedDemoState();
  saveDemoState(seeded);
  return seeded;
}

/** サンプル初期状態に戻す */
export function resetDemo(): DemoState {
  const seeded = seedDemoState();
  saveDemoState(seeded);
  return seeded;
}

// --- 外部ストア（useSyncExternalStore 用） -----------------------------
// localStorage を「外部ストア」として React に同期する。SSR では空の固定
// スナップショットを返し、ハイドレーション後にクライアントの実データへ差し替える。

/** SSR / ハイドレーション初回に用いる固定スナップショット（参照安定） */
export const DEMO_INITIAL_SNAPSHOT: DemoState = {
  categories: [],
  items: [],
  history: [],
};

let clientState: DemoState | null = null;
const listeners = new Set<() => void>();

export function subscribeDemo(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** クライアントの現在スナップショット（未ロード時は localStorage から復元） */
export function getDemoSnapshot(): DemoState {
  if (!clientState) clientState = loadDemoState();
  return clientState;
}

/** SSR 用スナップショット（常に同一参照を返す） */
export function getDemoServerSnapshot(): DemoState {
  return DEMO_INITIAL_SNAPSHOT;
}

function emit(next: DemoState): void {
  clientState = next;
  saveDemoState(next);
  listeners.forEach((l) => l());
}

export function demoAddItem(name: string, categoryId: string | null): void {
  emit(addItemToState(getDemoSnapshot(), name, categoryId));
}

export function demoToggleItem(id: string, isActive: boolean): void {
  emit(toggleItemInState(getDemoSnapshot(), id, isActive));
}

export function demoDeleteItem(id: string): void {
  emit(deleteItemFromState(getDemoSnapshot(), id));
}

export function demoAddCategory(name: string, color: string): void {
  emit(addCategoryToState(getDemoSnapshot(), name, color));
}

export function demoReactivate(name: string): void {
  emit(reactivateInState(getDemoSnapshot(), name));
}

export function demoReset(): void {
  emit(seedDemoState());
}
