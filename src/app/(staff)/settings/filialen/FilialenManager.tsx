"use client";

import { useState } from "react";
import type { FilialeItem } from "@/lib/types";

export function FilialenManager({ initialFilialen }: { initialFilialen: FilialeItem[] }) {
  const [filialen, setFilialen] = useState(initialFilialen);
  const [showNew, setShowNew] = useState(false);
  const [newFiliale, setNewFiliale] = useState({ name: "", address: "" });
  const [error, setError] = useState<string | null>(null);

  async function createFiliale() {
    setError(null);
    if (!newFiliale.name.trim()) {
      setError("Name erforderlich.");
      return;
    }
    const res = await fetch("/api/filialen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFiliale.name, address: newFiliale.address || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Filiale konnte nicht angelegt werden.");
      return;
    }
    setFilialen((prev) => [...prev, data.filiale]);
    setShowNew(false);
    setNewFiliale({ name: "", address: "" });
  }

  return (
    <div>
      <button
        onClick={() => setShowNew((v) => !v)}
        className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
      >
        {showNew ? "Abbrechen" : "+ Neue Filiale"}
      </button>

      {showNew && (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-4">
          <input
            placeholder="Name"
            value={newFiliale.name}
            onChange={(e) => setNewFiliale((v) => ({ ...v, name: e.target.value }))}
            className="rounded-lg border border-border px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Adresse (optional)"
            value={newFiliale.address}
            onChange={(e) => setNewFiliale((v) => ({ ...v, address: e.target.value }))}
            className="rounded-lg border border-border px-2 py-1.5 text-sm"
          />
          {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
          <button
            onClick={createFiliale}
            className="col-span-full rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Filiale anlegen
          </button>
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {filialen.map((f) => (
          <li key={f.id} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm">
            <span className="font-medium text-foreground">{f.name}</span>
            {f.address && <span className="ml-2 text-foreground/60">{f.address}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
