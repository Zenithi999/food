"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { CartDrawer } from "./CartDrawer";
import { MobileMenu } from "./MobileMenu";
import { ProfileMenu } from "./ProfileMenu";
import { useCartStore, cartCount } from "@/store/cart";
import type { SessionUser } from "@/types";

export function Header({ initialSession }: { initialSession: SessionUser | null }) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const [session, setSession] = useState(initialSession);
  const [hydrated, setHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => setHydrated(true), []);
  useEffect(() => setSession(initialSession), [initialSession]);
  useEffect(() => setMenuOpen(false), [session]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setMenuOpen(false);
    router.push(query.trim() ? `/?q=${encodeURIComponent(query.trim())}` : "/");
  }

  const count = hydrated ? cartCount(items) : 0;

  return (
    <>
    <header className="w-full top-0 sticky z-50 bg-background border-b border-outline-variant/60">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop h-16 md:h-20 flex justify-between items-center">
        <div className="flex items-center gap-u-xl">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-on-primary group-hover:opacity-90 transition-opacity">
              <MaterialIcon name="shopping_basket" className="text-lg" />
            </span>
            <span className="font-headline-md text-xl md:text-headline-md font-semibold text-on-surface">ХүнсМаркет</span>
          </Link>
          <nav className="hidden md:flex items-center gap-u-md">
            <Link href="/" className="relative py-1 whitespace-nowrap text-on-surface font-semibold hover:text-primary transition-colors font-label-md text-label-md group">
              Дэлгүүр
              <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-primary" />
            </Link>
            <Link href="/orders" className="relative py-1 whitespace-nowrap text-secondary hover:text-primary transition-colors font-label-md text-label-md group">
              Захиалгууд
              <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-primary transition-all duration-200 group-hover:w-full" />
            </Link>
            <a href="#" className="relative py-1 whitespace-nowrap text-secondary hover:text-primary transition-colors font-label-md text-label-md group">
              Бидний тухай
              <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-primary transition-all duration-200 group-hover:w-full" />
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-u-sm md:gap-u-md">
          <form onSubmit={handleSearch} className="hidden md:block relative">
            <button
              type="submit"
              aria-label="Хайх"
              className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-primary transition-colors"
            >
              <MaterialIcon name="search" className="text-lg" />
            </button>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-surface-container-low border-none rounded-full pl-10 pr-u-md py-2 text-label-md focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest transition-colors w-64"
              placeholder="Бүтээгдэхүүн хайх..."
              type="text"
            />
          </form>
          <button
            onClick={() => setCartOpen(true)}
            aria-label="Сагс нээх"
            className="relative w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-surface-container transition-colors active:scale-95 duration-150 ease-in-out text-on-surface"
          >
            <MaterialIcon name="shopping_cart" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </button>
          {session ? (
            <div className="hidden md:block">
              <ProfileMenu session={session} onLogout={handleLogout} />
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden md:flex items-center gap-1.5 bg-on-surface text-background rounded-full px-5 py-2.5 font-label-md text-label-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              <MaterialIcon name="login" className="text-lg" />
              Нэвтрэх
            </Link>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Цэс хаах" : "Цэс нээх"}
            aria-expanded={menuOpen}
            className="md:hidden w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface"
          >
            <MaterialIcon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>
    </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        session={session}
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        onLogout={handleLogout}
      />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
