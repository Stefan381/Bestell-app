import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findDuplicateCustomer } from "@/lib/import/matcher";

const schema = z
  .object({
    email: z.string().trim().email().optional().or(z.literal("")),
    phone: z.string().trim().optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: "E-Mail oder Telefonnummer erforderlich.",
  });

// Public (kiosk, no login): lets a customer check "is this already me" by an
// identifier they themselves provide, without exposing a browsable search
// over other customers' data. Only a minimal name confirmation is returned.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const candidates = await prisma.customer.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  });
  const match = findDuplicateCustomer(parsed.data, candidates);

  if (!match) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    customer: { id: match.id, firstName: match.firstName, lastName: match.lastName },
  });
}
