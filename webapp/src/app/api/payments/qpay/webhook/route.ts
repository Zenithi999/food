import { NextRequest, NextResponse } from "next/server";
import { getPaymentByOrderId, markPaymentPaid } from "@/lib/db";
import { verifyInvoicePayment } from "@/lib/qpay";
import { logError } from "@/lib/logger";

// QPay callback_url-д бид өөрсдийн орж ирэх ?token= (QPAY_WEBHOOK_SECRET) болон ?orderId=
// параметрүүдийг эхнээсээ оруулж илгээдэг тул payload-д итгэлгүйгээр эдгээрээр эх сурвалжаа
// баталгаажуулна. Payload дахь төлбөрийн статусыг ШУУД итгэхгүй — QPay API-аас дахин шалгана.
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const orderId = searchParams.get("orderId");

  if (!token || token !== process.env.QPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
  }

  try {
    const payment = await getPaymentByOrderId(orderId);
    if (!payment || !payment.qpayInvoiceId) {
      return NextResponse.json({ ok: true });
    }
    if (payment.status === "SUCCESS") {
      return NextResponse.json({ ok: true });
    }

    const result = await verifyInvoicePayment(payment.qpayInvoiceId);
    if (result.paid) {
      await markPaymentPaid(orderId, result.transactionId);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("qpay.webhook", err);
    // QPay 200-оос өөр кодод дахин илгээдэг тул алдаа ч гэсэн 200 буцаана —
    // polling endpoint (/api/orders/[id]/payment-status) нөөц баталгаажуулагчаар үлдэнэ.
    return NextResponse.json({ ok: true });
  }
}
