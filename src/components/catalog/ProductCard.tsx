import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Share2, Clock, Package } from 'lucide-react';
import type { Product } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { useCartStore } from '../../stores/cartStore';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { toggle, isFavorite } = useFavoritesStore();
  const favorite = isFavorite(product.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
    toast.success(favorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos \u2661');
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/produto/${product.slug}`;
    if (navigator.share) {
      await navigator.share({ title: product.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.is_customizable) {
      toast.info('Este produto e personalizavel. Acesse a pagina para configurar.');
      return;
    }
    addItem(product, 1, {}, product.price);
    toast.success('Adicionado ao carrinho!');
  };

  const image = product.images?.[0]?.url || '/images/almofada.jpg';

  return (
    <Link
      to={`/produto/${product.slug}`}
      className={cn('product-card group block', className)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        <img
          src={image}
          alt={product.images?.[0]?.alt || product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new && (
            <span className="badge-new">Novidade</span>
          )}
          {product.is_featured && !product.is_new && (
            <span className="badge-featured">Destaque</span>
          )}
          {product.is_customizable && (
            <span className="badge-custom">Personalizavel</span>
          )}
          {product.is_made_to_order && (
            <span className="badge-order">Sob Encomenda</span>
          )}
          {product.price_from && (
            <span className="badge bg-red-50 text-red-600">Oferta</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleFavorite}
            className={cn(
              'w-8 h-8 rounded-full bg-white shadow-soft flex items-center justify-center transition-all duration-200 hover:scale-110',
              favorite ? 'text-red-400' : 'text-stone-500 hover:text-red-400'
            )}
            aria-label="Favoritar"
          >
            <Heart size={14} className={favorite ? 'fill-current' : ''} />
          </button>
          <button
            onClick={handleShare}
            className="w-8 h-8 rounded-full bg-white shadow-soft flex items-center justify-center text-stone-500 hover:text-stone-800 transition-all duration-200 hover:scale-110"
            aria-label="Compartilhar"
          >
            <Share2 size={14} />
          </button>
        </div>

        {/* Quick Add */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleQuickAdd}
            className="w-full py-3 bg-stone-800 text-white text-xs font-semibold tracking-wide uppercase hover:bg-stone-700 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <ShoppingBag size={14} />
            {product.is_customizable ? 'Personalizar' : 'Adicionar'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-serif text-base text-stone-800 leading-snug mb-1 group-hover:text-brand-mocha transition-colors duration-200">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-1.5">
            {product.price_from && (
              <span className="price-from">{formatCurrency(product.price_from)}</span>
            )}
            <span className="price-tag">{formatCurrency(product.price)}</span>
          </div>

          {product.production_days && (
            <div className="flex items-center gap-1 text-stone-400">
              <Clock size={11} />
              <span className="text-[11px] font-sans">{product.production_days}d</span>
            </div>
          )}
        </div>

        {product.is_made_to_order && (
          <div className="flex items-center gap-1 mt-2 text-stone-400">
            <Package size={11} />
            <span className="text-[11px] font-sans">Sob encomenda</span>
          </div>
        )}
      </div>
    </Link>
  );
}
