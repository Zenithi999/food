import { NextRequest, NextResponse } from "next/server";
import { getPaymentByOrderId } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/byl";
import { syncOnlinePayment } from "@/lib/payments";
import { logError } from "@/lib/logger";

interface BylEvent {
  id: string | number;
  type: string;
  data?: { object?: { id?: string | number; client_reference_id?: string | null } };
}

// Byl webhook: гарын үсгийг түүхий body-оор шалгаад, payload-ийн төлөвт шууд итгэлгүйгээр
// Byl API-аас нэхэмжлэхийг дахин татаж баталгаажуулна. Давхар ирсэн event аюулгүй (idempotent).
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, request.headers.get("byl-signature"))) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: BylEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (event.type !== "invoice.paid") {
    return NextResponse.json({ ok: true });
  }

  try {
    const invoice = event.data?.object;
    const orderId = invoice?.client_reference_id;
    if (!orderId || invoice?.id === undefined) return NextResponse.json({ ok: true });

    const payment = await getPaymentByOrderId(orderId);
    if (!payment || payment.bylInvoiceId !== String(invoice.id)) return NextResponse.json({ ok: true });

    await syncOnlinePayment(orderId);
  } catch (err) {
    // 2xx-ээс өөр хариу өгвөл Byl дахин илгээнэ — түр алдаа бол дахин оролдуулна.
    logError("byl.webhook", err);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
