import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";

const updateFilialeSchema = z.object({
  name: z.string().trim().min(1).optional(),
  address: z.string().trim().optional(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/filialen/[id]">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateFilialeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.filiale.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Filiale nicht gefunden." }, { status: 404 });

  const filiale = await prisma.filiale
    .update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.address !== undefined && { address: data.address || null }),
      },
    })
    .catch(() => null);

  if (!filiale) {
    return NextResponse.json({ error: "Filialname bereits vergeben." }, { status: 409 });
  }

  return NextResponse.json({ filiale });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/filialen/[id]">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  const existing = await prisma.filiale.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Filiale nicht gefunden." }, { status: 404 });

  const [userCount, orderCount] = await Promise.all([
    prisma.user.count({ where: { filialeId: id } }),
    prisma.order.count({ where: { filialeId: id } }),
  ]);
  if (userCount > 0 || orderCount > 0) {
    return NextResponse.json(
      { error: "Filiale wird noch von Mitarbeitern oder Bestellungen verwendet und kann nicht gelöscht werden." },
      { status: 409 }
    );
  }

  await prisma.filiale.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
