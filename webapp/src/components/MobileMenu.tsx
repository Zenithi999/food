"use client";

import Link from "next/link";
import { useEffect } from "react";
import { MaterialIcon } from "./MaterialIcon";
import type { SessionUser } from "@/types";

export function MobileMenu({
  open,
  onClose,
  session,
  query,
  onQueryChange,
  onSearch,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  session: SessionUser | null;
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onLogout: () => void;
}) {
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
        className={`md:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Цэс"
        className={`md:hidden fixed top-0 left-0 z-[70] h-dvh w-[85vw] max-w-xs bg-background shadow-2xl flex flex-col transition-[transform,visibility] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          open ? "translate-x-0 visible" : "-translate-x-full invisible"
        }`}
      >
        <div className="flex items-center justify-between px-margin-mobile h-16 border-b border-outline-variant">
          <span className="font-headline-md text-headline-md font-medium text-primary">Цэс</span>
          <button
            onClick={onClose}
            aria-label="Цэс хаах"
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-margin-mobile py-u-md flex flex-col gap-u-sm">
          <form onSubmit={onSearch} className="relative mb-u-sm">
            <MaterialIcon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg pointer-events-none"
            />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-full pl-10 pr-u-md py-2 text-label-md focus:ring-2 focus:ring-primary/40 transition-shadow"
              placeholder="Бүтээгдэхүүн хайх..."
              type="text"
            />
          </form>
          <Link href="/" onClick={onClose} className="text-secondary hover:text-primary transition-colors font-label-md text-label-md py-1">
            Дэлгүүр
          </Link>
          <Link href="/orders" onClick={onClose} className="text-secondary hover:text-primary transition-colors font-label-md text-label-md py-1">
            Захиалгууд
          </Link>
          <a href="#" onClick={onClose} className="text-secondary hover:text-primary transition-colors font-label-md text-label-md py-1">
            Бидний тухай
          </a>
          <div className="border-t border-outline-variant pt-u-sm mt-1">
            {session ? (
              <>
                {session.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="block text-secondary hover:text-primary transition-colors font-label-md text-label-md py-1"
                  >
                    Админ
                  </Link>
                )}
                <button
                  onClick={onLogout}
                  className="text-left w-full text-secondary hover:text-error transition-colors font-label-md text-label-md py-1"
                >
                  Гарах
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={onClose}
                className="block text-secondary hover:text-primary transition-colors font-label-md text-label-md py-1"
              >
                Нэвтрэх
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
