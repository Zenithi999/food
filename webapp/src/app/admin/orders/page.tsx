import Image from "next/image";
import Link from "next/link";
import { listOrders } from "@/lib/db";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { MaterialIcon } from "@/components/MaterialIcon";
import { formatMNT, formatDateTimeMN } from "@/lib/format";
import { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE, PAYMENT_TYPE_LABEL, orderNumber } from "@/lib/labels";

export default async function AdminOrdersPage() {
  const orders = await listOrders();

  return (
    <div>
      <h1 className="font-headline-lg text-headline-lg text-primary mb-u-lg">Захиалгууд</h1>

      {orders.length === 0 ? (
        <p className="text-secondary text-center py-u-xl">Захиалга алга.</p>
      ) : (
        <div className="space-y-u-md">
          {orders.map((order) => {
            const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
            const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
            return (
              <article
                key={order.id}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 overflow-hidden"
              >
                <header className="flex flex-wrap items-start justify-between gap-u-sm p-u-md border-b border-outline-variant/60">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-label-md text-[17px] font-bold">#{orderNumber(order.id)}</h2>
                      <span
                        className={`text-label-sm px-2 py-0.5 rounded-full ${
                          order.source === "POS"
                            ? "bg-tertiary-container text-on-tertiary-container"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {order.source === "POS" ? "Касс" : "Онлайн"}
                      </span>
                      <span className="text-label-sm text-secondary">{formatDateTimeMN(order.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 font-label-md text-label-md">
                      {order.companyName ? (
                        <>
                          <MaterialIcon name="domain" className="text-base align-[-3px] mr-1" />
                          {order.companyName}
                        </>
                      ) : (
                        order.userName
                      )}
                    </p>
                    <p className="text-label-sm text-secondary">
                      {[order.phone, order.address, order.companyName ? null : order.userEmail].filter(Boolean).join(" · ")}
                    </p>
                    {order.note && <p className="text-label-sm text-on-surface-variant mt-1 italic">“{order.note}”</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-right mr-2">
                      <p className="text-label-sm">{PAYMENT_TYPE_LABEL[order.paymentType]}</p>
                      <span
                        className={`inline-block mt-1 text-label-sm px-2 py-0.5 rounded-full ${PAYMENT_STATUS_STYLE[order.paymentStatus]}`}
                      >
                        {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                      </span>
                    </div>
                    <OrderStatusSelect orderId={order.id} status={order.status} />
                    <Link
                      href={`/admin/orders/${order.id}/receipt`}
                      target="_blank"
                      className="flex items-center gap-1.5 bg-primary text-on-primary rounded-full px-4 py-2 font-label-sm text-label-sm hover:opacity-90 transition-opacity"
                    >
                      <MaterialIcon name="print" className="text-base" />
                      Баримт хэвлэх
                    </Link>
                  </div>
                </header>

                {order.items.length === 0 && (
                  <p className="px-u-md py-4 text-label-sm text-secondary">Барааны дэлгэрэнгүй мэдээлэл хадгалагдаагүй байна.</p>
                )}
                <ul className="divide-y divide-outline-variant/50">
                  {order.items.map((item) => (
                    <li key={item.productId} className="flex items-center gap-u-sm px-u-md py-2.5">
                      <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-white border border-outline-variant/50">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-contain p-1" />
                        ) : (
                          <MaterialIcon name="image" className="absolute inset-0 m-auto w-fit h-fit text-secondary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug line-clamp-2">{item.name}</p>
                        <p className="text-label-sm text-secondary">{item.unit}</p>
                      </div>
                      <p className="shrink-0 text-sm text-secondary w-28 text-right">
                        {item.quantity} × {formatMNT(item.price)}
                      </p>
                      <p className="shrink-0 text-sm font-semibold w-24 text-right">{formatMNT(item.price * item.quantity)}</p>
                    </li>
                  ))}
                </ul>

                <footer className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 px-u-md py-3 bg-surface-container-low text-sm">
                  {order.items.length > 0 && (
                    <>
                      <span className="text-secondary">{itemCount} ширхэг</span>
                      <span className="text-secondary">Дэд дүн: {formatMNT(subtotal)}</span>
                      <span className="text-secondary">НӨАТ: {formatMNT(order.total - subtotal)}</span>
                    </>
                  )}
                  <span className="font-bold text-[16px]">Нийт: {formatMNT(order.total)}</span>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
