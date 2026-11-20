import { useState, useRef } from 'react';
import { Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { slugify } from '../../lib/utils';
import type { Category } from '../../types/database';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface CsvImportProps {
  categories: Category[];
  onComplete: () => void;
}

interface CsvRow {
  name: string;
  category: string;
  description: string;
  price: string;
  sku: string;
  is_available: string;
  is_featured: string;
  sort_order: string;
}

interface ValidatedRow {
  row: CsvRow;
  lineNumber: number;
  errors: string[];
  categoryId: string | null;
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }

  return { headers, rows };
}

export default function CsvImport({ categories, onComplete }: CsvImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawRows, setRawRows] = useState<ValidatedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const REQUIRED_COLS = ['name', 'price'];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const { headers, rows } = parseCsv(text);

      // Check required columns
      const missing = REQUIRED_COLS.filter(c => !headers.includes(c));
      if (missing.length > 0) {
        alert(`Missing required columns: ${missing.join(', ')}`);
        return;
      }

      // Build category lookup
      const catMap = new Map<string, string>();
      categories.forEach(c => {
        catMap.set(c.name.toLowerCase(), c.id);
        catMap.set(c.slug.toLowerCase(), c.id);
      });

      // Check for duplicate SKUs within the CSV
      const skuCounts = new Map<string, number>();
      rows.forEach(r => {
        const sku = r.sku?.trim();
        if (sku) skuCounts.set(sku.toLowerCase(), (skuCounts.get(sku.toLowerCase()) || 0) + 1);
      });

      const validated: ValidatedRow[] = rows.map((r, idx) => {
        const errors: string[] = [];
        const name = r.name?.trim() || '';
        const price = r.price?.trim() || '';
        const category = r.category?.trim() || '';
        const sku = r.sku?.trim() || '';

        if (!name) errors.push('Name is required');

        const priceNum = parseFloat(price);
        if (!price || isNaN(priceNum) || priceNum < 0) {
          errors.push('Price must be a valid non-negative number');
        }

        let categoryId: string | null = null;
        if (category) {
          categoryId = catMap.get(category.toLowerCase()) || null;
          if (!categoryId) errors.push(`Category "${category}" not found`);
        }

        if (sku && (skuCounts.get(sku.toLowerCase()) || 0) > 1) {
          errors.push(`Duplicate SKU "${sku}" in CSV`);
        }

        return {
          row: r as unknown as CsvRow,
          lineNumber: idx + 2,
          errors,
          categoryId,
        };
      });

      setRawRows(validated);
      setResult(null);
      setIsOpen(true);
    };
    reader.readAsText(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleImport = async () => {
    setImporting(true);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    const validRows = rawRows.filter(r => r.errors.length === 0);

    for (const { row, lineNumber, categoryId } of validRows) {
      const name = row.name.trim();
      const slug = slugify(name);
      const price = parseFloat(row.price);
      const sku = row.sku?.trim() || null;
      const description = row.description?.trim() || '';
      const is_available = row.is_available?.toLowerCase() !== 'false';
      const is_featured = row.is_featured?.toLowerCase() === 'true';
      const sort_order = parseInt(row.sort_order) || 0;

      // Check duplicate SKU in DB
      if (sku) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('sku', sku)
          .maybeSingle();

        if (existing) {
          errors.push(`Line ${lineNumber}: SKU "${sku}" already exists in database`);
          failed++;
          continue;
        }
      }

      const insertData: Record<string, unknown> = {
        name,
        slug,
        price,
        description,
        is_available,
        is_featured,
        sort_order,
      };

      if (sku) insertData.sku = sku;
      if (categoryId) insertData.category_id = categoryId;

      const { error } = await supabase.from('products').insert(insertData);

      if (error) {
        errors.push(`Line ${lineNumber}: ${error.message}`);
        failed++;
      } else {
        success++;
      }
    }

    const skippedCount = rawRows.length - validRows.length;
    if (skippedCount > 0) {
      errors.push(`${skippedCount} row(s) skipped due to validation errors`);
      failed += skippedCount;
    }

    setResult({ success, failed, errors });
    setImporting(false);

    if (success > 0) onComplete();
  };

  const errorCount = rawRows.filter(r => r.errors.length > 0).length;
  const validCount = rawRows.length - errorCount;

  return (
    <>
      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFile}
        />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload size={14} />
          Import CSV
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="CSV Import" size="lg">
        {result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={16} className="text-success" />
              <span>{result.success} product(s) imported successfully</span>
            </div>
            {result.failed > 0 && (
              <div className="flex items-start gap-2 text-sm text-error">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p>{result.failed} row(s) failed</p>
                  <ul className="mt-1 space-y-0.5 text-xs">
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              </div>
            )}
            <Button onClick={() => setIsOpen(false)} size="sm">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              {rawRows.length} row(s) found. {validCount} valid, {errorCount} with errors.
            </p>

            {/* Preview table */}
            <div className="max-h-64 overflow-auto border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-ivory border-b border-border sticky top-0">
                    <th className="px-2 py-1.5 text-left">Line</th>
                    <th className="px-2 py-1.5 text-left">Name</th>
                    <th className="px-2 py-1.5 text-left">Category</th>
                    <th className="px-2 py-1.5 text-left">Price</th>
                    <th className="px-2 py-1.5 text-left">SKU</th>
                    <th className="px-2 py-1.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rawRows.map((r, i) => (
                    <tr key={i} className={`border-b border-border-light ${r.errors.length > 0 ? 'bg-error/5' : ''}`}>
                      <td className="px-2 py-1.5">{r.lineNumber}</td>
                      <td className="px-2 py-1.5">{r.row.name || '—'}</td>
                      <td className="px-2 py-1.5">{r.row.category || '—'}</td>
                      <td className="px-2 py-1.5">{r.row.price || '—'}</td>
                      <td className="px-2 py-1.5">{r.row.sku || '—'}</td>
                      <td className="px-2 py-1.5">
                        {r.errors.length > 0 ? (
                          <span className="text-error" title={r.errors.join('; ')}>
                            ✗ {r.errors[0]}
                          </span>
                        ) : (
                          <span className="text-success">✓ Valid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleImport}
                loading={importing}
                disabled={validCount === 0}
                size="sm"
              >
                Import {validCount} Product{validCount !== 1 ? 's' : ''}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
