import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findDuplicateCustomer } from "@/lib/import/matcher";
import { generateUniqueOrderNumber } from "@/lib/orderNumber";
import { DEPARTMENTS } from "@/lib/departments";

const itemSchema = z
  .object({
    articleId: z.string().optional(),
    freeTextWish: z.string().trim().optional(),
    quantity: z.number().int().positive().default(1),
  })
  .refine((item) => item.articleId || item.freeTextWish, {
    message: "Artikel oder Freitext-Wunsch erforderlich.",
  });

const newCustomerSchema = z.object({
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
});

const schema = z.object({
  filialeId: z.string(),
  identifiedCustomerId: z.string().optional(),
  customer: newCustomerSchema.optional(),
  department: z.enum(DEPARTMENTS).optional(),
  gdprMarketingConsent: z.boolean(),
  note: z.string().trim().optional(),
  items: z.array(itemSchema).min(1),
});

// Public (kiosk, no login): a customer submits their own order at an
// in-store tablet. Never touches staff-only endpoints or exposes other
// customers' data.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const filiale = await prisma.filiale.findUnique({ where: { id: data.filialeId } });
  if (!filiale) {
    return NextResponse.json({ error: "Filiale nicht gefunden." }, { status: 404 });
  }

  let customerId = data.identifiedCustomerId;

  if (customerId) {
    const existing = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!existing) {
      return NextResponse.json({ error: "Kunde nicht gefunden." }, { status: 404 });
    }
    if (data.gdprMarketingConsent && !existing.gdprConsent) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { gdprConsent: true, gdprConsentAt: new Date() },
      });
    }
  } else {
    if (!data.customer) {
      return NextResponse.json({ error: "Kundendaten erforderlich." }, { status: 400 });
    }
    const candidates = await prisma.customer.findMany({
      select: { id: true, email: true, phone: true },
    });
    const duplicate = findDuplicateCustomer(data.customer, candidates);

    if (duplicate) {
      customerId = duplicate.id;
      if (data.gdprMarketingConsent) {
        await prisma.customer.update({
          where: { id: duplicate.id },
          data: { gdprConsent: true, gdprConsentAt: new Date() },
        });
      }
    } else {
      const created = await prisma.customer.create({
        data: {
          firstName: data.customer.firstName || null,
          lastName: data.customer.lastName,
          email: data.customer.email || null,
          phone: data.customer.phone || null,
          source: "MANUAL",
          gdprConsent: data.gdprMarketingConsent,
          gdprConsentAt: data.gdprMarketingConsent ? new Date() : null,
        },
      });
      customerId = created.id;
    }
  }

  const orderNumber = await generateUniqueOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId,
      filialeId: data.filialeId,
      department: data.department ?? null,
      note: data.note || null,
      status: "OFFEN",
      createdByUserId: null,
      items: {
        create: data.items.map((item) => ({
          articleId: item.articleId || null,
          freeTextWish: item.freeTextWish || null,
          quantity: item.quantity,
        })),
      },
    },
  });

  return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber }, { status: 201 });
}
