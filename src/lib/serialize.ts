import type { OrderWithRelations } from "./types";

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
