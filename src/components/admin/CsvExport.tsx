import { useState } from 'react';
import { Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';

export default function CsvExport() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('name, slug, sku, price, description, is_available, is_featured, sort_order, category:categories!category_id(name)')
        .order('created_at', { ascending: false });

      if (error || !products) {
        alert('Failed to fetch products for export.');
        setExporting(false);
        return;
      }

      const headers = ['name', 'category', 'description', 'price', 'sku', 'is_available', 'is_featured', 'sort_order'];

      const escapeField = (val: string) => {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const rows = products.map((p: Record<string, unknown>) => {
        const cat = p.category as { name: string } | null;
        return [
          escapeField(String(p.name ?? '')),
          escapeField(cat?.name ?? ''),
          escapeField(String(p.description ?? '')),
          String(p.price ?? 0),
          escapeField(String(p.sku ?? '')),
          String(p.is_available ?? true),
          String(p.is_featured ?? false),
          String(p.sort_order ?? 0),
        ].join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metallics-products-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Please try again.');
    }

    setExporting(false);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} loading={exporting}>
      <Download size={14} />
      Export CSV
    </Button>
  );
}
