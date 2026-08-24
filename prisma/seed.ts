import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [filiale1, filiale2, online] = await Promise.all([
    prisma.filiale.upsert({
      where: { name: "Filiale 1" },
      update: {},
      create: { name: "Filiale 1", address: "Hauptstraße 1, Musterstadt" },
    }),
    prisma.filiale.upsert({
      where: { name: "Filiale 2" },
      update: {},
      create: { name: "Filiale 2", address: "Marktplatz 5, Musterstadt" },
    }),
    prisma.filiale.upsert({
      where: { name: "Online" },
      update: {},
      create: { name: "Online" },
    }),
  ]);

  const passwordHash = await bcrypt.hash("bestell123", 10);
  const staff = await prisma.user.upsert({
    where: { email: "personal@citykauf.example" },
    update: {},
    create: {
      name: "Personal Demo",
      email: "personal@citykauf.example",
      passwordHash,
      filialeId: filiale1.id,
    },
  });

  await prisma.messageTemplate.upsert({
    where: { id: "default-email-template" },
    update: {},
    create: {
      id: "default-email-template",
      name: "Bestellung abholbereit (E-Mail)",
      channel: "EMAIL",
      subject: "Ihre Bestellung bei City Kauf ist abholbereit",
      body: "Hallo {{kundeVorname}},\n\nIhre Bestellung ({{artikel}}) ist ab sofort in unserer {{filiale}} abholbereit.\n\n{{abholhinweis}}\n\nViele Grüße\nIhr City Kauf Team",
      isDefault: true,
    },
  });

  await prisma.messageTemplate.upsert({
    where: { id: "default-whatsapp-template" },
    update: {},
    create: {
      id: "default-whatsapp-template",
      name: "Bestellung abholbereit (WhatsApp)",
      channel: "WHATSAPP",
      body: "Hallo {{kundeVorname}}, Ihre Bestellung ({{artikel}}) ist abholbereit in {{filiale}}. {{abholhinweis}}",
      isDefault: true,
    },
  });

  const [customer1, customer2] = await Promise.all([
    prisma.customer.upsert({
      where: { id: "demo-customer-1" },
      update: {},
      create: {
        id: "demo-customer-1",
        firstName: "Anna",
        lastName: "Beispiel",
        email: "anna.beispiel@example.com",
        phone: "+49 151 23456789",
        source: "KASSE",
        externalRef: "K-1001",
        gdprConsent: true,
        gdprConsentAt: new Date(),
      },
    }),
    prisma.customer.upsert({
      where: { id: "demo-customer-2" },
      update: {},
      create: {
        id: "demo-customer-2",
        firstName: "Ben",
        lastName: "Muster",
        email: "ben.muster@example.com",
        phone: "+49 160 98765432",
        source: "HUBSPOT",
        externalRef: "hs-contact-42",
        gdprConsent: false,
      },
    }),
  ]);

  const [article1, article2] = await Promise.all([
    prisma.article.upsert({
      where: { articleNumber: "A-1000" },
      update: {},
      create: {
        articleNumber: "A-1000",
        name: "Kaffeemaschine Deluxe",
        price: 89.99,
        ean: "4006381333931",
        category: "Haushalt",
        stock: 12,
      },
    }),
    prisma.article.upsert({
      where: { articleNumber: "A-1001" },
      update: {},
      create: {
        articleNumber: "A-1001",
        name: "Wasserkocher Kompakt",
        price: 29.5,
        ean: "4006381333948",
        category: "Haushalt",
        stock: 30,
      },
    }),
  ]);

  await prisma.order.upsert({
    where: { id: "demo-order-1" },
    update: {},
    create: {
      id: "demo-order-1",
      customerId: customer1.id,
      filialeId: filiale1.id,
      status: "OFFEN",
      note: "Kunde ruft bei Ankunft an.",
      createdByUserId: staff.id,
      items: {
        create: [{ articleId: article1.id, quantity: 1 }],
      },
    },
  });

  await prisma.order.upsert({
    where: { id: "demo-order-2" },
    update: {},
    create: {
      id: "demo-order-2",
      customerId: customer2.id,
      filialeId: filiale2.id,
      status: "BESTELLT",
      createdByUserId: staff.id,
      orderedAt: new Date(),
      orderedByUserId: staff.id,
      items: {
        create: [{ articleId: article2.id, quantity: 2 }],
      },
    },
  });

  console.log("Seed complete.");
  console.log(`Filialen: ${filiale1.name}, ${filiale2.name}, ${online.name}`);
  console.log(`Staff login: ${staff.email} / bestell123`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
