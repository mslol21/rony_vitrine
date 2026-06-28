import { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Palette, LogOut,
  Menu, X, ChevronRight, Home, Loader2, Shield, ShoppingBag
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { AdminLogin } from './AdminLogin';
import { toast } from 'sonner';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag, exact: false },
  { href: '/admin/produtos', label: 'Produtos', icon: Package, exact: false },
  { href: '/admin/categorias', label: 'Categorias', icon: Tag, exact: false },
  { href: '/admin/opcoes', label: 'Opções Globais', icon: Palette, exact: false },
  { href: '/admin/seguranca', label: 'Segurança', icon: Shield, exact: false },
];

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Sessão encerrada com sucesso! 🔒');
      navigate('/');
    } catch (e) {
      toast.error('Erro ao fazer logout');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-2 bg-stone-50">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
        <p className="text-stone-500 font-sans text-sm">Verificando credenciais...</p>
      </div>
    );
  }

  // If no session exists, display the login component
  if (!session) {
    return <AdminLogin onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-40 w-64 bg-stone-800 flex flex-col transition-transform duration-300',
          'lg:translate-x-0 lg:relative',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-stone-700">
          <Link to="/" className="flex flex-col">
            <span className="font-serif text-xl text-white">Roony</span>
            <span className="text-[10px] font-sans font-medium tracking-[0.2em] uppercase text-stone-400">
              Cosméticos · Admin
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              end={link.exact}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-sans font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-stone-400 hover:bg-white/5 hover:text-white'
                )
              }
            >
              <link.icon size={18} />
              {link.label}
              <ChevronRight size={14} className="ml-auto opacity-50" />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-sans text-stone-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Home size={16} />
            Ver loja
          </Link>
          <button
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-sans text-stone-400 hover:text-white hover:bg-white/5 transition-all text-left"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden bg-white border-b border-stone-100 px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-stone-600 hover:bg-stone-100"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-serif text-lg text-stone-800">Admin</span>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
