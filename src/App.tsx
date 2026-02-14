import React from 'react';
import { Navigation } from './components/Navigation';
import { MainContent } from './components/MainContent';
import { useAppComposition } from './hooks/useAppComposition';

const App: React.FC = () => {
  const { navigationProps, mainContentProps } = useAppComposition();

  return (
    <div className="min-h-screen bg-[#000917] text-white">
      <Navigation {...navigationProps} />
      <MainContent {...mainContentProps} />
    </div>
  );
};

export default App;
