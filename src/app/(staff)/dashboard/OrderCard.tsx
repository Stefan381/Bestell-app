"use client";

import { useDraggable } from "@dnd-kit/core";
import type { SerializedOrder } from "@/lib/serialize";

const STATUS_ORDER = ["OFFEN", "BESTELLT", "GELIEFERT"] as const;

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

export function OrderCard({
  order,
  onStatusChange,
}: {
  order: SerializedOrder;
  onStatusChange: (orderId: string, status: (typeof STATUS_ORDER)[number]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
  });

  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const nextStatus = STATUS_ORDER[currentIndex + 1];
  const prevStatus = currentIndex > 0 ? STATUS_ORDER[currentIndex - 1] : undefined;
  const lastNotification = order.notifications?.[0];

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

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
        {order.status === "GELIEFERT" && (
          <div className={lastNotification?.status === "SENT" ? "text-green-700" : "text-amber-700"}>
            {lastNotification
              ? lastNotification.status === "SENT"
                ? `✓ Benachrichtigung per ${lastNotification.channel === "EMAIL" ? "E-Mail" : "WhatsApp"} gesendet`
                : `⚠ Benachrichtigung fehlgeschlagen: ${lastNotification.errorMessage ?? ""}`
              : "Benachrichtigung wird gesendet…"}
          </div>
        )}
      </div>

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
