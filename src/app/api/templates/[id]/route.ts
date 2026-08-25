import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";

const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  // Nullable: WhatsApp templates have no subject field, and the form sends
  // null (not omitted) once a subject is cleared - z.string().optional()
  // rejects null and produced "Invalid input: expected string, received
  // null" on every save that did this.
  subject: z.string().trim().optional().nullable(),
  body: z.string().trim().min(1).optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/templates/[id]">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.messageTemplate.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Vorlage nicht gefunden." }, { status: 404 });

  if (data.isDefault) {
    await prisma.messageTemplate.updateMany({
      where: { channel: existing.channel, isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const template = await prisma.messageTemplate.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.subject !== undefined && { subject: data.subject || null }),
      ...(data.body !== undefined && { body: data.body }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
    },
  });

  return NextResponse.json({ template });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/templates/[id]">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  await prisma.messageTemplate.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
