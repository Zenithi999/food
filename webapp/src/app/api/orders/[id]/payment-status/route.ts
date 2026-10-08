import { NextRequest, NextResponse } from "next/server";
import { getOrderById, getPaymentByOrderId, markPaymentPaid } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { verifyInvoicePayment } from "@/lib/qpay";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    return NextResponse.json({ error: "Төлбөрийн бичлэг олдсонгүй." }, { status: 404 });
  }

  if (payment.status !== "PENDING" || !payment.qpayInvoiceId) {
    return NextResponse.json({ status: payment.status });
  }

  try {
    const result = await verifyInvoicePayment(payment.qpayInvoiceId);
    if (result.paid) {
      await markPaymentPaid(id, result.transactionId);
      return NextResponse.json({ status: "SUCCESS" });
    }
    return NextResponse.json({ status: "PENDING" });
  } catch (err) {
    logError("orders.payment-status", err);
    return NextResponse.json({ status: "PENDING" });
  }
}
