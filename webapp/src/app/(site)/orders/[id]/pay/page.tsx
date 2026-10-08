"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { PaymentSuccessAnimation } from "@/components/PaymentSuccessAnimation";
import { formatMNT } from "@/lib/format";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

interface QPayInvoice {
  invoiceId: string;
  qrImage: string;
  qrText: string;
  deeplinks: { name: string; link: string }[];
}

function readStoredInvoice(id: string): { qpayInvoice: QPayInvoice | null; amount: number | null } {
  if (typeof window === "undefined") return { qpayInvoice: null, amount: null };
  const key = `qpay-invoice-${id}`;
  const stored = sessionStorage.getItem(key);
  if (!stored) return { qpayInvoice: null, amount: null };
  sessionStorage.removeItem(key);
  try {
    const parsed = JSON.parse(stored);
    return { qpayInvoice: parsed.qpayInvoice ?? null, amount: parsed.amount ?? null };
  } catch {
    return { qpayInvoice: null, amount: null };
  }
}

export default function QPayPayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [initial] = useState(() => readStoredInvoice(id));
  const [invoice, setInvoice] = useState<QPayInvoice | null>(initial.qpayInvoice);
  const [amount] = useState<number | null>(initial.amount);
  const [status, setStatus] = useState<"loading" | "pending" | "success" | "timeout" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadOrder() {
    try {
      const res = await fetch(`/api/orders/${id}/payment-status`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setStatus("error");
        setError(data?.error ?? "Захиалга олдсонгүй.");
        return;
      }
      if (data.status === "SUCCESS") {
        setStatus("success");
        return;
      }
      setStatus("pending");
    } catch {
      setStatus("error");
      setError("Сүлжээний алдаа гарлаа.");
    }
  }

  async function retryInvoice() {
    setRetrying(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${id}/qpay-invoice`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.qpayInvoice) {
        setError(data?.error ?? "QPay нэхэмжлэх үүсгэхэд алдаа гарлаа.");
        return;
      }
      setInvoice(data.qpayInvoice);
      setStatus("pending");
    } finally {
      setRetrying(false);
    }
  }

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (status !== "pending") return;

    pollRef.current = setInterval(loadOrder, POLL_INTERVAL_MS);
    timeoutRef.current = setTimeout(() => {
      setStatus((s) => (s === "pending" ? "timeout" : s));
    }, POLL_TIMEOUT_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (status === "success") {
      const t = setTimeout(() => router.push("/orders?success=1"), 1600);
      return () => clearTimeout(t);
    }
  }, [status, router]);

  if (status === "success") {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-u-xl w-full">
        <PaymentSuccessAnimation message="Төлбөр амжилттай хийгдлээ!" />
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-u-xl w-full max-w-md">
      <h1 className="font-headline-lg text-headline-lg text-primary mb-u-md text-center">QPay-ээр төлөх</h1>

      {amount !== null && (
        <p className="text-center text-secondary mb-u-md">
          Төлөх дүн: <span className="font-label-md text-primary">{formatMNT(amount)}</span>
        </p>
      )}

      {status === "loading" && <p className="text-center text-secondary">Ачааллаж байна...</p>}

      {(status === "pending" || status === "timeout") && (
        <div className="bg-surface-container-lowest rounded-lg p-u-lg text-center item-card-shadow">
          {invoice ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI, no benefit from next/image optimization */}
              <img
                src={`data:image/png;base64,${invoice.qrImage}`}
                alt="QPay QR код"
                className="mx-auto w-56 h-56 object-contain mb-u-md"
              />
              {invoice.deeplinks.length > 0 && (
                <div className="flex flex-col gap-2 mb-u-md">
                  {invoice.deeplinks.map((d) => (
                    <a
                      key={d.link}
                      href={d.link}
                      className="text-primary underline text-label-sm"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {d.name}
                    </a>
                  ))}
                </div>
              )}
              <p className="text-label-sm text-secondary">QPay апп-аар уншуулж төлбөрөө хийнэ үү.</p>
            </>
          ) : (
            <>
              <p className="text-secondary mb-u-md">QR код үүсээгүй байна.</p>
              <button
                onClick={retryInvoice}
                disabled={retrying}
                className="w-full bg-primary text-on-primary py-3 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {retrying ? "Үүсгэж байна..." : "QPay QR код үүсгэх"}
              </button>
            </>
          )}

          {status === "timeout" && (
            <p className="text-error text-label-sm mt-u-md">
              Төлбөр удаж байна. Апп-аараа шалгаад дараах товчоор дахин шалгана уу.
            </p>
          )}

          <button
            onClick={loadOrder}
            className="mt-u-md w-full bg-primary text-on-primary py-3 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity"
          >
            Төлбөр шалгах
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="bg-error-container text-on-error-container rounded-lg p-u-md text-center">
          <p className="mb-u-md">{error}</p>
          <button
            onClick={retryInvoice}
            disabled={retrying}
            className="bg-primary text-on-primary py-3 px-6 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {retrying ? "Оролдож байна..." : "Дахин оролдох"}
          </button>
        </div>
      )}
    </div>
  );
}
