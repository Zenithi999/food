import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderById } from "@/lib/db";
import { formatMNT, formatDateTimeMN } from "@/lib/format";
import { PAYMENT_STATUS_LABEL, PAYMENT_TYPE_LABEL, orderNumber } from "@/lib/labels";
import { SHOP } from "@/lib/shop";
import { PrintButton } from "@/components/admin/PrintButton";
import { MaterialIcon } from "@/components/MaterialIcon";

export default async function OrderReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const vat = order.total - subtotal;
  const buyer = order.companyName ?? order.userName;

  return (
    <div className="max-w-[820px] mx-auto">
      <div className="print:hidden flex items-center justify-between gap-u-sm mb-u-md">
        <Link href="/admin/orders" className="flex items-center gap-1 text-label-md text-secondary hover:text-primary transition-colors">
          <MaterialIcon name="arrow_back" className="text-lg" />
          Захиалгууд
        </Link>
        <PrintButton />
      </div>

      <div className="receipt bg-white text-[#1f1f1f] rounded-2xl print:rounded-none p-10 print:p-0 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.25)] print:shadow-none text-[13px] leading-relaxed">
        <div className="flex items-start justify-between gap-6 pb-5 border-b-2 border-[#1f1f1f]">
          <div>
            <p className="text-[22px] font-extrabold">{SHOP.name}</p>
            <p className="text-[#555]">{SHOP.phone}</p>
            <p className="text-[#555]">{SHOP.email}</p>
          </div>
          <div className="text-right">
            <p className="text-[18px] font-extrabold tracking-wide">ЗАРЛАГЫН БАРИМТ</p>
            <p>
              Дугаар: <span className="font-bold">#{orderNumber(order.id)}</span>
            </p>
            <p>Огноо: {formatDateTimeMN(order.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-5">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#777] mb-1">Худалдан авагч</p>
            <p className="font-bold text-[15px]">{buyer}</p>
            {order.phone && <p>Утас: {order.phone}</p>}
            {order.address && <p>Хаяг: {order.address}</p>}
            {!order.companyName && order.userEmail && <p>Имэйл: {order.userEmail}</p>}
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-[#777] mb-1">Төлбөр</p>
            <p className="font-bold text-[15px]">{PAYMENT_TYPE_LABEL[order.paymentType]}</p>
            <p>Төлөв: {PAYMENT_STATUS_LABEL[order.paymentStatus]}</p>
            <p>{order.source === "POS" ? "Кассын борлуулалт" : "Онлайн захиалга"}</p>
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-[#1f1f1f] text-left">
              <th className="py-2 pr-2 w-8">№</th>
              <th className="py-2 pr-2">Барааны нэр</th>
              <th className="py-2 pr-2 w-20">Нэгж</th>
              <th className="py-2 pr-2 w-14 text-right">Тоо</th>
              <th className="py-2 pr-2 w-24 text-right">Нэгж үнэ</th>
              <th className="py-2 w-28 text-right">Дүн</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={item.productId} className="border-b border-[#ddd] align-top">
                <td className="py-2 pr-2">{i + 1}</td>
                <td className="py-2 pr-2">{item.name}</td>
                <td className="py-2 pr-2">{item.unit}</td>
                <td className="py-2 pr-2 text-right">{item.quantity}</td>
                <td className="py-2 pr-2 text-right">{formatMNT(item.price)}</td>
                <td className="py-2 text-right">{formatMNT(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end pt-4">
          <dl className="w-64 space-y-1">
            {order.items.length > 0 && (
              <>
                <div className="flex justify-between">
                  <dt>Дэд дүн</dt>
                  <dd>{formatMNT(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>НӨАТ (10%)</dt>
                  <dd>{formatMNT(vat)}</dd>
                </div>
              </>
            )}
            <div className="flex justify-between border-t-2 border-[#1f1f1f] pt-2 mt-2 text-[16px] font-extrabold">
              <dt>Нийт дүн</dt>
              <dd>{formatMNT(order.total)}</dd>
            </div>
          </dl>
        </div>

        {order.paymentType === "CREDIT" && order.paymentStatus !== "SUCCESS" && (
          <p className="mt-4 border border-[#1f1f1f] px-3 py-2 font-semibold">
            Зээлээр олгосон — төлөгдөөгүй үлдэгдэл: {formatMNT(order.total)}
          </p>
        )}

        {order.note && <p className="mt-4 text-[#555]">Тэмдэглэл: {order.note}</p>}

        <div className="grid grid-cols-2 gap-10 mt-14">
          <div>
            <p>Хүлээлгэн өгсөн: ................................</p>
            <p className="text-[#777] text-[11px] mt-1 ml-28">(нэр, гарын үсэг)</p>
          </div>
          <div>
            <p>Хүлээн авсан: ................................</p>
            <p className="text-[#777] text-[11px] mt-1 ml-24">(нэр, гарын үсэг)</p>
          </div>
        </div>
        <p className="mt-8 text-[#777]">Тамга:</p>
      </div>
    </div>
  );
}
