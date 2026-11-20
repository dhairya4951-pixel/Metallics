import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { CheckCircle, Copy, Check, ExternalLink, ClipboardX, FileText } from 'lucide-react';
import { useClipboard } from '../../hooks/useClipboard';
import { getSettings } from '../../services/settings';
import { formatPrice } from '../../lib/utils';
import Button from '../../components/ui/Button';

interface ConfirmationState {
  orderCode: string;
  publicToken: string;
  totalItems: number;
  subtotal: number;
  currencyCode: string;
  items: {
    product_name: string;
    product_slug: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }[];
  summaryText: string;
  clipboardSuccess: boolean;
}

export default function OrderConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ConfirmationState | null;

  const { copied, copy } = useClipboard(3000);
  const [copyFailed, setCopyFailed] = useState(false);
  const [instagramUsername, setInstagramUsername] = useState<string | null>(null);
  const [showManualText, setShowManualText] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // If no state, redirect to cart (user refreshed or came directly)
  useEffect(() => {
    if (!state) {
      navigate('/cart', { replace: true });
    }
  }, [state, navigate]);

  // Fetch Instagram username from settings
  useEffect(() => {
    getSettings().then(settings => {
      setInstagramUsername(settings.instagram_username || null);
    });
  }, []);

  // Show initial clipboard status
  useEffect(() => {
    if (state && !state.clipboardSuccess) {
      setCopyFailed(true);
    }
  }, [state]);

  if (!state) {
    return null;
  }

  const handleCopy = async () => {
    setCopyFailed(false);
    const success = await copy(state.summaryText);
    if (!success) {
      setCopyFailed(true);
    }
  };

  const handleSelectText = () => {
    setShowManualText(true);
    // Focus and select after render
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        textAreaRef.current.select();
      }
    }, 100);
  };

  const cleanInstagramHandle = instagramUsername
    ? instagramUsername.replace(/^@/, '').trim()
    : null;

  const instagramUrl = cleanInstagramHandle
    ? `https://www.instagram.com/${cleanInstagramHandle}/`
    : null;

  const handleOpenInstagram = () => {
    if (!instagramUrl) return;
    window.open(instagramUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-12 md:py-20">
      <div className="space-y-8">
        {/* Success icon & heading */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 flex items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle size={32} />
            </div>
          </div>

          <h1 className="font-serif text-2xl md:text-3xl text-text">
            We've got your cart!
          </h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-md mx-auto">
            Your order has been saved successfully.
            {state.clipboardSuccess
              ? ' The order summary has been copied to your clipboard.'
              : ' Please copy the order summary below and send it to us on Instagram.'}
          </p>
        </div>

        {/* Order reference */}
        <div className="border border-border bg-white p-6 text-center">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Your Order Reference</p>
          <p className="font-serif text-xl text-burgundy tracking-wider">
            {state.orderCode}
          </p>
          <div className="mt-3 flex justify-center gap-6 text-sm text-text-muted">
            <span>{state.totalItems} {state.totalItems === 1 ? 'item' : 'items'}</span>
            <span>{formatPrice(state.subtotal, state.currencyCode)}</span>
          </div>
        </div>

        {/* Clipboard status */}
        {copyFailed && !copied && (
          <div className="flex items-start gap-3 border border-warning/30 bg-warning/5 p-4 text-sm">
            <ClipboardX size={18} className="text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-text">Could not copy automatically</p>
              <p className="text-text-muted mt-1">
                Use the "Copy Order Details" button below, or{' '}
                <button
                  onClick={handleSelectText}
                  className="text-burgundy underline hover:text-burgundy-light transition-colors"
                >
                  select the text manually
                </button>.
              </p>
            </div>
          </div>
        )}

        {copied && (
          <div className="flex items-center gap-3 border border-success/30 bg-success/5 p-4 text-sm text-success">
            <Check size={18} className="shrink-0" />
            <p className="font-medium">Order details copied to clipboard!</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={handleCopy} disabled={copied}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Order Details'}
          </Button>

          {instagramUrl ? (
            <Button
              onClick={handleOpenInstagram}
              className="w-full sm:w-auto"
            >
              <ExternalLink size={16} />
              Open @{cleanInstagramHandle} on Instagram
            </Button>
          ) : (
            <div className="text-center">
              <Button disabled>
                <ExternalLink size={16} />
                Open Instagram
              </Button>
              <p className="text-[11px] text-text-muted mt-1.5">
                Instagram handle not configured
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="border border-border bg-ivory-dark/50 p-5 space-y-3">
          <h3 className="text-sm font-medium text-text">What to do next</h3>
          <ol className="text-sm text-text-muted space-y-2 list-decimal list-inside">
            <li>
              {state.clipboardSuccess
                ? 'Your order details are already in your clipboard.'
                : 'Click "Copy Order Details" above.'}
            </li>
            <li>
              Open{' '}
              {instagramUrl ? (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-burgundy underline hover:text-burgundy-light"
                >
                  @{cleanInstagramHandle} on Instagram
                </a>
              ) : (
                'our Instagram page'
              )}{' '}
              and click "Message".
            </li>
            <li>Paste the order details into the message and send.</li>
            <li>We will confirm your order and arrange delivery.</li>
          </ol>
          <p className="text-xs text-text-muted/70 pt-1">
            Your order is saved on our end. Sending the DM helps us respond quickly.
          </p>
        </div>

        {/* Manual text fallback */}
        {showManualText && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text flex items-center gap-2">
                <FileText size={14} />
                Order Summary Text
              </label>
              <button
                onClick={() => setShowManualText(false)}
                className="text-xs text-text-muted hover:text-text transition-colors"
              >
                Hide
              </button>
            </div>
            <textarea
              ref={textAreaRef}
              readOnly
              value={state.summaryText}
              rows={12}
              className="w-full border border-border bg-white px-4 py-3 text-xs text-text font-mono leading-relaxed focus:border-burgundy focus:outline-none resize-y"
              onFocus={(e) => e.target.select()}
            />
            <p className="text-[11px] text-text-muted">
              Select all text above (Ctrl+A / Cmd+A), then copy (Ctrl+C / Cmd+C).
            </p>
          </div>
        )}

        {/* View order & continue links */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 text-sm">
          <Link
            to={`/order/${state.publicToken}`}
            className="text-burgundy hover:text-burgundy-light transition-colors text-center"
          >
            View Order Details →
          </Link>
          <span className="hidden sm:inline text-border">|</span>
          <Link
            to="/catalog"
            className="text-text-muted hover:text-text transition-colors text-center"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
