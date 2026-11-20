import { useState, useRef, useCallback } from 'react';
import { Upload, X, Star, GripVertical, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadImage, deleteImage, getPublicImageUrl } from '../../services/images';
import type { ProductImage } from '../../types/database';


interface ImageUploaderProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface UploadProgress {
  file: File;
  progress: number;
  error?: string;
}

export default function ImageUploader({ productId, images, onImagesChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [editingAlt, setEditingAlt] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `${file.name}: Unsupported file type. Use JPEG, PNG, WebP or GIF.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File too large. Maximum size is 5 MB.`;
    }
    return null;
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const errors: string[] = [];
    const validFiles: File[] = [];

    for (const f of fileArray) {
      const err = validateFile(f);
      if (err) errors.push(err);
      else validFiles.push(f);
    }

    if (validFiles.length === 0) {
      if (errors.length) alert(errors.join('\n'));
      return;
    }

    setUploading(true);
    const progressList: UploadProgress[] = validFiles.map(f => ({ file: f, progress: 0 }));
    setUploads(progressList);

    const currentImageCount = images.length;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, progress: 30 } : u));

      const { path, error } = await uploadImage(productId, file);

      if (error) {
        setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, progress: 100, error } : u));
        continue;
      }

      setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, progress: 70 } : u));

      // Insert DB record
      const displayOrder = currentImageCount + i;
      const isPrimary = currentImageCount === 0 && i === 0;

      const { error: dbError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          storage_path: path,
          alt_text: '',
          display_order: displayOrder,
          is_primary: isPrimary,
        });

      if (dbError) {
        setUploads(prev => prev.map((u, idx) =>
          idx === i ? { ...u, progress: 100, error: dbError.message } : u
        ));
      } else {
        setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, progress: 100 } : u));
      }
    }

    if (errors.length) alert(errors.join('\n'));

    setUploading(false);
    setTimeout(() => setUploads([]), 1500);
    onImagesChange();
  }, [productId, images.length, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleRemove = async (img: ProductImage) => {
    if (!confirm('Remove this image?')) return;

    await deleteImage(img.storage_path);
    await supabase.from('product_images').delete().eq('id', img.id);

    // If we removed the primary, make the next one primary
    if (img.is_primary) {
      const remaining = images.filter(i => i.id !== img.id);
      if (remaining.length > 0) {
        await supabase
          .from('product_images')
          .update({ is_primary: true })
          .eq('id', remaining[0].id);
      }
    }
    onImagesChange();
  };

  const handleSetPrimary = async (img: ProductImage) => {
    // Unset all, then set this one
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId);

    await supabase
      .from('product_images')
      .update({ is_primary: true })
      .eq('id', img.id);

    onImagesChange();
  };

  const handleSaveAlt = async (imgId: string) => {
    await supabase
      .from('product_images')
      .update({ alt_text: altText })
      .eq('id', imgId);

    setEditingAlt(null);
    setAltText('');
    onImagesChange();
  };

  const handleReorder = async (imgId: string, direction: 'up' | 'down') => {
    const sorted = [...images].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex(i => i.id === imgId);
    if (idx < 0) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const orderA = sorted[idx].display_order;
    const orderB = sorted[swapIdx].display_order;

    await supabase.from('product_images').update({ display_order: orderB }).eq('id', sorted[idx].id);
    await supabase.from('product_images').update({ display_order: orderA }).eq('id', sorted[swapIdx].id);

    onImagesChange();
  };

  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-text">Product Images</label>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-burgundy bg-burgundy/5' : 'border-border hover:border-burgundy/50'
        }`}
      >
        <Upload size={24} className="mx-auto text-text-muted mb-2" />
        <p className="text-sm text-text-muted">
          Drop images here or <span className="text-burgundy underline">browse</span>
        </p>
        <p className="text-xs text-text-muted mt-1">JPEG, PNG, WebP or GIF. Max 5 MB each.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="truncate flex-1">{u.file.name}</span>
              {u.error ? (
                <span className="text-error text-xs">{u.error}</span>
              ) : (
                <div className="w-24 h-1.5 bg-ivory-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-burgundy transition-all duration-300"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image grid */}
      {sortedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sortedImages.map((img, idx) => (
            <div
              key={img.id}
              className={`relative border group ${
                img.is_primary ? 'border-burgundy' : 'border-border'
              } bg-white`}
            >
              {/* Image */}
              <div className="aspect-square bg-ivory flex items-center justify-center overflow-hidden">
                <img
                  src={getPublicImageUrl(img.storage_path)}
                  alt={img.alt_text || 'Product image'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Primary badge */}
              {img.is_primary && (
                <div className="absolute top-1 left-1 bg-burgundy text-white text-[10px] px-1.5 py-0.5">
                  Primary
                </div>
              )}

              {/* Hover actions */}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!img.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(img)}
                    className="p-1 bg-white/90 border border-border hover:border-burgundy text-text-muted hover:text-burgundy"
                    title="Set as primary"
                  >
                    <Star size={12} />
                  </button>
                )}
                <button
                  onClick={() => handleRemove(img)}
                  className="p-1 bg-white/90 border border-border hover:border-error text-text-muted hover:text-error"
                  title="Remove"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Reorder + alt text */}
              <div className="p-2 space-y-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleReorder(img.id, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 text-text-muted hover:text-text disabled:opacity-30"
                    title="Move up"
                  >
                    <GripVertical size={12} />
                  </button>
                  {editingAlt === img.id ? (
                    <div className="flex-1 flex gap-1">
                      <input
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                        className="flex-1 text-[10px] border border-border px-1 py-0.5"
                        placeholder="Alt text"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveAlt(img.id)}
                        className="text-[10px] text-burgundy hover:underline"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingAlt(img.id); setAltText(img.alt_text || ''); }}
                      className="flex-1 text-left text-[10px] text-text-muted hover:text-text truncate"
                      title="Edit alt text"
                    >
                      {img.alt_text || 'Add alt text'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sortedImages.length === 0 && !uploading && (
        <div className="flex items-center gap-2 text-sm text-text-muted py-4">
          <ImageIcon size={16} />
          No images uploaded yet.
        </div>
      )}
    </div>
  );
}
