import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Key, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function AdminSecurity() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Show/hide passwords
  const [showPassword, setShowPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error('Por favor, informe a nova senha.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Senha atualizada com sucesso! 🔒');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="font-serif text-3xl text-stone-800">Segurança da Conta</h1>
        <p className="text-stone-500 font-sans text-sm mt-1">Altere sua senha de acesso ao painel administrativo</p>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-6 md:p-8">
        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-600">
              <Key size={22} />
            </div>
          </div>

          <div>
            <label className="label-base" htmlFor="new-password">Nova Senha</label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="input-base pr-10"
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="label-base" htmlFor="confirm-password">Confirmar Nova Senha</label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input-base"
              placeholder="Digite novamente a nova senha"
              disabled={loading}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5 flex items-center gap-2"
              disabled={loading}
            >
              {loading && <Loader2 className="animate-spin" size={14} />}
              Atualizar Senha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
