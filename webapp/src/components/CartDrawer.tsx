"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { useCartStore, cartSubtotal } from "@/store/cart";
import { formatMNT } from "@/lib/format";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, updateQuantity, removeItem } = useCartStore();
  const subtotal = cartSubtotal(items);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Сагс"
        className={`fixed top-0 right-0 z-[70] h-dvh w-full sm:max-w-sm bg-surface-container-lowest shadow-2xl flex flex-col transition-[transform,visibility] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          open ? "translate-x-0 visible" : "translate-x-full invisible"
        }`}
      >
        <div className="flex items-center justify-between px-u-md py-u-md border-b border-outline-variant">
          <h2 className="font-headline-md text-headline-md text-primary">Таны сагс</h2>
          <button
            onClick={onClose}
            aria-label="Сагс хаах"
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-u-sm px-u-md text-center">
            <MaterialIcon name="shopping_cart" className="text-4xl text-secondary" />
            <p className="text-secondary">Таны сагс хоосон байна.</p>
            <Link
              href="/"
              onClick={onClose}
              className="mt-u-sm bg-primary text-on-primary py-2.5 px-6 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity"
            >
              ХУДАЛДАН АВАЛТ ХИЙХ
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-u-md py-u-md space-y-u-sm">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-u-sm">
                  <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 relative bg-surface-container-low">
                    <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-label-md text-label-md text-primary truncate">{item.name}</p>
                    <p className="text-on-surface-variant font-label-sm">{formatMNT(item.price)}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center border border-tertiary-fixed rounded-full px-1.5 py-0.5 bg-surface-container-low">
                        <button
                          className="p-1 hover:text-primary transition-colors active:scale-90"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          aria-label="Тоо хорих"
                        >
                          <MaterialIcon name="remove" className="text-sm" />
                        </button>
                        <span className="px-3 font-label-sm">{item.quantity}</span>
                        <button
                          className="p-1 hover:text-primary transition-colors active:scale-90"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          aria-label="Тоо нэмэх"
                        >
                          <MaterialIcon name="add" className="text-sm" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        aria-label="Устгах"
                        className="p-1 text-secondary hover:text-error transition-colors"
                      >
                        <MaterialIcon name="delete" className="text-base" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-outline-variant px-u-md py-u-md space-y-u-sm">
              <div className="flex justify-between items-center">
                <span className="text-secondary">Дэд дүн</span>
                <span className="font-headline-md text-headline-md text-primary">{formatMNT(subtotal)}</span>
              </div>
              <Link
                href="/basket"
                onClick={onClose}
                className="w-full bg-primary text-on-primary py-3.5 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity active:scale-[0.98] duration-150 flex items-center justify-center gap-2"
              >
                САГС ХАРАХ / ЗАХИАЛГА ХИЙХ
                <MaterialIcon name="arrow_forward" className="text-base" />
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
