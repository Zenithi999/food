import { getSupabase } from "./supabase";
import type {
  CategoryDTO,
  SubcategoryDTO,
  ProductDTO,
  UserDTO,
  OrderDTO,
  OrderStatus,
  OrderSource,
  Role,
  CompanyDTO,
  PaymentType,
  PaymentStatus,
} from "@/types";

function num(value: unknown): number {
  return typeof value === "string" ? Number(value) : (value as number);
}

// ---------- Users ----------

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: Role;
  companyId: string | null;
  createdAt: string;
}

function toUserRecord(u: {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: string;
  company_id: string | null;
  created_at: string;
}): UserRecord {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    passwordHash: u.password_hash,
    role: u.role as Role,
    companyId: u.company_id,
    createdAt: u.created_at,
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const { data, error } = await getSupabase().from("users").select("*").eq("email", email).maybeSingle();
  if (error) throw error;
  return data ? toUserRecord(data) : null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const { data, error } = await getSupabase().from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toUserRecord(data) : null;
}

export async function createUser(input: {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: Role;
}): Promise<UserRecord> {
  const { data, error } = await getSupabase()
    .from("users")
    .insert({ name: input.name, email: input.email, phone: input.phone, password_hash: input.passwordHash, role: input.role })
    .select()
    .single();
  if (error) throw error;
  return toUserRecord(data);
}

// ---------- Companies ----------

export class CompanyError extends Error {}

function toCompanyDTO(c: {
  id: string;
  name: string;
  contact_phone: string;
  contact_email: string;
  is_active: boolean;
  created_at: string;
}): CompanyDTO {
  return {
    id: c.id,
    name: c.name,
    contactPhone: c.contact_phone,
    contactEmail: c.contact_email,
    isActive: c.is_active,
    createdAt: c.created_at,
  };
}

export async function listCompanies(): Promise<CompanyDTO[]> {
  const { data, error } = await getSupabase().from("companies").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toCompanyDTO);
}

export async function createCompany(input: {
  name: string;
  contactPhone: string;
  contactEmail: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  passwordHash: string;
}): Promise<CompanyDTO> {
  const { data: companyId, error } = await getSupabase().rpc("create_company_with_user", {
    p_company_name: input.name,
    p_contact_phone: input.contactPhone,
    p_contact_email: input.contactEmail,
    p_user_name: input.userName,
    p_user_email: input.userEmail,
    p_user_phone: input.userPhone,
    p_password_hash: input.passwordHash,
  });

  if (error) {
    throw new CompanyError(error.message);
  }

  const { data, error: fetchError } = await getSupabase().from("companies").select("*").eq("id", companyId).single();
  if (fetchError) throw fetchError;
  return toCompanyDTO(data);
}

export async function getCompanyUser(companyId: string): Promise<UserRecord | null> {
  const { data, error } = await getSupabase()
    .from("users")
    .select("*")
    .eq("company_id", companyId)
    .eq("role", "COMPANY")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toUserRecord(data) : null;
}

export async function listCustomers(): Promise<(UserDTO & { orderCount: number })[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "CUSTOMER")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const counts = await Promise.all(
    (data ?? []).map(async (u) => {
      const { count } = await supabase.from("orders").select("*", { count: "exact", head: true }).eq("user_id", u.id);
      return count ?? 0;
    })
  );

  return (data ?? []).map((u, i) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role as Role,
    createdAt: u.created_at,
    orderCount: counts[i],
  }));
}

export async function countCustomers(): Promise<number> {
  const { count, error } = await getSupabase().from("users").select("*", { count: "exact", head: true }).eq("role", "CUSTOMER");
  if (error) throw error;
  return count ?? 0;
}

// ---------- Categories ----------

function toCategoryDTO(c: {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  created_at: string;
}): CategoryDTO {
  return { id: c.id, name: c.name, slug: c.slug, imageUrl: c.image_url, createdAt: c.created_at };
}

