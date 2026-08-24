"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground/70 transition hover:border-brand hover:text-brand"
    >
      Abmelden
    </button>
  );
}
