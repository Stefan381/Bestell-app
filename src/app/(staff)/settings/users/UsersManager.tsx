"use client";

import { useState } from "react";
import type { FilialeItem, StaffUserListItem } from "@/lib/types";

export function UsersManager({
  initialUsers,
  filialen,
}: {
  initialUsers: StaffUserListItem[];
  filialen: FilialeItem[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [showNew, setShowNew] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", filialeId: "" });
  const [error, setError] = useState<string | null>(null);

  async function toggleActive(user: StaffUserListItem) {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    const data = await res.json();
    if (res.ok) setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...data.user } : u)));
  }

  async function createUser() {
    setError(null);
    if (!newUser.name.trim() || !newUser.email.trim() || newUser.password.length < 6) {
      setError("Name, E-Mail und ein Passwort mit mind. 6 Zeichen erforderlich.");
      return;
    }
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newUser, filialeId: newUser.filialeId || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Benutzer konnte nicht angelegt werden.");
      return;
    }
    setUsers((prev) => [...prev, data.user]);
    setShowNew(false);
    setNewUser({ name: "", email: "", password: "", filialeId: "" });
  }

  return (
    <div>
      <p className="text-sm text-foreground/60">
        Alle Personal-Accounts haben identischen Vollzugriff (keine Rechte-Stufen).
      </p>

      <button
        onClick={() => setShowNew((v) => !v)}
        className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
      >
        {showNew ? "Abbrechen" : "+ Neuer Benutzer"}
      </button>

      {showNew && (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-4 sm:grid-cols-4">
          <input
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser((v) => ({ ...v, name: e.target.value }))}
            className="rounded-lg border border-border px-2 py-1.5 text-sm"
          />
          <input
            placeholder="E-Mail"
            value={newUser.email}
            onChange={(e) => setNewUser((v) => ({ ...v, email: e.target.value }))}
            className="rounded-lg border border-border px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Passwort"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser((v) => ({ ...v, password: e.target.value }))}
            className="rounded-lg border border-border px-2 py-1.5 text-sm"
          />
          <select
            value={newUser.filialeId}
            onChange={(e) => setNewUser((v) => ({ ...v, filialeId: e.target.value }))}
            className="rounded-lg border border-border px-2 py-1.5 text-sm"
          >
            <option value="">Keine Filiale</option>
            {filialen.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
          <button
            onClick={createUser}
            className="col-span-full rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Benutzer anlegen
          </button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-border bg-background text-xs uppercase text-foreground/50">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">E-Mail</th>
              <th className="px-3 py-2">Filiale</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-medium text-foreground">{u.name}</td>
                <td className="px-3 py-2 text-foreground/70">{u.email}</td>
                <td className="px-3 py-2 text-foreground/70">{u.filiale?.name ?? "–"}</td>
                <td className="px-3 py-2">
                  {u.isActive ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Aktiv</span>
                  ) : (
                    <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs text-foreground/60">
                      Deaktiviert
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => toggleActive(u)}
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    {u.isActive ? "Deaktivieren" : "Aktivieren"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
