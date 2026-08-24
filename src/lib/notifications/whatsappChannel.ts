import type { ChannelMessage, ChannelSendResult, NotificationChannel } from "./channel";

/**
 * Prepared but not connected: City Kauf hasn't provisioned a WhatsApp
 * Business API account yet (see project brief §6). Once WHATSAPP_API_TOKEN /
 * WHATSAPP_PHONE_NUMBER_ID are set and a provider (Meta Cloud API, Twilio,
 * 360dialog) is chosen, replace the body of `send` with a real API call —
 * the rest of the app (order flow, Notification logging) needs no changes.
 */
export class WhatsAppChannel implements NotificationChannel {
  async send(message: ChannelMessage): Promise<ChannelSendResult> {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      console.info(
        `[WhatsAppChannel] Not connected yet — would send to ${message.recipient}: ${message.body}`
      );
      return {
        success: false,
        errorMessage:
          "WhatsApp Business API ist noch nicht angebunden (siehe WHATSAPP_* Umgebungsvariablen).",
      };
    }

    return {
      success: false,
      errorMessage: "WhatsApp-Versand ist noch nicht implementiert.",
    };
  }
}
