export interface ChannelMessage {
  recipient: string;
  subject?: string;
  body: string;
}

export interface ChannelSendResult {
  success: boolean;
  errorMessage?: string;
}

/** A notification channel knows how to deliver one rendered message.
 * Swapping providers (e.g. plugging in a real WhatsApp Business API) means
 * implementing this interface and wiring it up in ./index.ts — nothing else
 * in the order/notification flow needs to change. */
export interface NotificationChannel {
  send(message: ChannelMessage): Promise<ChannelSendResult>;
}
