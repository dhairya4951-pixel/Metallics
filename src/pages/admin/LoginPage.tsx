import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdmin, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: loginError } = await signIn(email, password);

    if (loginError) {
      setError(loginError);
      setLoading(false);
    }
    // If successful, the auth state change will trigger the redirect
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center bg-burgundy mb-4">
            <span className="text-white font-serif text-lg font-bold">M</span>
          </div>
          <h1 className="font-serif text-2xl text-text">Admin Login</h1>
          <p className="text-sm text-text-muted mt-2">Sign in to manage your catalogue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            disabled={loading}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
          <Button type="submit" className="w-full" loading={loading}>
            <LogIn size={16} />
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
