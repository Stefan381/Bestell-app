import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";
import { toPlainArticle } from "@/lib/apiSerialize";

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

  return NextResponse.json({ articles: articles.map(toPlainArticle) });
}

const createArticleSchema = z.object({
  // Both optional: an article can be added on the fly (e.g. from the New
  // Order modal) without knowing the article number or price yet - staff
  // can fill those in later from the article's detail page.
  articleNumber: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  price: z.number().nonnegative().optional(),
  ean: z.string().trim().optional(),
  manufacturer: z.string().trim().optional(),
  supplier: z.string().trim().optional(),
  category: z.string().trim().optional(),
  stock: z.number().int().nonnegative().optional(),
});

/** Placeholder article number for quick-add flows that don't have a real
 * one yet - prefixed so staff can spot and clean these up later (e.g. by
 * searching "NEU-"). */
function generatePlaceholderArticleNumber(): string {
  return `NEU-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(request: Request) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createArticleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;
  const articleNumber = data.articleNumber || generatePlaceholderArticleNumber();

  const duplicate = await prisma.article.findUnique({ where: { articleNumber } });
  if (duplicate) {
    return NextResponse.json({ error: "Artikelnummer existiert bereits." }, { status: 409 });
  }

  const article = await prisma.article.create({
    data: {
      articleNumber,
      name: data.name,
      price: data.price ?? 0,
      ean: data.ean || null,
      manufacturer: data.manufacturer || null,
      supplier: data.supplier || null,
      category: data.category || null,
      stock: data.stock ?? null,
    },
  });

  return NextResponse.json({ article: toPlainArticle(article) }, { status: 201 });
}
