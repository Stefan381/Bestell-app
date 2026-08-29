import { Linking, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

function onlyDigits(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export function buildMailtoUrl(to: string[], subject: string, body: string): string {
  const params = new URLSearchParams();
  params.set('subject', subject);
  params.set('body', body);
  return `mailto:${to.join(',')}?${params.toString().replace(/\+/g, '%20')}`;
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  return `https://wa.me/${onlyDigits(phone)}?text=${encodeURIComponent(text)}`;
}

export async function openMailto(to: string[], subject: string, body: string): Promise<boolean> {
  const url = buildMailtoUrl(to, subject, body);
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) return false;
  await Linking.openURL(url);
  return true;
}

export async function openWhatsApp(phone: string, text: string): Promise<boolean> {
  const url = buildWhatsAppUrl(phone, text);
  await Linking.openURL(url);
  return true;
}

/** Öffnet das native Share-Sheet (dort sind auf den meisten Geräten Instagram/TikTok gelistet). */
export async function shareToSocial(message: string): Promise<void> {
  await Share.share({ message });
}

export async function copyToClipboard(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}
