"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { decodeInviteToken } from "@/lib/group";

// app/(app)/page.tsx の SELECTED_GROUP_KEY と一致させること
const SELECTED_GROUP_KEY = "kaeyo:selectedGroupId";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function acceptInvite() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?redirect=/invite/${token}`);
        return;
      }

      let groupId: string;
      try {
        ({ groupId } = decodeInviteToken(token));
      } catch (err) {
        console.error("招待トークンのデコードに失敗しました", err);
        setErrorMessage("招待リンクが正しくありません。");
        setStatus("error");
        return;
      }

      // ignoreDuplicates: true で既存メンバー（owner 含む）の roleを上書きしない
      const { error } = await supabase
        .from("group_members")
        .upsert(
          { group_id: groupId, user_id: user.id, role: "member" },
          { onConflict: "group_id,user_id", ignoreDuplicates: true },
        );
      if (error) {
        console.error("グループ参加に失敗しました", error);
        setErrorMessage(
          "グループへの参加に失敗しました。時間をおいて再度お試しください。",
        );
        setStatus("error");
        return;
      }

      // 参加したグループをホームで表示させる
      if (typeof window !== "undefined") {
        localStorage.setItem(SELECTED_GROUP_KEY, groupId);
      }
      setStatus("success");
      setTimeout(() => router.push("/"), 1500);
    }
    acceptInvite();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {status === "loading" && <p>招待を処理中...</p>}
      {status === "success" && (
        <p className="text-green-500">
          グループに参加しました！リダイレクト中...
        </p>
      )}
      {status === "error" && (
        <p className="text-red-500">
          {errorMessage ?? "エラーが発生しました。リンクを確認してください。"}
        </p>
      )}
    </div>
  );
}
