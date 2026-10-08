"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";
import type { CategoryDTO } from "@/types";

const CARD_COLORS = ["#ec6b73", "#f58a2e", "#5cc94a", "#6c6cf5", "#f5b423", "#1fb5c9", "#e0569b"];

export function CategoryCarousel({ categories }: { categories: CategoryDTO[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows]);

  function slide(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 24 : 200;
    const perView = Math.max(1, Math.floor(el.clientWidth / step));
    el.scrollBy({ left: dir * step * perView, behavior: "smooth" });
  }

  return (
    <div className="relative -mx-4 md:mx-10">
      <div className="bg-surface-container-lowest md:rounded-[2.5rem] md:shadow-[0_20px_60px_-20px_rgba(239,75,61,0.25)] md:px-16 md:py-6 max-md:bg-transparent">
        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="no-scrollbar flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pt-14 pb-6 px-4 md:px-1 scroll-px-4 md:scroll-px-1"
        >
          {categories.map((c, i) => {
            const color = CARD_COLORS[i % CARD_COLORS.length];
            return (
              <Link
                key={c.id}
                href={`/?category=${c.id}`}
                data-card
                className="group relative shrink-0 snap-start w-[136px] md:w-[170px] rounded-2xl pt-14 md:pt-16 pb-3.5 md:pb-4 px-3 md:px-4 flex flex-col transition-transform duration-300 hover:-translate-y-1.5"
                style={{ backgroundColor: color, boxShadow: `0 14px 28px -10px ${color}aa` }}
              >
                <div
                  className="absolute -top-11 md:-top-12 left-1/2 -translate-x-1/2 w-[92px] h-[92px] md:w-[104px] md:h-[104px] rounded-full bg-white overflow-hidden"
                  style={{ boxShadow: `0 0 0 5px ${color}99, 0 8px 20px rgba(0,0,0,0.15)` }}
                >
                  {c.imageUrl ? (
                    <Image
                      src={c.imageUrl}
                      alt={c.name}
                      fill
                      sizes="104px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color }}>
                      <MaterialIcon name="category" className="text-4xl" />
                    </div>
                  )}
                </div>

                <h3 className="font-label-md text-[15px] font-bold text-white text-center leading-tight min-h-[2.4em] flex items-center justify-center">
                  {c.name}
                </h3>

                <div className="flex items-center justify-center mt-3">
                  <span className="bg-white text-on-surface rounded-full pl-3 pr-2 py-1 text-[11px] font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                    Үзэх
                    <MaterialIcon name="chevron_right" className="text-sm" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <ArrowButton side="left" disabled={!canPrev} onClick={() => slide(-1)} />
      <ArrowButton side="right" disabled={!canNext} onClick={() => slide(1)} />
    </div>
  );
}

function ArrowButton({ side, disabled, onClick }: { side: "left" | "right"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Өмнөх" : "Дараах"}
      className={`hidden md:flex absolute top-1/2 -translate-y-1/2 ${
        side === "left" ? "-left-8" : "-right-8"
      } w-16 h-16 rounded-full bg-surface-container-lowest ring-[10px] ring-background shadow-lg items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-all active:scale-95 disabled:opacity-40 disabled:hover:bg-surface-container-lowest disabled:hover:text-on-surface`}
    >
      <MaterialIcon name={side === "left" ? "chevron_left" : "chevron_right"} className="text-2xl md:text-3xl" />
    </button>
  );
}
