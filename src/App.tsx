import React from 'react';
import { Navigation } from './components/Navigation';
import { MainContent } from './components/MainContent';
import { useAppComposition } from './hooks/useAppComposition';

const App: React.FC = () => {
  const { navigationProps, mainContentProps } = useAppComposition();

  return (
    <div className="min-h-screen bg-[#000917] text-white">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
      >
        Перейти к основному контенту
      </a>
      <Navigation {...navigationProps} />
      <MainContent {...mainContentProps} />
    </div>
  );
};

export default App;
