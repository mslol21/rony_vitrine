import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart, Share2, ShoppingBag, MessageCircle,
  Clock, Package, CheckCircle, ChevronLeft, ChevronRight, Minus, Plus, Loader2, Play, Download
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { ProductCard } from '../components/catalog/ProductCard';
import { useCartStore } from '../stores/cartStore';
import { useFavoritesStore } from '../stores/favoritesStore';
import type { CustomizationData, Product, Category, GlobalOption } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { generateSingleProductMessage } from '../lib/whatsapp';
import { dbService } from '../lib/dbService';
import { toast } from 'sonner';
import { downloadFile } from '../lib/download';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [globalOptions, setGlobalOptions] = useState<GlobalOption[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [customizations, setCustomizations] = useState<CustomizationData>({});
  
  const [optionLabels] = useState(() => {
    const saved = localStorage.getItem('roony_option_labels');
    return saved ? JSON.parse(saved) : {
      color: 'Tom/Cor',
      fabric: 'Tipo de Pele / Cabelo',
      finish: 'Volume / Dosagem',
      size: 'Apresentação',
    };
  });

  const { addItem } = useCartStore();
  const { toggle, isFavorite } = useFavoritesStore();

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      try {
        setLoading(true);
        const [prod, cats, opts, prods] = await Promise.all([
          dbService.getProductBySlug(slug),
          dbService.getCategories(),
          dbService.getGlobalOptions(),
          dbService.getProducts(),
        ]);
        setProduct(prod);
        setCategories(cats);
        setGlobalOptions(opts);
        setAllProducts(prods);
      } catch (e) {
        console.error('Error loading product page data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  // Reset state on product change
  useEffect(() => {
    setCurrentImage(0);
    setQuantity(1);
    setCustomizations({});
  }, [product]);

  const favorite = product ? isFavorite(product.id) : false;
  const category = product ? categories.find((c) => c.id === product.category_id) : null;

  // Filter options by type
  const colorOptions = globalOptions.filter((o) => o.type === 'color' && o.active);
  const fabricOptions = globalOptions.filter((o) => o.type === 'fabric' && o.active);
  const finishOptions = globalOptions.filter((o) => o.type === 'finish' && o.active);
  const sizeOptions = globalOptions.filter((o) => o.type === 'size' && o.active);

  // Calculate dynamic price
  const dynamicPrice = useMemo(() => {
    if (!product) return 0;
    let price = Number(product.price) || 0;
    if (customizations.cor && Array.isArray(colorOptions)) {
      const opt = colorOptions.find((o) => o.value === customizations.cor);
      price += Number(opt?.extra?.price_modifier) || 0;
    }
    if (customizations.tecido && Array.isArray(fabricOptions)) {
      const opt = fabricOptions.find((o) => o.value === customizations.tecido);
      price += Number(opt?.extra?.price_modifier) || 0;
    }
    if (customizations.acabamento && Array.isArray(finishOptions)) {
      const opt = finishOptions.find((o) => o.value === customizations.acabamento);
      price += Number(opt?.extra?.price_modifier) || 0;
    }
    if (customizations.tamanho && Array.isArray(sizeOptions)) {
      const opt = sizeOptions.find((o) => o.value === customizations.tamanho);
      price += Number(opt?.extra?.price_modifier) || 0;
    }
    return Math.max(price, 0);
  }, [customizations, product, colorOptions, fabricOptions, finishOptions, sizeOptions]);

  const relatedProducts = useMemo(() => {
    if (!product || !Array.isArray(allProducts)) return [];
    return allProducts
      .filter((p) => p && p.id !== product.id && p.category_id === product.category_id && p.active)
      .slice(0, 4);
  }, [product, allProducts]);

  const slides = useMemo(() => {
    if (!product) return [];
    const imagesArray = Array.isArray(product.images) ? product.images : [];
    const list = imagesArray.map((img: any) => ({
      type: 'image',
      url: img?.url || '/images/almofada.jpg',
      alt: img?.alt || product.name || '',
    }));
    
    if (product.video_url) {
      list.push({
        type: 'video',
        url: product.video_url,
        alt: 'Vídeo do produto',
      });
    }

    if (list.length === 0) {
      list.push({
        type: 'image',
        url: '/images/almofada.jpg',
        alt: product.name || '',
      });
    }
    
    return list;
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity, customizations, dynamicPrice);
    toast.success('Adicionado ao carrinho! 🛍️');
  };

  const handleWhatsApp = () => {
    if (!product) return;
    const { url } = generateSingleProductMessage(
      product.name,
      customizations,
      quantity,
      dynamicPrice
    );
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    if (!product) return;
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-2 bg-brand-cream">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
        <p className="text-stone-500 font-sans text-sm">Carregando produto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-20 min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-cream">
        <p className="font-serif text-2xl text-stone-600">Produto não encontrado</p>
        <Link to="/catalogo" className="btn-primary">Voltar ao catálogo</Link>
      </div>
    );
  }

  const getYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYoutubeEmbedUrl = (url: string): string | null => {
    const id = getYoutubeId(url);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  };

  const handleDownload = async () => {
    const activeSlide = slides[currentImage];
    if (!activeSlide) return;

    const filename = `${product?.slug || 'produto'}_${activeSlide.type === 'video' ? 'video' : `imagem_${currentImage + 1}`}`;

    if (activeSlide.type === 'video') {
      const youtubeId = getYoutubeId(activeSlide.url);
      if (youtubeId) {
        toast.info('Este vídeo está hospedado no YouTube. Redirecionando para visualização.');
        window.open(activeSlide.url, '_blank');
        return;
      }
    }

    try {
      toast.loading('Iniciando download...', { id: 'download-toast' });
      const extension = activeSlide.type === 'video' ? 'mp4' : 'jpg';
      await downloadFile(activeSlide.url, `${filename}.${extension}`);
      toast.success('Download concluído!', { id: 'download-toast' });
    } catch (err) {
      toast.error('Erro ao baixar o arquivo.', { id: 'download-toast' });
    }
  };

  return (
    <>
      <Helmet>
        <title>{product.name || 'Produto'} — Macêdo Home Decor</title>
        <meta name="description" content={(product.description || '').slice(0, 155)} />
        <meta property="og:title" content={product.name || 'Produto'} />
        <meta property="og:description" content={(product.description || '').slice(0, 155)} />
        <meta property="og:image" content={slides[0]?.type === 'image' ? slides[0].url : undefined} />
      </Helmet>

      <div className="pt-16 md:pt-20 min-h-screen">
        {/* Breadcrumb */}
        <div className="container-custom py-4">
          <div className="flex items-center gap-2 text-xs font-sans text-stone-400">
            <Link to="/" className="hover:text-stone-600 transition-colors">Início</Link>
            <span>/</span>
            <Link to="/catalogo" className="hover:text-stone-600 transition-colors">Catálogo</Link>
            {category && (
              <>
                <span>/</span>
                <Link to={`/catalogo?categoria=${category.slug}`} className="hover:text-stone-600 transition-colors">
                  {category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-stone-600 truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>

        <div className="container-custom pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 group">
                {slides[currentImage]?.type === 'video' ? (
                  <div className="absolute inset-0 w-full h-full bg-stone-900 z-0">
                    {getYoutubeEmbedUrl(slides[currentImage].url) ? (
                      <iframe
                        src={getYoutubeEmbedUrl(slides[currentImage].url)!}
                        title="Vídeo do produto"
                        className="w-full h-full border-0 absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={slides[currentImage].url}
                        controls
                        className="w-full h-full object-contain absolute inset-0"
                      />
                    )}
                  </div>
                ) : (
                  <img
                    src={slides[currentImage]?.url}
                    alt={slides[currentImage]?.alt}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {product.is_new && <span className="badge-new">Novidade</span>}
                  {product.is_customizable && <span className="badge-custom">Personalizável</span>}
                </div>

                {/* Navigation arrows */}
                {slides.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImage((i) => (i - 1 + slides.length) % slides.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-soft flex items-center justify-center text-stone-700 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentImage((i) => (i + 1) % slides.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-soft flex items-center justify-center text-stone-700 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                {/* Action buttons */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                  <button
                    onClick={() => { toggle(product.id); toast.success(favorite ? 'Removido' : 'Adicionado aos favoritos ♡'); }}
                    className={cn(
                      'w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center transition-all hover:scale-110',
                      favorite ? 'text-red-400' : 'text-stone-500'
                    )}
                  >
                    <Heart size={16} className={favorite ? 'fill-current' : ''} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center text-stone-500 hover:text-stone-800 transition-all hover:scale-110"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center text-stone-500 hover:text-stone-800 transition-all hover:scale-110"
                    title={slides[currentImage]?.type === 'video' ? 'Baixar Vídeo' : 'Baixar Imagem'}
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>

              {/* Thumbnails */}
              {slides.length > 1 && (
                <div className="flex gap-3 overflow-x-auto scrollbar-none py-1">
                  {slides.map((slide, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={cn(
                        'w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200 relative flex items-center justify-center bg-stone-100',
                        i === currentImage ? 'ring-2 ring-brand-gold ring-offset-2' : 'opacity-60 hover:opacity-100'
                      )}
                    >
                      {slide.type === 'video' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-stone-800 text-white gap-1">
                          <Play size={20} className="fill-current text-brand-gold" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider font-sans">Vídeo</span>
                        </div>
                      ) : (
                        <img src={slide.url} alt={slide.alt} className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {category && (
                <Link
                  to={`/catalogo?categoria=${category.slug}`}
                  className="section-eyebrow hover:text-brand-espresso transition-colors"
                >
                  {category.name}
                </Link>
              )}

              <h1 className="font-serif text-heading-xl md:text-display text-stone-800 leading-tight">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                {product.price_from && (
                  <span className="price-from text-base">{formatCurrency(product.price_from)}</span>
                )}
                <span className="font-serif text-3xl text-stone-800">{formatCurrency(dynamicPrice)}</span>
                {dynamicPrice !== product.price && (
                  <span className="text-xs font-sans text-brand-mocha bg-brand-linen px-2 py-1 rounded-full">
                    Com personalizações
                  </span>
                )}
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-3">
                {product.production_days && (
                  <div className="flex items-center gap-1.5 text-stone-500">
                    <Clock size={14} />
                    <span className="text-sm font-sans">Prazo: {product.production_days} dias úteis</span>
                  </div>
                )}
                {product.is_made_to_order && (
                  <div className="flex items-center gap-1.5 text-stone-500">
                    <Package size={14} />
                    <span className="text-sm font-sans">Sob encomenda</span>
                  </div>
                )}
              </div>

              <div className="w-full h-px bg-stone-100" />

              {/* Description */}
              <div>
                <p className="font-sans text-stone-600 leading-relaxed text-sm">{product.description || ''}</p>
              </div>

              {/* Customization panel */}
              {product.is_customizable && (
                <div className="space-y-5 bg-brand-linen rounded-2xl p-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-brand-mocha" />
                    <h3 className="font-serif text-base text-stone-800">Personalize este produto</h3>
                  </div>

                  {/* Colors */}
                  {colorOptions.length > 0 && (
                    <div>
                      <label className="label-base">
                        Tom/Cor {customizations.cor && <span className="normal-case font-normal text-stone-500">— {customizations.cor}</span>}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setCustomizations((c) => ({
                              ...c,
                              cor: c.cor === opt.value ? undefined : opt.value
                            }))}
                            className={cn(
                              'w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110',
                              customizations.cor === opt.value
                                ? 'border-stone-800 scale-110 shadow-medium'
                                : 'border-transparent hover:border-stone-300'
                            )}
                            style={{ backgroundColor: opt.extra?.hex || '#ccc' }}
                            title={opt.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fabrics */}
                  {fabricOptions.length > 0 && (
                    <div>
                      <label className="label-base">Tipo de Pele / Cabelo</label>
                      <div className="flex flex-wrap gap-2">
                        {fabricOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setCustomizations((c) => ({
                              ...c,
                              tecido: c.tecido === opt.value ? undefined : opt.value
                            }))}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all duration-200',
                              customizations.tecido === opt.value
                                ? 'bg-stone-800 text-white border-stone-800'
                                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'
                            )}
                          >
                            {opt.name}
                            {opt.extra?.price_modifier && opt.extra.price_modifier > 0 && (
                              <span className="ml-1 text-brand-mocha">+{formatCurrency(opt.extra.price_modifier)}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Finishes */}
                  {finishOptions.length > 0 && (
                    <div>
                      <label className="label-base">Volume / Dosagem</label>
                      <div className="flex flex-wrap gap-2">
                        {finishOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setCustomizations((c) => ({
                              ...c,
                              acabamento: c.acabamento === opt.value ? undefined : opt.value
                            }))}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all duration-200',
                              customizations.acabamento === opt.value
                                ? 'bg-stone-800 text-white border-stone-800'
                                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'
                            )}
                          >
                            {opt.name}
                            {opt.extra?.price_modifier && opt.extra.price_modifier > 0 && (
                              <span className="ml-1 text-brand-mocha">+{formatCurrency(opt.extra.price_modifier)}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sizes */}
                  {sizeOptions.length > 0 && (
                    <div>
                      <label className="label-base">Apresentação</label>
                      <div className="flex flex-wrap gap-2">
                        {sizeOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setCustomizations((c) => ({
                              ...c,
                              tamanho: c.tamanho === opt.value ? undefined : opt.value
                            }))}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all duration-200',
                              customizations.tamanho === opt.value
                                ? 'bg-stone-800 text-white border-stone-800'
                                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'
                            )}
                          >
                            {opt.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}


                  {/* Notes */}
                  <div>
                    <label className="label-base" htmlFor="custom-notes">Observações adicionais</label>
                    <textarea
                      id="custom-notes"
                      placeholder="Algum detalhe especial que deseja..."
                      value={customizations.observacoes || ''}
                      onChange={(e) => setCustomizations((c) => ({ ...c, observacoes: e.target.value }))}
                      className="input-base min-h-[80px] resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Customization preview */}
                  {Object.values(customizations).some((v) => v && v.trim()) && (
                    <div className="bg-white rounded-xl p-4 border border-stone-200">
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Suas escolhas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(customizations)
                          .filter(([, v]) => v && v.trim())
                          .map(([key, value]) => (
                            <span key={key} className="badge-custom text-xs">
                              {value}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="label-base">Quantidade</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-serif text-xl w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAddToCart}
                  className="btn-primary w-full justify-center"
                  id="add-to-cart"
                >
                  <ShoppingBag size={18} />
                  Adicionar ao carrinho — {formatCurrency(dynamicPrice * quantity)}
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="btn-whatsapp w-full justify-center"
                  id="whatsapp-order"
                >
                  <MessageCircle size={18} />
                  Solicitar via WhatsApp
                </button>
              </div>

              {/* Tags */}
              {Array.isArray(product.tags) && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {product.tags.map((tag) => (
                    <span key={tag} className="text-[11px] font-sans text-stone-400 bg-stone-100 px-3 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-20 pt-16 border-t border-stone-100">
              <div className="mb-8">
                <p className="section-eyebrow mb-2">Você também pode gostar</p>
                <h2 className="font-serif text-heading-lg text-stone-800">Produtos Relacionados</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
