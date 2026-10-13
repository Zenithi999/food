"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { ProductCard } from "./ProductCard";
import type { ProductDTO } from "@/types";

export interface SpotlightCategory {
  id: string;
  name: string;
  imageUrl: string | null;
  products: ProductDTO[];
}

const MIN_SLOTS = 8;
const HERO_ANGLE = 45;
const DURATION = 800;
const EASE = "cubic-bezier(0.65, 0, 0.35, 1.08)";
const MOTION = `${DURATION}ms ${EASE}`;

const CHARCOAL = "#3A3A3A";

function subscribeResize(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}
function visibleForWidth() {
  const w = window.innerWidth;
  return w >= 1024 ? 6 : w >= 768 ? 4 : 3;
}

function splitName(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return { thin: null, bold: words[0] };
  return { thin: words.slice(0, -1).join(" "), bold: words[words.length - 1] };
}

export function CategorySpotlight({ categories }: { categories: SpotlightCategory[] }) {
  const [index, setIndex] = useState(0);
  // Дугуйн нийт эргэлтийг слотоор хадгална (хязгааргүй) — ингэснээр үргэлж богино замаар эргэнэ.
  const [rotation, setRotation] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const visibleCount = useSyncExternalStore(subscribeResize, visibleForWidth, () => 6);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (prevIndex === null) return;
    const t = setTimeout(() => setPrevIndex(null), DURATION);
    return () => clearTimeout(t);
  }, [prevIndex]);

  if (categories.length === 0) return null;

  const count = categories.length;
  const slots = Math.max(MIN_SLOTS, count);
  const step = 360 / slots;
  const fullCircle = count === slots;
  const neighbourK = Math.SQRT1_2 - Math.sin(((HERO_ANGLE - step) * Math.PI) / 180);
  const selected = categories[index];

  function select(target: number) {
    const next = fullCircle ? ((target % count) + count) % count : Math.max(0, Math.min(count - 1, target));
    if (next === index) return;
    let delta = next - index;
    if (fullCircle) {
      delta = ((delta % slots) + slots) % slots;
      if (delta > slots / 2) delta -= slots;
    }
    setRotation((r) => r + delta);
    setPrevIndex(index);
    setIndex(next);
  }

  const trackOffset = Math.min(
    Math.max(index - Math.floor((visibleCount - 1) / 2), 0),
    Math.max(0, count - visibleCount)
  );

  return (
    <section
      className="wheel-vars wheel-motion relative w-full overflow-hidden bg-gradient-to-b from-[#F5F4F2] to-[#ECEAE7]"
      style={{ color: CHARCOAL, "--k": neighbourK.toFixed(4) } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full border-[64px] border-transparent"
        style={{
          left: "var(--cx)",
          top: "var(--cy)",
          width: "calc(var(--R) * 2 + 64px)",
          height: "calc(var(--R) * 2 + 64px)",
          translate: "-50% -50%",
          borderBottomColor: "rgba(244,176,160,0.20)",
          borderRightColor: "rgba(244,176,160,0.12)",
          transform: `rotate(${rotation * step * 0.3}deg)`,
          transition: `transform ${MOTION}`,
        }}
      />

      <div
        aria-hidden
        className="absolute"
        style={{
          left: "var(--cx)",
          top: "var(--cy)",
          transform: `rotate(${rotation * step}deg)`,
          transition: `transform ${MOTION}`,
        }}
      >
        {categories.map((c, i) => (
          <div
            key={c.id}
            className="absolute left-0 top-0"
            style={{
              width: "var(--plate)",
              height: "var(--plate)",
              marginLeft: "calc(var(--plate) / -2)",
              marginTop: "calc(var(--plate) / -2)",
              transform: `rotate(${HERO_ANGLE - i * step}deg) translateX(var(--R)) rotate(${-HERO_ANGLE}deg)`,
            }}
          >
            <Plate imageUrl={c.imageUrl} priority={i === 0} />
          </div>
        ))}
      </div>

      <PageIndicator count={count} index={index} onSelect={select} />

      <div className="wheel-content relative px-margin-mobile lg:pr-margin-desktop xl:flex xl:flex-wrap xl:items-start xl:gap-x-12 xl:gap-y-8">
        <div className="w-full min-w-0 text-center lg:text-left xl:w-auto xl:max-w-[440px] xl:shrink-0">
            <p className="text-[12px] font-bold tracking-wide mb-2">#{index + 1} Онцлох ангилал</p>
            <div className="relative">
              {prevIndex !== null && <Title key={`prev-${prevIndex}`} name={categories[prevIndex].name} leaving />}
              <Title key={`cur-${index}`} name={selected.name} />
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-6 mt-5">
              <a
                href="#category-products"
                className="xl:hidden flex items-center gap-1.5 text-[13px] font-semibold text-[#6a6a6a] hover:text-[#3A3A3A] transition-colors"
              >
                <MaterialIcon name="arrow_downward" className="text-lg" />
                Бараа үзэх ({selected.products.length})
              </a>
              <Link
                href="/basket"
                className="flex items-center gap-1.5 text-[13px] font-semibold text-[#6a6a6a] hover:text-[#3A3A3A] transition-colors"
              >
                <MaterialIcon name="shopping_bag" className="text-lg" />
                Сагс руу
              </Link>
            </div>
        </div>

        <ProductRail category={selected} />
      </div>

      <div className="relative px-margin-mobile md:px-margin-desktop pt-6 pb-8 flex flex-col items-center gap-5" id="shop">
        <div
          className="flex items-center gap-1 md:gap-3 [--step:96px] md:[--step:124px]"
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 40) select(index + (dx < 0 ? 1 : -1));
          }}
        >
          <Chevron dir="left" disabled={!fullCircle && index === 0} onClick={() => select(index - 1)} />
          <div className="overflow-hidden" style={{ width: `calc(${visibleCount} * var(--step))` }}>
            <div
              className="relative flex"
              style={{ transform: `translateX(calc(${-trackOffset} * var(--step)))`, transition: `transform ${MOTION}` }}
            >
              <div
                aria-hidden
                className="absolute top-0 left-0 h-full p-1.5"
                style={{ width: "var(--step)", transform: `translateX(calc(${index} * var(--step)))`, transition: `transform ${MOTION}` }}
              >
                <div className="w-full h-full rounded-2xl bg-white/70 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)]" />
              </div>
              {categories.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => select(i)}
                  aria-pressed={i === index}
                  className="group relative shrink-0 flex flex-col items-center gap-2 pt-4 pb-3 px-2"
                  style={{ width: "var(--step)" }}
                >
                  <span className="relative block w-14 h-14 md:w-[68px] md:h-[68px] rounded-full overflow-hidden bg-white ring-[3px] ring-white shadow-[0_8px_18px_-10px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_14px_24px_-12px_rgba(0,0,0,0.4)]">
                    {c.imageUrl ? (
                      <Image src={c.imageUrl} alt="" fill sizes="68px" className="object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-[#9A9A9A]">
                        <MaterialIcon name="category" />
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[11px] leading-tight text-center line-clamp-2 min-h-[2.5em] transition-colors ${
                      i === index ? "text-[#3A3A3A] font-semibold" : "text-[#9A9A9A] group-hover:text-[#3A3A3A]"
                    }`}
                  >
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <Chevron dir="right" disabled={!fullCircle && index === count - 1} onClick={() => select(index + 1)} />
        </div>

      </div>

      <div
        id="category-products"
        className="xl:hidden relative max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-u-xl scroll-mt-24"
      >
        <div className="flex items-end justify-between gap-3 mb-5 md:mb-6">
          <h2 className="text-[22px] md:text-[28px] font-extrabold leading-tight">{selected.name}</h2>
          <Link
            href={`/?category=${selected.id}`}
            className="shrink-0 flex items-center gap-1 text-[13px] font-semibold text-[#6a6a6a] hover:text-[#3A3A3A] transition-colors"
          >
            Бүгдийг харах
            <MaterialIcon name="arrow_forward" className="text-base" />
          </Link>
        </div>
        <div key={selected.id} className="wheel-fade-in">
          {selected.products.length === 0 ? (
            <p className="text-[#9A9A9A] text-center py-12">Энэ ангилалд одоогоор бараа алга.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
              {selected.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Plate({ imageUrl, priority }: { imageUrl: string | null; priority: boolean }) {
  return (
    <div className="w-full h-full rounded-full p-[6%] bg-gradient-to-br from-[#a3a19e] to-[#7d7b78] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.45)]">
      <div className="relative w-full h-full rounded-full overflow-hidden bg-[#8d8b88] shadow-[inset_0_2px_10px_rgba(0,0,0,0.25)]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            priority={priority}
            loading={priority ? undefined : "eager"}
            sizes="(max-width: 1024px) 80vw, 520px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/70">
            <MaterialIcon name="category" className="text-5xl" />
          </div>
        )}
      </div>
    </div>
  );
}

function Title({ name, leaving = false }: { name: string; leaving?: boolean }) {
  const { thin, bold } = splitName(name);
  const anim = leaving ? "wheel-title-out" : "wheel-title-in";
  const boldSize = `clamp(28px, ${Math.min(7, 48 / bold.length)}vw, ${Math.min(76, 640 / bold.length)}px)`;
  return (
    <div className={leaving ? "absolute inset-x-0 top-0" : "relative"} aria-hidden={leaving}>
      {thin && (
        <p
          className={`${anim} uppercase font-extralight tracking-[0.06em] leading-[1.05] break-words`}
          style={{ fontSize: "clamp(26px, 4.4vw, 56px)" }}
        >
          {thin}
        </p>
      )}
      <h1
        className={`${anim} uppercase font-black tracking-[-0.02em] leading-[1.02] break-words`}
        style={{ fontSize: boldSize, animationDelay: leaving ? "0ms" : "80ms" }}
      >
        {bold}
      </h1>
    </div>
  );
}

function ProductRail({ category }: { category: SpotlightCategory }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function slide(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth - 120, 216), behavior: "smooth" });
  }

  return (
    <div className="hidden xl:block flex-1 min-w-[460px]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-semibold text-[#6a6a6a]">{category.products.length} бараа</p>
        <div className="flex items-center gap-2">
          <Link
            href={`/?category=${category.id}`}
            className="mr-2 flex items-center gap-1 text-[13px] font-semibold text-[#6a6a6a] hover:text-[#3A3A3A] transition-colors"
          >
            Бүгдийг харах
            <MaterialIcon name="arrow_forward" className="text-base" />
          </Link>
          <RailButton dir="left" onClick={() => slide(-1)} />
          <RailButton dir="right" onClick={() => slide(1)} />
        </div>
      </div>
      <div
        key={category.id}
        ref={trackRef}
        className="wheel-fade-in no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mb-4"
      >
        {category.products.length === 0 ? (
          <p className="text-[#9A9A9A] py-12">Энэ ангилалд одоогоор бараа алга.</p>
        ) : (
          category.products.map((p) => (
            <div key={p.id} className="w-[200px] shrink-0 snap-start">
              <ProductCard product={p} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RailButton({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === "left" ? "Өмнөх бараанууд" : "Дараагийн бараанууд"}
      className="w-9 h-9 rounded-full bg-white/80 shadow-[0_8px_18px_-10px_rgba(0,0,0,0.3)] flex items-center justify-center text-[#3A3A3A] hover:bg-white transition-colors"
    >
      <MaterialIcon name={dir === "left" ? "chevron_left" : "chevron_right"} className="text-xl" />
    </button>
  );
}

function PageIndicator({ count, index, onSelect }: { count: number; index: number; onSelect: (i: number) => void }) {
  return (
    <div
      className="hidden lg:flex absolute left-6 z-10 flex-col items-center gap-2 -translate-y-1/2"
      style={{ top: "var(--hy)" }}
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          aria-label={`${i + 1}-р ангилал`}
          className="w-[3px] rounded-full bg-[#3A3A3A] transition-all duration-500"
          style={{ height: i === index ? 28 : 4, opacity: i === index ? 1 : 0.35 }}
        />
      ))}
    </div>
  );
}

function Chevron({ dir, disabled, onClick }: { dir: "left" | "right"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "left" ? "Өмнөх" : "Дараах"}
      className="w-8 h-8 flex items-center justify-center text-[#3A3A3A] hover:scale-110 transition-transform disabled:opacity-25 disabled:hover:scale-100"
    >
      <MaterialIcon name={dir === "left" ? "arrow_left" : "arrow_right"} className="text-3xl" />
    </button>
  );
}
