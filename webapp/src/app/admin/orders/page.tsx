import { listOrders } from "@/lib/db";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { formatMNT, formatDateMN } from "@/lib/format";
import type { PaymentType, PaymentStatus } from "@/types";

const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  CASH: "Бэлнээр",
  CREDIT: "Зээлээр",
  QPAY: "Онлайн (Byl)",
  BANK: "Дансаар",
};

const PAYMENT_STATUS_STYLE: Record<PaymentStatus, string> = {
  SUCCESS: "bg-primary-container text-on-primary-container",
  PENDING: "bg-surface-container-high text-on-surface-variant",
  FAILED: "bg-error-container text-on-error-container",
};

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  SUCCESS: "Төлөгдсөн",
  PENDING: "Хүлээгдэж буй",
  FAILED: "Амжилтгүй",
};

export default async function AdminOrdersPage() {
  const orders = await listOrders();

  return (
    <div>
      <h1 className="font-headline-lg text-headline-lg text-primary mb-u-lg">Захиалгууд</h1>
      <div className="item-card-shadow bg-surface-container-lowest rounded-lg overflow-x-auto">
        <table className="w-full text-left min-w-[1100px]">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Захиалга</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Эх үүсвэр</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Хэрэглэгч</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Байгууллага</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Хаяг / Утас</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Огноо</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Төлбөр</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Төлөв</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">Дүн</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-u-md py-6 text-center text-secondary">
                  Захиалга алга.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t border-outline-variant">
                  <td className="px-u-md py-3 font-label-md">#{order.id.slice(-6).toUpperCase()}</td>
                  <td className="px-u-md py-3">
                    <span
                      className={`text-label-sm px-2 py-0.5 rounded-full ${
                        order.source === "POS"
                          ? "bg-tertiary-container text-on-tertiary-container"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {order.source === "POS" ? "Касс" : "Онлайн"}
                    </span>
                  </td>
                  <td className="px-u-md py-3">
                    {order.userName}
                    <div className="text-label-sm text-secondary">{order.userEmail}</div>
                  </td>
                  <td className="px-u-md py-3 text-label-sm text-secondary">{order.companyName ?? "—"}</td>
                  <td className="px-u-md py-3 text-label-sm text-secondary max-w-[200px]">
                    <div className="truncate">{order.address}</div>
                    <div>{order.phone}</div>
                  </td>
                  <td className="px-u-md py-3">{formatDateMN(order.createdAt)}</td>
                  <td className="px-u-md py-3">
                    <div className="text-label-sm">{PAYMENT_TYPE_LABEL[order.paymentType]}</div>
                    <span className={`inline-block mt-1 text-label-sm px-2 py-0.5 rounded-full ${PAYMENT_STATUS_STYLE[order.paymentStatus]}`}>
                      {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                    </span>
                  </td>
                  <td className="px-u-md py-3">
                    <OrderStatusSelect orderId={order.id} status={order.status} />
                  </td>
                  <td className="px-u-md py-3 text-right font-label-md">{formatMNT(order.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
