import { useState, useEffect } from 'react';
import { X, ShoppingBag, ArrowRight, MessageCircle, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import type { Inspiration, Product } from '../types';
import { cn } from '../lib/utils';
import { dbService } from '../lib/dbService';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5535998406407';

function InspirationModal({
  inspiration,
  allProducts,
  onClose,
}: {
  inspiration: Inspiration;
  allProducts: Product[];
  onClose: () => void;
}) {
  const products = allProducts.filter((p) =>
    inspiration.product_ids.includes(p.id)
  );

  const whatsappMsg = encodeURIComponent(
    `Olá! Vi a inspiração "${inspiration.title}" no site e gostaria de solicitar um orçamento 😊`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl overflow-hidden shadow-large max-w-3xl w-full max-h-[90vh] flex flex-col md:flex-row animate-scale-in">
        {/* Image */}
        <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto flex-shrink-0">
          <img
            src={inspiration.image_url}
            alt={inspiration.title}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-stone-600 hover:bg-white transition-all md:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <button
            onClick={onClose}
            className="hidden md:flex absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 items-center justify-center text-stone-600 hover:bg-stone-200 transition-all"
          >
            <X size={16} />
          </button>

          <p className="section-eyebrow mb-2">Ambiente Inspirador</p>
          <h2 className="font-serif text-heading-lg text-stone-800 mb-3">{inspiration.title}</h2>
          {inspiration.description && (
            <p className="text-stone-500 font-sans text-sm leading-relaxed mb-6">
              {inspiration.description}
            </p>
          )}

          {products.length > 0 && (
            <div className="mb-6">
              <p className="label-base mb-3">Produtos neste ambiente</p>
              <div className="space-y-3">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/produto/${product.slug}`}
                    className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl hover:bg-brand-linen transition-colors group"
                  >
                    <img
                      src={product.images?.[0]?.url || '/images/almofada.jpg'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm text-stone-800 truncate group-hover:text-brand-mocha transition-colors">
                        {product.name}
                      </p>
                      <p className="text-xs text-stone-400 font-sans mt-0.5">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-stone-300 group-hover:text-brand-mocha transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp w-full justify-center"
          >
            <MessageCircle size={16} />
            Solicitar orçamento deste ambiente
          </a>
        </div>
      </div>
    </div>
  );
}

export function InspirationsPage() {
  const [selectedInspiration, setSelectedInspiration] = useState<Inspiration | null>(null);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [iData, pData] = await Promise.all([
          dbService.getInspirations(),
          dbService.getProducts()
        ]);
        setInspirations(iData);
        setProducts(pData);
      } catch (err) {
        console.error('Error fetching inspirations page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeInspirations = inspirations.filter((i) => i.active);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-2 bg-brand-cream">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
        <p className="text-stone-500 font-sans text-sm">Carregando inspirações...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Inspirações — Macêdo Home Decor</title>
        <meta
          name="description"
          content="Descubra ambientes decorados com nossas peças exclusivas. Inspire-se e solicite orçamento para transformar sua casa."
        />
      </Helmet>

      <div className="pt-20 min-h-screen">
        {/* Header */}
        <div className="bg-brand-linen border-b border-stone-200 py-14 md:py-20">
          <div className="container-custom text-center">
            <p className="section-eyebrow mb-3">Inspire-se</p>
            <h1 className="font-serif text-heading-xl md:text-display text-stone-800">
              Ambientes que Encantam
            </h1>
            <p className="section-subtitle mx-auto mt-4">
              Veja como nossas peças transformam espaços comuns em ambientes cheios de personalidade e aconchego.
            </p>
            <div className="divider mx-auto mt-6" />
          </div>
        </div>

        {/* Masonry Grid */}
        <div className="container-custom py-12 md:py-16">
          {activeInspirations.length > 0 ? (
            <div className="masonry-grid">
              {activeInspirations.map((inspiration, index) => (
                <div
                  key={inspiration.id}
                  className="masonry-item cursor-pointer group"
                  onClick={() => setSelectedInspiration(inspiration)}
                >
                  <div className="relative rounded-2xl overflow-hidden bg-stone-100">
                    <img
                      src={inspiration.image_url}
                      alt={inspiration.title}
                      className={cn(
                        'w-full object-cover transition-transform duration-500 group-hover:scale-105',
                        index % 3 === 0 ? 'aspect-[3/4]' : index % 3 === 1 ? 'aspect-square' : 'aspect-[4/5]'
                      )}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <h3 className="font-serif text-base text-white font-medium">{inspiration.title}</h3>
                      <p className="text-white/70 text-xs font-sans mt-1">
                        {inspiration.product_ids.length} produto{inspiration.product_ids.length !== 1 ? 's' : ''}
                      </p>
                      <span className="inline-flex items-center gap-1 mt-2 text-xs font-sans text-white/80 border border-white/30 rounded-full px-3 py-1">
                        <ShoppingBag size={10} />
                        Ver produtos
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="font-serif text-lg text-stone-500">Nenhum ambiente inspirador cadastrado</p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 text-center bg-brand-linen rounded-3xl p-12">
            <h2 className="font-serif text-heading-lg text-stone-800 mb-3">
              Tem um ambiente em mente?
            </h2>
            <p className="text-stone-500 font-sans text-sm mb-6 max-w-md mx-auto">
              Nossa consultora pode te ajudar a criar a composição perfeita para o seu espaço.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de ajuda para decorar meu ambiente 😊')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              <MessageCircle size={18} />
              Falar com consultora
            </a>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedInspiration && (
        <InspirationModal
          inspiration={selectedInspiration}
          allProducts={products}
          onClose={() => setSelectedInspiration(null)}
        />
      )}
    </>
  );
}
