import type { Prisma } from "@/generated/prisma/client";
import { orderStaffInclude } from "./orderInclude";

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderStaffInclude & { notifications: true };
}>;

export type CustomerListItem = Prisma.CustomerGetPayload<{
  include: { _count: { select: { orders: true } } };
}>;

export type ArticleListItem = Prisma.ArticleGetPayload<{
  include: { _count: { select: { orderItems: true } } };
}>;

export type FilialeItem = Prisma.FilialeGetPayload<Record<string, never>>;

export type ArticleDetail = Prisma.ArticleGetPayload<{
  include: {
    orderItems: { include: { order: { include: { customer: true } } } };
    _count: { select: { orderItems: true } };
  };
}>;

export type CustomerDetail = Prisma.CustomerGetPayload<{
  include: {
    orders: {
      include: { items: { include: { article: true } }; filiale: true };
    };
  };
}>;

export type StaffUserListItem = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  filialeId: string | null;
  filiale?: FilialeItem | null;
};
