import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { getSettings, updateSettings } from '../../services/settings';
import type { SiteSettings } from '../../types/database';
import { DEFAULT_SETTINGS } from '../../lib/constants';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const s = await getSettings();
      setSettings(s);
      setLoading(false);
    }
    load();
  }, []);

  const handleChange = (key: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Strip @ from instagram username
    const cleanSettings = {
      ...settings,
      instagram_username: settings.instagram_username.replace(/^@/, ''),
    };

    const { error } = await updateSettings(cleanSettings);

    if (error) {
      alert(`Failed to save settings: ${error}`);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setSaving(false);
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-text">Settings</h1>
        <p className="text-sm text-text-muted mt-1">Configure your brand and store</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Input
          label="Brand Name"
          placeholder="Metallics"
          value={settings.brand_name}
          onChange={(e) => handleChange('brand_name', e.target.value)}
        />
        <Input
          label="Brand Tagline"
          placeholder="Jewelry that highlights your individuality"
          value={settings.brand_tagline}
          onChange={(e) => handleChange('brand_tagline', e.target.value)}
        />
        <Input
          label="Instagram Username"
          placeholder="your_instagram_handle (without @)"
          value={settings.instagram_username}
          onChange={(e) => handleChange('instagram_username', e.target.value)}
        />
        <Input
          label="Currency Code"
          placeholder="INR"
          value={settings.currency_code}
          onChange={(e) => handleChange('currency_code', e.target.value)}
        />
        <Input
          label="Currency Locale"
          placeholder="en-IN"
          value={settings.currency_locale}
          onChange={(e) => handleChange('currency_locale', e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="about" className="text-sm font-medium text-text">
            About Us Content
          </label>
          <textarea
            id="about"
            rows={6}
            placeholder="Write about your brand…"
            value={settings.about_content}
            onChange={(e) => handleChange('about_content', e.target.value)}
            className="w-full border border-border bg-white px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-burgundy focus:outline-none transition-colors resize-y"
          />
        </div>

        <div className="pt-4 flex items-center gap-4">
          <Button type="submit" loading={saving}>
            <Save size={16} />
            Save Settings
          </Button>
          {saved && (
            <span className="text-sm text-success">Settings saved successfully.</span>
          )}
        </div>
      </form>
    </div>
  );
}
