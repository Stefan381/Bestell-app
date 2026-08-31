import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";
import { orderNotificationsInclude, orderStaffInclude } from "@/lib/orderInclude";
import { toPlainOrder } from "@/lib/apiSerialize";
import { DEPARTMENTS } from "@/lib/departments";
import { generateUniqueOrderNumber } from "@/lib/orderNumber";
import { buildOrderWhere } from "@/lib/orderFilters";

export async function GET(request: Request) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { searchParams } = new URL(request.url);
  const where = buildOrderWhere(searchParams);

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      ...orderStaffInclude,
      notifications: orderNotificationsInclude,
    },
    take: 300,
  });

  return NextResponse.json({ orders: orders.map(toPlainOrder) });
}

const orderItemSchema = z.object({
  articleId: z.string().optional(),
  freeTextWish: z.string().trim().optional(),
  quantity: z.number().int().positive().default(1),
});

const createOrderSchema = z.object({
  customerId: z.string(),
  filialeId: z.string(),
  department: z.enum(DEPARTMENTS),
  note: z.string().trim().optional(),
  items: z.array(orderItemSchema).min(1),
});

export async function POST(request: Request) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const [customer, filiale] = await Promise.all([
    prisma.customer.findUnique({ where: { id: data.customerId } }),
    prisma.filiale.findUnique({ where: { id: data.filialeId } }),
  ]);
  if (!customer) return NextResponse.json({ error: "Kunde nicht gefunden." }, { status: 404 });
  if (!filiale) return NextResponse.json({ error: "Filiale nicht gefunden." }, { status: 404 });

  const orderNumber = await generateUniqueOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: data.customerId,
      filialeId: data.filialeId,
      department: data.department,
      note: data.note || null,
      status: "OFFEN",
      createdByUserId: auth.session.userId,
      items: {
        create: data.items.map((item) => ({
          articleId: item.articleId || null,
          freeTextWish: item.freeTextWish || null,
          quantity: item.quantity,
        })),
      },
    },
    include: { items: { include: { article: true } }, customer: true, filiale: true, notifications: true },
  });

  return NextResponse.json({ order: toPlainOrder(order) }, { status: 201 });
}
