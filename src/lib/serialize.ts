import type { ArticleDetail, ArticleListItem, CustomerDetail, OrderWithRelations } from "./types";

/** Server Components can't pass Prisma Decimal instances to Client
 * Components (React's RSC serialization only accepts plain objects, unlike
 * JSON.stringify which uses Decimal's toJSON). Call this before handing
 * Prisma data with a price field to a "use client" component. */
export function serializeOrders(orders: OrderWithRelations[]): SerializedOrder[] {
  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      article: item.article ? { ...item.article, price: Number(item.article.price) } : null,
    })),
  }));
}

export type SerializedOrder = Omit<OrderWithRelations, "items"> & {
  items: (Omit<OrderWithRelations["items"][number], "article"> & {
    article: (Omit<NonNullable<OrderWithRelations["items"][number]["article"]>, "price"> & {
      price: number;
    }) | null;
  })[];
};

export function serializeArticles(articles: ArticleListItem[]): SerializedArticle[] {
  return articles.map((a) => ({ ...a, price: Number(a.price) }));
}

export type SerializedArticle = Omit<ArticleListItem, "price"> & { price: number };

export function serializeArticleDetail(article: ArticleDetail): SerializedArticleDetail {
  return { ...article, price: Number(article.price) };
}

export type SerializedArticleDetail = Omit<ArticleDetail, "price"> & { price: number };

export function serializeCustomerDetail(customer: CustomerDetail): SerializedCustomerDetail {
  return {
    ...customer,
    orders: customer.orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        article: item.article ? { ...item.article, price: Number(item.article.price) } : null,
      })),
    })),
  };
}

export type SerializedCustomerDetail = Omit<CustomerDetail, "orders"> & {
  orders: (Omit<CustomerDetail["orders"][number], "items"> & {
    items: (Omit<CustomerDetail["orders"][number]["items"][number], "article"> & {
      article:
        | (Omit<NonNullable<CustomerDetail["orders"][number]["items"][number]["article"]>, "price"> & {
            price: number;
          })
        | null;
    })[];
  })[];
};
