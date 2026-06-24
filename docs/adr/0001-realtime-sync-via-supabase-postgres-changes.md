# ADR-0001: Supabase Realtime postgres_changes によるグループリストのリアルタイム同期

**Date**: 2026-06-24
**Status**: accepted
**Deciders**: suama-akdo5317

## Context

複数のグループメンバーが同じ買い物リストを共有する。メンバー A がアイテムを追加・変更・削除しても、メンバー B の画面はページリロードまで変わらない。リアルタイムで変更を反映し、全員が常に最新のリストを見られる状態にする必要がある。

Supabase を使用しており、WebSocket を自前管理せずにサーバー側 DB の変更をクライアントへプッシュする手段が必要。

## Decision

Supabase Realtime の `postgres_changes` を使用し、`items`/`categories`/`groups` テーブルへの変更イベントをグループ単位のチャネル（`group:{groupId}`）で購読する。イベント受信時はクライアント側で再フェッチ（`getItems` / `getItemHistory`）してステートを更新する。テーブルは `ALTER PUBLICATION supabase_realtime ADD TABLE ...` でレプリケーション対象に追加する。

## Alternatives Considered

### Alternative 1: Supabase Realtime Broadcast（カスタムイベント送信）
- **Pros**: 任意のデータを送れる。再フェッチ不要で差分のみ適用できる
- **Cons**: 書き込み側が明示的にブロードキャストを呼ぶ必要がある。書き込み箇所が増えるたびに漏れが生じる
- **Why not**: `postgres_changes` なら DB 書き込みさえすれば自動で通知される。実装漏れが起きない

### Alternative 2: ポーリング（setInterval で定期リフェッチ）
- **Pros**: 実装が単純。Supabase Realtime の設定不要
- **Cons**: 遅延が大きい。不必要なリクエストが発生しサーバー負荷が増える
- **Why not**: UX として応答性が低く、スケールしない

### Alternative 3: イベント受信時に差分だけステートを更新（再フェッチなし）
- **Pros**: 余分なリクエストが減る
- **Cons**: `postgres_changes` のペイロードはすべてのカラムを含まない場合がある。RLS フィルタ済みデータとの整合性維持が複雑
- **Why not**: `getItems` 再フェッチは RLS を通過した正確なデータを保証できる。現状のデータ量では追加リクエストは問題にならない

## Consequences

### Positive
- DB への書き込みが発生すれば、実装箇所を問わず自動で全メンバーに反映される
- 購読チャネルがグループ単位（`group:{groupId}`）なので、関係のないグループのイベントを受け取らない
- `item_history`（履歴サジェスト）も `onItemChange` で同時更新されるため、他メンバーの追加アイテムがオートコンプリートに即座に反映される

### Negative
- アイテム変更のたびに `getItems` + `getItemHistory` の 2 リクエストが発生する
- `supabase_realtime` publication へのテーブル追加（マイグレーション）を忘れると無音で動作しない

### Risks
- テーブルを追加するたびに publication への登録を忘れるリスク → 新テーブルをリアルタイム対象にする際は必ずマイグレーションに `ALTER PUBLICATION supabase_realtime ADD TABLE ...` を含める規約を設ける
