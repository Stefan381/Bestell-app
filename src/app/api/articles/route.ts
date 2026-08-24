import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";

export async function GET(request: Request) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const articles = await prisma.article.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { articleNumber: { contains: q, mode: "insensitive" } },
            { ean: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    take: 50,
    include: { _count: { select: { orderItems: true } } },
  });

  return NextResponse.json({ articles });
}

const createArticleSchema = z.object({
  articleNumber: z.string().trim().min(1),
  name: z.string().trim().min(1),
  price: z.number().nonnegative(),
  ean: z.string().trim().optional(),
  category: z.string().trim().optional(),
  stock: z.number().int().nonnegative().optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createArticleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const duplicate = await prisma.article.findUnique({ where: { articleNumber: data.articleNumber } });
  if (duplicate) {
    return NextResponse.json({ error: "Artikelnummer existiert bereits." }, { status: 409 });
  }

  const article = await prisma.article.create({
    data: {
      articleNumber: data.articleNumber,
      name: data.name,
      price: data.price,
      ean: data.ean || null,
      category: data.category || null,
      stock: data.stock ?? null,
    },
  });

  return NextResponse.json({ article }, { status: 201 });
}
