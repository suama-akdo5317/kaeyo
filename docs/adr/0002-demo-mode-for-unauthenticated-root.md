# ADR-0002: 未ログイン時のルートドメインでデモモードを表示する

**Date**: 2026-06-25
**Status**: accepted
**Deciders**: ujikawa

## Context

これまで未ログインユーザーがルートドメイン `/` にアクセスすると、`middleware.ts` と `app/(app)/layout.tsx` の二重ガードにより問答無用で `/login` へリダイレクトされていた。そのため、ログインしない限りアプリが何をするものか体験できず、初回訪問者の離脱要因になっていた。

未ログインでも買い物リストの追加・チェック・削除・カテゴリ追加を実際に試せるデモを提供したい。デモは Supabase / 認証 / リアルタイムに依存せず、編集内容はクライアントの localStorage に保持する。

## Decision

ルート `/` の認証ガードを開放し、`/` をサーバーコンポーネントで分岐させる。

- `middleware.ts`: 未ログインのリダイレクト条件にルート例外（`pathname === "/"`）を追加。`/settings` などその他の保護ルートは従来どおり `/login` へリダイレクトする。
- `app/(app)/page.tsx`: サーバーコンポーネント化し、`supabase.auth.getUser()` の結果でログイン済み→`AuthedApp`（Supabase版）／未ログイン→`DemoApp`（ローカル版）を分岐する。
- `app/(app)/layout.tsx`: ルート直下の認証ガードを撤去（パススルー化）。保護が必要な `/settings` には `app/(app)/settings/layout.tsx` を新設してガードを移設する。
- `lib/demo.ts`: `lib/types.ts` の型と `lib/categoryColors.ts` の定数を再利用したローカルデータ層。状態変換はイミュータブルな純関数で実装し、localStorage（`kaeyo:demo:*`）への I/O を別途ラップする。
- `components/DemoApp.tsx` / `components/DemoBanner.tsx`: 既存のプレゼン用コンポーネント（`ItemInput` / `CategorySection` / `HistoryPanel` / `EmptyState`）を再利用したデモ UI とログイン誘導バナー。

## Alternatives Considered

### Alternative 1: 専用 `/demo` ルートを作り、未ログインの `/` をそこへリダイレクト
- **Pros**: ルート直下の構成を変えずに済む。
- **Cons**: URL が増え、「ルートドメインで体験できる」という要件から外れる。リダイレクトの一手間が挟まる。
- **Why not**: 要件は「ルートドメインでデモを機能させる」ことであり、別 URL への遷移は体験を損なう。

### Alternative 2: デモ状態をメモリ（React state）のみで保持
- **Pros**: 実装が最もシンプル。永続化のキー設計が不要。
- **Cons**: リロードで初期化され「機能している感」が弱い。
- **Why not**: ユーザー判断で localStorage 保持を採用。本番キーと衝突しない `kaeyo:demo:*` 名前空間で分離する。

## Consequences

### Positive
- 初回訪問者がログインなしでアプリを体験でき、ログインへの導線（バナー）も提供できる。
- データ層を `lib/demo.ts` に閉じ込め、プレゼン層は本番と完全に共有するため重複が少ない。

### Negative
- ルートページがクライアント単独描画からサーバー分岐＋クライアントの2構成になり、認証ガードの責務が `layout` 単位で分散した（`/settings` 専用 layout を追加）。

### Risks
- 認証ガードの移設漏れにより保護ルートが露出するリスク。→ `middleware.ts` が一次ガード、各保護ルートの layout が二次ガードの多層防御で担保する。
- localStorage 非対応環境（プライベートモード等）では永続化されないが、デモ自体は動作する（保存失敗を握り潰す実装）。
