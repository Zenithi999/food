"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MaterialIcon } from "@/components/MaterialIcon";
import { formatMNT } from "@/lib/format";
import type { CategoryDTO, ProductDTO, SubcategoryDTO } from "@/types";

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const emptyForm = {
  name: "",
  slug: "",
  slugTouched: false,
  description: "",
  price: "",
  unit: "",
  categoryId: "",
  subcategoryId: "",
  imageUrl: "",
  stock: "",
  stockWarehouse: "",
  featured: false,
};

export function ProductsTable({
  products,
  categories,
  subcategories,
}: {
  products: ProductDTO[];
  categories: CategoryDTO[];
  subcategories: SubcategoryDTO[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableSubcategories = useMemo(
    () => subcategories.filter((s) => s.categoryId === form.categoryId),
    [subcategories, form.categoryId]
  );

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    setError(null);
    setShowForm(true);
  }

  function openEdit(product: ProductDTO) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      slugTouched: true,
      description: product.description,
      price: String(product.price),
      unit: product.unit,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId ?? "",
      imageUrl: product.imageUrl,
      stock: String(product.stock),
      stockWarehouse: String(product.stockWarehouse),
      featured: product.featured,
    });
    setError(null);
    setShowForm(true);
  }

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: f.slugTouched ? f.slug : slugify(name) }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Зураг байршуулахад алдаа гарлаа.");
        return;
      }
      setForm((f) => ({ ...f, imageUrl: data.url }));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (!form.categoryId) {
        setError("Ангилал сонгоно уу.");
        return;
      }
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        price: Number(form.price),
        unit: form.unit,
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId || null,
        imageUrl: form.imageUrl,
        stock: Number(form.stock),
        stockWarehouse: Number(form.stockWarehouse || 0),
        featured: form.featured,
      };
      const res = await fetch(editingId ? `/api/products/${editingId}` : "/api/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Алдаа гарлаа.");
        return;
      }
      setShowForm(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Энэ барааг устгах уу? Энэ үйлдлийг буцаах боломжгүй.")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleTransfer(product: ProductDTO) {
    const input = prompt(
      `"${product.name}" — агуулахаас (${product.stockWarehouse}) лангуун дээр (${product.stock}) хэдийг шилжүүлэх вэ?\nСөрөг тоо оруулбал лангуунаас агуулах руу буцна.`,
      "0"
    );
    if (input === null) return;
    const quantity = Number(input);
    if (!Number.isInteger(quantity) || quantity === 0) return;
    const res = await fetch(`/api/products/${product.id}/transfer-stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error ?? "Шилжүүлэхэд алдаа гарлаа.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-u-lg">
        <h1 className="font-headline-lg text-headline-lg text-primary">Бараа</h1>
        <button
          onClick={openCreate}
          disabled={categories.length === 0}
          className="bg-primary text-on-primary py-2 px-6 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
        >
          <MaterialIcon name="add" className="text-base" />
          Бараа нэмэх
        </button>
      </div>

      {categories.length === 0 && (
        <div className="mb-u-md p-u-md rounded-lg bg-error-container text-on-error-container text-label-sm">
          Эхлээд &ldquo;Ангилал&rdquo; хэсгээс дор хаяж нэг ангилал үүсгэнэ үү.
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-margin-mobile">
          <div className="bg-surface-container-lowest rounded-lg p-u-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-headline-md text-headline-md text-primary mb-u-md">
              {editingId ? "Бараа засах" : "Бараа нэмэх"}
            </h2>
            {error && <div className="mb-u-md p-3 rounded bg-error-container text-on-error-container text-label-sm">{error}</div>}
            <form className="space-y-u-sm" onSubmit={handleSubmit}>
              <Field label="Нэр" value={form.name} onChange={handleNameChange} required />
              <Field
                label="Slug"
                value={form.slug}
                onChange={(v) => setForm({ ...form, slug: v, slugTouched: true })}
                required
              />
              <Field label="Тайлбар" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              <div className="grid grid-cols-2 gap-u-sm">
                <Field label="Үнэ (₮)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
                <Field label="Хэмжих нэгж" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} required placeholder="1 кг, 1 ш..." />
              </div>
              <div className="grid grid-cols-2 gap-u-sm">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                    Ангилал
                  </label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value, subcategoryId: "" })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  >
                    <option value="" disabled>
                      Сонгох
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                    Дэд ангилал (заавал биш)
                  </label>
                  <select
                    value={form.subcategoryId}
                    onChange={(e) => setForm({ ...form, subcategoryId: e.target.value })}
                    disabled={availableSubcategories.length === 0}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors disabled:opacity-50"
                  >
                    <option value="">Байхгүй</option>
                    {availableSubcategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-u-sm">
                <Field
                  label="Лангуун дээр"
                  type="number"
                  value={form.stock}
                  onChange={(v) => setForm({ ...form, stock: v })}
                  required
                />
                <Field
                  label="Агуулахад"
                  type="number"
                  value={form.stockWarehouse}
                  onChange={(v) => setForm({ ...form, stockWarehouse: v })}
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Зураг
                </label>
                <div className="flex items-center gap-u-sm">
                  {form.imageUrl ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative bg-surface-container-low">
                      <Image src={form.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 bg-surface-container-low text-secondary">
                      <MaterialIcon name="image" className="text-2xl" />
                    </div>
                  )}
                  <div className="flex-grow">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileChange}
                      disabled={uploading}
                      className="block w-full text-label-sm text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary file:text-on-primary file:font-label-sm file:cursor-pointer hover:file:opacity-90 disabled:opacity-60"
                    />
                    {uploading && <p className="text-label-sm text-secondary mt-1">Байршуулж байна...</p>}
                  </div>
                </div>
                <input
                  type="url"
                  required
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="эсвэл зургийн URL шууд оруулах"
                  className="mt-2 w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-label-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                />
              </div>
              <label className="flex items-center gap-2 text-secondary text-label-sm">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="rounded border-outline-variant text-primary focus:ring-primary"
                />
                Онцлох бараа
              </label>
              <div className="flex gap-u-sm pt-u-sm">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-full font-label-md text-label-md border border-outline-variant text-secondary hover:bg-surface-container-low transition-colors"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex-1 bg-primary text-on-primary py-3 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {submitting ? "Хадгалж байна..." : "Хадгалах"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="item-card-shadow bg-surface-container-lowest rounded-lg overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Бараа</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Ангилал</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Үнэ</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Лангуунд</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Агуулахад</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Нийт</th>
              <th className="px-u-md py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-u-md py-6 text-center text-secondary">
                  Бараа алга.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-t border-outline-variant">
                  <td className="px-u-md py-3 font-label-md">{product.name}</td>
                  <td className="px-u-md py-3 text-label-sm text-secondary">
                    {product.categoryName}
                    {product.subcategoryName ? ` / ${product.subcategoryName}` : ""}
                  </td>
                  <td className="px-u-md py-3">{formatMNT(product.price)}</td>
                  <td className={`px-u-md py-3 ${product.stock <= 5 ? "text-error" : ""}`}>{product.stock}</td>
                  <td className="px-u-md py-3 text-secondary">{product.stockWarehouse}</td>
                  <td className="px-u-md py-3 font-label-md">{product.stock + product.stockWarehouse}</td>
                  <td className="px-u-md py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleTransfer(product)}
                      title="Агуулах ⇄ лангуу шилжүүлэх"
                      className="text-secondary hover:text-primary transition-colors"
                    >
                      <MaterialIcon name="swap_horiz" className="text-lg" />
                    </button>
                    <button onClick={() => openEdit(product)} className="text-secondary hover:text-primary transition-colors ml-2">
                      <MaterialIcon name="edit" className="text-lg" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-secondary hover:text-error transition-colors ml-2">
                      <MaterialIcon name="delete" className="text-lg" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">{label}</label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
      />
    </div>
  );
}
