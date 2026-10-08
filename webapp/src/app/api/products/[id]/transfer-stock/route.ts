import { NextRequest, NextResponse } from "next/server";
import { transferStock } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { StockTransferSchema } from "@/lib/validation";
import { logError } from "@/lib/logger";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = StockTransferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Буруу мэдээлэл." }, { status: 400 });
  }

  try {
    await transferStock(id, parsed.data.quantity);
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("products.transfer-stock", err);
    const message = err instanceof Error ? err.message : "Шилжүүлэхэд алдаа гарлаа.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
