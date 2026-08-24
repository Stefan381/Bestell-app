import { prisma } from "@/lib/prisma";
import { serializeArticles } from "@/lib/serialize";
import { ArticlesList } from "./ArticlesList";

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { orderItems: true } } },
    take: 50,
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Artikel</h1>
      <p className="mt-1 text-sm text-foreground/60">Artikelstammdaten aus dem Kassensystem-Import.</p>
      <ArticlesList initialArticles={serializeArticles(articles)} />
    </div>
  );
}
