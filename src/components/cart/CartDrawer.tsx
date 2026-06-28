import { useState, useEffect } from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus, MessageCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { formatCurrency, cn } from '../../lib/utils';
import { generateWhatsAppMessage } from '../../lib/whatsapp';
import { dbService } from '../../lib/dbService';
import { toast } from 'sonner';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const total = getTotalPrice();

  // Step state: 'cart' or 'checkout'
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  
  // Checkout form state
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset step when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setStep('cart');
      setName('');
      setWhatsapp('');
      setNotes('');
    }
  }, [isOpen]);

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!name || !whatsapp) {
      toast.error('Por favor, informe seu nome e WhatsApp.');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Save order to Supabase
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.images?.[0]?.url || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        customizations: item.customizations
      }));

      await dbService.createOrder({
        customer_name: name,
        customer_whatsapp: whatsapp,
        total: total,
        notes: notes,
        items: orderItems
      });

      // 2. Direct to WhatsApp
      const { url } = generateWhatsAppMessage(items, { name, notes });
      window.open(url, '_blank');

      // 3. Clear cart and close
      clearCart();
      closeCart();
      toast.success('Pedido registrado e enviado para o WhatsApp! 📝');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erro ao registrar o pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-large transition-transform duration-400 ease-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            {step === 'checkout' ? (
              <button
                onClick={() => setStep('cart')}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-all mr-1"
                aria-label="Voltar para o carrinho"
                disabled={submitting}
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <ShoppingBag size={20} className="text-stone-700" />
            )}
            <h2 className="font-serif text-xl text-stone-800">
              {step === 'checkout' ? 'Dados para Contato' : 'Meu Carrinho'}
            </h2>
            {items.length > 0 && step === 'cart' && (
              <span className="w-5 h-5 bg-brand-gold text-white text-xs font-bold rounded-full flex items-center justify-center">
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-all duration-200"
            aria-label="Fechar carrinho"
            disabled={submitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                <ShoppingBag size={28} className="text-stone-300" />
              </div>
              <div>
                <p className="font-serif text-lg text-stone-600">Seu carrinho está vazio</p>
                <p className="text-sm text-stone-400 mt-1 font-sans">Adicione produtos para solicitar orçamento</p>
              </div>
              <button
                onClick={closeCart}
                className="btn-secondary mt-2"
              >
                Ver Catálogo
              </button>
            </div>
          ) : step === 'cart' ? (
            /* CART LIST STEP */
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-stone-50 rounded-xl">
                  <img
                    src={item.product.images?.[0]?.url || '/images/almofada.jpg'}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-sm text-stone-800 leading-snug mb-1">
                      {item.product.name}
                    </h4>

                    {/* Customizations */}
                    {Object.entries(item.customizations).filter(([, v]) => v && v.trim()).length > 0 && (
                      <div className="mt-1 mb-2 space-y-0.5">
                        {Object.entries(item.customizations)
                          .filter(([, v]) => v && v.trim())
                          .map(([key, value]) => (
                            <span
                              key={key}
                              className="inline-block text-[10px] font-sans bg-brand-linen text-brand-espresso px-2 py-0.5 rounded-full mr-1"
                            >
                              {value}
                            </span>
                          ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-serif text-sm font-medium text-stone-800">
                          {formatCurrency(item.total_price)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-stone-300 hover:text-red-400 transition-colors"
                          aria-label="Remover item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* CHECKOUT CONTACT FORM STEP */
            <form id="checkout-form" onSubmit={handleSubmitCheckout} className="space-y-5 pt-2">
              <div>
                <label className="label-base" htmlFor="checkout-name">Nome Completo *</label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-base"
                  placeholder="Ex: Maria Silva"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="label-base" htmlFor="checkout-whatsapp">WhatsApp *</label>
                <input
                  id="checkout-whatsapp"
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="input-base"
                  placeholder="Ex: 35 99840-6407"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="label-base" htmlFor="checkout-notes">Observações ou Dúvidas</label>
                <textarea
                  id="checkout-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="input-base min-h-[100px] resize-none py-2.5"
                  placeholder="Alguma instrução especial, horário para contato ou detalhes sobre as opções customizáveis..."
                  disabled={submitting}
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-100 px-6 py-5 space-y-4 bg-stone-50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500 font-sans">
                {step === 'checkout' ? 'Valor dos Itens' : 'Total estimado'}
              </span>
              <span className="font-serif text-xl text-stone-800">{formatCurrency(total)}</span>
            </div>
            
            {step === 'cart' ? (
              <>
                <p className="text-xs text-stone-400 font-sans leading-relaxed">
                  * Os valores são estimados. O valor final será confirmado via WhatsApp após a análise do seu pedido.
                </p>
                <button
                  onClick={() => setStep('checkout')}
                  className="btn-primary w-full justify-center py-3"
                >
                  Finalizar Orçamento
                </button>
              </>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                className="btn-whatsapp w-full justify-center py-3 flex items-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processando Pedido...
                  </>
                ) : (
                  <>
                    <MessageCircle size={18} />
                    Enviar Pedido via WhatsApp
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
