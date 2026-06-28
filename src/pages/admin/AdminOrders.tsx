import { useState, useEffect } from 'react';
import { dbService } from '../../lib/dbService';
import type { Order, OrderStatus } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { ShoppingBag, MessageCircle, Clock, Check, X, Truck, Ban, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string; icon: any }> = {
  pending: { label: 'Pendente', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  confirmed: { label: 'Confirmado', bg: 'bg-green-50', text: 'text-green-700', icon: Check },
  in_production: { label: 'Em Produção', bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
  shipped: { label: 'Enviado', bg: 'bg-purple-50', text: 'text-purple-700', icon: Truck },
  delivered: { label: 'Entregue', bg: 'bg-stone-100', text: 'text-stone-700', icon: Check },
  cancelled: { label: 'Cancelado', bg: 'bg-red-50', text: 'text-red-700', icon: X },
};

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await dbService.getOrders();
      setOrders(data);
    } catch (e) {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingId(orderId);
      await dbService.updateOrderStatus(orderId, newStatus);
      toast.success(`Pedido atualizado para: ${statusConfig[newStatus].label}!`);
      await fetchOrders(); // Reload orders
    } catch (e) {
      toast.error('Erro ao atualizar status do pedido');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
        <p className="text-stone-500 font-sans text-sm">Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-stone-800">Pedidos</h1>
        <p className="text-stone-500 font-sans text-sm mt-1">
          {orders.length} pedido{orders.length === 1 ? '' : 's'} recebido{orders.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const config = statusConfig[order.status];
          const OrderIcon = config.icon;
          const formattedDate = new Date(order.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          const cleanPhone = order.customer_whatsapp.replace(/\D/g, '');
          const waUrl = `https://wa.me/${cleanPhone}`;

          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-soft border border-stone-100 overflow-hidden">
              {/* Header Info */}
              <div className="p-6 border-b border-stone-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif text-base font-semibold text-stone-800">
                      Pedido #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className={cn('inline-flex items-center gap-1 text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full', config.bg, config.text)}>
                      <OrderIcon size={10} />
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-sans text-stone-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formattedDate}
                    </span>
                    <span>Total: {formatCurrency(order.total)}</span>
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {updatingId === order.id ? (
                    <div className="flex items-center gap-1.5 text-xs text-stone-400 font-sans px-3 py-1.5">
                      <Loader2 className="animate-spin text-brand-gold" size={14} />
                      Atualizando...
                    </div>
                  ) : (
                    <>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                          className="px-3 py-1.5 rounded-xl text-xs font-sans font-semibold bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 transition-colors"
                        >
                          <Check size={12} />
                          Aceitar Pedido
                        </button>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'in_production')}
                          className="px-3 py-1.5 rounded-xl text-xs font-sans font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 transition-colors"
                        >
                          <Clock size={12} />
                          Iniciar Produção
                        </button>
                      )}

                      {order.status === 'in_production' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'shipped')}
                          className="px-3 py-1.5 rounded-xl text-xs font-sans font-semibold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 transition-colors"
                        >
                          <Truck size={12} />
                          Enviar Pedido
                        </button>
                      )}

                      {order.status === 'shipped' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          className="px-3 py-1.5 rounded-xl text-xs font-sans font-semibold bg-stone-700 hover:bg-stone-850 text-white flex items-center gap-1 transition-colors"
                        >
                          <Check size={12} />
                          Marcar como Entregue
                        </button>
                      )}

                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          className="p-1.5 rounded-xl hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
                          title="Cancelar Pedido"
                        >
                          <Ban size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Customer and Items list */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Customer Details */}
                <div className="space-y-4 lg:border-r lg:border-stone-100 lg:pr-8">
                  <div>
                    <h3 className="text-xs font-semibold text-stone-400 font-sans uppercase tracking-wider mb-2">Cliente</h3>
                    <p className="font-sans text-sm font-semibold text-stone-800">{order.customer_name}</p>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-sans font-medium mt-1 transition-colors"
                    >
                      <MessageCircle size={14} />
                      {order.customer_whatsapp}
                    </a>
                  </div>

                  {order.notes && (
                    <div>
                      <h3 className="text-xs font-semibold text-stone-400 font-sans uppercase tracking-wider mb-1">Observações</h3>
                      <p className="font-sans text-xs text-stone-600 leading-relaxed bg-stone-50 rounded-xl p-3 border border-stone-100">
                        {order.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Items details */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xs font-semibold text-stone-400 font-sans uppercase tracking-wider">Itens do Pedido</h3>
                  <div className="divide-y divide-stone-100">
                    {order.items?.map((item) => (
                      <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-4">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0 bg-stone-50"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-sm font-medium text-stone-800 truncate">{item.product_name}</p>
                          
                          {/* Render customizations */}
                          {item.customizations && Object.entries(item.customizations).filter(([, v]) => v && String(v).trim()).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(item.customizations)
                                .filter(([, v]) => v && String(v).trim())
                                .map(([key, value]) => (
                                  <span key={key} className="text-[10px] font-sans bg-brand-linen text-brand-espresso px-2 py-0.5 rounded-full">
                                    {String(value)}
                                  </span>
                                ))}
                            </div>
                          )}
                          
                          <p className="text-xs text-stone-400 font-sans mt-1">
                            Qtd: {item.quantity} · Preço un: {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-serif text-sm text-stone-800">
                            {formatCurrency(item.unit_price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-soft border border-stone-100">
            <ShoppingBag size={36} className="text-stone-200 mx-auto mb-3" />
            <p className="font-serif text-stone-500 text-lg">Nenhum pedido recebido ainda</p>
            <p className="text-stone-400 font-sans text-xs mt-1">Os pedidos aparecerão aqui assim que os clientes solicitarem orçamentos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
