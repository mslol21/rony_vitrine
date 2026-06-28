import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Loader2, X, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dbService } from '../../lib/dbService';
import type { Category, Product, CategoryFormData } from '../../types';
import { toast } from 'sonner';

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    order: 0,
    active: true,
    image_url: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cData, pData] = await Promise.all([
        dbService.getCategories(),
        dbService.getProducts()
      ]);
      setCategories(cData);
      setProducts(pData);
    } catch (e) {
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      order: categories.length + 1,
      active: true,
      image_url: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      order: cat.order,
      active: cat.active,
      image_url: cat.image_url || ''
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      setUploading(true);
      toast.loading('Fazendo upload da imagem da categoria...', { id: 'upload-cat-toast' });
      
      let imageUrl = '';
      try {
        imageUrl = await dbService.uploadCategoryImage(file);
      } catch (uploadErr) {
        console.warn('Failed category-images upload, trying product-images:', uploadErr);
        try {
          imageUrl = await dbService.uploadProductImage(file);
        } catch (fallbackErr) {
          console.error('All uploads failed, using local object URL:', fallbackErr);
          imageUrl = URL.createObjectURL(file);
          toast.warning('Upload falhou no Supabase. Usando URL temporária local.', { duration: 5000 });
        }
      }
      
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
      toast.success('Imagem da categoria atualizada!', { id: 'upload-cat-toast' });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao fazer upload da imagem.', { id: 'upload-cat-toast' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Por favor, informe o nome da categoria.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCategory) {
        await dbService.updateCategory(editingCategory.id, formData);
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await dbService.createCategory(formData);
        toast.success('Categoria criada com sucesso!');
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar categoria');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir a categoria "${name}"? Os produtos vinculados a ela ficarão sem categoria.`)) return;
    try {
      await dbService.deleteCategory(id);
      toast.success('Categoria excluída com sucesso!');
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir categoria');
    }
  };

  const getProductCount = (catId: string) =>
    products.filter(p => p.category_id === catId).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
        <p className="text-stone-500 font-sans text-sm">Carregando categorias...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-stone-800">Categorias</h1>
          <p className="text-stone-500 font-sans text-sm mt-1">{categories.length} categorias cadastradas</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Nova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white rounded-2xl shadow-soft overflow-hidden group flex flex-col justify-between">
            <div>
              <div className="relative aspect-video overflow-hidden bg-brand-sand/30">
                <img
                  src={cat.image_url || '/images/almofada.jpg'}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="font-serif text-white text-base font-medium">{cat.name}</p>
                  <p className="text-white/70 text-xs font-sans mt-0.5">{getProductCount(cat.id)} produtos</p>
                </div>
              </div>
              <div className="p-5">
                {cat.description ? (
                  <p className="text-xs text-stone-500 font-sans line-clamp-2 leading-relaxed">{cat.description}</p>
                ) : (
                  <p className="text-xs text-stone-300 italic font-sans">Sem descrição definida</p>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-stone-50 flex items-center justify-between">
              <div>
                <span className={`inline-block text-[10px] font-sans px-2.5 py-0.5 rounded-full ${
                  cat.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                }`}>
                  {cat.active ? 'Ativa' : 'Inativa'}
                </span>
                <span className="text-[10px] text-stone-400 ml-2 font-sans">Ordem: {cat.order}</span>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  to={`/catalogo?categoria=${cat.slug}`}
                  target="_blank"
                  className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-all"
                  title="Visualizar no catálogo"
                >
                  <Eye size={15} />
                </Link>
                <button
                  className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-all"
                  onClick={() => openEditModal(cat)}
                  title="Editar"
                >
                  <Edit size={15} />
                </button>
                <button
                  className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  onClick={() => handleDelete(cat.id, cat.name)}
                  title="Excluir"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Create/Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-large z-10 animate-scale-in">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-stone-800">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
                <X size={20} className="text-stone-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-base">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-base"
                  placeholder="Ex: Cama, Mesa & Banho"
                />
              </div>

              <div>
                <label className="label-base">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-base min-h-[80px] py-2.5 resize-none"
                  placeholder="Ex: Mantas, lençóis e texturas naturais..."
                />
              </div>

              <div>
                <label className="label-base">Ordem de Exibição</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={e => setFormData(prev => ({ ...prev, order: Number(e.target.value) }))}
                  className="input-base"
                  placeholder="Ex: 1"
                />
              </div>

              <div>
                <label className="label-base flex items-center justify-between">
                  <span>Foto da Categoria (URL ou Arquivo)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.image_url || ''}
                    onChange={e => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    className="input-base flex-1 text-xs"
                    placeholder="https://... ou faça upload..."
                  />
                  <label className="btn-secondary py-2.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                    <Upload size={14} /> Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                {formData.image_url && (
                  <div className="mt-2 relative aspect-video rounded-xl overflow-hidden bg-stone-50 border border-stone-200">
                    <img src={formData.image_url} alt="Preview da categoria" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Remover Imagem"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-stone-100 pt-4">
                <input
                  type="checkbox"
                  id="category-active"
                  checked={formData.active}
                  onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="w-4 h-4 rounded border-stone-300 text-brand-gold accent-brand-mocha"
                />
                <label htmlFor="category-active" className="text-xs font-semibold text-stone-700 cursor-pointer">
                  Categoria Ativa (visível no catálogo)
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
                  {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
