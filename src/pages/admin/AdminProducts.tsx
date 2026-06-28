import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Package, Loader2, X, Upload, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dbService } from '../../lib/dbService';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import type { Product, Category, ProductFormData, ProductImage } from '../../types';
import { downloadFile } from '../../lib/download';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category_id: '',
    description: '',
    price: 0,
    price_from: undefined,
    production_days: undefined,
    is_featured: false,
    is_new: false,
    is_customizable: false,
    is_made_to_order: false,
    tags: '',
    video_url: '',
    active: true
  });

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
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleAddImageUrl = (url: string) => {
    if (!url) return;
    setProductImages(prev => [
      ...prev,
      { url, alt: formData.name || 'Foto do produto', order: prev.length }
    ]);
    toast.success('URL da foto adicionada!');
  };

  const handleRemoveImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index).map((img, i) => ({ ...img, order: i })));
    toast.success('Foto removida!');
  };

  const handleDownloadImage = async (url: string, index: number) => {
    try {
      const filename = `${formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'produto'}_foto_${index + 1}.jpg`;
      toast.loading('Iniciando download da foto...', { id: 'admin-download-img' });
      await downloadFile(url, filename);
      toast.success('Foto baixada com sucesso!', { id: 'admin-download-img' });
    } catch (err) {
      toast.error('Erro ao baixar foto.', { id: 'admin-download-img' });
    }
  };

  const handleDownloadVideo = async () => {
    if (!formData.video_url) return;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const isYoutube = formData.video_url.match(regExp);

    if (isYoutube) {
      toast.info('Este vídeo está hospedado no YouTube. Redirecionando.');
      window.open(formData.video_url, '_blank');
      return;
    }

    try {
      const filename = `${formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'produto'}_video.mp4`;
      toast.loading('Iniciando download do vídeo...', { id: 'admin-download-vid' });
      await downloadFile(formData.video_url, filename);
      toast.success('Vídeo baixado com sucesso!', { id: 'admin-download-vid' });
    } catch (err) {
      toast.error('Erro ao baixar vídeo.', { id: 'admin-download-vid' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      toast.loading('Fazendo upload das imagens...', { id: 'upload-toast' });
      
      const newImages: ProductImage[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const publicUrl = await dbService.uploadProductImage(file);
          newImages.push({
            url: publicUrl,
            alt: file.name,
            order: productImages.length + i
          });
        } catch (uploadErr) {
          console.error('Failed upload to Supabase, falling back to local object URL:', uploadErr);
          const localUrl = URL.createObjectURL(file);
          newImages.push({
            url: localUrl,
            alt: file.name,
            order: productImages.length + i
          });
          toast.warning(`Upload falhou no Supabase para ${file.name}. Usando URL temporária local.`, { duration: 5000 });
        }
      }

      setProductImages(prev => [...prev, ...newImages]);
      toast.success('Imagens adicionadas com sucesso!', { id: 'upload-toast' });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao fazer upload das imagens.', { id: 'upload-toast' });
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      setUploading(true);
      toast.loading('Fazendo upload do vídeo...', { id: 'upload-toast' });
      
      let videoUrl = '';
      try {
        videoUrl = await dbService.uploadProductVideo(file);
      } catch (uploadErr) {
        console.error('Failed video upload to Supabase, falling back to local object URL:', uploadErr);
        videoUrl = URL.createObjectURL(file);
        toast.warning('Upload do vídeo falhou no Supabase. Usando URL temporária local.', { duration: 5000 });
      }

      setFormData(prev => ({ ...prev, video_url: videoUrl }));
      toast.success('Vídeo adicionado com sucesso!', { id: 'upload-toast' });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao fazer upload do vídeo.', { id: 'upload-toast' });
    } finally {
      setUploading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: categories[0]?.id || '',
      description: '',
      price: 0,
      price_from: undefined,
      production_days: undefined,
      is_featured: false,
      is_new: false,
      is_customizable: false,
      is_made_to_order: false,
      tags: '',
      video_url: '',
      active: true
    });
    setProductImages([]);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id || '',
      description: product.description || '',
      price: product.price,
      price_from: product.price_from || undefined,
      production_days: product.production_days || undefined,
      is_featured: product.is_featured,
      is_new: product.is_new,
      is_customizable: product.is_customizable,
      is_made_to_order: product.is_made_to_order,
      tags: product.tags ? product.tags.join(', ') : '',
      video_url: product.video_url || '',
      active: product.active
    });
    setProductImages(product.images || []);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0) {
      toast.error('Por favor, preencha os campos obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingProduct) {
        await dbService.updateProduct(editingProduct.id, formData, productImages);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await dbService.createProduct(formData, productImages);
        toast.success('Produto criado com sucesso!');
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar produto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o produto "${name}"?`)) return;
    try {
      await dbService.deleteProduct(id);
      toast.success('Produto excluído com sucesso!');
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir produto');
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '—';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
        <p className="text-stone-500 font-sans text-sm">Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-stone-800">Produtos</h1>
          <p className="text-stone-500 font-sans text-sm mt-1">{products.length} produtos cadastrados</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-base pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Produto</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Categoria</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Preço</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0]?.url || '/images/almofada.jpg'}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                      />
                      <div>
                        <p className="font-sans text-sm font-medium text-stone-800">{product.name}</p>
                        <p className="text-[11px] text-stone-400 font-sans mt-0.5">/{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-sans text-stone-600">{getCategoryName(product.category_id)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-serif text-sm text-stone-800">{formatCurrency(product.price)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {product.is_featured && (
                        <span className="text-[10px] font-sans bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">Destaque</span>
                      )}
                      {product.is_new && (
                        <span className="text-[10px] font-sans bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Novo</span>
                      )}
                      {product.is_customizable && (
                        <span className="text-[10px] font-sans bg-brand-linen text-brand-espresso px-2 py-0.5 rounded-full">Custom</span>
                      )}
                      {!product.active && (
                        <span className="text-[10px] font-sans bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Inativo</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/produto/${product.slug}`}
                        target="_blank"
                        className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-all"
                        title="Visualizar"
                      >
                        <Eye size={15} />
                      </Link>
                      <button
                        className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-all"
                        title="Editar"
                        onClick={() => openEditModal(product)}
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir"
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Package size={32} className="text-stone-200 mx-auto mb-3" />
            <p className="font-serif text-stone-500">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Modal - Create/Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-large z-10 animate-scale-in">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-stone-800">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
                <X size={20} className="text-stone-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label-base">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-base"
                    placeholder="Ex: Almofada Linho Cru"
                  />
                </div>
                <div>
                  <label className="label-base">Categoria *</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    className="input-base"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label-base">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-base min-h-[100px] py-2.5 resize-none"
                  placeholder="Descreva as qualidades e características do produto..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="label-base">Preço R$ *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price || ''}
                    onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="input-base"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="label-base">Preço De R$ (Opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_from || ''}
                    onChange={e => setFormData(prev => ({ ...prev, price_from: e.target.value ? Number(e.target.value) : undefined }))}
                    className="input-base"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="label-base">Dias de Produção</label>
                  <input
                    type="number"
                    value={formData.production_days || ''}
                    onChange={e => setFormData(prev => ({ ...prev, production_days: e.target.value ? Number(e.target.value) : undefined }))}
                    className="input-base"
                    placeholder="Ex: 10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label-base">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="input-base"
                    placeholder="almofada, linho, decoração"
                  />
                </div>
                <div>
                  <label className="label-base flex items-center justify-between">
                    <span>URL ou Arquivo do Vídeo (Opcional)</span>
                    {formData.video_url && (
                      <button
                        type="button"
                        onClick={handleDownloadVideo}
                        className="text-brand-mocha hover:text-stone-800 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                        title="Baixar Vídeo"
                      >
                        <Download size={11} /> Baixar Vídeo
                      </button>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.video_url || ''}
                      onChange={e => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                      className="input-base flex-1"
                      placeholder="https://youtube.com/ ou link direto..."
                    />
                    <label className="btn-secondary py-2.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                      <Upload size={14} /> Upload Vídeo
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Fotos do Produto Section */}
              <div className="border-t border-stone-100 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg text-stone-800 flex items-center gap-2">
                    Fotos do Produto ({productImages.length})
                  </h3>
                  <label className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer">
                    <Upload size={14} /> Upload de Fotos
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>

                {/* Add Image by URL */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    id="new-image-url"
                    placeholder="Adicionar foto por URL (opcional)..."
                    className="input-base text-xs py-1.5 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-image-url') as HTMLInputElement;
                      if (input && input.value) {
                        handleAddImageUrl(input.value);
                        input.value = '';
                      }
                    }}
                    className="btn-secondary py-1.5 px-3 text-xs"
                  >
                    Adicionar URL
                  </button>
                </div>

                {/* Images Grid */}
                {productImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    {productImages.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-white border border-stone-100 group">
                        <img src={img.url} alt={img.alt || `Imagem ${index}`} className="w-full h-full object-cover" />
                        
                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadImage(img.url, index)}
                            className="p-1.5 bg-white text-stone-700 rounded-full hover:bg-stone-100 transition-all hover:scale-110"
                            title="Baixar Foto"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all hover:scale-110"
                            title="Excluir Foto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                          Ordem {index}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-400 text-xs text-center py-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                    Nenhuma foto adicionada. Faça upload de arquivos ou insira URLs acima.
                  </p>
                )}
              </div>

              <div className="border-t border-stone-100 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'is_featured', label: 'Destaque' },
                  { key: 'is_new', label: 'Lançamento' },
                  { key: 'is_customizable', label: 'Personalizável' },
                  { key: 'is_made_to_order', label: 'Sob Encomenda' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData[key as keyof ProductFormData]}
                      onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-stone-300 text-brand-gold accent-brand-mocha"
                    />
                    <span className="text-xs font-medium text-stone-600 font-sans">{label}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t border-stone-100 pt-4">
                <input
                  type="checkbox"
                  id="product-active"
                  checked={formData.active}
                  onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="w-4 h-4 rounded border-stone-300 text-brand-gold accent-brand-mocha"
                />
                <label htmlFor="product-active" className="text-xs font-semibold text-stone-700 cursor-pointer">
                  Produto Ativo no Catálogo (visível para clientes)
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
                  {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
