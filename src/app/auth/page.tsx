"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/game-shell/Header";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase chưa được cấu hình. Bạn vẫn có thể chơi ở chế độ khách (guest).");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Đăng ký thành công! Kiểm tra email để xác nhận tài khoản (nếu được yêu cầu).");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-border-hover bg-surface-hover/60 p-6">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Đăng nhập là tuỳ chọn — bạn vẫn chơi được ở chế độ khách và đồng bộ sau.
          </p>

          {!isSupabaseConfigured && (
            <p className="mt-4 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-400">
              Supabase chưa được cấu hình trong `.env`. Xem <code>SETUP.md</code> để bật đăng nhập.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-border-hover bg-surface px-3 py-2.5 text-foreground outline-none focus:border-amber-400"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border-hover bg-surface px-3 py-2.5 text-foreground outline-none focus:border-amber-400"
            />

            {error && <p className="text-sm text-coral-500">{error}</p>}
            {message && <p className="text-sm text-teal-400">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-lg bg-amber-400 py-2.5 font-medium text-ink-950 transition hover:bg-amber-500 disabled:opacity-60"
            >
              {loading ? "Đang xử lý..." : mode === "signin" ? "Đăng nhập" : "Đăng ký"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-sm text-muted hover:text-foreground"
          >
            {mode === "signin" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
          </button>
        </div>
      </main>
    </>
  );
}
