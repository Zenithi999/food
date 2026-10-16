import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex w-full">
      <AdminSidebar email={session.email} />
      <main className="flex-grow p-u-md md:p-u-lg print:p-0 overflow-y-auto">{children}</main>
    </div>
  );
}
