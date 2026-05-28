# 買い物メモアプリ 設計書

## 概要

家族・パートナーと共有できる買い物メモWebアプリ。リアルタイム同期・カテゴリ管理・履歴機能を備える。

## 技術スタック

- フロントエンド: Next.js 14（App Router）+ TypeScript + Tailwind CSS
- バックエンド: Supabase（PostgreSQL + Auth + Realtime）
- デプロイ: Vercel（フロント）+ Supabase Cloud

## アーキテクチャ

```
App
├── 認証（Supabase Auth）
│   ├── メール/パスワードログイン
│   └── 招待リンク送信
├── ショッピングリスト
│   ├── アイテム一覧（アクティブ/非アクティブ）
│   ├── カテゴリ管理
│   └── 履歴パネル
└── グループ管理
    ├── メンバー招待
    └── リスト共有設定
```

### データフロー

1. ユーザーがアイテムを追加/更新
2. Supabaseにwriteされると同時にRealtimeチャンネルで他メンバーへブロードキャスト
3. 全メンバーの画面が即時更新（WebSocketベース）

## データベーススキーマ

```sql
-- ユーザーグループ（家族単位）
groups
  id uuid PK
  name text
  created_at timestamptz

-- グループメンバー
group_members
  group_id uuid FK→groups
  user_id  uuid FK→auth.users
  role     text  -- 'owner' | 'member'

-- カテゴリ（グループごとに自由定義）
categories
  id       uuid PK
  group_id uuid FK→groups
  name     text
  position int  -- 並び順

-- 買い物アイテム
items
  id          uuid PK
  group_id    uuid FK→groups
  category_id uuid FK→categories (nullable)
  name        text
  is_active   boolean  -- true=未購入, false=購入済み
  created_at  timestamptz
  updated_at  timestamptz

-- 履歴（アイテム名の使用履歴）
item_history
  id       uuid PK
  group_id uuid FK→groups
  name     text
  UNIQUE(group_id, name)  -- 重複なし
```

**設計上のポイント**
- `item_history` はアイテム追加時に自動でupsert
- `items` から削除されても `item_history` には残る → 再アクティブ化の候補として表示
- RLSポリシーは全テーブルで `group_id` を軸に制御

## 画面設計

### 画面構成

| パス | 説明 |
|------|------|
| `/login` | ログイン・新規登録 |
| `/invite/[token]` | 招待リンク受け入れ |
| `/` | メインのリスト画面 |
| `/settings` | グループ・カテゴリ管理 |

### メイン画面レイアウト

```
┌─────────────────────────┐
│ [グループ名]  [設定] [招待]│  ヘッダー
├─────────────────────────┤
│ + 品名を入力...  [追加]  │  入力エリア
├─────────────────────────┤
│ 🥦 野菜                  │  カテゴリ
│   ☐ にんじん             │  アクティブ
│   ☐ ほうれん草           │
│ 🥩 肉・魚                │
│   ☐ 鶏むね肉             │
│   ✓ サーモン（薄字）     │  非アクティブ
├─────────────────────────┤
│ 履歴: [豆腐][卵][牛乳]...│  タップで再追加
└─────────────────────────┘
```

### 主なインタラクション

- アイテム名入力 → `Enter` or `追加`ボタンで追加（同時に履歴にupsert）
- アイテムをタップ → アクティブ/非アクティブ切り替え
- 非アクティブは一覧下部に薄く表示
- 履歴チップをタップ → 同名アイテムが即アクティブで追加
- リアルタイム更新はアニメーション付きで反映

## 実装フェーズ

| フェーズ | 内容 | 目安 |
|---------|------|------|
| Phase 1 | 基盤: Next.js + Supabase初期化、認証、グループ・招待 | 1〜2日 |
| Phase 2 | コア機能: カテゴリCRUD、アイテムCRUD、履歴 | 2〜3日 |
| Phase 3 | リアルタイム: Supabase Realtimeによる即時反映 | 1日 |
| Phase 4 | 仕上げ: レスポンシブ、UX改善、Vercelデプロイ | 1日 |

**合計目安: 5〜7日**
