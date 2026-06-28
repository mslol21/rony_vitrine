import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, Menu, X, Search } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { cn } from '../../lib/utils';

const megaMenuData = [
  {
    label: 'MARCAS',
    href: '/catalogo',
    sections: [
      {
        title: 'PRINCIPAIS',
        items: [
          { label: 'Natura', href: '/catalogo' },
          { label: 'O Boticário', href: '/catalogo' },
          { label: 'Eudora', href: '/catalogo' },
          { label: 'Hinode', href: '/catalogo' },
        ]
      },
      {
        title: 'OUTRAS',
        items: [
          { label: 'Mary Kay', href: '/catalogo' },
          { label: 'Jequiti', href: '/catalogo' },
        ]
      }
    ]
  },
  {
    label: 'PERFUMARIA',
    href: '/catalogo',
    sections: [
      {
        title: 'FRAGRÂNCIAS',
        items: [
          { label: 'Perfumaria Feminina', href: '/catalogo' },
          { label: 'Perfumaria Masculina', href: '/catalogo' },
        ]
      }
    ]
  },
  {
    label: 'CUIDADOS',
    href: '/catalogo',
    sections: [
      {
        title: 'BELEZA & HIGIENE',
        items: [
          { label: 'Maquiagem', href: '/catalogo' },
          { label: 'Cuidados Diários', href: '/catalogo' },
          { label: 'Cabelos', href: '/catalogo' },
        ]
      }
    ]
  },
  {
    label: 'INSPIRAÇÕES',
    href: '/inspiracoes',
    sections: [] // No mega menu
  }
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  
  const { getTotalItems, openCart } = useCartStore();
  const { ids: favoriteIds } = useFavoritesStore();
  const totalItems = getTotalItems();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setHoveredMenu(null);
  }, [location]);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 left-0 right-0 z-40 transition-all duration-300 bg-brand-olive',
          isScrolled ? 'shadow-soft' : ''
        )}
        onMouseLeave={() => setHoveredMenu(null)}
      >
        <div className="container-custom relative">
          <div className="flex items-center justify-between h-20 md:h-24">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 md:gap-4 flex-shrink-0 z-50 group">
              <img 
                src="/logo.png" 
                alt="Roony Cosméticos" 
                className="h-12 md:h-16 object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-10 h-full">
              {megaMenuData.map((menu) => (
                <div 
                  key={menu.label} 
                  className="h-full flex items-center"
                  onMouseEnter={() => setHoveredMenu(menu.label)}
                >
                  <Link
                    to={menu.href}
                    className={cn(
                      'text-xs font-sans font-medium tracking-[0.15em] transition-colors relative',
                      hoveredMenu === menu.label ? 'text-brand-cream' : 'text-brand-cream/80 hover:text-brand-cream'
                    )}
                  >
                    {menu.label}
                    <span className={cn(
                      'absolute -bottom-2 left-0 w-full h-px bg-brand-cream transition-all duration-300',
                      hoveredMenu === menu.label ? 'opacity-100' : 'opacity-0'
                    )}/>
                  </Link>
                </div>
              ))}
            </nav>

            {/* Actions (Desktop) */}
            <div className="hidden md:flex flex-col items-end gap-3 z-50">
              {/* Top tiny links */}
              <div className="flex items-center gap-4 text-[9px] font-sans tracking-[0.1em] uppercase text-stone-500">
                <Link to="/favoritos" className="hover:text-brand-olive transition-colors">Lista de Desejos</Link>
                <a href="#" className="hover:text-brand-olive transition-colors">Atendimento</a>
              </div>
              
              {/* Bottom icons */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Pesquisar..." 
                    className="w-40 border-b border-brand-cream/30 bg-transparent py-1 text-xs outline-none focus:border-brand-cream transition-colors text-brand-cream placeholder:text-brand-cream/50"
                  />
                  <Search size={14} className="absolute right-0 top-1.5 text-brand-cream/50 group-focus-within:text-brand-cream" />
                </div>

                <button
                  onClick={openCart}
                  className="relative text-brand-cream/80 hover:text-brand-cream transition-colors"
                  aria-label="Carrinho"
                >
                  <ShoppingBag size={18} strokeWidth={1.5} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-brand-gold text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex md:hidden items-center gap-4 z-50">
              <Link to="/favoritos" className="text-brand-cream relative">
                <Heart size={20} strokeWidth={1.5} />
                {favoriteIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-gold text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {favoriteIds.length > 9 ? '9+' : favoriteIds.length}
                  </span>
                )}
              </Link>
              
              <button onClick={openCart} className="text-brand-cream relative">
                <ShoppingBag size={20} strokeWidth={1.5} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-gold text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="text-brand-cream ml-2"
                aria-label="Menu"
              >
                {isMobileOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <div 
          className={cn(
            'absolute top-full left-0 w-full bg-brand-canvas border-t border-stone-200 shadow-large overflow-hidden transition-all duration-300 origin-top',
            hoveredMenu && megaMenuData.find(m => m.label === hoveredMenu)?.sections.length 
              ? 'opacity-100 max-h-[400px] py-12' 
              : 'opacity-0 max-h-0 py-0 pointer-events-none'
          )}
          onMouseEnter={() => setHoveredMenu(hoveredMenu)}
        >
          <div className="container-custom">
            <div className="flex gap-20">
              {megaMenuData.find(m => m.label === hoveredMenu)?.sections.map((section, idx) => (
                <div key={idx} className="flex flex-col">
                  <h4 className="text-[10px] font-sans font-semibold tracking-[0.2em] text-brand-dark mb-6 uppercase">
                    {section.title}
                  </h4>
                  <ul className="flex flex-col gap-4">
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        <Link 
                          to={item.href} 
                          className="text-sm font-sans text-stone-500 hover:text-brand-olive transition-colors"
                          onClick={() => setHoveredMenu(null)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={cn(
          'fixed inset-0 z-40 md:hidden transition-all duration-300',
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setIsMobileOpen(false)}
        />
        <div
          className={cn(
            'absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-brand-canvas shadow-large transition-transform duration-300 flex flex-col',
            isMobileOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="flex-1 overflow-y-auto py-24 px-8">
            <div className="flex flex-col gap-8">
              {megaMenuData.map((menu) => (
                <div key={menu.label} className="flex flex-col">
                  <Link
                    to={menu.href}
                    className="font-serif text-2xl text-brand-dark mb-4"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {menu.label}
                  </Link>
                  {menu.sections.length > 0 && (
                    <div className="flex flex-col gap-6 pl-4 border-l border-stone-200">
                      {menu.sections.map((sec, i) => (
                        <div key={i}>
                          <h5 className="text-[9px] uppercase tracking-[0.2em] text-stone-400 mb-3">{sec.title}</h5>
                          <ul className="flex flex-col gap-3">
                            {sec.items.map((item, j) => (
                              <li key={j}>
                                <Link 
                                  to={item.href}
                                  className="text-sm font-sans text-stone-600"
                                  onClick={() => setIsMobileOpen(false)}
                                >
                                  {item.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-8 border-t border-stone-200 bg-white">
            <div className="flex flex-col gap-4 text-xs font-sans uppercase tracking-[0.1em] text-stone-500">
              <Link to="/favoritos" onClick={() => setIsMobileOpen(false)}>Lista de Desejos</Link>
              <a href="#">Atendimento</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
