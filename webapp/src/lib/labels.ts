import type { PaymentStatus, PaymentType } from "@/types";

export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  CASH: "Бэлнээр",
  CREDIT: "Зээлээр",
  QPAY: "Онлайн (Byl)",
  BANK: "Дансаар",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  SUCCESS: "Төлөгдсөн",
  PENDING: "Хүлээгдэж буй",
  FAILED: "Амжилтгүй",
};

export const PAYMENT_STATUS_STYLE: Record<PaymentStatus, string> = {
  SUCCESS: "bg-primary-container text-on-primary-container",
  PENDING: "bg-surface-container-high text-on-surface-variant",
  FAILED: "bg-error-container text-on-error-container",
};

export function orderNumber(id: string) {
  return id.slice(-6).toUpperCase();
}
