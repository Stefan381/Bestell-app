import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";

export async function GET(request: Request) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { externalRef: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 50,
    include: { _count: { select: { orders: true } } },
  });

  return NextResponse.json({ customers });
}

const createCustomerSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  gdprConsent: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const customer = await prisma.customer.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      notes: data.notes || null,
      source: "MANUAL",
      gdprConsent: data.gdprConsent ?? false,
      gdprConsentAt: data.gdprConsent ? new Date() : null,
    },
  });

  return NextResponse.json({ customer }, { status: 201 });
}
