"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/MaterialIcon";
import { formatMNT } from "@/lib/format";
import type { CategoryDTO, CompanyDTO, PaymentType, ProductDTO } from "@/types";

const VAT_RATE = 0.1;

type SaleType = "RETAIL" | "CREDIT" | "COMPANY";

interface CartLine {
  product: ProductDTO;
  quantity: number;
}

export function PosTerminal({
  products,
  categories,
  companies,
}: {
  products: ProductDTO[];
  categories: CategoryDTO[];
  companies: CompanyDTO[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [saleType, setSaleType] = useState<SaleType>("RETAIL");
  const [companyId, setCompanyId] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryId && p.categoryId !== categoryId) return false;
      if (needle && !p.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [products, query, categoryId]);

  const lines = Object.values(cart);
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;

  function addToCart(product: ProductDTO) {
    if (product.stock <= 0) return;
    setCart((c) => {
      const existing = c[product.id];
      const quantity = Math.min((existing?.quantity ?? 0) + 1, product.stock);
      return { ...c, [product.id]: { product, quantity } };
    });
  }

  function setQuantity(productId: string, quantity: number) {
    setCart((c) => {
      const line = c[productId];
      if (!line) return c;
      if (quantity <= 0) {
        const next = { ...c };
        delete next[productId];
        return next;
      }
      return { ...c, [productId]: { ...line, quantity: Math.min(quantity, line.product.stock) } };
    });
  }

  function resetCheckoutForm() {
    setSaleType("RETAIL");
    setCompanyId("");
    setPaymentType("CASH");
    setError(null);
  }

  function openCheckout() {
    if (lines.length === 0) return;
    resetCheckoutForm();
    setCheckoutOpen(true);
  }

  async function handleSubmit() {
    if (saleType !== "RETAIL" && !companyId) {
      setError("Байгууллага сонгоно уу.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
          saleType,
          companyId: saleType === "RETAIL" ? null : companyId,
          paymentType,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(data?.error ?? "Борлуулалт үүсгэхэд алдаа гарлаа.");
        return;
      }

      if (data.order.paymentType === "QPAY") {
        router.push(`/orders/${data.order.id}/pay`);
        return;
      }

      setCart({});
      setCheckoutOpen(false);
      setSuccess(
        saleType === "CREDIT" ? "Зээлээр борлуулалт бүртгэгдлээ." : "Борлуулалт амжилттай бүртгэгдлээ."
      );
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const companyPaymentOptions: { value: PaymentType; label: string }[] = [
    { value: "CASH", label: "Бэлнээр" },
    { value: "QPAY", label: "Онлайн" },
    { value: "BANK", label: "Дансаар" },
  ];
  const retailPaymentOptions: { value: PaymentType; label: string }[] = [
    { value: "CASH", label: "Бэлнээр" },
    { value: "QPAY", label: "Онлайн" },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-u-md h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-u-md gap-u-sm flex-wrap">
          <h1 className="font-headline-lg text-headline-lg text-primary">Касс</h1>
          {success && (
            <span className="text-label-sm px-3 py-1 rounded-full bg-primary-container text-on-primary-container">
              {success}
            </span>
          )}
        </div>

        <div className="relative mb-u-sm">
          <MaterialIcon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg pointer-events-none"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Бараа хайх..."
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-full pl-10 pr-4 py-2.5 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-u-md">
          <button
            onClick={() => setCategoryId(null)}
            className={`shrink-0 px-4 py-2 rounded-full font-label-sm text-label-sm border transition-colors ${
              categoryId === null
                ? "bg-primary border-primary text-on-primary"
                : "bg-surface-container-lowest border-outline-variant text-on-surface-variant"
            }`}
          >
            Бүгд
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={`shrink-0 px-4 py-2 rounded-full font-label-sm text-label-sm border transition-colors ${
                categoryId === c.id
                  ? "bg-primary border-primary text-on-primary"
                  : "bg-surface-container-lowest border-outline-variant text-on-surface-variant"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((product) => {
            const inCart = cart[product.id]?.quantity ?? 0;
            const outOfStock = product.stock <= 0;
            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={outOfStock}
                className={`relative text-left bg-surface-container-lowest border rounded-2xl p-2.5 transition-all disabled:opacity-40 disabled:pointer-events-none ${
                  inCart > 0 ? "border-primary ring-1 ring-primary" : "border-outline-variant/50 hover:border-primary/40"
                }`}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-white mb-2">
                  <Image src={product.imageUrl} alt={product.name} fill sizes="200px" className="object-contain p-2" />
                  {inCart > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-primary text-on-primary w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold">
                      {inCart}
                    </span>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 bg-black/55 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    Лангуу: {product.stock}
                  </span>
                </div>
                <p className="text-[13px] font-medium leading-snug line-clamp-2 min-h-[2.4em]">{product.name}</p>
                <p className="text-sm font-bold mt-0.5">{formatMNT(product.price)}</p>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="col-span-full text-center text-secondary py-u-lg">Бараа олдсонгүй.</p>}
        </div>
      </div>

      <div className="lg:w-80 shrink-0 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-u-md flex flex-col lg:sticky lg:top-u-md lg:max-h-[calc(100vh-4rem)]">
        <h2 className="font-headline-md text-headline-md text-primary mb-u-sm">Сагс</h2>
        {lines.length === 0 ? (
          <p className="text-secondary text-label-sm py-u-md text-center">Бараа сонгоно уу.</p>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 mb-u-sm">
            {lines.map((l) => (
              <div key={l.product.id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium leading-snug line-clamp-1">{l.product.name}</p>
                  <p className="text-label-sm text-secondary">{formatMNT(l.product.price)}</p>
                </div>
                <div className="flex items-center border border-outline-variant rounded-full px-1 py-0.5 bg-surface-container-low shrink-0">
                  <button
                    onClick={() => setQuantity(l.product.id, l.quantity - 1)}
                    className="p-1 hover:text-primary transition-colors active:scale-90"
                  >
                    <MaterialIcon name="remove" className="text-sm" />
                  </button>
                  <span className="px-2 text-label-sm">{l.quantity}</span>
                  <button
                    onClick={() => setQuantity(l.product.id, l.quantity + 1)}
                    disabled={l.quantity >= l.product.stock}
                    className="p-1 hover:text-primary transition-colors active:scale-90 disabled:opacity-30"
                  >
                    <MaterialIcon name="add" className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-outline-variant pt-u-sm space-y-1.5 mb-u-sm">
          <div className="flex justify-between text-label-sm">
            <span className="text-secondary">Дэд дүн</span>
            <span>{formatMNT(subtotal)}</span>
          </div>
          <div className="flex justify-between text-label-sm">
            <span className="text-secondary">НӨАТ (10%)</span>
            <span>{formatMNT(vat)}</span>
          </div>
          <div className="flex justify-between font-headline-md text-headline-md text-primary pt-1">
            <span>Нийт</span>
            <span>{formatMNT(total)}</span>
          </div>
        </div>

        <button
          onClick={openCheckout}
          disabled={lines.length === 0}
          className="w-full bg-primary text-on-primary py-3 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Зарах
        </button>
      </div>

      {checkoutOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-margin-mobile">
          <div className="bg-surface-container-lowest rounded-2xl p-u-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="font-headline-md text-headline-md text-primary mb-u-md">Борлуулалт баталгаажуулах</h2>

            {error && <div className="mb-u-sm p-3 rounded-lg bg-error-container text-on-error-container text-label-sm">{error}</div>}

            <div className="space-y-2 mb-u-md">
              <SaleTypeOption
                active={saleType === "RETAIL"}
                title="Шууд худалдан авалт"
                desc="Лангуунаас шууд авна"
                onClick={() => {
                  setSaleType("RETAIL");
                  setPaymentType("CASH");
                }}
              />
              <SaleTypeOption
                active={saleType === "CREDIT"}
                title="Байгууллагад зээлээр"
                desc="Байгууллага хожим төлнө"
                onClick={() => setSaleType("CREDIT")}
              />
              <SaleTypeOption
                active={saleType === "COMPANY"}
                title="Байгууллага бэлнээр/шилжүүлгээр"
                desc="Байгууллага одоо төлнө"
                onClick={() => {
                  setSaleType("COMPANY");
                  setPaymentType("CASH");
                }}
              />
            </div>

            {saleType !== "RETAIL" && (
              <div className="mb-u-md">
                <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Байгууллага
                </label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                >
                  <option value="">Сонгох</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {saleType !== "CREDIT" && (
              <div className="mb-u-md">
                <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Төлбөрийн төрөл
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(saleType === "RETAIL" ? retailPaymentOptions : companyPaymentOptions).map((opt) => (
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
            )}

            <div className="flex justify-between items-center mb-u-md">
              <span className="text-secondary">Нийт дүн</span>
              <span className="font-headline-md text-headline-md text-primary">{formatMNT(total)}</span>
            </div>

            <div className="flex gap-u-sm">
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="flex-1 py-3 rounded-full font-label-md text-label-md border border-outline-variant text-secondary hover:bg-surface-container-low transition-colors"
              >
                Болих
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-primary text-on-primary py-3 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {submitting ? "Боловсруулж байна..." : "Баталгаажуулах"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SaleTypeOption({
  active,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-colors ${
        active ? "border-primary bg-primary-container/40" : "border-outline-variant hover:bg-surface-container-low"
      }`}
    >
      <p className="font-label-md text-label-md">{title}</p>
      <p className="text-label-sm text-secondary">{desc}</p>
    </button>
  );
}
