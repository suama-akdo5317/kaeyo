"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { decodeInviteToken } from "@/lib/group";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

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

      try {
        const { groupId } = decodeInviteToken(token);
        await supabase
          .from("group_members")
          .upsert(
            { group_id: groupId, user_id: user.id, role: "member" },
            { onConflict: "group_id,user_id" },
          );
        setStatus("success");
        setTimeout(() => router.push("/"), 1500);
      } catch {
        setStatus("error");
      }
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
          エラーが発生しました。リンクを確認してください。
        </p>
      )}
    </div>
  );
}