export async function listCategories(): Promise<CategoryDTO[]> {
  const { data, error } = await getSupabase().from("categories").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toCategoryDTO);
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDTO | null> {
  const { data, error } = await getSupabase().from("categories").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? toCategoryDTO(data) : null;
}

export async function createCategory(input: {
  name: string;
  slug: string;
  imageUrl?: string | null;
}): Promise<CategoryDTO> {
  const { data, error } = await getSupabase()
    .from("categories")
    .insert({ name: input.name, slug: input.slug, image_url: input.imageUrl ?? null })
    .select()
    .single();
  if (error) throw error;
  return toCategoryDTO(data);
}

export async function updateCategory(
  id: string,
  input: { name: string; slug: string; imageUrl?: string | null }
): Promise<void> {
  const { error } = await getSupabase()
    .from("categories")
    .update({ name: input.name, slug: input.slug, image_url: input.imageUrl ?? null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await getSupabase().from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Subcategories ----------

interface SubcategoryRow {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  created_at: string;
  category: { name: string } | { name: string }[] | null;
}

function toSubcategoryDTO(s: SubcategoryRow): SubcategoryDTO {
  const category = Array.isArray(s.category) ? s.category[0] : s.category;
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    categoryId: s.category_id,
    categoryName: category?.name ?? "",
    createdAt: s.created_at,
  };
}

const SUBCATEGORY_SELECT = "*, category:categories(name)";

export async function listSubcategories(categoryId?: string): Promise<SubcategoryDTO[]> {
  let query = getSupabase().from("subcategories").select(SUBCATEGORY_SELECT).order("name", { ascending: true });
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => toSubcategoryDTO(row as unknown as SubcategoryRow));
}

export async function createSubcategory(input: {
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
}): Promise<SubcategoryDTO> {
  const { data, error } = await getSupabase()
    .from("subcategories")
    .insert({ name: input.name, slug: input.slug, category_id: input.categoryId })
    .select(SUBCATEGORY_SELECT)
    .single();
  if (error) throw error;
  return toSubcategoryDTO(data as unknown as SubcategoryRow);
}

export async function updateSubcategory(
  id: string,
  input: { name: string; slug: string; categoryId: string; categoryName: string }
): Promise<void> {
  const { error } = await getSupabase()
    .from("subcategories")
    .update({ name: input.name, slug: input.slug, category_id: input.categoryId })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSubcategory(id: string): Promise<void> {
  const { error } = await getSupabase().from("subcategories").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Products ----------

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  unit: string;
  category_id: string;
  subcategory_id: string | null;
  image_url: string;
  stock: number;
  stock_warehouse: number;
  featured: boolean;
  created_at: string;
  category: { name: string } | { name: string }[] | null;
  subcategory: { name: string } | { name: string }[] | null;
}

function toProductDTO(p: ProductRow): ProductDTO {
  const category = Array.isArray(p.category) ? p.category[0] : p.category;
  const subcategory = Array.isArray(p.subcategory) ? p.subcategory[0] : p.subcategory;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: num(p.price),
    unit: p.unit,
    categoryId: p.category_id,
    categoryName: category?.name ?? "",
    subcategoryId: p.subcategory_id,
    subcategoryName: subcategory?.name ?? null,
    imageUrl: p.image_url,
    stock: p.stock,
    stockWarehouse: p.stock_warehouse,
    featured: p.featured,
    createdAt: p.created_at,
  };
}

const PRODUCT_SELECT = "*, category:categories(name), subcategory:subcategories(name)";

export async function listProducts(filters?: {
  categoryId?: string;
  subcategoryId?: string;
}): Promise<ProductDTO[]> {
  let query = getSupabase().from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false });
  if (filters?.subcategoryId) {
    query = query.eq("subcategory_id", filters.subcategoryId);
  } else if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => toProductDTO(row as unknown as ProductRow));
}

