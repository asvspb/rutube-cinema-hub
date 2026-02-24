import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Hook to access auth context
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Hook to require authentication
 * Returns auth state and redirects if not authenticated
 */
export function useRequireAuth() {
  const auth = useAuth();

  return {
    ...auth,
    isAuthReady: !auth.loading,
  };
}

/**
 * Hook for optional authentication
 * Returns user if authenticated, but doesn't require it
 */
export function useOptionalAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    return {
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
    };
  }

  return {
    user: context.user,
    loading: context.loading,
    error: context.error,
    isAuthenticated: context.isAuthenticated,
  };
}
