"use client";

import type { SerializedOrder } from "@/lib/serialize";
import { STATUS_LABEL } from "./OrderCard";

function formatDateTime(value: string | Date | null): string {
  if (!value) return "–";
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TableView({ orders }: { orders: SerializedOrder[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-border bg-background text-xs uppercase text-foreground/50">
          <tr>
            <th className="px-3 py-2">Kunde</th>
            <th className="px-3 py-2">Artikel</th>
            <th className="px-3 py-2">Filiale</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Erfasst</th>
            <th className="px-3 py-2">Bestellt</th>
            <th className="px-3 py-2">Geliefert</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border last:border-0">
              <td className="px-3 py-2 font-medium text-foreground">
                {order.customer.firstName} {order.customer.lastName}
              </td>
              <td className="px-3 py-2 text-foreground/70">
                {order.items
                  .map((item) => `${item.article?.name ?? item.freeTextWish ?? "Artikel"} (×${item.quantity})`)
                  .join(", ")}
              </td>
              <td className="px-3 py-2 text-foreground/70">{order.filiale.name}</td>
              <td className="px-3 py-2">
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-dark">
                  {STATUS_LABEL[order.status]}
                </span>
              </td>
              <td className="px-3 py-2 text-foreground/60">
                {formatDateTime(order.createdAt)}
                {order.createdByUser ? ` (${order.createdByUser.name})` : " (Kiosk)"}
              </td>
              <td className="px-3 py-2 text-foreground/60">
                {formatDateTime(order.orderedAt)}
                {order.orderedByUser && ` (${order.orderedByUser.name})`}
              </td>
              <td className="px-3 py-2 text-foreground/60">
                {formatDateTime(order.deliveredAt)}
                {order.deliveredByUser && ` (${order.deliveredByUser.name})`}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-6 text-center text-foreground/40">
                Keine Bestellungen gefunden.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
