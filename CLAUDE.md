# kaeyo — Claude Code ガイドライン

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

### 新テーブルをリアルタイム対象にする場合

`supabase/migrations/` に `ALTER PUBLICATION supabase_realtime ADD TABLE <table>;` を必ず含めること。  
この設定がないと `postgres_changes` イベントが無音で届かない（参照: ADR-0001）。
