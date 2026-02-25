import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { MainContent } from './components/MainContent';
import { AuthModal } from './components/Auth/AuthModal';
import { useAppComposition } from './hooks/useAppComposition';
import { useAuth } from './hooks/useAuth';

const AppContent: React.FC = () => {
  const { navigationProps, mainContentProps } = useAppComposition();
  const { isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Override the login/logout handlers in navigationProps
  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
    navigationProps.setIsUserMenuOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    navigationProps.setIsLoggedIn(false);
    navigationProps.setIsUserMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#000917] text-white">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
      >
        Перейти к основному контенту
      </a>
      <Navigation
        {...navigationProps}
        isLoggedIn={isAuthenticated}
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogoutClick}
      />
      <MainContent {...mainContentProps} />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
      />
    </div>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;
