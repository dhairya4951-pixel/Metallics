import { useState, useEffect } from 'react';
import { getSettings } from '../../services/settings';
import Spinner from '../../components/ui/Spinner';

export default function AboutPage() {
  const [aboutContent, setAboutContent] = useState<string | null>(null);
  const [brandTagline, setBrandTagline] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then(settings => {
      setAboutContent(settings.about_content || null);
      setBrandTagline(settings.brand_tagline || '');
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="text-center mb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted mb-4">Our Story</p>
        <h1 className="font-serif text-3xl md:text-4xl text-text">About Us</h1>
      </div>

      <div className="space-y-6 text-sm text-text-muted leading-relaxed">
        {aboutContent ? (
          <div className="whitespace-pre-wrap">{aboutContent}</div>
        ) : (
          <>
            <p>
              Welcome to our jewellery collection. Content for this page can be configured
              through the admin panel settings.
            </p>
            {brandTagline && (
              <p className="font-serif text-lg italic text-burgundy text-center py-4">
                {brandTagline}
              </p>
            )}
          </>
        )}
      </div>

      {/* Decorative element */}
      <div className="flex items-center justify-center py-12">
        <div className="h-px w-12 bg-border" />
        <span className="mx-4 font-serif text-lg text-burgundy/30">✦</span>
        <div className="h-px w-12 bg-border" />
      </div>
    </div>
  );
}
