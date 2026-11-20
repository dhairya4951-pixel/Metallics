import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { getSettings } from '../../services/settings';
import { supabase } from '../../lib/supabase';
import { getPublicImageUrl } from '../../services/images';
import { formatPrice } from '../../lib/utils';
import Button from '../../components/ui/Button';
import type { Product } from '../../types/database';

export default function HomePage() {
  const [brandTagline, setBrandTagline] = useState('Jewelry that highlights your individuality');
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    getSettings().then(settings => {
      if (settings.brand_tagline) setBrandTagline(settings.brand_tagline);
    });

    // Fetch featured products (up to 4)
    supabase
      .from('products')
      .select(`
        id, name, slug, price, is_available, is_featured,
        images:product_images(id, storage_path, alt_text, is_primary, display_order)
      `)
      .eq('is_available', true)
      .eq('is_featured', true)
      .order('sort_order', { ascending: true })
      .limit(4)
      .then(({ data }) => {
        if (data) setFeatured(data as unknown as Product[]);
      });
  }, []);

  const getImageUrl = (product: Product): string | null => {
    const imgs = (product.images || []) as unknown as { storage_path: string; is_primary: boolean }[];
    const primary = imgs.find(i => i.is_primary) || imgs[0];
    return primary ? getPublicImageUrl(primary.storage_path) : null;
  };

  return (
    <div>
      {/* Hero section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
              Premium Collection
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-text leading-tight">
              {brandTagline}
            </h1>
            <p className="text-sm md:text-base text-text-muted leading-relaxed max-w-lg mx-auto">
              Discover our curated collection of handcrafted jewellery, designed to celebrate the
              unique beauty in every person.
            </p>
            <div className="pt-4">
              <Link to="/catalog">
                <Button size="lg">
                  Browse Collection
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative divider */}
      <div className="flex items-center justify-center py-4">
        <div className="h-px w-16 bg-border" />
        <span className="mx-4 font-serif text-xl text-text-muted/40">✦</span>
        <div className="h-px w-16 bg-border" />
      </div>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl md:text-3xl text-text">Featured Pieces</h2>
            <p className="text-sm text-text-muted mt-2">Handpicked selections from our catalogue</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featured.map(product => {
              const imgUrl = getImageUrl(product);
              return (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className="group block"
                >
                  <div className="aspect-[3/4] bg-ivory-dark overflow-hidden mb-3">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="text-center text-text-muted/40">
                          <div className="font-serif text-4xl mb-2">✦</div>
                          <p className="text-xs tracking-wider uppercase">No Image</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 className="font-serif text-sm italic text-text leading-snug">
                    &ldquo;{product.name}&rdquo;
                  </h3>
                  <p className="text-xs text-text-muted mt-1">
                    {formatPrice(product.price)}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link to="/catalog">
              <Button variant="outline">
                View All Products
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Empty featured state */}
      {featured.length === 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl md:text-3xl text-text">Featured Pieces</h2>
            <p className="text-sm text-text-muted mt-2">Handpicked selections from our catalogue</p>
          </div>
          <div className="text-center py-12">
            <p className="text-sm text-text-muted mb-4">Featured products will appear here once marked in the admin panel.</p>
            <Link to="/catalog">
              <Button variant="outline">
                Browse Catalogue
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Brand statement */}
      <section className="bg-ivory-dark border-y border-border-light">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
          <p className="font-serif text-lg md:text-xl italic text-burgundy leading-relaxed">
            &ldquo;Every piece in our collection is crafted to tell a story — your story.
            We believe jewellery should be as unique as the person wearing it.&rdquo;
          </p>
        </div>
      </section>
    </div>
  );
}
