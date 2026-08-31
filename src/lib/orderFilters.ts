import type { Prisma } from "@/generated/prisma/client";

/** Shared filter parsing for GET /api/orders and GET /api/orders/export so
 * the Excel export always matches what's currently filtered on the
 * dashboard (status is deliberately not forced here - the export wants
 * every status, split across sheets). */
export function buildOrderWhere(searchParams: URLSearchParams): Prisma.OrderWhereInput {
  const status = searchParams.get("status");
  const filialeId = searchParams.get("filialeId");
  const department = searchParams.get("department");
  const employeeId = searchParams.get("employeeId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const q = searchParams.get("q")?.trim();

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status as Prisma.OrderWhereInput["status"];
  if (filialeId) where.filialeId = filialeId;
  if (department) where.department = department as Prisma.OrderWhereInput["department"];
  if (employeeId) {
    where.OR = [
      { createdByUserId: employeeId },
      { orderedByUserId: employeeId },
      { deliveredByUserId: employeeId },
    ];
  }
  if (from || to) {
    where.createdAt = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
  }
  if (q) {
    where.AND = [
      {
        OR: [
          { orderNumber: { contains: q } },
          { customer: { firstName: { contains: q, mode: "insensitive" } } },
          { customer: { lastName: { contains: q, mode: "insensitive" } } },
          { items: { some: { article: { name: { contains: q, mode: "insensitive" } } } } },
          { items: { some: { freeTextWish: { contains: q, mode: "insensitive" } } } },
        ],
      },
    ];
  }

  return where;
}
