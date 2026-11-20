import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { getProductBySlug } from '../../services/products';
import { useCart } from '../../contexts/CartContext';
import type { Product } from '../../types/database';
import ImageGallery from '../../components/product/ImageGallery';
import ProductInfo from '../../components/product/ProductInfo';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function fetchProduct() {
      setLoading(true);
      setError(null);

      try {
        const data = await getProductBySlug(slug!);
        if (cancelled) return;

        setProduct(data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProduct();
    return () => { cancelled = true; };
  }, [slug]);

  // Scroll to top on slug change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const handleAddToCart = (quantity: number = 1) => {
    if (product) addItem(product.id, quantity);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Catalog
        </Link>
      </nav>

      {/* Content */}
      {loading ? (
        <div className="py-20">
          <Spinner />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load product"
          message={error}
          onRetry={() => window.location.reload()}
        />
      ) : !product ? (
        <EmptyState
          title="Product not found"
          message="The product you are looking for does not exist or is no longer available."
          action={
            <Link to="/catalog">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-burgundy text-white text-sm font-medium tracking-wide hover:bg-burgundy-light transition-colors cursor-pointer">
                Browse Catalogue
              </button>
            </Link>
          }
        />
      ) : !product.is_available ? (
        <EmptyState
          title="Currently Unavailable"
          message={`"${product.name}" is not available at this time. Please check back later or browse other products.`}
          action={
            <Link to="/catalog">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-burgundy text-white text-sm font-medium tracking-wide hover:bg-burgundy-light transition-colors cursor-pointer">
                Browse Catalogue
              </button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
          {/* Image gallery — left */}
          <div>
            <ImageGallery
              images={product.images || []}
              productName={product.name}
            />
          </div>

          {/* Product info — right */}
          <div className="md:sticky md:top-8 md:self-start">
            <ProductInfo
              product={product}
              onAddToCart={handleAddToCart}
            />
          </div>
        </div>
      )}
    </div>
  );
}
