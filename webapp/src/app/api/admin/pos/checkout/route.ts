import { NextRequest, NextResponse } from "next/server";
import { createOrder, getCompanyUser, listCompanies, updatePaymentInvoice, OrderError } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { PosCheckoutSchema } from "@/lib/validation";
import { createInvoice } from "@/lib/qpay";
import { logError } from "@/lib/logger";
import type { PaymentType } from "@/types";

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = PosCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Буруу мэдээлэл." }, { status: 400 });
  }
  const { items, saleType, companyId, note, idempotencyKey } = parsed.data;

  let userId: string;
  let resolvedCompanyId: string | null = null;
  let address: string;
  let phone: string;
  let paymentType: PaymentType;

  if (saleType === "RETAIL") {
    if (parsed.data.paymentType === "BANK") {
      return NextResponse.json({ error: "Шууд худалдан авалтад бэлэн эсвэл QPay-г ашиглана уу." }, { status: 400 });
    }
    userId = session.userId;
    address = "Лангуунаас шууд худалдан авалт";
    phone = "";
    paymentType = parsed.data.paymentType;
  } else {
    if (!companyId) {
      return NextResponse.json({ error: "Байгууллага сонгоно уу." }, { status: 400 });
    }
    const companies = await listCompanies();
    const company = companies.find((c) => c.id === companyId);
    if (!company || !company.isActive) {
      return NextResponse.json({ error: "Байгууллага олдсонгүй эсвэл идэвхгүй байна." }, { status: 404 });
    }
    const companyUser = await getCompanyUser(companyId);
    if (!companyUser) {
      return NextResponse.json({ error: "Энэ байгууллагад нэвтрэх хэрэглэгч тохируулаагүй байна." }, { status: 409 });
    }
    userId = companyUser.id;
    resolvedCompanyId = companyId;
    address = `Байгууллага: ${company.name}`;
    phone = company.contactPhone;
    paymentType = saleType === "CREDIT" ? "CREDIT" : parsed.data.paymentType;
  }

  try {
    const order = await createOrder({
      userId,
      userName: "",
      userEmail: "",
      address,
      phone,
      note,
      items,
      paymentType,
      companyId: resolvedCompanyId,
      idempotencyKey,
      source: "POS",
    });

    if (order.paymentType !== "QPAY") {
      return NextResponse.json({ order, qpayInvoice: null }, { status: 201 });
    }

    try {
      const invoice = await createInvoice({
        orderId: order.id,
        amount: order.total,
        description: `Кассын захиалга #${order.id.slice(0, 8)}`,
      });
      await updatePaymentInvoice(order.id, { qpayInvoiceId: invoice.invoiceId });
      return NextResponse.json({ order, qpayInvoice: invoice }, { status: 201 });
    } catch (invoiceErr) {
      logError("pos.checkout-qpay-invoice", invoiceErr);
      return NextResponse.json(
        { order, qpayInvoice: null, error: "QPay нэхэмжлэх үүсгэхэд алдаа гарлаа. Дахин оролдоно уу." },
        { status: 201 }
      );
    }
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    logError("pos.checkout", err);
    return NextResponse.json({ error: "Борлуулалт үүсгэхэд алдаа гарлаа." }, { status: 500 });
  }
}
