"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(data?.error ?? "Нэвтрэхэд алдаа гарлаа.");
        return;
      }
      router.push(data.user.role === "ADMIN" ? "/admin" : "/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-grow flex items-center justify-center px-margin-mobile py-u-xl">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest rounded-[20px] p-u-lg shadow-[0_24px_60px_-28px_rgba(0,0,0,0.25)]">
          <h1 className="font-headline-lg text-headline-lg text-primary mb-u-xs text-center">Тавтай морил</h1>
          <p className="text-secondary text-center mb-u-lg">Худалдан авалтаа үргэлжлүүлэхийн тулд нэвтэрнэ үү.</p>

          {error && (
            <div className="mb-u-md p-3 rounded bg-error-container text-on-error-container text-label-sm">
              {error}
            </div>
          )}

          <form className="space-y-u-md" onSubmit={handleSubmit}>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1" htmlFor="email">
                Имэйл
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tanii@jishee.mn"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1" htmlFor="password">
                Нууц үг
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-on-primary py-3 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity active:scale-[0.98] duration-150 disabled:opacity-60"
            >
              {submitting ? "НЭВТРЭХ..." : "НЭВТРЭХ"}
            </button>
          </form>

          <p className="text-center text-secondary mt-u-lg">
            Бүртгэлгүй юу?{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Бүртгүүлэх
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
