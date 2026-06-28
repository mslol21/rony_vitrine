import { useState, useEffect } from 'react';
import { Package, Tag, ShoppingBag, TrendingUp, ArrowRight, Clock, Database, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dbService } from '../../lib/dbService';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import type { Product, Category } from '../../types';

export function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pData, cData] = await Promise.all([
        dbService.getProducts(),
        dbService.getCategories()
      ]);
      setProducts(pData);
      setCategories(cData);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao buscar dados do Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await dbService.seedDatabase();
      if (res.success) {
        toast.success(res.message);
        await fetchData(); // Refresh
      } else {
        toast.error(res.message);
      }
    } catch (e) {
      toast.error('Erro durante o processo de semeadura');
    } finally {
      setSeeding(false);
    }
  };

  const totalProducts = products.length;
  const totalCategories = categories.length;
  const featured = products.filter(p => p.is_featured).length;
  const newProducts = products.filter(p => p.is_new).length;

  const stats = [
    { label: 'Produtos', value: totalProducts, icon: Package, color: 'bg-blue-50 text-blue-600', link: '/admin/produtos' },
    { label: 'Categorias', value: totalCategories, icon: Tag, color: 'bg-amber-50 text-amber-600', link: '/admin/categorias' },
    { label: 'Destaques', value: featured, icon: TrendingUp, color: 'bg-green-50 text-green-600', link: '/admin/produtos' },
    { label: 'Lançamentos', value: newProducts, icon: ShoppingBag, color: 'bg-purple-50 text-purple-600', link: '/admin/produtos' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
        <p className="text-stone-500 font-sans text-sm">Carregando painel...</p>
      </div>
    );
  }

  // Show seed button if database tables are empty
  const isDatabaseEmpty = products.length === 0 && categories.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-stone-800">Dashboard</h1>
          <p className="text-stone-500 font-sans text-sm mt-1">Visão geral da sua loja</p>
        </div>
        
        {isDatabaseEmpty && (
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="btn-primary !bg-stone-800 !text-white hover:!bg-stone-900 flex items-center gap-2"
          >
            {seeding ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Semeando Banco...
              </>
            ) : (
              <>
                <Database size={16} />
                Semear Banco de Dados
              </>
            )}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="bg-white rounded-2xl p-5 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-stone-400 font-sans text-xs uppercase tracking-widest">{stat.label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon size={18} />
              </div>
            </div>
            <p className="font-serif text-3xl text-stone-800">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <h2 className="font-serif text-lg text-stone-800">Produtos Recentes</h2>
          <Link to="/admin/produtos" className="text-xs text-brand-mocha hover:text-brand-espresso font-sans flex items-center gap-1">
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-stone-50">
          {products.slice(0, 6).map((product) => (
            <div key={product.id} className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors">
              <img
                src={product.images?.[0]?.url || '/images/almofada.jpg'}
                alt={product.name}
                className="w-12 h-12 object-cover rounded-xl flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm font-medium text-stone-800 truncate">{product.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {product.is_featured && <span className="text-[10px] font-sans bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">Destaque</span>}
                  {product.is_new && <span className="text-[10px] font-sans bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Novo</span>}
                  {product.is_customizable && <span className="text-[10px] font-sans bg-brand-linen text-brand-espresso px-2 py-0.5 rounded-full">Personalizável</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-serif text-sm text-stone-800">{formatCurrency(product.price)}</p>
                {product.production_days && (
                  <p className="text-[10px] text-stone-400 font-sans flex items-center gap-1 justify-end mt-0.5">
                    <Clock size={10} /> {product.production_days}d
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
