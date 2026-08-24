import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeCustomerDetail } from "@/lib/serialize";
import { CustomerDetailView } from "./CustomerDetailView";

export default async function CustomerDetailPage({
  params,
}: PageProps<"/customers/[id]">) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { article: true } }, filiale: true },
      },
    },
  });

  if (!customer) notFound();

  return <CustomerDetailView customer={serializeCustomerDetail(customer)} />;
}
