import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureOnlinePayment } from "@/lib/payments";
import { logError } from "@/lib/logger";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  if (order.paymentType !== "QPAY" && order.paymentType !== "CREDIT") {
    return NextResponse.json({ error: "Энэ захиалгыг онлайнаар төлөх боломжгүй." }, { status: 400 });
  }

  try {
    const result = await ensureOnlinePayment(order);
    if (result.status === "PAID") {
      return NextResponse.json({ status: "SUCCESS" });
    }
    return NextResponse.json({ status: "PENDING", url: result.url, amount: order.total });
  } catch (err) {
    logError("orders.payment-link", err);
    return NextResponse.json({ error: "Төлбөрийн холбоос үүсгэхэд алдаа гарлаа. Дахин оролдоно уу." }, { status: 502 });
  }
}
