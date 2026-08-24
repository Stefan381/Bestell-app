/** API routes serialize with NextResponse.json (JSON.stringify), which
 * turns a Prisma Decimal into a string via its toJSON — silently breaking
 * any client code that expects Article.price to be a number (found via
 * browser-testing the kiosk article search, where `.toFixed()` on the
 * string blew up). Route handlers that return Article rows should pass
 * them through this first so price is always a JSON number. */
export function toPlainArticle<T extends { price: unknown }>(article: T): Omit<T, "price"> & { price: number } {
  return { ...article, price: Number(article.price) };
}

/** Same fix, applied to an Order's nested item.article.price. */
export function toPlainOrder<
  T extends { items: { article: ({ price: unknown } & Record<string, unknown>) | null }[] },
>(order: T): T {
  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      article: item.article ? toPlainArticle(item.article) : null,
    })),
  };
}
