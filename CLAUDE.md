# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**kaeyo** はグループ共有型の買い物リストアプリ。グループメンバーがカテゴリ別の買い物アイテムをリアルタイムで共有・編集する。Next.js 16（App Router）+ React 19 + Supabase（Auth / Realtime / RLS / RPC）+ Tailwind CSS v4。

## コマンド

```bash
npm run dev          # 開発サーバー（http://localhost:3000）
npm run build        # 本番ビルド
npm run lint         # ESLint（eslint-config-next）
npm test             # Vitest（ユニット）をウォッチ実行
npx vitest run       # ユニットテストを1回だけ実行
npx vitest run tests/unit/item.test.ts   # 単一ファイルのみ実行
npm run test:e2e     # Playwright E2E（要: dev サーバー起動済み）
```

- パスエイリアス `@/` はリポジトリルートを指す（`tsconfig.json` / `vitest.config.mts` 両方で設定）。
- ユニットテストは happy-dom 環境。`tests/e2e/**` は Vitest から除外され、Playwright が担当。
- Supabase マイグレーションは `supabase/migrations/` に連番（`NNN_*.sql`）で配置。`npx supabase db push` で適用。

## アーキテクチャ

### データアクセス層（`lib/`）

ドメインごとのモジュール（`item.ts` / `category.ts` / `group.ts` / `account.ts`）が Supabase クライアント操作をラップする**唯一の窓口**。コンポーネントから直接 `supabase.from(...)` を呼ばず、必ずこれらの関数を経由する。各関数は `SupabaseClient` を引数で受け取る（依存注入）。

- `lib/supabase/client.ts` — ブラウザ用（Client Component）
- `lib/supabase/server.ts` — SSR / Route Handler 用（cookie 連携）
- `lib/types.ts` — DB スキーマと対応するドメイン型
- `lib/realtime.ts` — `postgres_changes` 購読のラッパー

### 認証フロー

- `middleware.ts` が全リクエストを認証ゲート。未ログインは `/login` へリダイレクト、ログイン済みで `/login` アクセス時は `/` へ。`/invite`・`/auth/callback` は例外。
- ルート（`/?code=xxx`）に OAuth/マジックリンクの `code` が来た場合、middleware が `/auth/callback` へ転送する。
- ルートグループ: `app/(app)/` は認証必須画面（メイン・設定）、`app/(auth)/` はログイン・パスワード再設定、`app/invite/[token]/` は招待受諾。

### Supabase の重要パターン（変更時は要注意）

- **RLS は全テーブルでグループメンバーシップ基準**。`group_members` に自分が属するグループのみ参照・編集可。新テーブル追加時は同等の RLS ポリシーを必ず付ける。
- **RLS の returning 問題は SECURITY DEFINER RPC で回避する**。INSERT 直後の `.select()` が SELECT ポリシーに弾かれるケース（グループ作成）や、`auth.users` の削除（アカウント削除）は、クライアント INSERT ではなく RPC で実行する。例: `create_group_with_owner`（005）、`delete_my_account`（006）。
- **新テーブルをリアルタイム対象にするには** `ALTER PUBLICATION supabase_realtime ADD TABLE <table>;` をマイグレーションに含める（無いと `postgres_changes` が無音で届かない。ADR-0001 / 007 参照）。
- リアルタイム購読はグループ単位のチャンネル（`group:${groupId}`）で `items` / `categories` / `groups` を監視する。

### クライアント状態

- 選択中グループ ID は localStorage（`SELECTED_GROUP_KEY = "kaeyo:selectedGroupId"`）でメイン画面・設定画面間で共有する。
- 招待トークンは `groupId:timestamp` を Base64URL（`+→-`, `/→_`, パディング除去）でエンコードしたもの。`/invite/[token]` の単一動的セグメントを壊さないため標準 Base64 は使わない（`lib/group.ts` 参照）。

## アーキテクチャ決定記録（ADR）

新機能・設計変更を実装する際は、以下に該当する場合に **`docs/adr/`** へ ADR を作成すること。

### ADR が必要な変更

- データフローの変更（リアルタイム・キャッシュ・同期戦略など）
- 外部サービスや Supabase 機能の採用・変更（Auth / Realtime / Storage / RPC など）
- テーブルスキーマや RLS ポリシーの設計判断
- 認証・認可の方式変更
- 状態管理パターンの変更
- 新しい依存ライブラリの採用

### ADR が不要な変更

- バグ修正（設計上の意思決定を伴わないもの）
- UI のスタイル調整
- リファクタリング（外から見た振る舞いが変わらないもの）

### 手順

1. `docs/adr/template.md` をコピーして `docs/adr/NNNN-<kebab-case-title>.md` を作成
2. `docs/adr/README.md` のインデックス表に1行追加
3. 番号は既存の最大値 +1
