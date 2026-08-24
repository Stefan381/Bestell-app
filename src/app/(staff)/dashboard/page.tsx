import { prisma } from "@/lib/prisma";
import { orderStaffInclude } from "@/lib/orderInclude";
import { serializeOrders } from "@/lib/serialize";
import { DashboardBoard } from "./DashboardBoard";

export default async function DashboardPage() {
  const [orders, filialen, users] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { ...orderStaffInclude, notifications: { orderBy: { createdAt: "desc" } } },
      take: 300,
    }),
    prisma.filiale.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, isActive: true, filialeId: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Offen → Bestellt → Geliefert. Karten per Drag &amp; Drop oder Button verschieben.
      </p>
      <DashboardBoard
        initialOrders={serializeOrders(orders)}
        filialen={filialen}
        users={users}
      />
    </div>
  );
}
