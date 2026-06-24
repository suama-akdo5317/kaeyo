// 認証ガードはルート直下では行わない（未ログインはルートでデモを表示するため）。
// 保護が必要な画面（/settings 等）は各ルートのレイアウトでガードする。
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
