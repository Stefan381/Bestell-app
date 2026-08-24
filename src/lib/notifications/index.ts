import { prisma } from "@/lib/prisma";
import { EmailChannel } from "./emailChannel";
import { WhatsAppChannel } from "./whatsappChannel";
import { renderTemplate } from "./templateRenderer";
import type { NotificationChannel } from "./channel";

const channels: Record<"EMAIL" | "WHATSAPP", NotificationChannel> = {
  EMAIL: new EmailChannel(),
  WHATSAPP: new WhatsAppChannel(),
};

function formatItems(
  items: { quantity: number; freeTextWish: string | null; article: { name: string } | null }[]
): string {
  return items
    .map((item) => {
      const label = item.article?.name ?? item.freeTextWish ?? "Artikel";
      return `${label} (x${item.quantity})`;
    })
    .join(", ");
}

/**
 * Triggered when an order's status moves to GELIEFERT. Always fires
 * regardless of the customer's marketing-consent flag — this is a
 * transactional "your order is ready" message, not marketing (brief §4.4).
 * Picks the default template for the channel, renders it, sends it, and
 * writes the Notification audit row either way (sent or failed).
 */
export async function sendOrderReadyNotification(orderId: string, channel: "EMAIL" | "WHATSAPP" = "EMAIL") {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      customer: true,
      filiale: true,
      items: { include: { article: true } },
    },
  });

  const recipient = channel === "EMAIL" ? order.customer.email : order.customer.phone;

  const template = await prisma.messageTemplate.findFirst({
    where: { channel, isDefault: true },
  });

  if (!recipient || !template) {
    return prisma.notification.create({
      data: {
        orderId,
        channel,
        status: "FAILED",
        recipient: recipient ?? "",
        renderedBody: "",
        errorMessage: !recipient
          ? `Kunde hat keine ${channel === "EMAIL" ? "E-Mail-Adresse" : "Telefonnummer"} hinterlegt.`
          : `Keine Standardvorlage für Kanal ${channel} konfiguriert.`,
      },
    });
  }

  const variables = {
    kundeVorname: order.customer.firstName,
    kundeNachname: order.customer.lastName,
    artikel: formatItems(order.items),
    filiale: order.filiale.name,
    abholhinweis: "Bitte Bestellbestätigung oder Kundenkarte mitbringen.",
  };

  const renderedBody = renderTemplate(template.body, variables);
  const renderedSubject = template.subject ? renderTemplate(template.subject, variables) : undefined;

  const result = await channels[channel].send({
    recipient,
    subject: renderedSubject,
    body: renderedBody,
  });

  return prisma.notification.create({
    data: {
      orderId,
      channel,
      status: result.success ? "SENT" : "FAILED",
      recipient,
      templateId: template.id,
      renderedBody,
      errorMessage: result.errorMessage,
      sentAt: result.success ? new Date() : null,
    },
  });
}
