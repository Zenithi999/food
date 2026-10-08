import Image from "next/image";
import Link from "next/link";
import { listProducts, listCategories, listSubcategories } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCarousel } from "@/components/CategoryCarousel";
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

  return (
    <>
      {showBrowse ? (
        <>
          <section className="w-full bg-background overflow-hidden">
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 md:pt-u-xl pb-2 md:pb-4 flex flex-col md:flex-row items-center gap-8 md:gap-u-lg">
              <div className="flex-1 text-center md:text-left">
                <h1 className="font-display-lg text-[32px] leading-[1.15] sm:text-[40px] md:text-display-lg text-on-surface max-w-lg mx-auto md:mx-0 mb-3 md:mb-u-sm">
                  Өдөр тутмын <span className="text-primary">хүнс</span>,{" "}
                  <span className="text-[#f5a623]">шинэ</span> бүтээгдэхүүн
                </h1>
                <p className="text-secondary text-body-md md:text-body-lg max-w-md mx-auto md:mx-0 mb-5 md:mb-u-md">
                  Шинэ, чанартай хүнсний бүтээгдэхүүнийг хамгийн сайн үнээр.
                </p>
                <a
                  href="#shop"
                  className="inline-flex items-center gap-2 bg-primary text-on-primary py-3 md:py-3.5 px-7 md:px-8 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity active:scale-[0.98] duration-150 shadow-[0_10px_24px_-8px_rgba(239,75,61,0.6)]"
                >
                  Захиалж эхлэх
                  <MaterialIcon name="arrow_downward" className="text-base" />
                </a>
              </div>
              <div className="relative flex-1 w-full max-w-md flex items-center justify-center">
                <div className="w-[230px] sm:w-[280px] md:w-full md:max-w-sm aspect-square rounded-full overflow-hidden relative ring-[6px] md:ring-8 ring-white shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80"
                    alt="Хүнсний дэлгүүрийн шинэ ногоо, жимсний лангуу"
                    fill
                    priority
                    sizes="(max-width: 768px) 280px, 400px"
                    className="object-cover"
                  />
                </div>
                <div className="hidden md:flex absolute -bottom-2 left-0 bg-surface-container-lowest rounded-2xl p-4 items-center gap-3 item-card-shadow">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-container text-primary">
                    <MaterialIcon name="storefront" className="text-xl" />
                  </span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Дэлгүүрт бэлэн</p>
                    <p className="text-label-sm text-secondary">Шинэ бараа өдөр бүр орж ирнэ</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-0 md:pt-2 pb-8 md:pb-u-xl w-full scroll-mt-20" id="shop">
            <h2 className="font-headline-lg text-[26px] md:text-headline-lg text-on-surface mb-2 md:mb-u-md text-center">Ангиллаар үзэх</h2>
            <CategoryCarousel categories={orderedCategories} />
          </div>
        </>
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
