"use client";

import { useCallback, useState } from "react";
import type { FilialeItem, StaffUserListItem } from "@/lib/types";
import type { SerializedOrder } from "@/lib/serialize";
import { KanbanView } from "./KanbanView";
import { TableView } from "./TableView";
import { NewOrderModal } from "./NewOrderModal";
import type { STATUS_ORDER } from "./OrderCard";
import { DEPARTMENTS, DEPARTMENT_LABELS } from "@/lib/departments";

interface Filters {
  q: string;
  filialeId: string;
  department: string;
  employeeId: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: Filters = { q: "", filialeId: "", department: "", employeeId: "", from: "", to: "" };

export function DashboardBoard({
  initialOrders,
  filialen,
  users,
}: {
  initialOrders: SerializedOrder[];
  filialen: FilialeItem[];
  users: StaffUserListItem[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async (nextFilters: Filters) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (nextFilters.q) params.set("q", nextFilters.q);
    if (nextFilters.filialeId) params.set("filialeId", nextFilters.filialeId);
    if (nextFilters.department) params.set("department", nextFilters.department);
    if (nextFilters.employeeId) params.set("employeeId", nextFilters.employeeId);
    if (nextFilters.from) params.set("from", nextFilters.from);
    if (nextFilters.to) params.set("to", nextFilters.to);

    const res = await fetch(`/api/orders?${params.toString()}`);
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoading(false);
  }, []);

  function updateFilter(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    refetch(next);
  }

  async function handleStatusChange(orderId: string, status: (typeof STATUS_ORDER)[number]) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    } else {
      refetch(filters);
    }
  }

  async function handleDelete(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    const label = order ? `${order.customer.firstName} ${order.customer.lastName}` : "diese Bestellung";
    if (!confirm(`Bestellung von ${label} wirklich unwiderruflich löschen?`)) return;

    const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } else {
      alert("Bestellung konnte nicht gelöscht werden.");
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-3">
        <input
          value={filters.q}
          onChange={(e) => updateFilter({ q: e.target.value })}
          placeholder="Suche: Kunde, Artikel…"
          className="min-w-[180px] flex-1 rounded-lg border border-border px-3 py-1.5 text-sm"
        />
        <select
          value={filters.filialeId}
          onChange={(e) => updateFilter({ filialeId: e.target.value })}
          className="rounded-lg border border-border px-2 py-1.5 text-sm"
        >
          <option value="">Alle Filialen</option>
          {filialen.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select
          value={filters.department}
          onChange={(e) => updateFilter({ department: e.target.value })}
          className="rounded-lg border border-border px-2 py-1.5 text-sm"
        >
          <option value="">Alle Abteilungen</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {DEPARTMENT_LABELS[d]}
            </option>
          ))}
        </select>
        <select
          value={filters.employeeId}
          onChange={(e) => updateFilter({ employeeId: e.target.value })}
          className="rounded-lg border border-border px-2 py-1.5 text-sm"
        >
          <option value="">Alle Mitarbeiter</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => updateFilter({ from: e.target.value })}
          className="rounded-lg border border-border px-2 py-1.5 text-sm"
        />
        <span className="text-xs text-foreground/40">bis</span>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => updateFilter({ to: e.target.value })}
          className="rounded-lg border border-border px-2 py-1.5 text-sm"
        />

        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5 text-sm">
            <button
              onClick={() => setView("kanban")}
              className={`rounded-md px-3 py-1 ${view === "kanban" ? "bg-brand text-white" : "text-foreground/60"}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView("table")}
              className={`rounded-md px-3 py-1 ${view === "table" ? "bg-brand text-white" : "text-foreground/60"}`}
            >
              Tabelle
            </button>
          </div>
          <button
            onClick={() => setShowNewOrder(true)}
            className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            + Neue Bestellung
          </button>
        </div>
      </div>

      <div className={`mt-4 ${loading ? "opacity-50" : ""}`}>
        {view === "kanban" ? (
          <KanbanView
            orders={orders}
            onStatusChange={handleStatusChange}
            onNotified={() => refetch(filters)}
            onUpdated={() => refetch(filters)}
            onDelete={handleDelete}
          />
        ) : (
          <TableView orders={orders} />
        )}
      </div>

      {showNewOrder && (
        <NewOrderModal
          filialen={filialen}
          defaultFilialeId={filialen[0]?.id ?? null}
          onClose={() => setShowNewOrder(false)}
          onCreated={() => {
            setShowNewOrder(false);
            refetch(filters);
          }}
        />
      )}
    </div>
  );
}
