import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthService from '@/services/auth.service';

/**
 * Renders children only when session is valid (user present and JWT not expired).
 * Otherwise redirects to login with returnUrl so user can be sent back after login.
 */
export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!AuthService.isSessionValid()) {
      const returnUrl = location.pathname && location.pathname !== '/'
        ? encodeURIComponent(location.pathname + (location.search || ''))
        : '';
      navigate(returnUrl ? `/login?returnUrl=${returnUrl}` : '/login', { replace: true });
    }
  }, [navigate, location.pathname, location.search]);

  if (!AuthService.isSessionValid()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Checking session...</p>
      </div>
    );
  }

  return children;
}
