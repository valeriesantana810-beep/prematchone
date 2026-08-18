export const WHATSAPP_NUMBER = '264814435774';
export const PLATFORM_URL = 'https://prematch.bet';

export const BRAND_NAME = 'Prematch.Bet';
export const BRAND_SHORT = 'Prematch';

export function whatsappLink(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}
