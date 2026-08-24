import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";

export async function GET(_request: Request, ctx: RouteContext<"/api/customers/[id]/export">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        include: { items: { include: { article: true } }, filiale: true, notifications: true },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Kunde nicht gefunden." }, { status: 404 });
  }

  return new NextResponse(JSON.stringify(customer, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="kunde-${customer.id}.json"`,
    },
  });
}
