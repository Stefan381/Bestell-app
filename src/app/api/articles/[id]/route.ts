import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";
import { toPlainArticle } from "@/lib/apiSerialize";

export async function GET(_request: Request, ctx: RouteContext<"/api/articles/[id]">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: { order: { include: { customer: true } } },
        orderBy: { id: "desc" },
        take: 20,
      },
      _count: { select: { orderItems: true } },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Artikel nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ article: toPlainArticle(article) });
}

const updateArticleSchema = z.object({
  name: z.string().trim().min(1).optional(),
  price: z.number().nonnegative().optional(),
  ean: z.string().trim().optional(),
  category: z.string().trim().optional(),
  stock: z.number().int().nonnegative().nullable().optional(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/articles/[id]">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateArticleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Artikel nicht gefunden." }, { status: 404 });
  }

  const article = await prisma.article.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.ean !== undefined && { ean: data.ean || null }),
      ...(data.category !== undefined && { category: data.category || null }),
      ...(data.stock !== undefined && { stock: data.stock }),
    },
  });

  return NextResponse.json({ article: toPlainArticle(article) });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/articles/[id]">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  const usageCount = await prisma.orderItem.count({ where: { articleId: id } });
  if (usageCount > 0) {
    return NextResponse.json(
      { error: "Artikel wird in Bestellungen verwendet und kann nicht gelöscht werden." },
      { status: 409 }
    );
  }

  await prisma.article.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
