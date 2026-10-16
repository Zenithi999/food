"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/MaterialIcon";
import { PaymentSuccessAnimation } from "@/components/PaymentSuccessAnimation";
import { useCartStore, cartSubtotal } from "@/store/cart";
import { formatMNT } from "@/lib/format";
import type { PaymentType } from "@/types";

const VAT_RATE = 0.1;

const PAYMENT_OPTIONS: { value: PaymentType; label: string }[] = [
  { value: "CASH", label: "Бэлнээр" },
  { value: "CREDIT", label: "Зээлээр" },
  { value: "QPAY", label: "Онлайн" },
];

export default function BasketPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clear } = useCartStore();
  const [hydrated, setHydrated] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("CASH");
  const [success, setSuccess] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => setHydrated(true), []);

  const subtotal = hydrated ? cartSubtotal(items) : 0;
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;

  async function handleCheckout() {
    setError(null);
    if (!address.trim()) {
      setError("Хаягаа оруулна уу.");
      return;
    }
    if (!phone.trim()) {
      setError("Утасны дугаараа оруулна уу.");
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          address: address.trim(),
          phone: phone.trim(),
          note: note.trim(),
          paymentType,
          idempotencyKey,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        setError(data?.error ?? "Захиалга үүсгэхэд алдаа гарлаа.");
        return;
      }

      if (paymentType === "QPAY") {
        clear();
        router.push(`/orders/${data.order.id}/pay`);
        return;
      }

      clear();
      setSuccess(true);
      setTimeout(() => {
        router.push("/orders?success=1");
      }, 1400);
    } finally {
      setPlacing(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-u-xl w-full">
        <PaymentSuccessAnimation message="Захиалга амжилттай үүслээ!" />
      </div>
    );
  }

  if (hydrated && items.length === 0) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-u-xl w-full text-center">
        <h1 className="font-display-lg text-display-lg text-primary mb-u-md">Таны сагс</h1>
        <p className="text-secondary mb-u-lg">Таны сагс хоосон байна.</p>
        <Link
          href="/"
          className="inline-block bg-primary text-on-primary py-3 px-8 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity"
        >
          ХУДАЛДАН АВАЛТ ҮРГЭЛЖЛҮҮЛЭХ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-u-xl w-full">
      <h1 className="font-display-lg text-display-lg text-primary mb-u-lg">Таны сагс</h1>
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-u-xl">
        <div className="lg:col-span-8 space-y-3 md:space-y-u-md">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-surface-container-lowest border border-outline-variant/50 p-3 md:p-u-md rounded-2xl flex items-center gap-3 md:gap-u-md"
            >
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl overflow-hidden flex-shrink-0 relative bg-white">
                <Image src={item.imageUrl} alt={item.name} fill sizes="112px" className="object-contain p-1" />
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm md:text-base font-medium text-on-surface leading-snug line-clamp-2">{item.name}</h3>
                    <p className="text-on-surface-variant text-[12px] mt-0.5">{item.unit}</p>
                  </div>
                  <p className="shrink-0 text-sm md:text-base font-bold text-on-surface">{formatMNT(item.price)}</p>
                </div>
                <div className="mt-2 md:mt-u-md flex justify-between items-center">
                  <div className="flex items-center border border-tertiary-fixed rounded-full px-2 py-1 bg-surface-container-low">
                    <button
                      className="p-1 hover:text-primary transition-colors active:scale-90"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      <MaterialIcon name="remove" className="text-sm" />
                    </button>
                    <span className="px-4 font-label-md">{item.quantity}</span>
                    <button
                      className="p-1 hover:text-primary transition-colors active:scale-90"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      <MaterialIcon name="add" className="text-sm" />
                    </button>
                  </div>
                  <button
                    className="text-secondary hover:text-error transition-colors flex items-center gap-1 font-label-sm p-1"
                    onClick={() => removeItem(item.productId)}
                    aria-label="Устгах"
                  >
                    <MaterialIcon name="delete" className="text-lg" />
                    <span className="hidden sm:inline">УСТГАХ</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-surface-container-lowest border border-outline-variant/50 p-4 md:p-u-md rounded-2xl space-y-u-sm">
            <h2 className="font-headline-md text-headline-md text-primary mb-1">Захиалгын мэдээлэл</h2>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                Хаяг
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Дүүрэг, хороо, байр, тоот..."
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                Утасны дугаар
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="99001122"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                Нэмэлт тэмдэглэл (заавал биш)
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Жишээ нь: тодорхой цагт бэлэн байлгах хүсэлт"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-secondary-container rounded-2xl p-5 md:p-u-lg lg:sticky lg:top-28">
            <h2 className="font-headline-md text-headline-md text-primary mb-u-md">Захиалгын дүн</h2>
            <div className="space-y-u-sm mb-u-lg">
              <div className="flex justify-between items-center">
                <span className="text-secondary">Дэд дүн</span>
                <span className="font-label-md">{formatMNT(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary">НӨАТ (10%)</span>
                <span className="font-label-md">{formatMNT(vat)}</span>
              </div>
              <div className="pt-u-sm border-t border-outline-variant flex justify-between items-center mt-u-md">
                <span className="font-label-md text-on-surface">Нийт дүн</span>
                <span className="font-headline-md text-headline-md text-primary">{formatMNT(total)}</span>
              </div>
            </div>

            <div className="mb-u-md">
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
                Төлбөрийн төрөл
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentType(opt.value)}
                    className={`py-2 px-2 rounded-full font-label-sm text-label-sm border transition-colors ${
                      paymentType === opt.value
                        ? "bg-primary text-on-primary border-primary"
                        : "border-outline-variant text-secondary hover:bg-surface-container-low"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-error text-label-sm mb-u-md">{error}</p>}

            <button
              onClick={handleCheckout}
              disabled={placing || !hydrated || items.length === 0}
              className="w-full bg-primary text-on-primary py-4 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity active:scale-[0.98] duration-150 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {placing ? "ЗАХИАЛГА ҮҮСГЭЖ БАЙНА..." : "ЗАХИАЛГА ХИЙХ"}
              {!placing && <MaterialIcon name="arrow_forward" className="text-base" />}
            </button>

            <div className="mt-u-md text-center">
              <p className="text-label-sm text-on-surface-variant italic">Захиалгын дараа тантай холбогдож баталгаажуулна.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
