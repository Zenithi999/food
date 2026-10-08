"use client";

import Image from "next/image";
import { useState } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { useCartStore } from "@/store/cart";
import { formatMNT } from "@/lib/format";
import type { ProductDTO } from "@/types";

export function ProductCard({ product }: { product: ProductDTO }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  function handleAdd() {
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="group flex flex-col bg-surface-container-lowest rounded-2xl p-2.5 md:p-3 border border-outline-variant/50 hover:border-primary/30 hover:shadow-[0_10px_30px_-12px_rgba(239,75,61,0.25)] transition-all">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-white">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className={`object-contain p-2 transition-transform duration-500 group-hover:scale-105 ${outOfStock ? "opacity-50" : ""}`}
        />
        {outOfStock && (
          <span className="absolute top-2 left-2 bg-on-surface/80 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
            Дууссан
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 pt-2.5 px-0.5">
        <h3 className="text-[13px] md:text-sm font-medium text-on-surface leading-snug line-clamp-2 min-h-[2.5em]">
          {product.name}
        </h3>
        <p className="text-[12px] text-secondary mt-0.5">{product.unit}</p>

        <div className="flex items-center justify-between gap-2 mt-auto pt-2">
          <span className="text-[15px] md:text-base font-bold text-on-surface">{formatMNT(product.price)}</span>
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            aria-label={`${product.name}-г сагсанд нэмэх`}
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none ${
              added ? "bg-tertiary text-on-tertiary" : "bg-primary text-on-primary hover:opacity-90"
            }`}
          >
            <MaterialIcon name={added ? "check" : "add"} className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
}
