"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/MaterialIcon";

const NAV_ITEMS = [
  { href: "/admin", label: "Хянах самбар", icon: "dashboard" },
  { href: "/admin/pos", label: "Касс", icon: "point_of_sale" },
  { href: "/admin/products", label: "Бараа", icon: "inventory_2" },
  { href: "/admin/categories", label: "Ангилал", icon: "category" },
  { href: "/admin/orders", label: "Захиалгууд", icon: "receipt_long" },
  { href: "/admin/customers", label: "Хэрэглэгчид", icon: "group" },
  { href: "/admin/companies", label: "Байгууллагууд", icon: "domain" },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="print:hidden w-56 md:w-64 flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant min-h-screen sticky top-0 flex flex-col">
      <div className="h-20 flex items-center px-u-md border-b border-outline-variant">
        <Link href="/" className="font-headline-md text-headline-md font-medium text-primary">
          ХүнсМаркет
        </Link>
      </div>
      <nav className="flex-grow p-u-sm space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-label-md text-label-md transition-colors ${
                active ? "bg-primary text-on-primary" : "text-secondary hover:bg-surface-container-low"
              }`}
            >
              <MaterialIcon name={item.icon} className="text-xl" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-u-sm border-t border-outline-variant">
        <div className="flex items-center gap-2 px-4 py-3">
          <MaterialIcon name="account_circle" className="text-primary" />
          <div className="flex-grow overflow-hidden">
            <p className="font-label-md text-label-md truncate">{email}</p>
            <p className="text-label-sm text-secondary">Администратор</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-secondary hover:bg-surface-container-low hover:text-error transition-colors font-label-sm"
        >
          <MaterialIcon name="logout" className="text-lg" />
          Гарах
        </button>
      </div>
    </aside>
  );
}
