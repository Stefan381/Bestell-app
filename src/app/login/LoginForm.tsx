"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Anmeldung fehlgeschlagen.");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
        E-Mail
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          autoComplete="username"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
        Passwort
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          autoComplete="current-password"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? "Anmelden…" : "Anmelden"}
      </button>
    </form>
  );
}
