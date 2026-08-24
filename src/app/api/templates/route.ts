import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";

export async function GET() {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const templates = await prisma.messageTemplate.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ templates });
}

const createTemplateSchema = z.object({
  name: z.string().trim().min(1),
  channel: z.enum(["EMAIL", "WHATSAPP"]),
  subject: z.string().trim().optional(),
  body: z.string().trim().min(1),
  isDefault: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  if (data.isDefault) {
    await prisma.messageTemplate.updateMany({
      where: { channel: data.channel, isDefault: true },
      data: { isDefault: false },
    });
  }

  const template = await prisma.messageTemplate.create({
    data: {
      name: data.name,
      channel: data.channel,
      subject: data.subject || null,
      body: data.body,
      isDefault: data.isDefault ?? false,
    },
  });

  return NextResponse.json({ template }, { status: 201 });
}
