# kaeyo

**kaeyo** はグループで共有する買い物リストアプリです。家族やルームメイトなどのグループメンバーが、カテゴリ別の買い物アイテムを**リアルタイム**で共有・編集できます。誰かがアイテムを追加・チェックすると、他のメンバーの画面にも即座に反映されます。

## 主な機能

- 📝 **共有買い物リスト** — グループ単位でアイテムを追加・削除・チェック
- 🗂️ **カテゴリ分類** — カラー付きカテゴリでアイテムを整理
- ⚡ **リアルタイム同期** — Supabase Realtime によりメンバー全員の画面が即座に更新
- 🔁 **入力履歴サジェスト** — 過去に追加したアイテム名をオートコンプリート
- 👥 **グループ管理** — リスト（グループ）の作成、招待リンクによるメンバー追加
- 🔐 **認証** — メール / マジックリンクによるログイン、パスワード再設定、アカウント削除

## 技術スタック

| 領域 | 採用技術 |
| --- | --- |
| フレームワーク | [Next.js 16](https://nextjs.org/)（App Router）+ React 19 |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| バックエンド | [Supabase](https://supabase.com/)（Auth / Realtime / RLS / RPC） |
| テスト | Vitest（ユニット）+ Playwright（E2E） |
| デプロイ | Vercel |

## セットアップ

### 前提条件

- Node.js 20 以上
- Supabase プロジェクト（[supabase.com](https://supabase.com/) で作成）

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、Supabase プロジェクトの値を設定します。

```bash
cp .env.local.example .env.local
```

| 変数名 | 説明 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトの URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon（公開）キー |

### 3. データベースマイグレーションの適用

`supabase/migrations/` 配下の SQL を Supabase プロジェクトに適用します。

```bash
npx supabase db push
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いて動作を確認します。

## コマンド

```bash
npm run dev          # 開発サーバー（http://localhost:3000）
npm run build        # 本番ビルド
npm run start        # 本番サーバー起動
npm run lint         # ESLint（eslint-config-next）
npm test             # Vitest（ユニット）をウォッチ実行
npx vitest run       # ユニットテストを1回だけ実行
npx vitest run tests/unit/item.test.ts   # 単一ファイルのみ実行
npm run test:e2e     # Playwright E2E（要: dev サーバー起動済み）
```

## プロジェクト構成

```
kaeyo/
├── app/                    # Next.js App Router
│   ├── (app)/              # 認証必須画面（メイン・設定）
│   ├── (auth)/             # ログイン・パスワード再設定
│   ├── auth/callback/      # OAuth / マジックリンクのコールバック
│   ├── invite/[token]/     # 招待受諾
│   └── layout.tsx          # ルートレイアウト
├── components/             # UI コンポーネント
├── lib/                    # データアクセス層
│   ├── supabase/           # Supabase クライアント（client / server）
│   ├── item.ts             # アイテム操作
│   ├── category.ts         # カテゴリ操作
│   ├── group.ts            # グループ・招待操作
│   ├── account.ts          # アカウント操作
│   ├── realtime.ts         # Realtime 購読ラッパー
│   └── types.ts            # ドメイン型
├── supabase/migrations/    # DB マイグレーション（連番 NNN_*.sql）
├── tests/
│   ├── unit/               # Vitest ユニットテスト
│   └── e2e/                # Playwright E2E テスト
├── docs/
│   ├── adr/                # アーキテクチャ決定記録（ADR）
│   └── plans/              # 設計メモ
└── middleware.ts           # 認証ゲート
```

## アーキテクチャ

### データアクセス層（`lib/`）

ドメインごとのモジュール（`item.ts` / `category.ts` / `group.ts` / `account.ts`）が Supabase クライアント操作をラップする**唯一の窓口**です。コンポーネントから直接 `supabase.from(...)` を呼ばず、必ずこれらの関数を経由します。各関数は `SupabaseClient` を引数で受け取る依存注入スタイルです。

- `lib/supabase/client.ts` — ブラウザ用（Client Component）
- `lib/supabase/server.ts` — SSR / Route Handler 用（cookie 連携）

### 認証フロー

- `middleware.ts` が全リクエストを認証ゲート。未ログインは `/login` へリダイレクト、ログイン済みで `/login` アクセス時は `/` へ。`/invite`・`/auth/callback` は例外。
- ルート（`/?code=xxx`）に OAuth / マジックリンクの `code` が来た場合、middleware が `/auth/callback` へ転送します。

### Supabase の重要パターン

- **RLS は全テーブルでグループメンバーシップ基準**。`group_members` に自分が属するグループのみ参照・編集可能。
- **RLS の returning 問題は SECURITY DEFINER RPC で回避**。INSERT 直後の `.select()` が SELECT ポリシーに弾かれるケースや `auth.users` の削除は RPC で実行します（例: `create_group_with_owner`、`delete_my_account`）。
- **新テーブルをリアルタイム対象にするには** マイグレーションに `ALTER PUBLICATION supabase_realtime ADD TABLE <table>;` を含めます（[ADR-0001](docs/adr/0001-realtime-sync-via-supabase-postgres-changes.md) 参照）。
- リアルタイム購読はグループ単位のチャンネル（`group:${groupId}`）で `items` / `categories` / `groups` を監視します。

## テスト

- ユニットテストは happy-dom 環境で実行されます。`tests/e2e/**` は Vitest から除外され、Playwright が担当します。
- パスエイリアス `@/` はリポジトリルートを指します（`tsconfig.json` / `vitest.config.mts` 両方で設定）。

```bash
npx vitest run       # ユニットテスト
npm run test:e2e     # E2E テスト（dev サーバー起動が前提）
```

## ライセンス

Private プロジェクト。
