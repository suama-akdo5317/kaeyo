import { createClient } from "@/lib/supabase/server";
import { AuthedApp } from "@/components/AuthedApp";
import { DemoApp } from "@/components/DemoApp";

// ルートドメイン: ログイン済みは本番アプリ、未ログインはデモを表示する。
// （未ログインの到達は middleware / settings 側ガードで許可）
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? <AuthedApp /> : <DemoApp />;
}
