"use client";

import { useEffect, useState } from "react";
import type { ArticleListItem, CustomerListItem, FilialeItem } from "@/lib/types";

interface DraftItem {
  articleId: string;
  name: string;
  quantity: number;
}

export function NewOrderModal({
  filialen,
  defaultFilialeId,
  onClose,
  onCreated,
}: {
  filialen: FilialeItem[];
  defaultFilialeId: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [filialeId, setFilialeId] = useState(defaultFilialeId ?? filialen[0]?.id ?? "");
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResultsRaw, setCustomerResults] = useState<CustomerListItem[]>([]);
  const customerResults = customerQuery.trim().length >= 2 ? customerResultsRaw : [];
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ firstName: "", lastName: "", email: "", phone: "" });

  const [articleQuery, setArticleQuery] = useState("");
  const [articleResultsRaw, setArticleResults] = useState<ArticleListItem[]>([]);
  const articleResults = articleQuery.trim().length >= 2 ? articleResultsRaw : [];
  const [items, setItems] = useState<DraftItem[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (customerQuery.trim().length < 2) return;
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(customerQuery)}`);
      const data = await res.json();
      setCustomerResults(data.customers ?? []);
    }, 250);
    return () => clearTimeout(timeout);
  }, [customerQuery]);

  useEffect(() => {
    if (articleQuery.trim().length < 2) return;
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/articles?q=${encodeURIComponent(articleQuery)}`);
      const data = await res.json();
      setArticleResults(data.articles ?? []);
    }, 250);
    return () => clearTimeout(timeout);
  }, [articleQuery]);

  async function createCustomer() {
    if (!newCustomer.firstName.trim() || !newCustomer.lastName.trim()) {
      setError("Vor- und Nachname des Kunden erforderlich.");
      return;
    }
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCustomer),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Kunde konnte nicht angelegt werden.");
      return;
    }
    setSelectedCustomer({ ...data.customer, _count: { orders: 0 } });
    setShowNewCustomerForm(false);
    setError(null);
  }

  function addItem(article: ArticleListItem) {
    setItems((prev) => {
      const existing = prev.find((i) => i.articleId === article.id);
      if (existing) {
        return prev.map((i) => (i.articleId === article.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { articleId: article.id, name: article.name, quantity: 1 }];
    });
    setArticleQuery("");
    setArticleResults([]);
  }

  function updateQuantity(articleId: string, quantity: number) {
    setItems((prev) => prev.map((i) => (i.articleId === articleId ? { ...i, quantity } : i)));
  }

  function removeItem(articleId: string) {
    setItems((prev) => prev.filter((i) => i.articleId !== articleId));
  }

  async function submit() {
    setError(null);
    if (!selectedCustomer) {
      setError("Bitte einen Kunden auswählen oder anlegen.");
      return;
    }
    if (items.length === 0) {
      setError("Bitte mindestens einen Artikel hinzufügen.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: selectedCustomer.id,
        filialeId,
        note: note || undefined,
        items: items.map((i) => ({ articleId: i.articleId, quantity: i.quantity })),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Bestellung konnte nicht angelegt werden.");
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Neue Bestellung</h2>
          <button onClick={onClose} className="text-foreground/50 hover:text-foreground">
            ✕
          </button>
        </div>

        <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-foreground">
          Filiale
          <select
            value={filialeId}
            onChange={(e) => setFilialeId(e.target.value)}
            className="rounded-lg border border-border px-3 py-2"
          >
            {filialen.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">Kunde</p>
          {selectedCustomer ? (
            <div className="mt-1 flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span>
                {selectedCustomer.firstName} {selectedCustomer.lastName}
              </span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-xs text-foreground/50 hover:text-foreground"
              >
                ändern
              </button>
            </div>
          ) : (
            <>
              <input
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="Name, E-Mail oder Telefon…"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              />
              {customerResults.length > 0 && (
                <ul className="mt-1 divide-y divide-border rounded-lg border border-border">
                  {customerResults.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerQuery("");
                          setCustomerResults([]);
                        }}
                        className="block w-full px-3 py-2 text-left hover:bg-brand/5"
                      >
                        {c.firstName} {c.lastName}{" "}
                        <span className="text-xs text-foreground/50">{c.email || c.phone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={() => setShowNewCustomerForm((v) => !v)}
                className="mt-1 text-xs font-medium text-brand hover:underline"
              >
                {showNewCustomerForm ? "Abbrechen" : "+ Neuen Kunden anlegen"}
              </button>
              {showNewCustomerForm && (
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-border p-3">
                  <input
                    placeholder="Vorname"
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer((v) => ({ ...v, firstName: e.target.value }))}
                    className="rounded-lg border border-border px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="Nachname"
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer((v) => ({ ...v, lastName: e.target.value }))}
                    className="rounded-lg border border-border px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="E-Mail"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer((v) => ({ ...v, email: e.target.value }))}
                    className="rounded-lg border border-border px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="Telefon"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer((v) => ({ ...v, phone: e.target.value }))}
                    className="rounded-lg border border-border px-2 py-1.5 text-sm"
                  />
                  <button
                    onClick={createCustomer}
                    className="col-span-2 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
                  >
                    Kunde anlegen &amp; auswählen
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">Artikel</p>
          <input
            value={articleQuery}
            onChange={(e) => setArticleQuery(e.target.value)}
            placeholder="Artikelnummer, Bezeichnung oder EAN…"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
          />
          {articleResults.length > 0 && (
            <ul className="mt-1 divide-y divide-border rounded-lg border border-border">
              {articleResults.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => addItem(a)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-brand/5"
                  >
                    <span>{a.name}</span>
                    <span className="text-xs text-foreground/50">
                      {a.articleNumber} · {Number(a.price).toFixed(2)} €
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && (
            <ul className="mt-2 space-y-1">
              {items.map((item) => (
                <li
                  key={item.articleId}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-1.5"
                >
                  <span className="text-sm">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.articleId, Math.max(1, Number(e.target.value)))}
                      className="w-14 rounded-lg border border-border px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => removeItem(item.articleId)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Entfernen
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-foreground">
          Notiz (optional)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="rounded-lg border border-border px-3 py-2"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground/70"
          >
            Abbrechen
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? "Wird angelegt…" : "Bestellung anlegen"}
          </button>
        </div>
      </div>
    </div>
  );
}
