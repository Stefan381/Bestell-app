"use client";

import { useState } from "react";
import type { FilialeItem } from "@/lib/types";

export function FilialenManager({ initialFilialen }: { initialFilialen: FilialeItem[] }) {
  const [filialen, setFilialen] = useState(initialFilialen);
  const [showNew, setShowNew] = useState(false);
  const [newFiliale, setNewFiliale] = useState({ name: "", address: "" });
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", address: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  function startEdit(f: FilialeItem) {
    setEditingId(f.id);
    setEditForm({ name: f.name, address: f.address ?? "" });
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(id: string) {
    if (!editForm.name.trim()) {
      setEditError("Name erforderlich.");
      return;
    }
    setSaving(true);
    setEditError(null);
    const res = await fetch(`/api/filialen/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name, address: editForm.address }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setEditError(data.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    setFilialen((prev) => prev.map((f) => (f.id === id ? data.filiale : f)));
    cancelEdit();
  }

  async function deleteFiliale(f: FilialeItem) {
    if (!confirm(`Filiale "${f.name}" wirklich löschen?`)) return;
    const res = await fetch(`/api/filialen/${f.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Filiale konnte nicht gelöscht werden.");
      return;
    }
    setFilialen((prev) => prev.filter((x) => x.id !== f.id));
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
        {filialen.map((f) =>
          editingId === f.id ? (
            <li key={f.id} className="rounded-lg border border-border bg-brand/5 px-4 py-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((v) => ({ ...v, name: e.target.value }))}
                  className="rounded-lg border border-border px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="Adresse (optional)"
                  value={editForm.address}
                  onChange={(e) => setEditForm((v) => ({ ...v, address: e.target.value }))}
                  className="rounded-lg border border-border px-2 py-1.5 text-sm"
                />
              </div>
              {editError && <p className="mt-2 text-sm text-red-600">{editError}</p>}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => saveEdit(f.id)}
                  disabled={saving}
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  {saving ? "Speichert…" : "Speichern"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/70"
                >
                  Abbrechen
                </button>
              </div>
            </li>
          ) : (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2 text-sm"
            >
              <div>
                <span className="font-medium text-foreground">{f.name}</span>
                {f.address && <span className="ml-2 text-foreground/60">{f.address}</span>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => startEdit(f)} className="text-xs font-medium text-brand hover:underline">
                  Bearbeiten
                </button>
                <button
                  onClick={() => deleteFiliale(f)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Löschen
                </button>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
