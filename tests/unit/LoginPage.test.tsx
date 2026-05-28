import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import LoginPage from "@/app/(auth)/login/page";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

test("メールとパスワードの入力フィールドが表示される", () => {
  render(<LoginPage />);
  expect(screen.getByPlaceholderText("メールアドレス")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("パスワード")).toBeInTheDocument();
});

test("ログインボタンが表示される", () => {
  render(<LoginPage />);
  expect(screen.getByRole("button", { name: "ログイン" })).toBeInTheDocument();
});
