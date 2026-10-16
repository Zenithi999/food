import { NextRequest, NextResponse } from "next/server";
import { listOrders, createOrder, getUserById, OrderError } from "@/lib/db";
import { getSession, requireAdminSession } from "@/lib/auth";
import { OrderCreateSchema } from "@/lib/validation";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("mine") === "1") {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Нэвтэрнэ үү." }, { status: 401 });
    }
    const orders = await listOrders({ userId: session.userId });
    return NextResponse.json({ orders });
  }

  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const orders = await listOrders();
  return NextResponse.json({ orders });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Захиалга хийхийн тулд нэвтэрнэ үү." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = OrderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Буруу мэдээлэл." },
      { status: 400 }
    );
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ error: "Хэрэглэгч олдсонгүй." }, { status: 401 });
  }

  try {
    const order = await createOrder({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      address: parsed.data.address,
      phone: parsed.data.phone,
      note: parsed.data.note,
      items: parsed.data.items,
      paymentType: parsed.data.paymentType,
      companyId: user.companyId,
      idempotencyKey: parsed.data.idempotencyKey,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    logError("orders.create", err);
    return NextResponse.json({ error: "Захиалга үүсгэхэд алдаа гарлаа." }, { status: 500 });
  }
}
