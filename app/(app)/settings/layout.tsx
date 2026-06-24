import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// 設定画面は認証必須（未ログインは /login へ）。
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
