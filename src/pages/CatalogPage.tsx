import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Grid3X3, LayoutGrid, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { ProductCard } from '../components/catalog/ProductCard';
import type { CatalogFilters, Product, Category } from '../types';
import { cn } from '../lib/utils';
import { dbService } from '../lib/dbService';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<CatalogFilters>({
    category: searchParams.get('categoria') || undefined,
    search: '',
    is_new: searchParams.get('novidades') === 'true',
    is_customizable: searchParams.get('personalizavel') === 'true',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [pData, cData] = await Promise.all([
          dbService.getProducts(),
          dbService.getCategories(),
        ]);
        setProducts(pData);
        setCategories(cData);
      } catch (e) {
        console.error('Error fetching catalog data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update filter when query param changes (e.g. from homepage navigation)
  useEffect(() => {
    const catSlug = searchParams.get('categoria');
    if (catSlug) {
      setFilters(prev => ({ ...prev, category: catSlug }));
    }
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;
      if (filters.category && filters.category !== 'todos') {
        const cat = categories.find((c) => c.slug === filters.category);
        if (cat && p.category_id !== cat.id) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.description.toLowerCase().includes(q) &&
          !p.tags.some((t) => t.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      if (filters.is_new && !p.is_new) return false;
      if (filters.is_customizable && !p.is_customizable) return false;
      if (filters.is_featured && !p.is_featured) return false;
      if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
      return true;
    });
  }, [filters, products, categories]);

  const updateFilter = (key: keyof CatalogFilters, value: CatalogFilters[keyof CatalogFilters]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '' });
    setSearchParams({});
  };

  const activeFilterCount = [
    filters.category && filters.category !== 'todos',
    filters.is_new,
    filters.is_customizable,
    filters.is_featured,
    filters.minPrice !== undefined,
    filters.maxPrice !== undefined,
  ].filter(Boolean).length;

  const activeCategories = categories.filter(c => c.active);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-2 bg-brand-cream">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
        <p className="text-stone-500 font-sans text-sm">Carregando catálogo...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Catálogo — Macêdo Home Decor</title>
        <meta name="description" content="Explore nossa coleção completa de peças artesanais, almofadas, vasos, mantas e muito mais. Filtre por categoria e encontre o produto ideal." />
      </Helmet>

      <div className="pt-20 min-h-screen">
        {/* Header */}
        <div className="bg-brand-linen border-b border-stone-200 py-10 md:py-14">
          <div className="container-custom">
            <p className="section-eyebrow mb-2">Explorar</p>
            <h1 className="font-serif text-heading-xl md:text-display text-stone-800">Catálogo</h1>
            <p className="text-stone-500 font-sans text-sm mt-2">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
            </p>
          </div>
        </div>

        <div className="container-custom py-8">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="input-base pl-10"
                id="catalog-search"
              />
              {filters.search && (
                <button
                  onClick={() => updateFilter('search', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'btn-secondary flex items-center gap-2 relative',
                showFilters && '!bg-stone-800 !text-white !border-stone-800'
              )}
              id="toggle-filters"
            >
              <SlidersHorizontal size={16} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-brand-gold text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* View toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-stone-100 rounded-xl p-1">
              <button
                onClick={() => setIsCompact(false)}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  !isCompact ? 'bg-white shadow-soft text-stone-800' : 'text-stone-500'
                )}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setIsCompact(true)}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  isCompact ? 'bg-white shadow-soft text-stone-800' : 'text-stone-500'
                )}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8 animate-fade-in">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-lg text-stone-800">Filtros</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-brand-mocha hover:text-brand-espresso font-sans font-medium flex items-center gap-1"
                  >
                    <X size={12} /> Limpar filtros
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category */}
                <div>
                  <label className="label-base">Categoria</label>
                  <select
                    value={filters.category || 'todos'}
                    onChange={(e) => updateFilter('category', e.target.value === 'todos' ? undefined : e.target.value)}
                    className="input-base"
                    id="filter-category"
                  >
                    <option value="todos">Todas as categorias</option>
                    {activeCategories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Price range */}
                <div>
                  <label className="label-base">Preço mínimo</label>
                  <input
                    type="number"
                    placeholder="R$ 0"
                    value={filters.minPrice || ''}
                    onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                    className="input-base"
                    id="filter-min-price"
                  />
                </div>
                <div>
                  <label className="label-base">Preço máximo</label>
                  <input
                    type="number"
                    placeholder="R$ 999"
                    value={filters.maxPrice || ''}
                    onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                    className="input-base"
                    id="filter-max-price"
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="label-base">Tipo</label>
                  {[
                    { key: 'is_new', label: 'Novidades' },
                    { key: 'is_featured', label: 'Destaques' },
                    { key: 'is_customizable', label: 'Personalizáveis' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={!!filters[key as keyof CatalogFilters]}
                        onChange={(e) => updateFilter(key as keyof CatalogFilters, e.target.checked)}
                        className="w-4 h-4 rounded border-stone-300 text-brand-gold accent-brand-mocha"
                        id={`filter-${key}`}
                      />
                      <span className="text-sm font-sans text-stone-600 group-hover:text-stone-800 transition-colors">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category pills */}
          {activeCategories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none mb-8 pb-2">
              <button
                onClick={() => updateFilter('category', undefined)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-sans font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0',
                  !filters.category || filters.category === 'todos'
                    ? 'bg-stone-800 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
                )}
              >
                Todos
              </button>
              {activeCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateFilter('category', cat.slug)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-sans font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0',
                    filters.category === cat.slug
                      ? 'bg-stone-800 text-white'
                      : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Products grid */}
          {filteredProducts.length > 0 ? (
            <div
              className={cn(
                'grid gap-4 md:gap-6',
                isCompact
                  ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              )}
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                <Search size={28} className="text-stone-300" />
              </div>
              <p className="font-serif text-xl text-stone-600">Nenhum produto encontrado</p>
              <p className="text-sm text-stone-400 font-sans">Tente ajustar os filtros ou termos de busca</p>
              <button onClick={clearFilters} className="btn-secondary mt-2">
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
