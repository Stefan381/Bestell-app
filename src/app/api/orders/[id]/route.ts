import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";
import { orderNotificationsInclude, orderStaffInclude } from "@/lib/orderInclude";
import { toPlainOrder } from "@/lib/apiSerialize";

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

const updateOrderSchema = z.object({
  status: z.enum(["OFFEN", "BESTELLT", "GELIEFERT"]).optional(),
  note: z.string().trim().optional(),
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

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Bestellung nicht gefunden." }, { status: 404 });

  const now = new Date();

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(data.note !== undefined && { note: data.note || null }),
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