export async function getProductById(id: string): Promise<ProductDTO | null> {
  const { data, error } = await getSupabase().from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toProductDTO(data as unknown as ProductRow) : null;
}

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  const { data, error } = await getSupabase().from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? toProductDTO(data as unknown as ProductRow) : null;
}

export interface ProductInput {
  name: string;
  slug: string;
  description: string;
  price: number;
  unit: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string | null;
  subcategoryName: string | null;
  imageUrl: string;
  stock: number;
  stockWarehouse: number;
  featured: boolean;
}

export async function createProduct(input: ProductInput): Promise<ProductDTO> {
  const { data, error } = await getSupabase()
    .from("products")
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description,
      price: input.price,
      unit: input.unit,
      category_id: input.categoryId,
      subcategory_id: input.subcategoryId,
      image_url: input.imageUrl,
      stock: input.stock,
      stock_warehouse: input.stockWarehouse,
      featured: input.featured,
    })
    .select(PRODUCT_SELECT)
    .single();
  if (error) throw error;
  return toProductDTO(data as unknown as ProductRow);
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<void> {
  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.slug !== undefined) update.slug = input.slug;
  if (input.description !== undefined) update.description = input.description;
  if (input.price !== undefined) update.price = input.price;
  if (input.unit !== undefined) update.unit = input.unit;
  if (input.categoryId !== undefined) update.category_id = input.categoryId;
  if (input.subcategoryId !== undefined) update.subcategory_id = input.subcategoryId;
  if (input.imageUrl !== undefined) update.image_url = input.imageUrl;
  if (input.stock !== undefined) update.stock = input.stock;
  if (input.stockWarehouse !== undefined) update.stock_warehouse = input.stockWarehouse;
  if (input.featured !== undefined) update.featured = input.featured;
  update.updated_at = new Date().toISOString();

  const { error } = await getSupabase().from("products").update(update).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await getSupabase().from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function transferStock(productId: string, quantity: number): Promise<void> {
  const { error } = await getSupabase().rpc("transfer_stock", {
    p_product_id: productId,
    p_quantity: quantity,
  });
  if (error) throw error;
}

export async function countLowStockProducts(threshold = 5): Promise<number> {
  const { count, error } = await getSupabase().from("products").select("*", { count: "exact", head: true }).lte("stock", threshold);
  if (error) throw error;
  return count ?? 0;
}

// ---------- Orders ----------

const STATUSES: OrderStatus[] = ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"];

interface OrderRow {
  id: string;
  user_id: string;
  status: string;
  total: number | string;
  address: string;
  phone: string;
  note: string;
  created_at: string;
  company_id: string | null;
  payment_type: string;
  source: string;
  user: { name: string; email: string } | { name: string; email: string }[] | null;
  company: { name: string } | { name: string }[] | null;
  payments: { status: string }[] | null;
  items:
    | {
        product_id: string;
        quantity: number;
        price: number | string;
        product: { name: string; image_url: string; unit: string } | { name: string; image_url: string; unit: string }[] | null;
      }[]
    | null;
}

function toOrderDTO(o: OrderRow): OrderDTO {
  const user = Array.isArray(o.user) ? o.user[0] : o.user;
  const company = Array.isArray(o.company) ? o.company[0] : o.company;
  return {
    id: o.id,
    userId: o.user_id,
    userName: user?.name ?? "",
    userEmail: user?.email ?? "",
    status: o.status as OrderStatus,
    total: num(o.total),
    address: o.address,
    phone: o.phone,
    note: o.note,
    items: (o.items ?? []).map((i) => {
      const product = Array.isArray(i.product) ? i.product[0] : i.product;
      return {
        productId: i.product_id,
        name: product?.name ?? "",
        imageUrl: product?.image_url ?? "",
        unit: product?.unit ?? "",
        quantity: i.quantity,
        price: num(i.price),
      };
    }),
    createdAt: o.created_at,
    companyId: o.company_id,
    companyName: company?.name ?? null,
    paymentType: o.payment_type as PaymentType,
    paymentStatus: (o.payments?.[0]?.status as PaymentStatus) ?? "PENDING",
    source: o.source as OrderSource,
  };
}

