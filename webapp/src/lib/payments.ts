import { getPaymentByOrderId, markPaymentPaid, setPaymentBylInvoice } from "./db";
import { createInvoice, getInvoice } from "./byl";
import type { OrderDTO } from "@/types";

export type OnlinePaymentResult = { status: "PAID" } | { status: "OPEN"; url: string };

// Захиалгын онлайн төлбөрийн холбоосыг буцаана: нээлттэй Byl нэхэмжлэх байвал дахин ашиглана,
// үгүй бол шинээр үүсгэнэ. Аль хэдийн төлөгдсөн бол төлбөрийг баталгаажуулна.
export async function ensureOnlinePayment(order: OrderDTO): Promise<OnlinePaymentResult> {
  const payment = await getPaymentByOrderId(order.id);
  if (payment?.status === "SUCCESS") return { status: "PAID" };

  if (payment?.bylInvoiceId) {
    const existing = await getInvoice(payment.bylInvoiceId);
    if (existing.status === "paid") {
      await markPaymentPaid(order.id);
      return { status: "PAID" };
    }
    if (existing.status === "open") return { status: "OPEN", url: existing.url };
  }

  const invoice = await createInvoice({
    orderId: order.id,
    amount: order.total,
    description: `ХүнсМаркет захиалга #${order.id.slice(-6).toUpperCase()}`,
  });
  await setPaymentBylInvoice(order.id, { invoiceId: invoice.id, url: invoice.url });
  return { status: "OPEN", url: invoice.url };
}

// Byl-ээс нэхэмжлэхийн төлөвийг эх сурвалжаас нь шалгаж, төлөгдсөн бол захиалгыг баталгаажуулна.
export async function syncOnlinePayment(orderId: string): Promise<boolean> {
  const payment = await getPaymentByOrderId(orderId);
  if (!payment) return false;
  if (payment.status === "SUCCESS") return true;
  if (!payment.bylInvoiceId) return false;
  const invoice = await getInvoice(payment.bylInvoiceId);
  if (invoice.status !== "paid") return false;
  await markPaymentPaid(orderId);
  return true;
}
