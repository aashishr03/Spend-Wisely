import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useFinance';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Gate every protected page on onboarding completion (modal-style enforcement)
  const onOnboarding = location.pathname === '/onboarding';
  if (!profileLoading && profile && !profile.onboarding_completed && !onOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