const ORDER_SELECT =
  "*, user:users(name, email), company:companies(name), payments(status), items:order_items(product_id, quantity, price, product:products(name, image_url, unit))";

export async function listOrders(filters?: { userId?: string }): Promise<OrderDTO[]> {
  let query = getSupabase().from("orders").select(ORDER_SELECT).order("created_at", { ascending: false });
  if (filters?.userId) query = query.eq("user_id", filters.userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => toOrderDTO(row as unknown as OrderRow));
}

export async function countOrders(): Promise<number> {
  const { count, error } = await getSupabase().from("orders").select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function sumRecentRevenue(sinceISO: string): Promise<number> {
  const { data, error } = await getSupabase()
    .from("orders")
    .select("total")
    .gte("created_at", sinceISO)
    .neq("status", "CANCELLED");
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + num(row.total), 0);
}

export interface CreateOrderInput {
  userId: string;
  userName: string;
  userEmail: string;
  address: string;
  phone: string;
  note: string;
  items: { productId: string; quantity: number }[];
  paymentType: PaymentType;
  companyId: string | null;
  idempotencyKey: string;
  source?: OrderSource;
}

export class OrderError extends Error {}

export async function createOrder(input: CreateOrderInput): Promise<OrderDTO> {
  const supabase = getSupabase();
  const { data: orderId, error } = await supabase.rpc("create_order", {
    p_user_id: input.userId,
    p_address: input.address,
    p_phone: input.phone,
    p_note: input.note,
    p_items: input.items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    p_payment_type: input.paymentType,
    p_company_id: input.companyId,
    p_idempotency_key: input.idempotencyKey,
    p_source: input.source ?? "ONLINE",
  });

  if (error) {
    throw new OrderError(error.message);
  }

  const { data, error: fetchError } = await supabase.from("orders").select(ORDER_SELECT).eq("id", orderId).single();
  if (fetchError) throw fetchError;
  return toOrderDTO(data as unknown as OrderRow);
}

export async function getOrderById(id: string): Promise<OrderDTO | null> {
  const { data, error } = await getSupabase().from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toOrderDTO(data as unknown as OrderRow) : null;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  if (!STATUSES.includes(status)) throw new Error("Invalid status");
  const { error } = await getSupabase().from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

// ---------- Payments ----------

export interface PaymentRecord {
  id: string;
  orderId: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  bylInvoiceId: string | null;
  bylInvoiceUrl: string | null;
}

function toPaymentRecord(p: {
  id: string;
  order_id: string;
  type: string;
  amount: number | string;
  status: string;
  byl_invoice_id: string | null;
  byl_invoice_url: string | null;
}): PaymentRecord {
  return {
    id: p.id,
    orderId: p.order_id,
    type: p.type as PaymentType,
    amount: num(p.amount),
    status: p.status as PaymentStatus,
    bylInvoiceId: p.byl_invoice_id,
    bylInvoiceUrl: p.byl_invoice_url,
  };
}

export async function getPaymentByOrderId(orderId: string): Promise<PaymentRecord | null> {
  const { data, error } = await getSupabase().from("payments").select("*").eq("order_id", orderId).maybeSingle();
  if (error) throw error;
  return data ? toPaymentRecord(data) : null;
}

export async function setPaymentBylInvoice(orderId: string, input: { invoiceId: string; url: string }): Promise<void> {
  const { error } = await getSupabase()
    .from("payments")
    .update({ byl_invoice_id: input.invoiceId, byl_invoice_url: input.url, updated_at: new Date().toISOString() })
    .eq("order_id", orderId);
  if (error) throw error;
}

export async function markPaymentPaid(orderId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("payments")
    .update({ status: "SUCCESS", updated_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .neq("status", "SUCCESS");
  if (error) throw error;
}
