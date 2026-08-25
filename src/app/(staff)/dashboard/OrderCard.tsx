"use client";

import { useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { SerializedOrder } from "@/lib/serialize";
import { DEPARTMENTS, DEPARTMENT_LABELS, type Department } from "@/lib/departments";

const STATUS_ORDER = ["OFFEN", "BESTELLT", "GELIEFERT"] as const;
type NotifyChannel = "EMAIL" | "WHATSAPP";

const SOURCE_LABEL: Record<string, string> = {
  KASSE: "Kasse",
  HUBSPOT: "HubSpot",
  MANUAL: "Manuell",
};

function formatDateTime(value: string | Date | null): string {
  if (!value) return "";
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** The compact tile only ever shows one supplier line - collapse the (usually
 * single) suppliers across an order's items into one string. */
function suppliersSummary(order: SerializedOrder): string {
  const suppliers = Array.from(
    new Set(order.items.map((item) => item.article?.supplier).filter((s): s is string => Boolean(s)))
  );
  return suppliers.length > 0 ? suppliers.join(", ") : "–";
}

/** Opens the customer's default mail app / WhatsApp with the rendered
 * template prefilled, and logs that this staff member notified them - this
 * app never sends anything itself (no SMTP), a click is the only "send". */
async function openNotifyWindow(orderId: string, channel: NotifyChannel): Promise<string | null> {
  // Open a blank tab synchronously (before the await) so browsers don't
  // treat the later window.open/location.href as an unrequested popup.
  const pendingWindow = channel === "WHATSAPP" ? window.open("", "_blank") : null;

  const res = await fetch(`/api/orders/${orderId}/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel }),
  });
  const data = await res.json();

  if (!res.ok) {
    pendingWindow?.close();
    return data.error ?? "Benachrichtigung konnte nicht vorbereitet werden.";
  }

  if (channel === "EMAIL") {
    // Not URLSearchParams: it form-encodes spaces as "+", which mailto:
    // clients (Outlook in particular) show literally instead of decoding -
    // mailto: needs plain percent-encoding (encodeURIComponent -> %20).
    const params = [
      data.subject ? `subject=${encodeURIComponent(data.subject)}` : null,
      `body=${encodeURIComponent(data.body)}`,
    ]
      .filter(Boolean)
      .join("&");
    window.location.href = `mailto:${encodeURIComponent(data.recipient)}?${params}`;
  } else {
    const waUrl = `https://wa.me/${data.recipient}?text=${encodeURIComponent(data.body)}`;
    if (pendingWindow) pendingWindow.location.href = waUrl;
    else window.open(waUrl, "_blank");
  }
  return null;
}

interface EditItemForm {
  id: string;
  articleId: string | null;
  quantity: string;
  name: string;
  price: string;
  manufacturer: string;
  supplier: string;
  ean: string;
}

interface EditForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: Department;
  note: string;
  items: EditItemForm[];
}

function buildEditForm(order: SerializedOrder): EditForm {
  return {
    firstName: order.customer.firstName,
    lastName: order.customer.lastName,
    email: order.customer.email ?? "",
    phone: order.customer.phone ?? "",
    department: (order.department ?? DEPARTMENTS[0]) as Department,
    note: order.note ?? "",
    items: order.items.map((item) => ({
      id: item.id,
      articleId: item.articleId,
      quantity: String(item.quantity),
      name: item.article?.name ?? "",
      price: item.article ? String(item.article.price) : "",
      manufacturer: item.article?.manufacturer ?? "",
      supplier: item.article?.supplier ?? "",
      ean: item.article?.ean ?? "",
    })),
  };
}

export function OrderCard({
  order,
  onStatusChange,
  onNotified,
  onUpdated,
}: {
  order: SerializedOrder;
  onStatusChange: (orderId: string, status: (typeof STATUS_ORDER)[number]) => void;
  onNotified: () => void;
  onUpdated: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
  });
  const [notifying, setNotifying] = useState<NotifyChannel | null>(null);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const nextStatus = STATUS_ORDER[currentIndex + 1];
  const prevStatus = currentIndex > 0 ? STATUS_ORDER[currentIndex - 1] : undefined;
  const lastEmailNotification = order.notifications?.find((n) => n.channel === "EMAIL");
  const lastWhatsappNotification = order.notifications?.find((n) => n.channel === "WHATSAPP");

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  function openEditMode() {
    setForm(buildEditForm(order));
    setSaveError(null);
    setEditing(true);
    setExpanded(true);
  }

  function closeEditMode() {
    setEditing(false);
    setForm(null);
  }

  function updateItemForm(itemId: string, patch: Partial<EditItemForm>) {
    setForm((f) => (f ? { ...f, items: f.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) } : f));
  }

  // A plain click toggles the expanded view; a double click opens edit mode
  // instead. Browsers fire click, click, dblclick in sequence for a double
  // click, so the single-click action is delayed and cancelled if a second
  // click (interpreted as the start of a dblclick) arrives in time.
  function handleClick() {
    if (editing) return;
    if (clickTimer.current) return;
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      setExpanded((v) => !v);
    }, 220);
  }

  function handleDoubleClick() {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    if (!editing) openEditMode();
  }

  async function handleNotify(channel: NotifyChannel) {
    setNotifying(channel);
    setNotifyError(null);
    const error = await openNotifyWindow(order.id, channel);
    setNotifying(null);
    if (error) {
      setNotifyError(error);
      return;
    }
    onNotified();
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setSaveError(null);
    try {
      const customerChanged =
        form.firstName !== order.customer.firstName ||
        form.lastName !== order.customer.lastName ||
        form.email !== (order.customer.email ?? "") ||
        form.phone !== (order.customer.phone ?? "");
      if (customerChanged) {
        if (!form.firstName.trim() || !form.lastName.trim()) {
          throw new Error("Vor- und Nachname des Kunden dürfen nicht leer sein.");
        }
        const res = await fetch(`/api/customers/${order.customer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error ?? "Kundendaten konnten nicht gespeichert werden.");
        }
      }

      for (const item of form.items) {
        if (!item.articleId) continue;
        const original = order.items.find((i) => i.id === item.id)?.article;
        if (!original) continue;
        const articleChanged =
          item.name !== original.name ||
          item.price !== String(original.price) ||
          item.manufacturer !== (original.manufacturer ?? "") ||
          item.supplier !== (original.supplier ?? "") ||
          item.ean !== (original.ean ?? "");
        if (!articleChanged) continue;

        if (!item.name.trim()) throw new Error("Artikelbezeichnung darf nicht leer sein.");
        const priceNum = Number(item.price.replace(",", "."));
        if (Number.isNaN(priceNum)) throw new Error(`Ungültiger Preis bei „${item.name}“.`);

        const res = await fetch(`/api/articles/${item.articleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            price: priceNum,
            manufacturer: item.manufacturer,
            supplier: item.supplier,
            ean: item.ean,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error ?? "Artikel konnte nicht gespeichert werden.");
        }
      }

      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: form.note,
          department: form.department,
          items: form.items.map((i) => ({ id: i.id, quantity: Math.max(0, Number(i.quantity) || 0) })),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Bestellung konnte nicht gespeichert werden.");
      }

      closeEditMode();
      onUpdated();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`cursor-grab touch-none rounded-xl border border-border bg-surface px-3 py-2 shadow-sm transition active:cursor-grabbing ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {order.customer.lastName}, {order.customer.firstName}
          </p>
          <p className="truncate text-xs text-foreground/60">Lieferant: {suppliersSummary(order)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-dark">
          {order.department ? DEPARTMENT_LABELS[order.department as Department] : "–"}
        </span>
      </div>

      {expanded && !editing && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="mt-3 space-y-3 border-t border-border pt-3 text-sm"
        >
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/40">Kunde</h4>
            <p className="mt-1 font-medium text-foreground">
              {order.customer.firstName} {order.customer.lastName}
            </p>
            <p className="text-foreground/60">E-Mail: {order.customer.email || "–"}</p>
            <p className="text-foreground/60">Telefon: {order.customer.phone || "–"}</p>
            <p className="text-foreground/60">Herkunft: {SOURCE_LABEL[order.customer.source] ?? order.customer.source}</p>
            <p className="text-foreground/60">DSGVO-Zustimmung: {order.customer.gdprConsent ? "Ja" : "Nein"}</p>
            {order.customer.notes && <p className="text-foreground/60">Notiz: {order.customer.notes}</p>}
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/40">Bestellung</h4>
            <p className="text-foreground/60">Filiale: {order.filiale.name}</p>
            <p className="text-foreground/60">
              Abteilung: {order.department ? DEPARTMENT_LABELS[order.department as Department] : "–"}
            </p>
            {order.note && <p className="text-foreground/60">Notiz: „{order.note}“</p>}
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/40">Artikel</h4>
            <ul className="mt-1 space-y-1.5">
              {order.items.map((item) => (
                <li key={item.id} className="rounded-lg border border-border p-2">
                  <p className="font-medium text-foreground">
                    {item.article?.name ?? item.freeTextWish ?? "Artikel"} (×{item.quantity})
                  </p>
                  {item.article && (
                    <p className="mt-0.5 text-xs text-foreground/60">
                      Art.-Nr. {item.article.articleNumber} · {item.article.price.toFixed(2)} € · EAN{" "}
                      {item.article.ean || "–"} · Hersteller {item.article.manufacturer || "–"} · Lieferant{" "}
                      {item.article.supplier || "–"}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-0.5 text-xs text-foreground/50">
            <div>
              Erfasst {formatDateTime(order.createdAt)}
              {order.createdByUser ? ` von ${order.createdByUser.name}` : " von Kunde (Kiosk)"}
            </div>
            {order.orderedAt && (
              <div>
                Bestellt {formatDateTime(order.orderedAt)}
                {order.orderedByUser && ` von ${order.orderedByUser.name}`}
              </div>
            )}
            {order.deliveredAt && (
              <div>
                Geliefert {formatDateTime(order.deliveredAt)}
                {order.deliveredByUser && ` von ${order.deliveredByUser.name}`}
              </div>
            )}
          </div>

          {order.status === "GELIEFERT" && (
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleNotify("EMAIL")}
                  disabled={notifying !== null}
                  className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground/70 transition hover:border-brand hover:text-brand disabled:opacity-60"
                >
                  {notifying === "EMAIL" ? "Öffnet…" : "📧 Per E-Mail informieren"}
                </button>
                <button
                  onClick={() => handleNotify("WHATSAPP")}
                  disabled={notifying !== null}
                  className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground/70 transition hover:border-brand hover:text-brand disabled:opacity-60"
                >
                  {notifying === "WHATSAPP" ? "Öffnet…" : "💬 Per WhatsApp informieren"}
                </button>
              </div>
              {lastEmailNotification && (
                <p className="text-xs text-green-700">
                  ✓ Per E-Mail informiert {formatDateTime(lastEmailNotification.sentAt)}
                  {lastEmailNotification.sentByUser && ` von ${lastEmailNotification.sentByUser.name}`}
                </p>
              )}
              {lastWhatsappNotification && (
                <p className="text-xs text-green-700">
                  ✓ Per WhatsApp informiert {formatDateTime(lastWhatsappNotification.sentAt)}
                  {lastWhatsappNotification.sentByUser && ` von ${lastWhatsappNotification.sentByUser.name}`}
                </p>
              )}
              {notifyError && <p className="text-xs text-red-600">{notifyError}</p>}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            {prevStatus ? (
              <button
                onClick={() => onStatusChange(order.id, prevStatus)}
                className="rounded-lg border border-border px-2 py-1 text-xs text-foreground/60 transition hover:border-brand hover:text-brand"
              >
                ← {STATUS_LABEL[prevStatus]}
              </button>
            ) : (
              <span />
            )}
            {nextStatus && (
              <button
                onClick={() => onStatusChange(order.id, nextStatus)}
                className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-dark"
              >
                {STATUS_LABEL[nextStatus]} →
              </button>
            )}
          </div>

          <p className="text-center text-[11px] text-foreground/30">Doppelklick zum Bearbeiten</p>
        </div>
      )}

      {editing && form && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="mt-3 space-y-3 border-t border-border pt-3 text-sm"
        >
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/40">Kunde</h4>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <input
                placeholder="Vorname"
                value={form.firstName}
                onChange={(e) => setForm((f) => f && { ...f, firstName: e.target.value })}
                className="rounded-lg border border-border px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Nachname"
                value={form.lastName}
                onChange={(e) => setForm((f) => f && { ...f, lastName: e.target.value })}
                className="rounded-lg border border-border px-2 py-1.5 text-sm"
              />
              <input
                placeholder="E-Mail"
                value={form.email}
                onChange={(e) => setForm((f) => f && { ...f, email: e.target.value })}
                className="rounded-lg border border-border px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Telefon"
                value={form.phone}
                onChange={(e) => setForm((f) => f && { ...f, phone: e.target.value })}
                className="rounded-lg border border-border px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/40">Bestellung</h4>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <select
                value={form.department}
                onChange={(e) => setForm((f) => f && { ...f, department: e.target.value as Department })}
                className="col-span-2 rounded-lg border border-border px-2 py-1.5 text-sm"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {DEPARTMENT_LABELS[d]}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Notiz"
                value={form.note}
                onChange={(e) => setForm((f) => f && { ...f, note: e.target.value })}
                rows={2}
                className="col-span-2 rounded-lg border border-border px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/40">Artikel</h4>
            <div className="mt-1 space-y-2">
              {form.items.map((item) => (
                <div key={item.id} className="rounded-lg border border-border p-2">
                  {item.articleId ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        placeholder="Bezeichnung"
                        value={item.name}
                        onChange={(e) => updateItemForm(item.id, { name: e.target.value })}
                        className="col-span-2 rounded-lg border border-border px-2 py-1 text-sm"
                      />
                      <input
                        placeholder="Menge"
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(e) => updateItemForm(item.id, { quantity: e.target.value })}
                        className="rounded-lg border border-border px-2 py-1 text-sm"
                      />
                      <input
                        placeholder="Preis (€)"
                        value={item.price}
                        onChange={(e) => updateItemForm(item.id, { price: e.target.value })}
                        className="rounded-lg border border-border px-2 py-1 text-sm"
                      />
                      <input
                        placeholder="EAN"
                        value={item.ean}
                        onChange={(e) => updateItemForm(item.id, { ean: e.target.value })}
                        className="rounded-lg border border-border px-2 py-1 text-sm"
                      />
                      <input
                        placeholder="Hersteller"
                        value={item.manufacturer}
                        onChange={(e) => updateItemForm(item.id, { manufacturer: e.target.value })}
                        className="rounded-lg border border-border px-2 py-1 text-sm"
                      />
                      <input
                        placeholder="Lieferant"
                        value={item.supplier}
                        onChange={(e) => updateItemForm(item.id, { supplier: e.target.value })}
                        className="col-span-2 rounded-lg border border-border px-2 py-1 text-sm"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-foreground/70">{item.name || "Freitext-Wunsch"}</span>
                      <input
                        placeholder="Menge"
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(e) => updateItemForm(item.id, { quantity: e.target.value })}
                        className="w-20 rounded-lg border border-border px-2 py-1 text-sm"
                      />
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-foreground/40">Menge 0 = Position entfernen</p>
                </div>
              ))}
            </div>
          </div>

          {saveError && <p className="text-xs text-red-600">{saveError}</p>}

          <div className="flex justify-end gap-2">
            <button
              onClick={closeEditMode}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/70"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {saving ? "Speichert…" : "Speichern"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const STATUS_LABEL: Record<(typeof STATUS_ORDER)[number], string> = {
  OFFEN: "Offen",
  BESTELLT: "Bestellt",
  GELIEFERT: "Geliefert",
};

export { STATUS_ORDER };
