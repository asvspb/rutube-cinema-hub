import { useState } from 'react';

interface UseGridClassResult {
  gridColumns: 2 | 3 | 4;
  setGridColumns: React.Dispatch<React.SetStateAction<2 | 3 | 4>>;
  getGridClass: () => string;
}

export const useGridClass = (initialGridColumns: 2 | 3 | 4): UseGridClassResult => {
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(initialGridColumns);

  const getGridClass = () => {
    switch (gridColumns) {
      case 2:
        return 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8';
      case 3:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8';
      case 4:
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8';
    }
  };

  return {
    gridColumns,
    setGridColumns,
    getGridClass,
  };
};
