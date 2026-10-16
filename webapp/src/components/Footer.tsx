import { SHOP } from "@/lib/shop";

export function Footer() {
  return (
    <footer className="w-full mt-u-xl bg-secondary-container">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-u-xl flex flex-col md:flex-row justify-between items-start gap-u-lg">
        <div className="max-w-xs">
          <h2 className="font-headline-md text-headline-md text-primary mb-u-sm">ХүнсМаркет</h2>
          <p className="text-on-secondary-container mb-u-md">
            Монголын хэрэглэгчдэд зориулсан онлайн хүнсний дэлгүүр. Шинэ, чанартай бүтээгдэхүүн.
          </p>
          <p className="font-body-md text-body-md text-on-secondary-container">© 2026 ХүнсМаркет. Бүх эрх хуулиар хамгаалагдсан.</p>
        </div>
        <div className="grid grid-cols-2 gap-6 md:gap-u-xl w-full md:w-auto">
          <div className="flex flex-col gap-u-sm">
            <h4 className="font-label-md text-label-md text-primary uppercase tracking-widest">Холбоо барих</h4>
            <a className="text-secondary hover:text-primary hover:underline decoration-primary transition-colors" href={`tel:${SHOP.phone.replace(/[^+\d]/g, "")}`}>
              {SHOP.phone}
            </a>
            <a className="text-secondary hover:text-primary hover:underline decoration-primary transition-colors" href={`mailto:${SHOP.email}`}>
              {SHOP.email}
            </a>
            <a className="text-secondary hover:text-primary hover:underline decoration-primary transition-colors" href="#">
              Instagram
            </a>
          </div>
          <div className="flex flex-col gap-u-sm">
            <h4 className="font-label-md text-label-md text-primary uppercase tracking-widest">Мэдээлэл</h4>
            <a className="text-secondary hover:text-primary hover:underline decoration-primary transition-colors" href="#">
              Нууцлалын бодлого
            </a>
            <a className="text-secondary hover:text-primary hover:underline decoration-primary transition-colors" href="#">
              Түгээмэл асуулт
            </a>
            <a className="text-secondary hover:text-primary hover:underline decoration-primary transition-colors" href="#">
              Буцаалт
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
