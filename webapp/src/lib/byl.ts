import { createHmac, timingSafeEqual } from "node:crypto";

// Byl (byl.mn) — нэхэмжлэх үүсгээд хэрэглэгчийг Byl-ийн төлбөрийн хуудас руу илгээнэ
// (QPay, SocialPay, Golomt, Pocket). Баримт бичиг: https://byl.mn/docs
const BYL_BASE_URL = "https://byl.mn/api/v1";
const BYL_TOKEN = process.env.BYL_TOKEN;
const BYL_PROJECT_ID = process.env.BYL_PROJECT_ID;

// Credentials ороогүй бол mock горимд ажиллана — .env-д орж ирмэгц кодыг өөрчлөхгүйгээр бодит API руу шилжинэ.
export const BYL_MOCK_MODE = !BYL_TOKEN || !BYL_PROJECT_ID;

export type BylInvoiceStatus = "draft" | "open" | "paid" | "void";

export interface BylInvoice {
  id: string;
  status: BylInvoiceStatus;
  url: string;
  clientReferenceId: string | null;
}

export class BylHttpError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

const globalForByl = globalThis as unknown as { bylMockPaid?: Set<string> };
function mockPaidSet() {
  if (!globalForByl.bylMockPaid) globalForByl.bylMockPaid = new Set();
  return globalForByl.bylMockPaid;
}

export function mockMarkInvoicePaid(invoiceId: string) {
  mockPaidSet().add(invoiceId);
}

async function bylFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BYL_BASE_URL}/projects/${BYL_PROJECT_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${BYL_TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new BylHttpError(`Byl ${init.method ?? "GET"} ${path} failed: ${res.status} ${text}`, res.status);
  }
  const json = await res.json();
  return json.data ?? json;
}

function toInvoice(raw: { id: number | string; status: string; url: string; client_reference_id?: string | null }): BylInvoice {
  return {
    id: String(raw.id),
    status: raw.status as BylInvoiceStatus,
    url: raw.url,
    clientReferenceId: raw.client_reference_id ?? null,
  };
}

export async function createInvoice(input: { orderId: string; amount: number; description: string }): Promise<BylInvoice> {
  if (BYL_MOCK_MODE) {
    return { id: `mock-${input.orderId}`, status: "open", url: `/orders/${input.orderId}/pay?mock=1`, clientReferenceId: input.orderId };
  }
  const data = await bylFetch("/invoices", {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(input.amount * 100) / 100,
      description: input.description.slice(0, 255),
      client_reference_id: input.orderId,
      auto_advance: true,
    }),
  });
  return toInvoice(data);
}

export async function getInvoice(invoiceId: string): Promise<BylInvoice> {
  if (BYL_MOCK_MODE) {
    const orderId = invoiceId.replace(/^mock-/, "");
    return {
      id: invoiceId,
      status: mockPaidSet().has(invoiceId) ? "paid" : "open",
      url: `/orders/${orderId}/pay?mock=1`,
      clientReferenceId: orderId,
    };
  }
  const data = await bylFetch(`/invoices/${encodeURIComponent(invoiceId)}`);
  return toInvoice(data);
}

// Byl-Signature = HMAC-SHA256(raw body, signing secret) hex. Body-г parse хийлгүй түүхий хэлбэрээр шалгана.
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.BYL_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
