"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SerializedCustomerDetail } from "@/lib/serialize";
import { STATUS_LABEL } from "../../dashboard/OrderCard";
import { customerFullName } from "@/lib/customerName";

const SOURCE_LABEL: Record<string, string> = {
  KASSE: "Kasse",
  HUBSPOT: "HubSpot",
  MANUAL: "Manuell",
};

function formatDateTime(value: string | Date | null): string {
  if (!value) return "–";
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CustomerDetailView({ customer }: { customer: SerializedCustomerDetail }) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: customer.firstName ?? "",
    lastName: customer.lastName,
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    notes: customer.notes ?? "",
    gdprConsent: customer.gdprConsent,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/customers/${customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
    if (!confirm(`${customerFullName(customer)} wirklich löschen (DSGVO-Löschung)?`)) return;
    const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    router.push("/customers");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{customerFullName(customer)}</h1>
        <div className="flex gap-2">
          <a
            href={`/api/customers/${customer.id}/export`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground/70 hover:border-brand hover:text-brand"
          >
            DSGVO-Export
          </a>
          <button
            onClick={handleDelete}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Löschen
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm text-foreground/60">
        Herkunft: {SOURCE_LABEL[customer.source]}
        {customer.externalRef && ` · Referenz: ${customer.externalRef}`}
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground">Kontaktdaten</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Vorname (optional)
              <input
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="rounded-lg border border-border px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Nachname
              <input
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="rounded-lg border border-border px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              E-Mail
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="rounded-lg border border-border px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Telefon
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="rounded-lg border border-border px-2 py-1.5"
              />
            </label>
          </div>
          <label className="mt-3 flex flex-col gap-1 text-sm">
            Notizen
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="rounded-lg border border-border px-2 py-1.5"
            />
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.gdprConsent}
              onChange={(e) => setForm((f) => ({ ...f, gdprConsent: e.target.checked }))}
            />
            DSGVO-Einwilligung (Marketing per E-Mail/WhatsApp)
          </label>
          {customer.gdprConsentAt && (
            <p className="mt-1 text-xs text-foreground/50">
              Gesetzt am {formatDateTime(customer.gdprConsentAt)}
            </p>
          )}
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
          <h2 className="text-sm font-semibold text-foreground">Bestellhistorie</h2>
          <ul className="mt-3 space-y-2">
            {customer.orders.map((order) => (
              <li key={order.id} className="rounded-lg border border-border p-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{order.filiale.name}</span>
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-dark">
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
                <p className="mt-1 text-foreground/70">
                  {order.items
                    .map((item) => `${item.article?.name ?? item.freeTextWish ?? "Artikel"} (×${item.quantity})`)
                    .join(", ")}
                </p>
                <p className="mt-1 text-xs text-foreground/40">{formatDateTime(order.createdAt)}</p>
              </li>
            ))}
            {customer.orders.length === 0 && (
              <p className="py-4 text-center text-sm text-foreground/40">Noch keine Bestellungen.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
