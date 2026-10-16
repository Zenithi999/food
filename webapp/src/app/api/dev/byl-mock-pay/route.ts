import { NextRequest, NextResponse } from "next/server";
import { getPaymentByOrderId } from "@/lib/db";
import { BYL_MOCK_MODE, mockMarkInvoicePaid } from "@/lib/byl";
import { z } from "zod";

const BodySchema = z.object({ orderId: z.string().trim().min(1) });

// Зөвхөн Byl credentials ороогүй (mock горим) үед идэвхтэй — нэхэмжлэхийг гараар "төлөгдсөн" болгож тестлэнэ.
export async function POST(request: NextRequest) {
  if (!BYL_MOCK_MODE || process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Буруу мэдээлэл." }, { status: 400 });
  }

  const payment = await getPaymentByOrderId(parsed.data.orderId);
  if (!payment?.bylInvoiceId) {
    return NextResponse.json({ error: "Нэхэмжлэх олдсонгүй." }, { status: 404 });
  }

  mockMarkInvoicePaid(payment.bylInvoiceId);
  return NextResponse.json({ ok: true });
}
