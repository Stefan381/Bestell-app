import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";
import { hashPassword } from "@/lib/auth/password";

const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  isActive: z.boolean().optional(),
  filialeId: z.string().nullable().optional(),
  password: z.string().min(6).optional(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/users/[id]">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });

  const user = await prisma.user
    .update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email.toLowerCase() }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.filialeId !== undefined && { filialeId: data.filialeId }),
        ...(data.password !== undefined && { passwordHash: await hashPassword(data.password) }),
      },
      select: { id: true, name: true, email: true, isActive: true, filialeId: true, filiale: true },
    })
    .catch(() => null);

  if (!user) {
    return NextResponse.json({ error: "E-Mail wird bereits verwendet." }, { status: 409 });
  }

  return NextResponse.json({ user });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/users/[id]">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  if (id === auth.session.userId) {
    return NextResponse.json({ error: "Der eigene Account kann nicht gelöscht werden." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });

  const [orderCount, importCount, notificationCount] = await Promise.all([
    prisma.order.count({
      where: { OR: [{ createdByUserId: id }, { orderedByUserId: id }, { deliveredByUserId: id }] },
    }),
    prisma.importBatch.count({ where: { importedByUserId: id } }),
    prisma.notification.count({ where: { sentByUserId: id } }),
  ]);
  if (orderCount > 0 || importCount > 0 || notificationCount > 0) {
    return NextResponse.json(
      {
        error:
          "Benutzer hat bereits Aktivität (Bestellungen, Imports oder Benachrichtigungen) und kann nur deaktiviert, nicht gelöscht werden.",
      },
      { status: 409 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
