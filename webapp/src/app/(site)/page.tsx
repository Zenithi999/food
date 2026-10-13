import Link from "next/link";
import { listProducts, listCategories, listSubcategories } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";
import { CategorySpotlight, type SpotlightCategory } from "@/components/CategorySpotlight";
import { MaterialIcon } from "@/components/MaterialIcon";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sub?: string }>;
}) {
  const { q, category: categoryId, sub: subcategoryId } = await searchParams;

  const [categories, subcategories] = await Promise.all([
    listCategories(),
    subcategoryId || categoryId ? listSubcategories(categoryId) : Promise.resolve([]),
  ]);

  const activeCategory = categories.find((c) => c.id === categoryId);
  const activeSubcategory = subcategories.find((s) => s.id === subcategoryId);
  const showBrowse = !q && !activeCategory;

  let products = showBrowse ? [] : await listProducts({ categoryId, subcategoryId });
  if (q) {
    const needle = q.trim().toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(needle));
  }

  const heading = q
    ? `Хайлтын үр дүн: "${q}"`
    : activeSubcategory
      ? activeSubcategory.name
      : activeCategory
        ? activeCategory.name
        : "Энэ долоо хоногийн бараа";

  const CATEGORY_ORDER = ["makh", "shingen-amtlagch", "khuurai-amtlagch", "sauce", "hachir", "laazalsan-buteegdehuun", "busad"];
  const orderedCategories = [...categories].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.slug);
    const bi = CATEGORY_ORDER.indexOf(b.slug);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  let spotlight: SpotlightCategory[] = [];
  if (showBrowse) {
    const allProducts = await listProducts();
    spotlight = orderedCategories.map((c) => ({
      id: c.id,
      name: c.name,
      imageUrl: c.imageUrl,
      products: allProducts.filter((p) => p.categoryId === c.id),
    }));
  }

  return (
    <>
      {showBrowse ? (
        <CategorySpotlight categories={spotlight} />
      ) : (
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-5 md:py-u-lg w-full" id="shop">
          <div className="flex flex-col gap-3 md:gap-u-md mb-5 md:mb-u-lg">
            <div className="flex justify-between items-center gap-u-sm">
              <h2 className="font-headline-lg text-[24px] md:text-headline-lg text-on-surface truncate">{heading}</h2>
              <Link
                href="/"
                className="shrink-0 flex items-center gap-1 text-label-sm text-secondary hover:text-primary transition-colors"
              >
                <MaterialIcon name="close" className="text-base" />
                Цэвэрлэх
              </Link>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
              <Link
                href="/"
                className="shrink-0 whitespace-nowrap px-4 py-2 rounded-full font-label-sm text-label-sm transition-colors bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:border-primary/40"
              >
                Бүгд
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/?category=${c.id}`}
                  className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full font-label-sm text-label-sm border transition-colors ${
                    activeCategory?.id === c.id
                      ? "bg-primary border-primary text-on-primary"
                      : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-primary/40"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>

            {activeCategory && subcategories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
                <Link
                  href={`/?category=${activeCategory.id}`}
                  className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full font-label-sm text-label-sm border transition-colors ${
                    !activeSubcategory
                      ? "border-primary text-primary"
                      : "border-outline-variant text-secondary hover:border-primary"
                  }`}
                >
                  Бүх {activeCategory.name}
                </Link>
                {subcategories.map((s) => (
                  <Link
                    key={s.id}
                    href={`/?category=${activeCategory.id}&sub=${s.id}`}
                    className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full font-label-sm text-label-sm border transition-colors ${
                      activeSubcategory?.id === s.id
                        ? "border-primary text-primary"
                        : "border-outline-variant text-secondary hover:border-primary"
                    }`}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {products.length === 0 ? (
            <p className="text-secondary py-u-xl text-center">Хайлтад тохирох бүтээгдэхүүн олдсонгүй.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-8 md:mt-u-lg p-5 md:p-u-lg bg-secondary-container rounded-xl text-center">
            <p className="text-label-sm text-on-secondary-container italic">Шинэ, чанартай хүнсийг таньд хямд үнээр.</p>
          </div>
        </div>
      )}
    </>
  );
}
