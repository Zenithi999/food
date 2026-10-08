import { NextRequest, NextResponse } from "next/server";
import { getOrderById, getPaymentByOrderId, updatePaymentInvoice } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createInvoice } from "@/lib/qpay";
import { logError } from "@/lib/logger";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Нэвтэрнэ үү." }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Захиалга олдсонгүй." }, { status: 404 });
  }
  if (order.userId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const payment = await getPaymentByOrderId(id);
  if (!payment) {
    return NextResponse.json({ error: "Төлбөрийн бичлэг олдсонгүй." }, { status: 400 });
  }
  if (payment.status === "SUCCESS") {
    return NextResponse.json({ error: "Захиалга аль хэдийн төлөгдсөн байна." }, { status: 409 });
  }

  try {
    const invoice = await createInvoice({
      orderId: order.id,
      amount: order.total,
      description: `Захиалга #${order.id.slice(0, 8)}`,
    });
    await updatePaymentInvoice(order.id, { qpayInvoiceId: invoice.invoiceId });
    return NextResponse.json({ qpayInvoice: invoice });
  } catch (err) {
    logError("orders.qpay-invoice-retry", err);
    return NextResponse.json({ error: "QPay нэхэмжлэх үүсгэхэд алдаа гарлаа. Дахин оролдоно уу." }, { status: 502 });
  }
}
