"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = [
  { value: "PENDING", label: "Хүлээгдэж буй" },
  { value: "SHIPPED", label: "Бэлэн болсон" },
  { value: "DELIVERED", label: "Дууссан" },
  { value: "CANCELLED", label: "Цуцлагдсан" },
];

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: string) {
    setCurrent(next);
    setSaving(true);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={current}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      className="bg-surface-container-low border border-outline-variant rounded-full px-3 py-1 text-label-sm focus:ring-1 focus:ring-primary outline-none"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
