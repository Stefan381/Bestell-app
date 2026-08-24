import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { KioskFlow } from "./KioskFlow";

export default async function KioskPage({
  searchParams,
}: PageProps<"/kiosk">) {
  const { filiale: filialeId } = await searchParams;
  const filiale = typeof filialeId === "string" ? await prisma.filiale.findUnique({ where: { id: filialeId } }) : null;

  if (!filiale) {
    const filialen = await prisma.filiale.findMany({ orderBy: { name: "asc" } });
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
        <h1 className="text-xl font-semibold text-foreground">Bitte Filiale auswählen</h1>
        <div className="flex flex-col gap-2">
          {filialen.map((f) => (
            <Link
              key={f.id}
              href={`/kiosk?filiale=${f.id}`}
              className="rounded-lg border border-border bg-surface px-6 py-3 font-medium text-foreground hover:border-brand"
            >
              {f.name}
            </Link>
          ))}
        </div>
      </main>
    );
  }

  return <KioskFlow filialeId={filiale.id} filialeName={filiale.name} />;
}
