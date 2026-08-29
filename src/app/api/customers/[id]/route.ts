import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";

export async function GET(_request: Request, ctx: RouteContext<"/api/customers/[id]">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { article: true } }, filiale: true },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Kunde nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

const updateCustomerSchema = z.object({
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  gdprConsent: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/customers/[id]">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Kunde nicht gefunden." }, { status: 404 });
  }

  const gdprConsentChanged = data.gdprConsent !== undefined && data.gdprConsent !== existing.gdprConsent;

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(data.firstName !== undefined && { firstName: data.firstName || null }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.gdprConsent !== undefined && {
        gdprConsent: data.gdprConsent,
        ...(gdprConsentChanged && { gdprConsentAt: data.gdprConsent ? new Date() : null }),
      }),
    },
  });

  return NextResponse.json({ customer });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/customers/[id]">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Kunde nicht gefunden." }, { status: 404 });
  }

  // GDPR erasure request: remove the customer record. Orders reference the
  // customer for operational history, so we block deletion while open
  // orders exist rather than silently orphaning them.
  const openOrders = await prisma.order.count({
    where: { customerId: id, status: { not: "GELIEFERT" } },
  });
  if (openOrders > 0) {
    return NextResponse.json(
      { error: "Kunde hat noch offene/bestellte Bestellungen und kann nicht gelöscht werden." },
      { status: 409 }
    );
  }

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
