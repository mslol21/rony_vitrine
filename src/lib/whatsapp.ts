import type { CartItem, CustomizationData, WhatsAppMessage } from '../types';
import { formatCurrency } from './utils';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5511975915227';

function formatCustomizations(customizations: CustomizationData): string {
  const labels: Record<string, string> = {
    cor: '🎨 Tom/Cor',
    tecido: '🧴 Tipo de Pele/Cabelo',
    acabamento: '✨ Volume/Dosagem',
    tamanho: '📐 Apresentação',
    nome: '✍️ Nome na Embalagem',
    observacoes: '📝 Observações',
  };

  return Object.entries(customizations)
    .filter(([, value]) => value && value.trim() !== '')
    .map(([key, value]) => `   ${labels[key] || key}: ${value}`)
    .join('\n');
}

function formatCartItem(item: CartItem, index: number): string {
  const hasCustomizations = Object.values(item.customizations).some(
    (v) => v && v.trim() !== ''
  );
  const customText = hasCustomizations
    ? '\n' + formatCustomizations(item.customizations)
    : '';

  return `*${index + 1}. ${item.product.name}*${customText}
   📦 Quantidade: ${item.quantity}
   💰 Valor unitário: ${formatCurrency(item.unit_price)}
   💵 Subtotal: ${formatCurrency(item.total_price)}`;
}

export function generateWhatsAppMessage(
  items: CartItem[],
  options?: { name?: string; notes?: string }
): WhatsAppMessage {
  const total = items.reduce((sum, item) => sum + item.total_price, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const itemsText = items.map(formatCartItem).join('\n\n');

  let message = `Olá! 😊 Gostaria de solicitar orçamento para os seguintes itens:`;

  if (options?.name) {
    message = `Olá! 😊 Meu nome é *${options.name}* e gostaria de solicitar orçamento para os seguintes itens:`;
  }

  message += `\n\n━━━━━━━━━━━━━━━━━━━━\n✨ *ROONY COSMÉTICOS*\n━━━━━━━━━━━━━━━━━━━━\n\n${itemsText}\n\n━━━━━━━━━━━━━━━━━━━━\n🛍️ *Total de itens:* ${totalItems}\n💳 *Valor estimado total:* ${formatCurrency(total)}\n━━━━━━━━━━━━━━━━━━━━`;

  if (options?.notes) {
    message += `\n\n📝 *Observações:* ${options.notes}`;
  }

  message += `\n\nAguardo retorno para confirmação! 🌿`;

  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

  return {
    phone: WHATSAPP_NUMBER,
    message,
    url,
  };
}

export function generateSingleProductMessage(
  productName: string,
  customizations: CustomizationData,
  quantity: number,
  price: number
): WhatsAppMessage {
  const hasCustomizations = Object.values(customizations).some(
    (v) => v && v.trim() !== ''
  );
  const customText = hasCustomizations
    ? '\n' + formatCustomizations(customizations)
    : '';

  const message = `Olá! 😊 Gostaria de solicitar orçamento:

━━━━━━━━━━━━━━━━━━━━
✨ *ROONY COSMÉTICOS*
━━━━━━━━━━━━━━━━━━━━

*${productName}*${customText}
   📦 Quantidade: ${quantity}
   💰 Valor estimado: ${formatCurrency(price * quantity)}

━━━━━━━━━━━━━━━━━━━━

Aguardo retorno! 🌿`;

  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

  return { phone: WHATSAPP_NUMBER, message, url };
}
