import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";
import { orderNotificationsInclude, orderStaffInclude } from "@/lib/orderInclude";
import { toPlainOrder } from "@/lib/apiSerialize";
import { DEPARTMENTS } from "@/lib/departments";

export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { ...orderStaffInclude, notifications: orderNotificationsInclude },
  });

  if (!order) return NextResponse.json({ error: "Bestellung nicht gefunden." }, { status: 404 });
  return NextResponse.json({ order: toPlainOrder(order) });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Bestellung nicht gefunden." }, { status: 404 });

  // OrderItem and Notification both cascade-delete with the order.
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

const updateOrderSchema = z.object({
  status: z.enum(["OFFEN", "BESTELLT", "GELIEFERT"]).optional(),
  note: z.string().trim().optional(),
  department: z.enum(DEPARTMENTS).optional(),
  // Editing an existing order's items: quantity 0 removes the position.
  items: z.array(z.object({ id: z.string(), quantity: z.number().int().nonnegative() })).optional(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!existing) return NextResponse.json({ error: "Bestellung nicht gefunden." }, { status: 404 });

  if (data.items) {
    const ownItemIds = new Set(existing.items.map((i) => i.id));
    for (const item of data.items) {
      if (!ownItemIds.has(item.id)) {
        return NextResponse.json({ error: "Position gehört nicht zu dieser Bestellung." }, { status: 400 });
      }
    }
    const removedIds = new Set(data.items.filter((i) => i.quantity === 0).map((i) => i.id));
    const remaining = existing.items.filter((i) => !removedIds.has(i.id));
    if (remaining.length === 0) {
      return NextResponse.json(
        { error: "Eine Bestellung muss mindestens eine Position behalten." },
        { status: 400 }
      );
    }
  }

  const now = new Date();

  await prisma.$transaction([
    ...(data.items?.filter((i) => i.quantity === 0).map((i) => prisma.orderItem.delete({ where: { id: i.id } })) ??
      []),
    ...(data.items
      ?.filter((i) => i.quantity > 0)
      .map((i) => prisma.orderItem.update({ where: { id: i.id }, data: { quantity: i.quantity } })) ?? []),
  ]);

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(data.note !== undefined && { note: data.note || null }),
      ...(data.department !== undefined && { department: data.department }),
      ...(data.status && { status: data.status }),
      ...(data.status === "BESTELLT" && {
        orderedAt: now,
        orderedByUserId: auth.session.userId,
      }),
      ...(data.status === "GELIEFERT" && {
        deliveredAt: now,
        deliveredByUserId: auth.session.userId,
      }),
    },
    include: { ...orderStaffInclude, notifications: orderNotificationsInclude },
  });

  return NextResponse.json({ order: toPlainOrder(order) });
}
