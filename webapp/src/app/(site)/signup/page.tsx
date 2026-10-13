"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Нууц үг таарахгүй байна.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(data?.error ?? "Бүртгэл үүсгэхэд алдаа гарлаа.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-grow flex items-center justify-center px-margin-mobile py-u-xl">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest rounded-[20px] p-u-lg shadow-[0_24px_60px_-28px_rgba(0,0,0,0.25)]">
          <h1 className="font-headline-lg text-headline-lg text-primary mb-u-xs text-center">Бүртгүүлэх</h1>
          <p className="text-secondary text-center mb-u-lg">Шинэ хүнс хамгийн түрүүнд танайд хүрэхийн тулд бүртгүүлээрэй.</p>

          {error && (
            <div className="mb-u-md p-3 rounded bg-error-container text-on-error-container text-label-sm">
              {error}
            </div>
          )}

          <form className="space-y-u-md" onSubmit={handleSubmit}>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1" htmlFor="name">
                Овог нэр
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Бат Болд"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
              />
            </div>
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
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1" htmlFor="phone">
                Утасны дугаар
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="99001122"
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Дор хаяж 6 тэмдэгт"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label
                className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1"
                htmlFor="confirm-password"
              >
                Нууц үг давтах
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
              />
            </div>
            <label className="flex items-start gap-2 text-secondary text-label-sm">
              <input required type="checkbox" className="mt-1 rounded border-outline-variant text-primary focus:ring-primary" />
              Үйлчилгээний нөхцөл, нууцлалын бодлогыг зөвшөөрч байна
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-on-primary py-3 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity active:scale-[0.98] duration-150 disabled:opacity-60"
            >
              {submitting ? "БҮРТГЭЖ БАЙНА..." : "БҮРТГҮҮЛЭХ"}
            </button>
          </form>

          <p className="text-center text-secondary mt-u-lg">
            Бүртгэлтэй юу?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Нэвтрэх
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
