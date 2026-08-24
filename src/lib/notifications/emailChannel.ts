import nodemailer from "nodemailer";
import type { ChannelMessage, ChannelSendResult, NotificationChannel } from "./channel";

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export class EmailChannel implements NotificationChannel {
  async send(message: ChannelMessage): Promise<ChannelSendResult> {
    const transport = buildTransport();
    const from = process.env.SMTP_FROM || "bestellungen@citykauf.example";

    if (!transport) {
      // No SMTP configured (e.g. local dev). Log instead of failing hard so
      // the rest of the flow (Notification record, order status) still works.
      console.info(
        `[EmailChannel] SMTP not configured — would send to ${message.recipient}: ${message.subject ?? ""}\n${message.body}`
      );
      return {
        success: false,
        errorMessage: "SMTP nicht konfiguriert (siehe SMTP_* Umgebungsvariablen).",
      };
    }

    try {
      await transport.sendMail({
        from,
        to: message.recipient,
        subject: message.subject || "Ihre Bestellung bei City Kauf",
        text: message.body,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unbekannter E-Mail-Fehler",
      };
    }
  }
}
