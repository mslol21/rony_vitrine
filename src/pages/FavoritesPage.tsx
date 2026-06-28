import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { mockProducts } from '../lib/mockData';
import { ProductCard } from '../components/catalog/ProductCard';
import { useFavoritesStore } from '../stores/favoritesStore';

export function FavoritesPage() {
  const { ids, clear } = useFavoritesStore();
  const favoriteProducts = mockProducts.filter((p) => ids.includes(p.id));

  return (
    <>
      <Helmet>
        <title>Favoritos — Macêdo Home Decor</title>
        <meta name="description" content="Seus produtos favoritos da Macêdo Home Decor." />
      </Helmet>

      <div className="pt-20 min-h-screen">
        <div className="bg-brand-linen border-b border-stone-200 py-10 md:py-14">
          <div className="container-custom flex items-end justify-between">
            <div>
              <p className="section-eyebrow mb-2">Sua lista</p>
              <h1 className="font-serif text-heading-xl text-stone-800 flex items-center gap-3">
                <Heart size={28} className="text-red-400 fill-red-400" />
                Favoritos
              </h1>
              <p className="text-stone-500 font-sans text-sm mt-2">
                {favoriteProducts.length} {favoriteProducts.length === 1 ? 'produto salvo' : 'produtos salvos'}
              </p>
            </div>
            {favoriteProducts.length > 0 && (
              <button
                onClick={clear}
                className="text-xs text-stone-400 hover:text-stone-600 font-sans transition-colors"
              >
                Limpar lista
              </button>
            )}
          </div>
        </div>

        <div className="container-custom py-12">
          {favoriteProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
              <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center">
                <Heart size={36} className="text-stone-300" />
              </div>
              <div>
                <p className="font-serif text-2xl text-stone-600">Nenhum favorito ainda</p>
                <p className="text-stone-400 font-sans text-sm mt-2">
                  Clique no coração nos produtos para salvá-los aqui
                </p>
              </div>
              <Link to="/catalogo" className="btn-primary mt-2">
                <ShoppingBag size={16} />
                Explorar catálogo
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {favoriteProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
