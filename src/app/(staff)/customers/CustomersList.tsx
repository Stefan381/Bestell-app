"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CustomerListItem } from "@/lib/types";

const SOURCE_LABEL: Record<string, string> = {
  KASSE: "Kasse",
  HUBSPOT: "HubSpot",
  MANUAL: "Manuell",
};

interface Filters {
  name: string;
  contact: string;
  source: string;
  gdprConsent: string;
}

const EMPTY_FILTERS: Filters = { name: "", contact: "", source: "", gdprConsent: "" };

function buildParams(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.name) params.set("name", filters.name);
  if (filters.contact) params.set("contact", filters.contact);
  if (filters.source) params.set("source", filters.source);
  if (filters.gdprConsent) params.set("gdprConsent", filters.gdprConsent);
  return params.toString();
}

export function CustomersList({ initialCustomers }: { initialCustomers: CustomerListItem[] }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [customers, setCustomers] = useState(initialCustomers);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/customers?${buildParams(filters)}`);
      const data = await res.json();
      setCustomers(data.customers ?? []);
    }, 250);
    return () => clearTimeout(timeout);
  }, [filters]);

  function updateFilter(patch: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...patch }));
  }

  const exportHref = `/api/customers/export${(() => {
    const qs = buildParams(filters);
    return qs ? `?${qs}` : "";
  })()}`;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href="/import"
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground/70 hover:border-brand hover:text-brand"
        >
          Kunden importieren
        </Link>
        <a
          href={exportHref}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground/70 hover:border-brand hover:text-brand"
        >
          Kunden exportieren (CSV)
        </a>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-border bg-background text-xs uppercase text-foreground/50">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Kontakt</th>
              <th className="px-3 py-2">Herkunft</th>
              <th className="px-3 py-2">DSGVO</th>
              <th className="px-3 py-2">Bestellungen</th>
            </tr>
            <tr className="border-t border-border normal-case">
              <th className="px-3 py-1.5">
                <input
                  value={filters.name}
                  onChange={(e) => updateFilter({ name: e.target.value })}
                  placeholder="Nach Name filtern…"
                  className="w-full rounded-lg border border-border px-2 py-1 text-xs font-normal text-foreground"
                />
              </th>
              <th className="px-3 py-1.5">
                <input
                  value={filters.contact}
                  onChange={(e) => updateFilter({ contact: e.target.value })}
                  placeholder="E-Mail/Telefon…"
                  className="w-full rounded-lg border border-border px-2 py-1 text-xs font-normal text-foreground"
                />
              </th>
              <th className="px-3 py-1.5">
                <select
                  value={filters.source}
                  onChange={(e) => updateFilter({ source: e.target.value })}
                  className="w-full rounded-lg border border-border px-2 py-1 text-xs font-normal text-foreground"
                >
                  <option value="">Alle</option>
                  <option value="KASSE">Kasse</option>
                  <option value="HUBSPOT">HubSpot</option>
                  <option value="MANUAL">Manuell</option>
                </select>
              </th>
              <th className="px-3 py-1.5">
                <select
                  value={filters.gdprConsent}
                  onChange={(e) => updateFilter({ gdprConsent: e.target.value })}
                  className="w-full rounded-lg border border-border px-2 py-1 text-xs font-normal text-foreground"
                >
                  <option value="">Alle</option>
                  <option value="true">Ja</option>
                  <option value="false">Nein</option>
                </select>
              </th>
              <th className="px-3 py-1.5">
                {(filters.name || filters.contact || filters.source || filters.gdprConsent) && (
                  <button
                    onClick={() => setFilters(EMPTY_FILTERS)}
                    className="text-xs font-normal text-foreground/50 hover:text-brand"
                  >
                    Filter zurücksetzen
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-brand/5">
                <td className="px-3 py-2">
                  <Link href={`/customers/${c.id}`} className="font-medium text-foreground hover:text-brand">
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="px-3 py-2 text-foreground/70">{c.email || c.phone || "–"}</td>
                <td className="px-3 py-2 text-foreground/70">{SOURCE_LABEL[c.source]}</td>
                <td className="px-3 py-2">
                  {c.gdprConsent ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Ja</span>
                  ) : (
                    <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs text-foreground/60">Nein</span>
                  )}
                </td>
                <td className="px-3 py-2 text-foreground/70">{c._count.orders}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-foreground/40">
                  Keine Kunden gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
