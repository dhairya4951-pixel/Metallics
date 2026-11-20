import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../ui/Spinner';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="text-sm text-text-muted mt-2">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
