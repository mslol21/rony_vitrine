import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Palette, Layers, Maximize, Sparkles, Loader2, X } from 'lucide-react';
import { dbService } from '../../lib/dbService';
import type { GlobalOption, GlobalOptionType, GlobalOptionFormData } from '../../types';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

const typeConfig: Record<GlobalOptionType, { label: string; icon: typeof Palette; color: string }> = {
  color: { label: 'Cores', icon: Palette, color: 'bg-pink-50 text-pink-600' },
  fabric: { label: 'Tecidos', icon: Layers, color: 'bg-blue-50 text-blue-600' },
  finish: { label: 'Acabamentos', icon: Sparkles, color: 'bg-amber-50 text-amber-600' },
  size: { label: 'Tamanhos', icon: Maximize, color: 'bg-green-50 text-green-600' },
};

export function AdminOptions() {
  const [activeTab, setActiveTab] = useState<GlobalOptionType>('color');
  const [options, setOptions] = useState<GlobalOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<GlobalOption | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<GlobalOptionFormData>({
    type: 'color',
    name: '',
    value: '',
    hex: '',
    price_modifier: 0,
    description: '',
    active: true,
  });

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const data = await dbService.getGlobalOptions();
      setOptions(data);
    } catch (e) {
      toast.error('Erro ao carregar opções globais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const openCreateModal = () => {
    setEditingOption(null);
    setFormData({
      type: activeTab,
      name: '',
      value: '',
      hex: '',
      price_modifier: 0,
      description: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (opt: GlobalOption) => {
    setEditingOption(opt);
    setFormData({
      type: opt.type,
      name: opt.name,
      value: opt.value,
      hex: opt.extra?.hex || '',
      price_modifier: opt.extra?.price_modifier || 0,
      description: opt.extra?.description || '',
      active: opt.active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir a opção "${name}"?`)) return;
    try {
      await dbService.deleteGlobalOption(id);
      toast.success('Opção excluída com sucesso!');
      await fetchOptions();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir opção');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.value) {
      toast.error('Por favor, preencha os campos obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingOption) {
        await dbService.updateGlobalOption(editingOption.id, formData);
        toast.success('Opção atualizada com sucesso!');
      } else {
        await dbService.createGlobalOption(formData);
        toast.success('Opção criada com sucesso!');
      }
      setIsModalOpen(false);
      await fetchOptions();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar opção');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = options.filter(o => o.type === activeTab);
  const config = typeConfig[activeTab];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
        <p className="text-stone-500 font-sans text-sm">Carregando opções...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-stone-800">Opções Globais</h1>
          <p className="text-stone-500 font-sans text-sm mt-1">Biblioteca de cores, tecidos, acabamentos e tamanhos</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Nova Opção
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-stone-100 rounded-2xl p-1.5 w-fit">
        {(Object.entries(typeConfig) as [GlobalOptionType, typeof typeConfig['color']][]).map(([type, cfg]) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-all duration-200',
              activeTab === type
                ? 'bg-white shadow-soft text-stone-800'
                : 'text-stone-500 hover:text-stone-700'
            )}
          >
            <cfg.icon size={14} />
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(option => (
          <div key={option.id} className="bg-white rounded-2xl shadow-soft p-5 flex flex-col justify-between group relative overflow-hidden transition-all hover:-translate-y-0.5">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {option.type === 'color' && option.extra?.hex ? (
                    <div
                      className="w-10 h-10 rounded-full border-2 border-stone-200 flex-shrink-0"
                      style={{ backgroundColor: option.extra.hex }}
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <config.icon size={18} />
                    </div>
                  )}
                  <div>
                    <p className="font-sans text-sm font-semibold text-stone-800">{option.name}</p>
                    <p className="text-[11px] text-stone-400 font-sans">{option.value}</p>
                  </div>
                </div>
                
                {/* Status indicator */}
                <span className={`inline-block text-[9px] font-sans px-1.5 py-0.5 rounded-full ${
                  option.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                }`}>
                  {option.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              
              {option.extra?.description && (
                <p className="text-xs text-stone-400 font-sans mt-2 italic leading-relaxed">
                  "{option.extra.description}"
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-50 flex items-center justify-between">
              <div>
                {option.extra?.price_modifier !== undefined && option.extra.price_modifier !== 0 ? (
                  <p className="text-xs font-semibold font-sans text-brand-mocha">
                    {option.extra.price_modifier > 0 ? '+' : ''} R$ {option.extra.price_modifier.toFixed(2)}
                  </p>
                ) : (
                  <p className="text-xs text-stone-400 font-sans">Preço padrão</p>
                )}
              </div>

              <div className="flex gap-1">
                <button
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-all"
                  onClick={() => openEditModal(option)}
                  title="Editar"
                >
                  <Edit size={13} />
                </button>
                <button
                  className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  onClick={() => handleDelete(option.id, option.name)}
                  title="Excluir"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl shadow-soft">
            <config.icon size={32} className="text-stone-200 mx-auto mb-3" />
            <p className="font-serif text-stone-500">Nenhuma opção de {config.label.toLowerCase()} cadastrada</p>
          </div>
        )}
      </div>

      {/* Modal - Create/Edit Option */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-large z-10 animate-scale-in">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-stone-800">
                {editingOption ? 'Editar Opção' : 'Nova Opção'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
                <X size={20} className="text-stone-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-base">Tipo de Opção *</label>
                <select
                  required
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as GlobalOptionType }))}
                  className="input-base cursor-pointer"
                >
                  <option value="color">Cor</option>
                  <option value="fabric">Tecido</option>
                  <option value="finish">Acabamento</option>
                  <option value="size">Tamanho</option>
                </select>
              </div>

              <div>
                <label className="label-base">Nome de Exibição *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-base"
                  placeholder="Ex: Verde Oliva, Linho Cru, G (Grande)"
                />
              </div>

              <div>
                <label className="label-base">Valor Técnico/Chave *</label>
                <input
                  type="text"
                  required
                  value={formData.value}
                  onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="input-base"
                  placeholder="Ex: verde-oliva, linho-cru, g"
                />
              </div>

              {formData.type === 'color' && (
                <div>
                  <label className="label-base">Código Hexadecimal da Cor</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.hex || '#ffffff'}
                      onChange={e => setFormData(prev => ({ ...prev, hex: e.target.value }))}
                      className="w-12 h-[42px] border border-stone-200 rounded-xl cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.hex || ''}
                      onChange={e => setFormData(prev => ({ ...prev, hex: e.target.value }))}
                      className="input-base flex-1"
                      placeholder="Ex: #D4AF37"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="label-base">Modificador de Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price_modifier || 0}
                  onChange={e => setFormData(prev => ({ ...prev, price_modifier: Number(e.target.value) }))}
                  className="input-base"
                  placeholder="Ex: 50.00 (valor somado ao preço base)"
                />
              </div>

              <div>
                <label className="label-base">Descrição Curta</label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-base"
                  placeholder="Ex: Tecido natural com toque macio"
                />
              </div>

              <div className="flex items-center gap-2 border-t border-stone-100 pt-4">
                <input
                  type="checkbox"
                  id="option-active"
                  checked={formData.active}
                  onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="w-4 h-4 rounded border-stone-300 text-brand-gold accent-brand-mocha"
                />
                <label htmlFor="option-active" className="text-xs font-semibold text-stone-700 cursor-pointer">
                  Opção Ativa (visível no formulário de customização)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-stone-100 pt-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary py-2.5"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2.5 flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="animate-spin" size={14} />}
                  {editingOption ? 'Salvar Alterações' : 'Criar Opção'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
