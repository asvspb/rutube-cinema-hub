import { useState, useRef, useEffect } from 'react';

interface UseUIStateResult {
  isGridMenuOpen: boolean;
  setIsGridMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSortMenuOpen: boolean;
  setIsSortMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeChannelMenuId: string | null;
  setActiveChannelMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  channelMenuPosition: { top: number; left: number } | null;
  setChannelMenuPosition: React.Dispatch<
    React.SetStateAction<{ top: number; left: number } | null>
  >;
  isEditingChannel: boolean;
  setIsEditingChannel: React.Dispatch<React.SetStateAction<boolean>>;
  channelEditName: string;
  setChannelEditName: React.Dispatch<React.SetStateAction<string>>;
  channelMenuRef: React.RefObject<HTMLDivElement>;
  channelInputRef: React.RefObject<HTMLInputElement>;
  sortMenuRef: React.RefObject<HTMLDivElement>;
  gridMenuRef: React.RefObject<HTMLDivElement>;
  userMenuRef: React.RefObject<HTMLDivElement>;
  closeChannelMenu: () => void;
  handleChannelMenuTrigger: (e: React.MouseEvent, element: HTMLElement, width?: number) => void;
}

export const useUIState = (): UseUIStateResult => {
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [activeChannelMenuId, setActiveChannelMenuId] = useState<string | null>(null);
  const [channelMenuPosition, setChannelMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [channelEditName, setChannelEditName] = useState('');

  // Refs
  const channelMenuRef = useRef<HTMLDivElement>(null);
  const channelInputRef = useRef<HTMLInputElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const gridMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const closeChannelMenu = () => {
    setActiveChannelMenuId(null);
    setChannelMenuPosition(null);
    setIsEditingChannel(false);
  };

  const handleChannelMenuTrigger = (
    e: React.MouseEvent,
    element: HTMLElement,
    width: number = 256
  ) => {
    e.stopPropagation();
    const rect = element.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - width / 2;
    const top = rect.bottom + 8;

    const padding = 16;
    if (left < padding) {
      left = padding;
    } else if (left + width > window.innerWidth - padding) {
      left = window.innerWidth - width - padding;
    }

    setChannelMenuPosition({ top, left });
    const elementId = element.getAttribute('data-channel-id');
    if (elementId) {
      setActiveChannelMenuId(elementId);
      setChannelEditName(element.getAttribute('data-channel-name') || '');
    }
    setIsEditingChannel(false);
  };

  // Handle clicks outside of menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (sortMenuRef.current && !sortMenuRef.current.contains(target)) {
        setIsSortMenuOpen(false);
      }
      if (gridMenuRef.current && !gridMenuRef.current.contains(target)) {
        setIsGridMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (channelMenuRef.current && !channelMenuRef.current.contains(target)) {
        closeChannelMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', closeChannelMenu, { capture: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', closeChannelMenu, { capture: true });
    };
  }, []);

  return {
    isGridMenuOpen,
    setIsGridMenuOpen,
    isUserMenuOpen,
    setIsUserMenuOpen,
    isSortMenuOpen,
    setIsSortMenuOpen,
    activeChannelMenuId,
    setActiveChannelMenuId,
    channelMenuPosition,
    setChannelMenuPosition,
    isEditingChannel,
    setIsEditingChannel,
    channelEditName,
    setChannelEditName,
    channelMenuRef,
    channelInputRef,
    sortMenuRef,
    gridMenuRef,
    userMenuRef,
    closeChannelMenu,
    handleChannelMenuTrigger,
  };
};
