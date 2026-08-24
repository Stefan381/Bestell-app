"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SerializedArticleDetail } from "@/lib/serialize";

export function ArticleDetailView({ article }: { article: SerializedArticleDetail }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: article.name,
    price: String(article.price),
    ean: article.ean ?? "",
    category: article.category ?? "",
    stock: article.stock !== null ? String(article.stock) : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const price = Number(form.price.replace(",", "."));
    if (Number.isNaN(price)) {
      setError("Ungültiger Preis.");
      setSaving(false);
      return;
    }
    const res = await fetch(`/api/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        price,
        ean: form.ean,
        category: form.category,
        stock: form.stock ? Number(form.stock) : null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    setSavedAt(new Date());
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Artikel "${article.name}" wirklich löschen?`)) return;
    const res = await fetch(`/api/articles/${article.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    router.push("/articles");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{article.name}</h1>
          <p className="mt-1 text-sm text-foreground/60 font-mono">{article.articleNumber}</p>
        </div>
        <button
          onClick={handleDelete}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Löschen
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground">Stammdaten</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="col-span-2 flex flex-col gap-1 text-sm">
              Bezeichnung
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded-lg border border-border px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Preis (€)
              <input
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="rounded-lg border border-border px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Lagerbestand
              <input
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                className="rounded-lg border border-border px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              EAN
              <input
                value={form.ean}
                onChange={(e) => setForm((f) => ({ ...f, ean: e.target.value }))}
                className="rounded-lg border border-border px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Kategorie
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="rounded-lg border border-border px-2 py-1.5"
              />
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {saving ? "Speichert…" : "Speichern"}
            </button>
            {savedAt && <span className="text-xs text-green-700">Gespeichert.</span>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground">
            Bestellhäufigkeit ({article._count.orderItems})
          </h2>
          <ul className="mt-3 space-y-2">
            {article.orderItems.map((item) => (
              <li key={item.id} className="rounded-lg border border-border p-2 text-sm">
                {item.order.customer.firstName} {item.order.customer.lastName} · ×{item.quantity}
              </li>
            ))}
            {article.orderItems.length === 0 && (
              <p className="py-4 text-center text-sm text-foreground/40">Noch nicht bestellt.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
