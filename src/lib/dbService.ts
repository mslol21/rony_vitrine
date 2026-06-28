import { supabase } from './supabase';
import { mockProducts, mockCategories, mockGlobalOptions, mockInspirations } from './mockData';
import type { Category, GlobalOption, Inspiration, Product, ProductFormData, CategoryFormData, GlobalOptionFormData, Order, OrderStatus, ProductImage } from '../types';

// Helper to get or create the default tenant ID
async function getTenantId(): Promise<string> {
  try {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'roony-cosmeticos')
      .maybeSingle();

    if (error) throw error;

    if (tenant) {
      return tenant.id;
    }

    // Insert fallback tenant if not found
    const { data: newTenant, error: insertError } = await supabase
      .from('tenants')
      .insert({
        name: 'Roony Cosméticos',
        slug: 'roony-cosmeticos',
        whatsapp: '5511975915227',
        settings: { primary_color: '#4A0D1B', currency: 'BRL', show_prices: true }
      })
      .select('id')
      .single();

    if (insertError) throw insertError;
    return newTenant.id;
  } catch (e) {
    console.warn('Error fetching tenant, using fallback id:', e);
    return 'tenant-1';
  }
}

export const dbService = {
  // ============================================================
  // DATABASE SEEDING
  // ============================================================
  async seedDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      const tenantId = await getTenantId();

      // 1. Check if categories already exist
      const { data: existingCats } = await supabase.from('categories').select('id');
      if (existingCats && existingCats.length > 0) {
        return { success: false, message: 'O banco de dados já possui dados cadastrados.' };
      }

      // 2. Insert Categories (mapping old IDs to new database insertions)
      console.log('Seeding categories...');
      const catMap: Record<string, string> = {};
      for (const cat of mockCategories) {
        const { data: newCat, error } = await supabase
          .from('categories')
          .insert({
            tenant_id: tenantId,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            image_url: cat.image_url || '',
            order: cat.order,
            active: cat.active
          })
          .select('id')
          .single();

        if (error) throw error;
        catMap[cat.id] = newCat.id;
      }

      // 3. Insert Global Options
      console.log('Seeding global options...');
      const optMap: Record<string, string> = {};
      for (const opt of mockGlobalOptions) {
        const { data: newOpt, error } = await supabase
          .from('global_options')
          .insert({
            tenant_id: tenantId,
            type: opt.type,
            name: opt.name,
            value: opt.value,
            extra: opt.extra || {},
            active: opt.active
          })
          .select('id')
          .single();

        if (error) throw error;
        optMap[opt.id] = newOpt.id;
      }

      // 4. Insert Products
      console.log('Seeding products...');
      const prodMap: Record<string, string> = {};
      for (const prod of mockProducts) {
        const dbCategoryId = catMap[prod.category_id] || null;
        const { data: newProd, error } = await supabase
          .from('products')
          .insert({
            tenant_id: tenantId,
            category_id: dbCategoryId,
            name: prod.name,
            slug: prod.slug,
            description: prod.description,
            price: prod.price,
            price_from: prod.price_from || null,
            production_days: prod.production_days || null,
            is_featured: prod.is_featured,
            is_new: prod.is_new,
            is_customizable: prod.is_customizable,
            is_made_to_order: prod.is_made_to_order,
            images: prod.images,
            tags: prod.tags,
            active: prod.active
          })
          .select('id')
          .single();

        if (error) throw error;
        prodMap[prod.id] = newProd.id;
      }

      // 5. Insert Inspirations
      console.log('Seeding inspirations...');
      for (const insp of mockInspirations) {
        const dbProductIds = insp.product_ids.map(id => prodMap[id]).filter(Boolean);
        const { error } = await supabase
          .from('inspirations')
          .insert({
            tenant_id: tenantId,
            title: insp.title,
            description: insp.description || '',
            image_url: insp.image_url,
            product_ids: dbProductIds,
            active: insp.active
          });

        if (error) throw error;
      }

      return { success: true, message: 'Banco de dados semeado com sucesso!' };
    } catch (e: any) {
      console.error('Error seeding database:', e);
      return { success: false, message: `Erro ao semear banco: ${e.message || e}` };
    }
  },

  // ============================================================
  // CATEGORIES
  // ============================================================
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      return (data || []) as Category[];
    } catch (e) {
      console.warn('Error fetching categories from Supabase, using mock fallback:', e);
      return mockCategories;
    }
  },

  async createCategory(formData: CategoryFormData): Promise<Category> {
    const tenantId = await getTenantId();
    const slug = formData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const { data, error } = await supabase
      .from('categories')
      .insert({
        tenant_id: tenantId,
        name: formData.name,
        slug,
        description: formData.description || '',
        order: formData.order,
        active: formData.active,
        image_url: formData.image_url || '/images/almofada.jpg'
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as Category;
  },

  async updateCategory(id: string, formData: CategoryFormData): Promise<Category> {
    const slug = formData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: formData.name,
        slug,
        description: formData.description || '',
        order: formData.order,
        active: formData.active,
        image_url: formData.image_url
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data as Category;
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ============================================================
  // PRODUCTS
  // ============================================================
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Product[];
    } catch (e) {
      console.warn('Error fetching products from Supabase, using mock fallback:', e);
      return mockProducts;
    }
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return mockProducts.find(p => p.slug === slug) || null; // Fallback
      }

      return data as Product;
    } catch (e) {
      console.warn(`Error fetching product by slug ${slug}, using mock fallback:`, e);
      return mockProducts.find(p => p.slug === slug) || null;
    }
  },

  async createProduct(formData: ProductFormData, images?: ProductImage[]): Promise<Product> {
    const tenantId = await getTenantId();
    const slug = formData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
    const productImages = images && images.length > 0 ? images : [{ url: '/images/almofada.jpg', alt: formData.name, order: 0 }];
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        tenant_id: tenantId,
        category_id: formData.category_id || null,
        name: formData.name,
        slug,
        description: formData.description,
        price: formData.price,
        price_from: formData.price_from || null,
        production_days: formData.production_days || null,
        is_featured: formData.is_featured,
        is_new: formData.is_new,
        is_customizable: formData.is_customizable,
        is_made_to_order: formData.is_made_to_order,
        images: productImages,
        video_url: formData.video_url || null,
        tags: tagsArray,
        active: formData.active
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as Product;
  },

  async updateProduct(id: string, formData: ProductFormData, images?: ProductImage[]): Promise<Product> {
    const slug = formData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];

    const updatePayload: any = {
      category_id: formData.category_id || null,
      name: formData.name,
      slug,
      description: formData.description,
      price: formData.price,
      price_from: formData.price_from || null,
      production_days: formData.production_days || null,
      is_featured: formData.is_featured,
      is_new: formData.is_new,
      is_customizable: formData.is_customizable,
      is_made_to_order: formData.is_made_to_order,
      video_url: formData.video_url || null,
      tags: tagsArray,
      active: formData.active
    };

    if (images) {
      updatePayload.images = images;
    }

    const { data, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data as Product;
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadProductImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async uploadCategoryImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from('category-images')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('category-images')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async uploadProductVideo(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from('product-videos')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('product-videos')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  // ============================================================
  // GLOBAL OPTIONS
  // ============================================================
  async getGlobalOptions(): Promise<GlobalOption[]> {
    try {
      const { data, error } = await supabase
        .from('global_options')
        .select('*');

      if (error) throw error;
      return (data || []) as GlobalOption[];
    } catch (e) {
      console.warn('Error fetching global options from Supabase, using mock fallback:', e);
      return mockGlobalOptions;
    }
  },

  async createGlobalOption(formData: GlobalOptionFormData): Promise<GlobalOption> {
    const tenantId = await getTenantId();
    const { data, error } = await supabase
      .from('global_options')
      .insert({
        tenant_id: tenantId,
        type: formData.type,
        name: formData.name,
        value: formData.value,
        extra: {
          hex: formData.hex || undefined,
          price_modifier: formData.price_modifier || 0,
          description: formData.description || undefined
        },
        active: formData.active
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as GlobalOption;
  },

  async updateGlobalOption(id: string, formData: GlobalOptionFormData): Promise<GlobalOption> {
    const { data, error } = await supabase
      .from('global_options')
      .update({
        type: formData.type,
        name: formData.name,
        value: formData.value,
        extra: {
          hex: formData.hex || undefined,
          price_modifier: formData.price_modifier || 0,
          description: formData.description || undefined
        },
        active: formData.active
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data as GlobalOption;
  },

  async deleteGlobalOption(id: string): Promise<void> {
    const { error } = await supabase
      .from('global_options')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ============================================================
  // INSPIRATIONS
  // ============================================================
  async getInspirations(): Promise<Inspiration[]> {
    try {
      const { data, error } = await supabase
        .from('inspirations')
        .select('*');

      if (error) throw error;
      return (data || []) as Inspiration[];
    } catch (e) {
      console.warn('Error fetching inspirations from Supabase, using mock fallback:', e);
      return mockInspirations;
    }
  },

  // ============================================================
  // ORDERS
  // ============================================================
  async getOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Order[];
    } catch (e) {
      console.error('Error fetching orders from Supabase:', e);
      return [];
    }
  },

  async createOrder(orderData: {
    customer_name: string;
    customer_whatsapp: string;
    total: number;
    notes?: string;
    items: Array<{
      product_id: string;
      product_name: string;
      product_image?: string;
      quantity: number;
      unit_price: number;
      customizations: any;
    }>;
  }): Promise<Order> {
    const tenantId = await getTenantId();
    
    // 1. Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenantId,
        customer_name: orderData.customer_name,
        customer_whatsapp: orderData.customer_whatsapp,
        total: orderData.total,
        notes: orderData.notes || '',
        status: 'pending'
      })
      .select('*')
      .single();

    if (orderError) throw orderError;

    // 2. Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image || '',
      quantity: item.quantity,
      unit_price: item.unit_price,
      customizations: item.customizations
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return {
      ...order,
      items: orderItems
    } as Order;
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data as Order;
  }
};
