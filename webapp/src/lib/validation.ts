import { z } from "zod";

export const SignupSchema = z.object({
  name: z.string().trim().min(2, "Нэр дор хаяж 2 тэмдэгттэй байх ёстой."),
  email: z.string().trim().email("Зөв имэйл хаяг оруулна уу."),
  phone: z.string().trim().min(6, "Утасны дугаараа оруулна уу.").default(""),
  password: z.string().min(6, "Нууц үг дор хаяж 6 тэмдэгттэй байх ёстой."),
});

export const LoginSchema = z.object({
  email: z.string().trim().email("Зөв имэйл хаяг оруулна уу."),
  password: z.string().min(1, "Нууц үгээ оруулна уу."),
});

const SLUG_REGEX = /^[a-z0-9-]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UuidString = z.string().trim().regex(UUID_REGEX, "Сагсанд хуучирсан бараа байна. Сагсаа цэвэрлээд дахин оролдоно уу.");

export const ProductSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().toLowerCase().regex(SLUG_REGEX, "Slug зөвхөн жижиг латин үсэг, тоо, зураас агуулна."),
  description: z.string().trim().default(""),
  price: z.coerce.number().positive(),
  unit: z.string().trim().min(1),
  categoryId: z.string().trim().min(1, "Ангилал сонгоно уу."),
  subcategoryId: z.string().trim().nullable().default(null),
  imageUrl: z.string().trim().url(),
  stock: z.coerce.number().int().min(0),
  stockWarehouse: z.coerce.number().int().min(0).default(0),
  featured: z.coerce.boolean().default(false),
});

export const CategorySchema = z.object({
  name: z.string().trim().min(2, "Ангиллын нэр дор хаяж 2 тэмдэгттэй байх ёстой."),
  slug: z.string().trim().toLowerCase().regex(SLUG_REGEX, "Slug зөвхөн жижиг латин үсэг, тоо, зураас агуулна."),
  imageUrl: z.string().trim().url().nullable().optional().default(null),
});

export const SubcategorySchema = z.object({
  name: z.string().trim().min(2, "Дэд ангиллын нэр дор хаяж 2 тэмдэгттэй байх ёстой."),
  slug: z.string().trim().toLowerCase().regex(SLUG_REGEX, "Slug зөвхөн жижиг латин үсэг, тоо, зураас агуулна."),
  categoryId: z.string().trim().min(1, "Харьяалагдах ангиллаа сонгоно уу."),
});

export const OrderCreateSchema = z.object({
  items: z
    .array(
      z.object({
        productId: UuidString,
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Сагс хоосон байна."),
  address: z.string().trim().min(3, "Хаягаа оруулна уу."),
  phone: z.string().trim().min(6, "Утасны дугаараа оруулна уу."),
  note: z.string().trim().default(""),
  paymentType: z.enum(["CASH", "CREDIT", "QPAY"], {
    message: "Төлбөрийн төрлөө сонгоно уу.",
  }),
  idempotencyKey: z.string().trim().min(1, "idempotencyKey шаардлагатай."),
});

export const PosCheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: UuidString,
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Сагс хоосон байна."),
  saleType: z.enum(["RETAIL", "CREDIT", "COMPANY"], { message: "Худалдааны төрлөө сонгоно уу." }),
  companyId: UuidString.nullable().default(null),
  paymentType: z.enum(["CASH", "QPAY", "BANK"]).default("CASH"),
  note: z.string().trim().default(""),
  idempotencyKey: z.string().trim().min(1, "idempotencyKey шаардлагатай."),
});

export const StockTransferSchema = z.object({
  quantity: z.coerce.number().int().refine((v) => v !== 0, "Тоо хэмжээ 0 байж болохгүй."),
});

export const CompanyCreateSchema = z.object({
  name: z.string().trim().min(2, "Байгууллагын нэр дор хаяж 2 тэмдэгттэй байх ёстой."),
  contactPhone: z.string().trim().min(6, "Утасны дугаараа оруулна уу.").default(""),
  contactEmail: z.string().trim().email("Зөв имэйл хаяг оруулна уу.").or(z.literal("")).default(""),
  loginEmail: z.string().trim().email("Зөв нэвтрэх имэйл хаяг оруулна уу."),
  loginPassword: z.string().min(6, "Нууц үг дор хаяж 6 тэмдэгттэй байх ёстой."),
});
