import { Link } from 'react-router-dom';
import { MessageCircle, Mail, Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappUrl = `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '5535998406407'}?text=${encodeURIComponent('Olá! Vim pelo site e gostaria de saber mais sobre os produtos 😊')}`;

  return (
    <footer className="bg-stone-800 text-white">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-6">
              <img 
                src="/logo.png" 
                alt="Roony Cosméticos" 
                className="h-16 object-contain opacity-90 hover:opacity-100 transition-opacity" 
              />
            </Link>
            <p className="text-stone-400 text-sm leading-relaxed max-w-xs font-sans">
              Beleza e Saúde com as melhores marcas: Natura, O Boticário, Eudora, Hinode, Mary Kay e Jequiti. Atacado e varejo com entrega rápida.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a
                href="https://instagram.com/roony_cosmeticos"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-stone-600 flex items-center justify-center text-stone-400 hover:text-white hover:border-white transition-all duration-200"
                aria-label="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-stone-600 flex items-center justify-center text-stone-400 hover:text-[#25D366] hover:border-[#25D366] transition-all duration-200"
                aria-label="WhatsApp"
              >
                <MessageCircle size={16} />
              </a>
              <a
                href="mailto:contato@ronycosmeticos.com.br"
                className="w-10 h-10 rounded-full border border-stone-600 flex items-center justify-center text-stone-400 hover:text-white hover:border-white transition-all duration-200"
                aria-label="Email"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-sans text-xs font-semibold text-white/50 uppercase tracking-widest mb-5">
              Navegação
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/', label: 'Início' },
                { href: '/catalogo', label: 'Catálogo' },
                { href: '/inspiracoes', label: 'Inspirações' },
                { href: '/favoritos', label: 'Favoritos' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-stone-400 text-sm hover:text-white transition-colors duration-200 font-sans"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-sans text-xs font-semibold text-white/50 uppercase tracking-widest mb-5">
              Contato
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-400 text-sm hover:text-[#25D366] transition-colors duration-200 font-sans flex items-center gap-2"
                >
                  <MessageCircle size={14} />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/roony_cosmeticos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-400 text-sm hover:text-white transition-colors duration-200 font-sans flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  @roony_cosmeticos
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@ronycosmeticos.com.br"
                  className="text-stone-400 text-sm hover:text-white transition-colors duration-200 font-sans flex items-center gap-2"
                >
                  <Mail size={14} />
                  E-mail
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-700">
        <div className="container-custom py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-stone-500 text-xs font-sans">
              © {currentYear} Roony Cosméticos. Todos os direitos reservados.
            </p>
            <p className="text-stone-400 text-xs font-sans flex items-center gap-1">
              📍 R. João Teodoro, 973 - Brás, São Paulo - SP
            </p>
          </div>
          <p className="text-stone-500 text-xs font-sans flex items-center gap-1">
            Feito com <Heart size={10} className="text-brand-gold fill-brand-gold" /> com amor
          </p>
        </div>
      </div>
    </footer>
  );
}
