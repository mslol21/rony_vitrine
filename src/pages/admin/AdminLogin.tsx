import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success('Login realizado com sucesso! 🛡️');
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      {/* Background decoration elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-brand-olive/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white/80 backdrop-blur-md border border-stone-200 w-full max-w-md rounded-3xl p-8 shadow-large relative z-10 animate-scale-in">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <span className="font-serif text-3xl font-medium text-stone-800 tracking-wide block">Roony</span>
          <span className="text-xs font-sans font-medium tracking-[0.25em] uppercase text-brand-olive block mt-1">
            Cosméticos
          </span>
          <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-4 mb-6" />
          <h2 className="font-serif text-xl text-stone-800 font-medium">Acesso Restrito</h2>
          <p className="text-stone-500 font-sans text-xs mt-1">Faça login para gerenciar a loja</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="label-base flex items-center gap-1.5" htmlFor="login-email">
              <Mail size={13} className="text-stone-400" />
              E-mail Administrativo
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
              placeholder="exemplo@ronycosmeticos.com.br"
              disabled={loading}
            />
          </div>

          <div>
            <label className="label-base flex items-center gap-1.5" htmlFor="login-password">
              <Lock size={13} className="text-stone-400" />
              Senha
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full justify-center py-3 mt-2 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Verificando...
              </>
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="text-center mt-8 text-[11px] text-stone-400 font-sans">
          Painel protegido por criptografia de ponta a ponta e controle de acesso via Supabase Auth.
        </div>
      </div>
    </div>
  );
}
