import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listOrders } from "@/lib/db";
import { formatMNT, formatDateMN } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Хүлээгдэж буй",
  SHIPPED: "Бэлэн болсон",
  DELIVERED: "Дууссан",
  CANCELLED: "Цуцлагдсан",
};

const STATUS_STYLES: Record<string, string> = {
  DELIVERED: "bg-primary-container text-on-primary-container",
  SHIPPED: "bg-secondary-container text-secondary",
  PENDING: "bg-error-container text-on-error-container",
  CANCELLED: "bg-surface-container-high text-secondary",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { success } = await searchParams;

  const orders = await listOrders({ userId: session.userId });

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-u-xl w-full">
      <h1 className="font-display-lg text-display-lg text-primary mb-u-lg">Миний захиалгууд</h1>

      {success === "1" && (
        <div className="mb-u-lg p-u-md rounded-lg bg-primary-container text-on-primary-container flex items-center gap-2">
          Таны захиалга амжилттай бүртгэгдлээ! Бид тун удахгүй холбогдох болно.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-u-xl">
          <p className="text-secondary mb-u-lg">Та одоогоор захиалга хийгээгүй байна.</p>
          <Link
            href="/"
            className="inline-block bg-primary text-on-primary py-3 px-8 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity"
          >
            ДЭЛГҮҮР ХАРАХ
          </Link>
        </div>
      ) : (
        <div className="space-y-u-md">
          {orders.map((order) => (
            <div key={order.id} className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-4 md:p-u-md">
              <div className="flex flex-wrap justify-between items-start gap-u-sm mb-u-sm">
                <div>
                  <p className="font-label-md text-label-md text-primary">Захиалга #{order.id.slice(-6).toUpperCase()}</p>
                  <p className="text-label-sm text-secondary">{formatDateMN(order.createdAt)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-label-sm ${STATUS_STYLES[order.status]}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              <div className="divide-y divide-outline-variant border-t border-b border-outline-variant mb-u-sm">
                {order.items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-u-sm py-u-sm">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden flex-shrink-0 relative bg-white">
                      <Image src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-contain p-0.5" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium leading-snug line-clamp-2">{item.name}</p>
                      <p className="text-label-sm text-secondary">
                        {item.quantity} x {formatMNT(item.price)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">{formatMNT(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center gap-3">
                <p className="text-label-sm text-secondary min-w-0 truncate">{order.address}</p>
                <p className="shrink-0 font-headline-md text-headline-md text-primary">{formatMNT(order.total)}</p>
              </div>

              {order.paymentStatus === "PENDING" && (order.paymentType === "CREDIT" || order.paymentType === "QPAY") && (
                <div className="mt-u-sm pt-u-sm border-t border-outline-variant flex items-center justify-between gap-3">
                  <p className="text-label-sm text-error">
                    {order.paymentType === "CREDIT" ? "Зээлийн үлдэгдэл төлөгдөөгүй байна." : "Төлбөр хийгдээгүй байна."}
                  </p>
                  <Link
                    href={`/orders/${order.id}/pay`}
                    className="shrink-0 bg-primary text-on-primary py-2 px-5 rounded-full font-label-sm text-label-sm hover:opacity-90 transition-opacity"
                  >
                    Төлөх
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
