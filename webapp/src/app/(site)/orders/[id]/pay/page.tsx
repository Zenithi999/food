"use client";

import { useCallback, useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { PaymentSuccessAnimation } from "@/components/PaymentSuccessAnimation";
import { MaterialIcon } from "@/components/MaterialIcon";
import { formatMNT } from "@/lib/format";

const POLL_INTERVAL_MS = 4000;

type Status = "loading" | "pending" | "success" | "error";

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [url, setUrl] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const loadLink = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/orders/${id}/payment-link`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setStatus("error");
        setError(data?.error ?? "Төлбөрийн холбоос үүсгэхэд алдаа гарлаа.");
        return;
      }
      if (data.status === "SUCCESS") {
        setStatus("success");
        return;
      }
      setUrl(data.url);
      setAmount(data.amount);
      setStatus("pending");
    } catch {
      setStatus("error");
      setError("Сүлжээний алдаа гарлаа.");
    }
  }, [id]);

  const checkStatus = useCallback(async () => {
    const res = await fetch(`/api/orders/${id}/payment-status`).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (data?.status === "SUCCESS") setStatus("success");
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- төлбөрийн холбоосыг серверээс ачаална
    loadLink();
  }, [loadLink]);

  useEffect(() => {
    if (status !== "pending") return;
    const t = setInterval(checkStatus, POLL_INTERVAL_MS);
    const onFocus = () => checkStatus();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [status, checkStatus]);

  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => router.push("/orders?success=1"), 1600);
    return () => clearTimeout(t);
  }, [status, router]);

  async function manualCheck() {
    setChecking(true);
    await checkStatus();
    setChecking(false);
  }

  async function mockPay() {
    await fetch("/api/dev/byl-mock-pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id }),
    });
    await checkStatus();
  }

  if (status === "success") {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-u-xl w-full">
        <PaymentSuccessAnimation message="Төлбөр амжилттай хийгдлээ!" />
      </div>
    );
  }

  const isMock = url?.startsWith("/") ?? false;

  return (
    <div className="mx-auto px-margin-mobile py-u-xl w-full max-w-md">
      <h1 className="font-headline-lg text-headline-lg text-center mb-2">Онлайн төлбөр</h1>
      <p className="text-center text-secondary text-label-md mb-u-md">QPay, SocialPay, Голомт, Pocket-оор төлөх боломжтой</p>

      {status === "loading" && <p className="text-center text-secondary">Ачааллаж байна...</p>}

      {status === "pending" && url && (
        <div className="bg-surface-container-lowest rounded-[20px] p-u-lg text-center shadow-[0_24px_60px_-28px_rgba(0,0,0,0.25)]">
          {amount !== null && (
            <p className="mb-u-md">
              <span className="block text-label-sm text-secondary mb-1">Төлөх дүн</span>
              <span className="text-[32px] font-extrabold">{formatMNT(amount)}</span>
            </p>
          )}

          {isMock ? (
            <button
              onClick={mockPay}
              className="w-full bg-tertiary text-on-tertiary py-3.5 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity"
            >
              Тест төлбөр хийх (Byl тохируулаагүй)
            </button>
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-on-primary py-3.5 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity"
            >
              Төлбөр төлөх
              <MaterialIcon name="open_in_new" className="text-base" />
            </a>
          )}

          <p className="text-label-sm text-secondary mt-u-md">
            Төлбөрийн хуудас шинэ цонхонд нээгдэнэ. Төлбөр хийгдмэгц энэ хуудас автоматаар шинэчлэгдэнэ.
          </p>

          <button
            onClick={manualCheck}
            disabled={checking}
            className="mt-u-md w-full py-3 rounded-full font-label-md text-label-md border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-60"
          >
            {checking ? "Шалгаж байна..." : "Төлбөр шалгах"}
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="bg-error-container text-on-error-container rounded-[20px] p-u-md text-center">
          <p className="mb-u-md">{error}</p>
          <button
            onClick={loadLink}
            className="bg-primary text-on-primary py-3 px-6 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity"
          >
            Дахин оролдох
          </button>
        </div>
      )}
    </div>
  );
}
