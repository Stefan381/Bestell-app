import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeArticleDetail } from "@/lib/serialize";
import { ArticleDetailView } from "./ArticleDetailView";

export default async function ArticleDetailPage({ params }: PageProps<"/articles/[id]">) {
  const { id } = await params;

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

  if (!article) notFound();

  return <ArticleDetailView article={serializeArticleDetail(article)} />;
}
