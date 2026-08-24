"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SerializedArticle } from "@/lib/serialize";

export function ArticlesList({ initialArticles }: { initialArticles: SerializedArticle[] }) {
  const [q, setQ] = useState("");
  const [articles, setArticles] = useState(initialArticles);
  const [showNew, setShowNew] = useState(false);
  const [newArticle, setNewArticle] = useState({
    articleNumber: "",
    name: "",
    price: "",
    ean: "",
    category: "",
    stock: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/articles?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setArticles((data.articles ?? []).map((a: SerializedArticle) => ({ ...a, price: Number(a.price) })));
    }, 250);
    return () => clearTimeout(timeout);
  }, [q]);

  async function createArticle() {
    setError(null);
    const price = Number(newArticle.price.replace(",", "."));
    if (!newArticle.articleNumber.trim() || !newArticle.name.trim() || Number.isNaN(price)) {
      setError("Artikelnummer, Bezeichnung und ein gültiger Preis sind erforderlich.");
      return;
    }
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleNumber: newArticle.articleNumber,
        name: newArticle.name,
        price,
        ean: newArticle.ean || undefined,
        category: newArticle.category || undefined,
        stock: newArticle.stock ? Number(newArticle.stock) : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Artikel konnte nicht angelegt werden.");
      return;
    }
    setArticles((prev) => [{ ...data.article, price: Number(data.article.price), _count: { orderItems: 0 } }, ...prev]);
    setShowNew(false);
    setNewArticle({ articleNumber: "", name: "", price: "", ean: "", category: "", stock: "" });
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suche: Artikelnummer, Bezeichnung, EAN…"
          className="w-full max-w-md rounded-lg border border-border px-3 py-2 text-sm"
        />
        <button
          onClick={() => setShowNew((v) => !v)}
          className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          {showNew ? "Abbrechen" : "+ Neuer Artikel"}
        </button>
      </div>

      {showNew && (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
          <input
            placeholder="Artikelnummer"
            value={newArticle.articleNumber}
            onChange={(e) => setNewArticle((v) => ({ ...v, articleNumber: e.target.value }))}
            className="rounded-lg border border-border px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Bezeichnung"
            value={newArticle.name}
            onChange={(e) => setNewArticle((v) => ({ ...v, name: e.target.value }))}
            className="rounded-lg border border-border px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Preis (€)"
            value={newArticle.price}
            onChange={(e) => setNewArticle((v) => ({ ...v, price: e.target.value }))}
            className="rounded-lg border border-border px-2 py-1.5 text-sm"
          />
          <input
            placeholder="EAN (optional)"
            value={newArticle.ean}
            onChange={(e) => setNewArticle((v) => ({ ...v, ean: e.target.value }))}
            className="rounded-lg border border-border px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Kategorie (optional)"
            value={newArticle.category}
            onChange={(e) => setNewArticle((v) => ({ ...v, category: e.target.value }))}
            className="rounded-lg border border-border px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Lagerbestand (optional)"
            value={newArticle.stock}
            onChange={(e) => setNewArticle((v) => ({ ...v, stock: e.target.value }))}
            className="rounded-lg border border-border px-2 py-1.5 text-sm"
          />
          {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
          <button
            onClick={createArticle}
            className="col-span-full rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Artikel anlegen
          </button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-border bg-background text-xs uppercase text-foreground/50">
            <tr>
              <th className="px-3 py-2">Artikelnummer</th>
              <th className="px-3 py-2">Bezeichnung</th>
              <th className="px-3 py-2">Preis</th>
              <th className="px-3 py-2">EAN</th>
              <th className="px-3 py-2">Bestellhäufigkeit</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0 hover:bg-brand/5">
                <td className="px-3 py-2 font-mono text-xs text-foreground/70">{a.articleNumber}</td>
                <td className="px-3 py-2">
                  <Link href={`/articles/${a.id}`} className="font-medium text-foreground hover:text-brand">
                    {a.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-foreground/70">{a.price.toFixed(2)} €</td>
                <td className="px-3 py-2 text-foreground/70">{a.ean || "–"}</td>
                <td className="px-3 py-2 text-foreground/70">{a._count.orderItems}</td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-foreground/40">
                  Keine Artikel gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
