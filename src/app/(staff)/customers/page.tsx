import { prisma } from "@/lib/prisma";
import { CustomersList } from "./CustomersList";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: { _count: { select: { orders: true } } },
    take: 50,
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Kunden</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Gemeinsamer Kundenpool aus Kasse, HubSpot und manueller Erfassung.
      </p>
      <CustomersList initialCustomers={customers} />
    </div>
  );
}
