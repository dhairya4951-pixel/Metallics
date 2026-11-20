import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import { getPublicImageUrl } from '../../services/images';
import type { ProductImage } from '../../types/database';

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const activeImage = sorted[activeIndex];

  const handleImgError = (id: string) => {
    setImgErrors(prev => new Set(prev).add(id));
  };

  if (sorted.length === 0) {
    return (
      <div className="bg-ivory-dark aspect-[3/4] flex items-center justify-center">
        <div className="text-center text-text-muted/40">
          <div className="font-serif text-5xl mb-3">✦</div>
          <p className="text-sm tracking-wider uppercase">No photographs available</p>
        </div>
      </div>
    );
  }

  const getUrl = (img: ProductImage) => getPublicImageUrl(img.storage_path);

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative group bg-ivory-dark aspect-[3/4] overflow-hidden">
        {imgErrors.has(activeImage.id) ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center text-text-muted/40">
              <div className="font-serif text-5xl mb-3">✦</div>
              <p className="text-sm tracking-wider uppercase">Image unavailable</p>
            </div>
          </div>
        ) : (
          <img
            src={getUrl(activeImage)}
            alt={activeImage.alt_text || productName}
            className="h-full w-full object-cover"
            onError={() => handleImgError(activeImage.id)}
          />
        )}

        {/* Zoom button */}
        {!imgErrors.has(activeImage.id) && (
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center bg-white/80 text-text-muted hover:bg-white hover:text-text opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Enlarge image"
          >
            <ZoomIn size={16} />
          </button>
        )}

        {/* Nav arrows (only if multiple images) */}
        {sorted.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex((prev) => (prev === 0 ? sorted.length - 1 : prev - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-white/80 text-text-muted hover:bg-white hover:text-text transition-colors cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setActiveIndex((prev) => (prev === sorted.length - 1 ? 0 : prev + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-white/80 text-text-muted hover:bg-white hover:text-text transition-colors cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`shrink-0 w-16 h-16 overflow-hidden border-2 transition-colors cursor-pointer ${
                i === activeIndex ? 'border-burgundy' : 'border-transparent hover:border-border'
              }`}
              aria-label={`View image ${i + 1}`}
            >
              {imgErrors.has(img.id) ? (
                <div className="h-full w-full bg-ivory-dark flex items-center justify-center text-text-muted/30 text-[10px]">
                  ✦
                </div>
              ) : (
                <img
                  src={getUrl(img)}
                  alt={img.alt_text || `${productName} ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={() => handleImgError(img.id)}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && !imgErrors.has(activeImage.id) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-text/80 p-4"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <img
            src={getUrl(activeImage)}
            alt={activeImage.alt_text || productName}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center bg-white/20 text-white/80 hover:text-white hover:bg-white/30 transition-colors cursor-pointer"
            aria-label="Close preview"
          >
            <X size={24} />
          </button>

          {/* Lightbox navigation */}
          {sorted.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev === 0 ? sorted.length - 1 : prev - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center bg-white/20 text-white/80 hover:text-white hover:bg-white/30 transition-colors cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev === sorted.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center bg-white/20 text-white/80 hover:text-white hover:bg-white/30 transition-colors cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
