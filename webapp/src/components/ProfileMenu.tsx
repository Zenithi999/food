"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";
import type { SessionUser } from "@/types";

export function ProfileMenu({ session, onLogout }: { session: SessionUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Профайл цэс"
        aria-expanded={open}
        className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-surface-container transition-colors active:scale-95 duration-150 text-on-surface"
      >
        <MaterialIcon name="account_circle" className="text-2xl" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-xl py-2 z-50">
          <div className="px-4 py-2 border-b border-outline-variant/60 mb-1">
            <p className="font-label-md text-label-md text-on-surface truncate">{session.name}</p>
            <p className="text-label-sm text-secondary truncate">{session.email}</p>
          </div>

          <MenuLink href="/orders" icon="receipt_long" onClick={() => setOpen(false)}>
            Захиалгын түүх
          </MenuLink>

          {session.role === "COMPANY" && (
            <MenuLink href="/orders" icon="payments" onClick={() => setOpen(false)}>
              Зээл төлөх
            </MenuLink>
          )}

          {session.role === "ADMIN" && (
            <MenuLink href="/admin" icon="admin_panel_settings" onClick={() => setOpen(false)}>
              Админ панель
            </MenuLink>
          )}

          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-secondary hover:bg-surface-container-low hover:text-error transition-colors font-label-md text-label-md"
          >
            <MaterialIcon name="logout" className="text-lg" />
            Гарах
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  onClick,
  children,
}: {
  href: string;
  icon: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors font-label-md text-label-md"
    >
      <MaterialIcon name={icon} className="text-lg" />
      {children}
    </Link>
  );
}
