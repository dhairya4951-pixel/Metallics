import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getAllCategories, invalidateCategoryCache } from '../../services/categories';
import { slugify } from '../../lib/utils';
import type { Category } from '../../types/database';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';

interface CategoryForm {
  name: string;
  slug: string;
  sort_order: string;
  is_active: boolean;
}

const INITIAL_FORM: CategoryForm = {
  name: '',
  slug: '',
  sort_order: '0',
  is_active: true,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    invalidateCategoryCache();
    const cats = await getAllCategories();
    setCategories(cats);

    // Fetch product counts per category in parallel
    const countResults = await Promise.all(
      cats.map(cat =>
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', cat.id)
          .then(({ count }) => [cat.id, count ?? 0] as const)
      )
    );
    const counts: Record<string, number> = {};
    for (const [id, c] of countResults) {
      counts[id] = c;
    }
    setProductCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAdd = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      sort_order: String(cat.sort_order),
      is_active: cat.is_active,
    });
    setModalOpen(true);
  };

  const handleChange = (field: keyof CategoryForm, value: string | boolean) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && typeof value === 'string' && !editingId) {
        updated.slug = slugify(value);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('Category name is required.');
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name.trim()),
      sort_order: parseInt(form.sort_order) || 0,
      is_active: form.is_active,
    };

    if (editingId) {
      const { error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        alert(`Failed to update: ${error.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('categories')
        .insert(payload);

      if (error) {
        alert(`Failed to create: ${error.message}`);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setModalOpen(false);
    fetchCategories();
  };

  const handleDelete = async (cat: Category) => {
    const count = productCounts[cat.id] || 0;
    if (count > 0) {
      alert(
        `Cannot delete "${cat.name}" because it has ${count} product${count !== 1 ? 's' : ''}. ` +
        `Reassign or archive those products first, or deactivate this category instead.`
      );
      return;
    }

    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;

    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
      return;
    }
    fetchCategories();
  };

  const handleToggleActive = async (cat: Category) => {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: !cat.is_active })
      .eq('id', cat.id);

    if (error) {
      alert(`Failed to update: ${error.message}`);
      return;
    }
    fetchCategories();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-text">Categories</h1>
          <p className="text-sm text-text-muted mt-1">Manage product categories</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus size={14} />
          Add Category
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-ivory">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted hidden sm:table-cell">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Products</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Order</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} className="border-b border-border-light last:border-0 hover:bg-ivory/50 transition-colors">
                <td className="px-4 py-3 font-medium text-text">{cat.name}</td>
                <td className="px-4 py-3 text-text-muted hidden sm:table-cell">{cat.slug}</td>
                <td className="px-4 py-3 text-text-muted">{productCounts[cat.id] ?? 0}</td>
                <td className="px-4 py-3 text-text-muted">{cat.sort_order}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggleActive(cat)} className="cursor-pointer">
                    <Badge variant={cat.is_active ? 'success' : 'default'}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1 text-text-muted hover:text-burgundy transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1 text-text-muted hover:text-error transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-muted">
                  No categories found. Create your first category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Category' : 'Add Category'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Earrings"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
          <Input
            label="Slug"
            placeholder="earrings"
            value={form.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
          />
          <Input
            label="Sort Order"
            type="number"
            value={form.sort_order}
            onChange={(e) => handleChange('sort_order', e.target.value)}
          />
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="accent-burgundy"
            />
            Active
          </label>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} loading={saving} size="sm">
              {editingId ? 'Save Changes' : 'Create Category'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
