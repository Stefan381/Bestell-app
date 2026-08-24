import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";

export async function GET() {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const filialen = await prisma.filiale.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ filialen });
}

const createFilialeSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createFilialeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const filiale = await prisma.filiale
    .create({ data: { name: data.name, address: data.address || null } })
    .catch(() => null);

  if (!filiale) {
    return NextResponse.json({ error: "Filiale existiert bereits." }, { status: 409 });
  }

  return NextResponse.json({ filiale }, { status: 201 });
}
