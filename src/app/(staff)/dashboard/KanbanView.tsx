"use client";

import { DndContext, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { SerializedOrder } from "@/lib/serialize";
import { OrderCard, STATUS_LABEL, STATUS_ORDER } from "./OrderCard";

function Column({
  status,
  orders,
  onStatusChange,
}: {
  status: (typeof STATUS_ORDER)[number];
  orders: SerializedOrder[];
  onStatusChange: (orderId: string, status: (typeof STATUS_ORDER)[number]) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

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
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} onStatusChange={onStatusChange} />
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
}: {
  orders: SerializedOrder[];
  onStatusChange: (orderId: string, status: (typeof STATUS_ORDER)[number]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as (typeof STATUS_ORDER)[number];
    if (STATUS_ORDER.includes(newStatus)) {
      onStatusChange(active.id as string, newStatus);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATUS_ORDER.map((status) => (
          <Column
            key={status}
            status={status}
            orders={orders.filter((o) => o.status === status)}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </DndContext>
  );
}
