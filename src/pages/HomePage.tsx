import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, MessageCircle, Sparkles, Package, Paintbrush, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { mockTestimonials } from '../lib/mockData';
import { ProductCard } from '../components/catalog/ProductCard';
import { getInitials } from '../lib/utils';
import { dbService } from '../lib/dbService';
import type { Product, Category, Inspiration } from '../types';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5511975915227';

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [p, c, i] = await Promise.all([
          dbService.getProducts(),
          dbService.getCategories(),
          dbService.getInspirations()
        ]);
        setProducts(p);
        setCategories(c);
        setInspirations(i);
      } catch (err) {
        console.error('Error loading data for homepage:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-2 bg-brand-cream">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
        <p className="text-stone-500 font-sans text-sm">Carregando Roony Cosméticos...</p>
      </div>
    );
  }

  const featuredProducts = products.filter((p) => p.is_featured && p.active);
  const newProducts = products.filter((p) => p.is_new && p.active);
  const activeCategories = categories.filter((c) => c.active);
  const activeInspirations = inspirations.filter((i) => i.active);

  return (
    <>
      <Helmet>
        <title>Roony Cosméticos | Natura, O Boticário, Eudora, Hinode e mais</title>
        <meta name="description" content="Revendedor autorizado das melhores marcas de cosméticos e perfumaria: Natura, O Boticário, Eudora, Hinode, Mary Kay e Jequiti." />
        <meta property="og:title" content="Roony Cosméticos" />
        <meta property="og:description" content="Natura, O Boticário, Eudora, Hinode, Mary Kay e Jequiti. Atacado e varejo com entrega rápida." />
        <meta property="og:image" content="/images/hero-banner.jpg" />
      </Helmet>

      {/* HERO SECTION */}
      <section className="flex flex-col bg-brand-olive">
        {/* Banner Image Container */}
        <div className="relative w-full h-[50vh] md:h-[65vh] lg:h-[75vh] max-h-[600px] overflow-hidden">
          <img
            src="/images/hero-banner.jpg"
            alt="Roony Cosméticos - Beleza e Saúde"
            className="w-full h-full object-cover object-[center_55%]"
          />
        </div>

        {/* Text Section (below the image) */}
        <div className="bg-brand-olive text-brand-cream py-10 md:py-16 text-center">
          <div className="container-custom max-w-3xl mx-auto flex flex-col items-center">
            <h1 className="font-serif text-3xl md:text-5xl font-normal leading-tight mb-4 text-brand-cream">
              Beleza e Saúde com <br className="hidden md:block" />
              <span className="italic font-light">as melhores</span> marcas
            </h1>
            <p className="text-brand-cream/80 font-sans text-xs md:text-sm font-light tracking-wider mb-6 uppercase">
              Natura • O Boticário • Eudora • Hinode • Mary Kay • Jequiti
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full sm:w-auto">
              <Link 
                to="/catalogo" 
                className="group flex flex-col items-center text-brand-cream font-sans text-xs font-medium uppercase tracking-[0.2em] transition-colors hover:text-white"
              >
                <span>Explorar Coleção</span>
                <span className="w-full h-[1px] bg-brand-cream/50 mt-1 transition-all duration-300 group-hover:bg-white" />
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de solicitar um orçamento 😊')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center text-brand-cream font-sans text-xs font-medium uppercase tracking-[0.2em] transition-colors hover:text-white"
              >
                <span>Atendimento Especializado</span>
                <span className="w-full h-[1px] bg-brand-cream/50 mt-1 transition-all duration-300 group-hover:bg-white" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <p className="section-eyebrow mb-3">Curadoria Especial</p>
                <h2 className="section-title">Destaques da Coleção</h2>
                <div className="divider mt-4" />
              </div>
              <Link to="/catalogo" className="btn-ghost self-start md:self-auto">
                Ver todos <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CATEGORIES GRID */}
      {activeCategories.length > 0 && (
        <section className="py-16 bg-stone-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <p className="section-eyebrow mb-3">Explore</p>
              <h2 className="section-title">Nossas Categorias</h2>
              <div className="divider mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {activeCategories.slice(0, 10).map((category) => (
                <Link
                  key={category.id}
                  to={`/catalogo?categoria=${category.slug}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
                >
                  <img
                    src={category.image_url || '/images/almofada.jpg'}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="font-serif text-sm md:text-base text-white font-medium leading-tight">
                      {category.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* NEW ARRIVALS */}
      {newProducts.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <p className="section-eyebrow mb-3">Recém Chegados</p>
                <h2 className="section-title">Lançamentos</h2>
                <div className="divider mt-4" />
              </div>
              <Link to="/catalogo?novidades=true" className="btn-ghost self-start md:self-auto">
                Ver lançamentos <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* INSPIRATIONS PREVIEW */}
      {activeInspirations.length > 0 && (
        <section className="py-16 bg-brand-linen">
          <div className="container-custom">
            <div className="text-center mb-12">
              <p className="section-eyebrow mb-3">Inspire-se</p>
              <h2 className="section-title">Ambientes que Encantam</h2>
              <p className="section-subtitle mx-auto mt-4">
                Veja como nossas peças transformam ambientes reais em espaços cheios de personalidade.
              </p>
              <div className="divider mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeInspirations.slice(0, 3).map((insp) => (
                <Link
                  key={insp.id}
                  to="/inspiracoes"
                  className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[3/4] block"
                >
                  <img
                    src={insp.image_url}
                    alt={insp.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-serif text-lg text-white font-medium">{insp.title}</h3>
                    {insp.description && (
                      <p className="text-white/75 text-xs font-sans mt-1 leading-relaxed">{insp.description}</p>
                    )}
                    <span className="inline-flex items-center gap-1 mt-3 text-xs font-sans font-medium text-white/80 group-hover:text-white transition-colors">
                      Ver produtos <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/inspiracoes" className="btn-secondary">
                Ver todas as inspirações <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CUSTOMIZATION SECTION */}
      <section className="py-20 md:py-28">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-eyebrow mb-3">Exclusivo para você</p>
              <h2 className="section-title mb-6">Atendimento Personalizado</h2>
              <p className="section-subtitle mb-8">
                Oferecemos assessoria completa para te ajudar a escolher a fragrância ideal, montar kits especiais para presente ou encontrar os produtos perfeitos para sua rotina de cuidados.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Sparkles, label: 'Fragrâncias Exclusivas', desc: 'Encontre o perfume que mais combina com seu estilo' },
                  { icon: Package, label: 'Kits para Presente', desc: 'Criação de kits personalizados e embalagens especiais' },
                  { icon: Paintbrush, label: 'Atendimento Rápido', desc: 'Dúvidas e pedidos diretamente pelo WhatsApp' },
                  { icon: Star, label: 'Melhores Marcas', desc: 'Natura, O Boticário, Eudora, Hinode, Mary Kay e Jequiti' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex gap-3 p-4 bg-stone-50 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-brand-sand flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-brand-olive" />
                    </div>
                    <div>
                      <p className="font-sans text-sm font-semibold text-stone-800">{label}</p>
                      <p className="font-sans text-xs text-stone-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/catalogo" className="btn-primary">
                Ver todos os produtos <ArrowRight size={16} />
              </Link>
            </div>
            <div className="relative">
              <img
                src="/images/almofada.jpg"
                alt="Produtos personalizáveis"
                className="w-full rounded-3xl object-cover aspect-square shadow-large"
              />
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-large max-w-[180px]">
                <p className="font-serif text-sm text-stone-800 font-medium">Kit Presente</p>
                <p className="text-xs text-brand-olive font-sans mt-1">Natura & Boticário</p>
                <p className="text-xs text-stone-500 font-sans">Beleza e Saúde</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 bg-stone-800 text-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-[0.2em] mb-3">Depoimentos</p>
            <h2 className="font-serif text-heading-xl text-white">O que nossas clientes dizem</h2>
            <div className="w-12 h-0.5 bg-amber-400 mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-stone-700 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-stone-300 text-sm font-sans leading-relaxed flex-1">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(testimonial.name)}
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold font-sans">{testimonial.name}</p>
                    <p className="text-stone-400 text-[10px] font-sans">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHATSAPP CTA */}
      <section className="py-20 bg-brand-linen">
        <div className="container-custom text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto mb-6">
              <MessageCircle size={30} className="text-[#25D366]" />
            </div>
            <h2 className="font-serif text-heading-xl text-stone-800 mb-4">
              Fale com a nossa consultora
            </h2>
            <p className="text-stone-500 font-sans text-base leading-relaxed mb-8">
              Tire suas dúvidas, solicite orçamentos personalizados e receba atendimento exclusivo via WhatsApp. Respondemos em até 2 horas!
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Vim pelo site e gostaria de um atendimento personalizado 😊')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp text-base px-10 py-4"
            >
              <MessageCircle size={20} />
              Iniciar Conversa no WhatsApp
            </a>
            <p className="text-stone-400 text-xs font-sans mt-4">
              Atendimento de seg. a sáb., das 9h às 20h
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
