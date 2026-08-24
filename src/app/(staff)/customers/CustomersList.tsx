"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CustomerListItem } from "@/lib/types";

const SOURCE_LABEL: Record<string, string> = {
  KASSE: "Kasse",
  HUBSPOT: "HubSpot",
  MANUAL: "Manuell",
};

export function CustomersList({ initialCustomers }: { initialCustomers: CustomerListItem[] }) {
  const [q, setQ] = useState("");
  const [customers, setCustomers] = useState(initialCustomers);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setCustomers(data.customers ?? []);
    }, 250);
    return () => clearTimeout(timeout);
  }, [q]);

  return (
    <div className="mt-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Suche: Name, E-Mail, Telefon, Kundennummer…"
        className="w-full max-w-md rounded-lg border border-border px-3 py-2 text-sm"
      />

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
