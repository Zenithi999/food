import { listProducts, listCategories, listCompanies } from "@/lib/db";
import { PosTerminal } from "@/components/admin/PosTerminal";

export default async function AdminPosPage() {
  const [products, categories, companies] = await Promise.all([
    listProducts(),
    listCategories(),
    listCompanies(),
  ]);

  return <PosTerminal products={products} categories={categories} companies={companies.filter((c) => c.isActive)} />;
}
