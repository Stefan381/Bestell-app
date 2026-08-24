import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";
import { hashPassword } from "@/lib/auth/password";

export async function GET() {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, isActive: true, filialeId: true, filiale: true },
  });

  return NextResponse.json({ users });
}

const createUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(6),
  filialeId: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "E-Mail wird bereits verwendet." }, { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      filialeId: data.filialeId || null,
    },
    select: { id: true, name: true, email: true, isActive: true, filialeId: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
