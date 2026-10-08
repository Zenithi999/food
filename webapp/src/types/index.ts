export type Role = "CUSTOMER" | "ADMIN" | "COMPANY";
export type OrderStatus = "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentType = "CASH" | "CREDIT" | "QPAY" | "BANK";
export type OrderSource = "ONLINE" | "POS";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  createdAt: string;
}

export interface SubcategoryDTO {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  createdAt: string;
}

export interface ProductDTO {
  id: string;
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
  createdAt: string;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  createdAt: string;
}

export interface OrderItemDTO {
  productId: string;
  name: string;
  imageUrl: string;
  unit: string;
  quantity: number;
  price: number;
}

export interface OrderDTO {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: OrderStatus;
  total: number;
  address: string;
  phone: string;
  note: string;
  items: OrderItemDTO[];
  createdAt: string;
  companyId: string | null;
  companyName: string | null;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  source: OrderSource;
}

export interface CompanyDTO {
  id: string;
  name: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  unit: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
}
