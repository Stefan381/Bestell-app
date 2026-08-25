"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { SerializedOrder } from "@/lib/serialize";

const STATUS_ORDER = ["OFFEN", "BESTELLT", "GELIEFERT"] as const;
type NotifyChannel = "EMAIL" | "WHATSAPP";

function formatDateTime(value: string | Date | null): string {
  if (!value) return "";
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function itemsSummary(order: SerializedOrder): string {
  return order.items
    .map((item) => `${item.article?.name ?? item.freeTextWish ?? "Artikel"} (×${item.quantity})`)
    .join(", ");
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
    const params = new URLSearchParams();
    if (data.subject) params.set("subject", data.subject);
    params.set("body", data.body);
    window.location.href = `mailto:${encodeURIComponent(data.recipient)}?${params.toString()}`;
  } else {
    const waUrl = `https://wa.me/${data.recipient}?text=${encodeURIComponent(data.body)}`;
    if (pendingWindow) pendingWindow.location.href = waUrl;
    else window.open(waUrl, "_blank");
  }
  return null;
}

export function OrderCard({
  order,
  onStatusChange,
  onNotified,
}: {
  order: SerializedOrder;
  onStatusChange: (orderId: string, status: (typeof STATUS_ORDER)[number]) => void;
  onNotified: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
  });
  const [notifying, setNotifying] = useState<NotifyChannel | null>(null);
  const [notifyError, setNotifyError] = useState<string | null>(null);

  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const nextStatus = STATUS_ORDER[currentIndex + 1];
  const prevStatus = currentIndex > 0 ? STATUS_ORDER[currentIndex - 1] : undefined;
  const lastEmailNotification = order.notifications?.find((n) => n.channel === "EMAIL");
  const lastWhatsappNotification = order.notifications?.find((n) => n.channel === "WHATSAPP");

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab touch-none rounded-xl border border-border bg-surface p-3 shadow-sm active:cursor-grabbing ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-foreground">
          {order.customer.firstName} {order.customer.lastName}
        </div>
        <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-dark">
          {order.filiale.name}
        </span>
      </div>
      <p className="mt-1 text-sm text-foreground/70">{itemsSummary(order)}</p>
      {order.note && <p className="mt-1 text-xs italic text-foreground/50">„{order.note}“</p>}

      <div className="mt-2 space-y-0.5 text-xs text-foreground/50">
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
        <div className="mt-2 space-y-1" onPointerDown={(e) => e.stopPropagation()}>
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

      <div className="mt-3 flex items-center justify-between gap-2" onPointerDown={(e) => e.stopPropagation()}>
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
    </div>
  );
}

export const STATUS_LABEL: Record<(typeof STATUS_ORDER)[number], string> = {
  OFFEN: "Offen",
  BESTELLT: "Bestellt",
  GELIEFERT: "Geliefert",
};

export { STATUS_ORDER };
