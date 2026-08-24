import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPlainArticle } from "@/lib/apiSerialize";

// Public (kiosk, no login): product catalog search, not personal data.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ articles: [] });
  }

  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { articleNumber: { contains: q, mode: "insensitive" } },
        { ean: { contains: q } },
      ],
    },
    select: { id: true, articleNumber: true, name: true, price: true, ean: true },
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json({ articles: articles.map(toPlainArticle) });
}
