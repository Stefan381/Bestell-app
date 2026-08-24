import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const filialen = await prisma.filiale.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background px-4 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">City Kauf Kundenbestellportal</h1>
        <p className="mt-1 text-foreground/60">Bitte wählen Sie einen Zugang.</p>
      </div>
      <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
        <Link
          href="/login"
          className="rounded-2xl border border-border bg-surface p-8 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-foreground">Personal-Login</h2>
          <p className="mt-2 text-sm text-foreground/60">
            Dashboard, Kunden, Artikel, Bestellungen und Einstellungen verwalten.
          </p>
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-8 text-left shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Kiosk (Kunde)</h2>
          <p className="mt-2 text-sm text-foreground/60">Filiale für dieses Tablet wählen:</p>
          <div className="mt-4 flex flex-col gap-2">
            {filialen.map((filiale) => (
              <Link
                key={filiale.id}
                href={`/kiosk?filiale=${filiale.id}`}
                className="rounded-lg border border-border px-4 py-2.5 text-center font-medium text-foreground transition hover:border-brand hover:bg-brand/5"
              >
                {filiale.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
