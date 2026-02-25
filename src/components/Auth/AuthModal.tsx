import React, { useState } from 'react';
import { X, User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

type Mode = 'login' | 'register';

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { login, register, error, clearError, loading } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Validate form
  const validateForm = (): boolean => {
    setLocalError(null);

    if (!username.trim()) {
      setLocalError('Username is required');
      return false;
    }

    if (username.trim().length < 3) {
      setLocalError('Username must be at least 3 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      setLocalError('Username can only contain letters, numbers, underscores, and hyphens');
      return false;
    }

    if (!password) {
      setLocalError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      clearError();
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password);
      }
      onClose();
      resetForm();
    } catch {
      // Error is handled by context
    }
  };

  // Reset form
  const resetForm = () => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setLocalError(null);
  };

  // Switch mode
  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setLocalError(null);
    clearError();
  };

  if (!isOpen) return null;

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4 p-6 border border-gray-700">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-white mb-6">
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </h2>

        {/* Error message */}
        {displayError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {displayError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="your_username"
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={loading}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={loading}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Switch mode link */}
        <p className="mt-4 text-center text-gray-400 text-sm">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={switchMode}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        {/* Simple password hint (register only) */}
        {mode === 'register' && (
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400">
            <p className="font-medium text-gray-300 mb-1">Requirements:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Username: at least 3 characters (letters, numbers, _ -)</li>
              <li>Password: at least 6 characters</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
