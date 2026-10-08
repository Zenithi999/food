import { listOrders, countOrders, countCustomers, countLowStockProducts, sumRecentRevenue } from "@/lib/db";
import { formatMNT } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Хүлээгдэж буй",
  SHIPPED: "Бэлэн болсон",
  DELIVERED: "Дууссан",
  CANCELLED: "Цуцлагдсан",
};

const STATUS_STYLES: Record<string, string> = {
  DELIVERED: "bg-primary-container text-on-primary-container",
  SHIPPED: "bg-secondary-container text-secondary",
  PENDING: "bg-error-container text-on-error-container",
  CANCELLED: "bg-surface-container-high text-secondary",
};

export default async function AdminDashboardPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [revenue, orderCount, customerCount, lowStockCount, allOrders] = await Promise.all([
    sumRecentRevenue(thirtyDaysAgo),
    countOrders(),
    countCustomers(),
    countLowStockProducts(),
    listOrders(),
  ]);

  const recentOrders = allOrders.slice(0, 5);

  return (
    <div>
      <h1 className="font-headline-lg text-headline-lg text-primary mb-u-lg">Хянах самбар</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-gutter mb-u-xl">
        <StatCard label="Орлого (30 хоног)" value={formatMNT(revenue)} />
        <StatCard label="Захиалга" value={String(orderCount)} />
        <StatCard label="Хэрэглэгч" value={String(customerCount)} />
        <StatCard label="Нөөц багассан бараа" value={String(lowStockCount)} tone={lowStockCount > 0 ? "error" : undefined} />
      </div>

      <h2 className="font-headline-md text-headline-md text-primary mb-u-md">Сүүлийн захиалгууд</h2>
      <div className="item-card-shadow bg-surface-container-lowest rounded-lg overflow-x-auto">
        <table className="w-full text-left min-w-[500px]">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Захиалга</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Хэрэглэгч</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Төлөв</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">Дүн</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-u-md py-6 text-center text-secondary">
                  Захиалга алга.
                </td>
              </tr>
            ) : (
              recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-outline-variant">
                  <td className="px-u-md py-3 font-label-md">#{order.id.slice(-6).toUpperCase()}</td>
                  <td className="px-u-md py-3">{order.userName}</td>
                  <td className="px-u-md py-3">
                    <span className={`px-2 py-1 rounded-full text-label-sm ${STATUS_STYLES[order.status]}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-u-md py-3 text-right font-label-md">{formatMNT(order.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "error" }) {
  return (
    <div className="item-card-shadow bg-surface-container-lowest rounded-lg p-u-md">
      <p className="text-label-sm text-secondary uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-headline-md text-headline-md ${tone === "error" ? "text-error" : "text-primary"}`}>{value}</p>
    </div>
  );
}
