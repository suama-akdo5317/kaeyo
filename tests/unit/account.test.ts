import { vi } from "vitest";
import { deleteMyAccount } from "@/lib/account";

test("アカウントを削除できる（RPC delete_my_account を呼ぶ）", async () => {
  const supabase = {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  } as any;

  await deleteMyAccount(supabase);

  expect(supabase.rpc).toHaveBeenCalledWith("delete_my_account");
});

test("削除でエラーが返ると例外を投げる", async () => {
  const supabase = {
    rpc: vi.fn().mockResolvedValue({ error: { message: "削除失敗" } }),
  } as any;

  await expect(deleteMyAccount(supabase)).rejects.toThrow("削除失敗");
});
