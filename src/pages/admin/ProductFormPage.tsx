import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getAllCategories, invalidateCategoryCache } from '../../services/categories';
import { slugify } from '../../lib/utils';
import type { Category, ProductImage } from '../../types/database';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import ImageUploader from '../../components/admin/ImageUploader';

interface ProductFormData {
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  description: string;
  price: string;
  is_available: boolean;
  is_featured: boolean;
  sort_order: string;
  stock_quantity: string;
}

const INITIAL_FORM: ProductFormData = {
  name: '',
  slug: '',
  sku: '',
  category_id: '',
  description: '',
  price: '',
  is_available: true,
  is_featured: false,
  sort_order: '0',
  stock_quantity: '1',
};

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<ProductFormData>(INITIAL_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCategories = useCallback(async () => {
    invalidateCategoryCache();
    const cats = await getAllCategories();
    setCategories(cats);
  }, []);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        images:product_images(id, product_id, storage_path, alt_text, display_order, is_primary, created_at)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      alert('Product not found.');
      navigate('/admin/products');
      return;
    }

    setForm({
      name: data.name,
      slug: data.slug,
      sku: data.sku || '',
      category_id: data.category_id || '',
      description: data.description || '',
      price: String(data.price),
      is_available: data.is_available,
      is_featured: data.is_featured,
      sort_order: String(data.sort_order),
      stock_quantity: String(data.stock_quantity ?? 1),
    });
    setImages((data.images as ProductImage[]) || []);
    setLoading(false);
  }, [id, navigate]);

  const fetchImages = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id)
      .order('display_order', { ascending: true });
    setImages((data as ProductImage[]) || []);
  }, [id]);

  useEffect(() => {
    fetchCategories();
    if (isEditing) fetchProduct();
  }, [fetchCategories, isEditing, fetchProduct]);

  const handleChange = (field: keyof ProductFormData, value: string | boolean) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from name
      if (field === 'name' && typeof value === 'string' && !isEditing) {
        updated.slug = slugify(value);
      }
      return updated;
    });
    // Clear field error
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.slug.trim()) e.slug = 'Slug is required';

    const priceNum = parseFloat(form.price);
    if (!form.price || isNaN(priceNum) || priceNum < 0) {
      e.price = 'Price must be a valid non-negative number';
    }

    const sortNum = parseInt(form.sort_order);
    if (isNaN(sortNum)) e.sort_order = 'Must be a number';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      sku: form.sku.trim() || null,
      category_id: form.category_id || null,
      description: form.description.trim(),
      price: parseFloat(form.price),
      is_available: form.is_available,
      is_featured: form.is_featured,
      sort_order: parseInt(form.sort_order) || 0,
      stock_quantity: parseInt(form.stock_quantity) >= 0 ? parseInt(form.stock_quantity) : 1,
    };

    if (isEditing && id) {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id);

      if (error) {
        alert(`Failed to update: ${error.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert(payload);

      if (error) {
        alert(`Failed to create: ${error.message}`);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    navigate('/admin/products');
  };

  if (loading) return <Spinner />;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to Products
        </Link>
        <h1 className="font-serif text-2xl text-text">
          {isEditing ? 'Edit Product' : 'New Product'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Input
          label="Product Name"
          placeholder="e.g. Crimson Elegance Necklace"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          required
        />

        <Input
          label="Slug"
          placeholder="crimson-elegance-necklace"
          value={form.slug}
          onChange={(e) => handleChange('slug', e.target.value)}
          error={errors.slug}
          required
        />

        <Input
          label="SKU"
          placeholder="e.g. NCK-001 (optional)"
          value={form.sku}
          onChange={(e) => handleChange('sku', e.target.value)}
        />

        <Select
          label="Category"
          value={form.category_id}
          onChange={(e) => handleChange('category_id', e.target.value)}
          options={categories.map(c => ({ value: c.id, label: c.name }))}
          placeholder="Select a category"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Price"
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => handleChange('price', e.target.value)}
            error={errors.price}
            required
          />

          <Input
            label="Stock Quantity"
            type="number"
            placeholder="1"
            min="0"
            value={form.stock_quantity}
            onChange={(e) => handleChange('stock_quantity', e.target.value)}
            error={errors.stock_quantity}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-text">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Describe this product…"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full border border-border bg-white px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-burgundy focus:outline-none transition-colors resize-y"
          />
        </div>

        <Input
          label="Sort Order"
          type="number"
          value={form.sort_order}
          onChange={(e) => handleChange('sort_order', e.target.value)}
          error={errors.sort_order}
        />

        <div className="flex flex-col gap-3">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(e) => handleChange('is_available', e.target.checked)}
              className="accent-burgundy"
            />
            Available for sale
          </label>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => handleChange('is_featured', e.target.checked)}
              className="accent-burgundy"
            />
            Featured product
          </label>
        </div>

        {/* Image Manager — only visible when editing (product must exist first) */}
        {isEditing && id && (
          <div className="border-t border-border pt-6">
            <ImageUploader
              productId={id}
              images={images}
              onImagesChange={fetchImages}
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="submit" loading={saving}>
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
          <Link to="/admin/products">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
