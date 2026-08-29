import { prisma } from "@/lib/prisma";
import { renderTemplate } from "./templateRenderer";

export class NotificationRenderError extends Error {}

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

/** Normalizes a phone number for a wa.me deep link: digits only, no leading
 * `+`. A bare German trunk number ("0151...", no country code) gets `49`
 * prefixed - a reasonable default for a single-country business, but not a
 * general phone-number library. */
export function toWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return digits;
  if (digits.startsWith("0")) return `49${digits.slice(1)}`;
  return digits;
}

export interface RenderedOrderNotification {
  recipient: string;
  subject?: string;
  body: string;
  templateId: string;
}

/**
 * Renders the default template for a channel with this order's real data.
 * Does not send anything - "sending" in this app means opening a prefilled
 * mailto:/wa.me link, which only the client (browser) can do. Throws
 * NotificationRenderError when there's nothing to notify with (no
 * recipient on file, or no default template configured for the channel).
 */
export async function renderOrderNotification(
  orderId: string,
  channel: "EMAIL" | "WHATSAPP"
): Promise<RenderedOrderNotification> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      customer: true,
      filiale: true,
      items: { include: { article: true } },
    },
  });

  const recipient = channel === "EMAIL" ? order.customer.email : order.customer.phone;
  if (!recipient) {
    throw new NotificationRenderError(
      channel === "EMAIL"
        ? "Kunde hat keine E-Mail-Adresse hinterlegt."
        : "Kunde hat keine Telefonnummer hinterlegt."
    );
  }

  const template = await prisma.messageTemplate.findFirst({ where: { channel, isDefault: true } });
  if (!template) {
    throw new NotificationRenderError(`Keine Standardvorlage für Kanal ${channel} konfiguriert.`);
  }

  const variables = {
    kundeVorname: order.customer.firstName ?? "",
    kundeNachname: order.customer.lastName,
    artikel: formatItems(order.items),
    filiale: order.filiale.name,
    abholhinweis: "Bitte Bestellbestätigung oder Kundenkarte mitbringen.",
  };

  return {
    recipient: channel === "EMAIL" ? recipient : toWhatsAppPhone(recipient),
    subject: template.subject ? renderTemplate(template.subject, variables) : undefined,
    body: renderTemplate(template.body, variables),
    templateId: template.id,
  };
}

/** Records that a staff member opened a prefilled mailto:/wa.me compose
 * window for this order - the audit trail the brief asks for ("gesendet:
 * Ja/Nein, wann, über welchen Kanal"), now driven by a manual click instead
 * of a system-confirmed send. */
export async function logOrderNotification(params: {
  orderId: string;
  channel: "EMAIL" | "WHATSAPP";
  recipient: string;
  body: string;
  templateId: string;
  sentByUserId: string;
}) {
  return prisma.notification.create({
    data: {
      orderId: params.orderId,
      channel: params.channel,
      status: "SENT",
      recipient: params.recipient,
      templateId: params.templateId,
      renderedBody: params.body,
      sentAt: new Date(),
      sentByUserId: params.sentByUserId,
    },
  });
}
