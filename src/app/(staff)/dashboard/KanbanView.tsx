"use client";

import { DndContext, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { SerializedOrder } from "@/lib/serialize";
import { OrderCard, STATUS_LABEL, STATUS_ORDER } from "./OrderCard";

const TRASH_ID = "__trash__";

function TrashDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: TRASH_ID });

  return (
    <div
      ref={setNodeRef}
      className={`mb-4 flex items-center justify-center gap-3 rounded-xl border-2 border-dashed p-4 transition ${
        isOver ? "scale-[1.02] border-red-500 bg-red-50" : "border-border bg-surface"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-8 w-8 shrink-0 transition ${isOver ? "text-red-600" : "text-foreground/40"}`}
        aria-hidden="true"
      >
        <path d="M3 6h18" />
        <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
      <p className={`text-sm font-medium ${isOver ? "text-red-700" : "text-foreground/50"}`}>
        {isOver ? "Loslassen zum Löschen" : "Bestellung hierher ziehen, um sie zu löschen"}
      </p>
    </div>
  );
}

/** Orders arrive sorted newest-created-first, which is what Offen/Bestellt
 * want. Geliefert should instead show whoever was most recently marked
 * delivered at the top - that's the meaningful "newest" once an order sits
 * in that column. */
function sortForColumn(
  status: (typeof STATUS_ORDER)[number],
  orders: SerializedOrder[]
): SerializedOrder[] {
  if (status !== "GELIEFERT") return orders;
  return [...orders].sort((a, b) => {
    const aTime = new Date(a.deliveredAt ?? a.createdAt).getTime();
    const bTime = new Date(b.deliveredAt ?? b.createdAt).getTime();
    return bTime - aTime;
  });
}

function Column({
  status,
  orders,
  onStatusChange,
  onNotified,
  onUpdated,
}: {
  status: (typeof STATUS_ORDER)[number];
  orders: SerializedOrder[];
  onStatusChange: (orderId: string, status: (typeof STATUS_ORDER)[number]) => void;
  onNotified: () => void;
  onUpdated: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const sortedOrders = sortForColumn(status, orders);

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[300px] flex-1 flex-col gap-2 rounded-xl border-2 border-dashed p-3 transition ${
        isOver ? "border-brand bg-brand/5" : "border-border bg-background"
      }`}
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-foreground">{STATUS_LABEL[status]}</h2>
        <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs text-foreground/60">
          {orders.length}
        </span>
      </div>
      {sortedOrders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onStatusChange={onStatusChange}
          onNotified={onNotified}
          onUpdated={onUpdated}
        />
      ))}
      {orders.length === 0 && (
        <p className="px-1 py-6 text-center text-xs text-foreground/40">Keine Bestellungen</p>
      )}
    </div>
  );
}

export function KanbanView({
  orders,
  onStatusChange,
  onNotified,
  onUpdated,
  onDelete,
}: {
  orders: SerializedOrder[];
  onStatusChange: (orderId: string, status: (typeof STATUS_ORDER)[number]) => void;
  onNotified: () => void;
  onUpdated: () => void;
  onDelete: (orderId: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (over.id === TRASH_ID) {
      onDelete(active.id as string);
      return;
    }
    const newStatus = over.id as (typeof STATUS_ORDER)[number];
    if (STATUS_ORDER.includes(newStatus)) {
      onStatusChange(active.id as string, newStatus);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <TrashDropZone />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATUS_ORDER.map((status) => (
          <Column
            key={status}
            status={status}
            orders={orders.filter((o) => o.status === status)}
            onStatusChange={onStatusChange}
            onNotified={onNotified}
            onUpdated={onUpdated}
          />
        ))}
      </div>
    </DndContext>
  );
}
