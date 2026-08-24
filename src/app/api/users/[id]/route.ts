import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";
import { hashPassword } from "@/lib/auth/password";

const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
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

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.filialeId !== undefined && { filialeId: data.filialeId }),
      ...(data.password !== undefined && { passwordHash: await hashPassword(data.password) }),
    },
    select: { id: true, name: true, email: true, isActive: true, filialeId: true },
  });

  return NextResponse.json({ user });
}
