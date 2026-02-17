import { useState, useRef } from 'react';
import { ChannelDef } from '../types';

interface UseChannelMenuProps {
  channels: ChannelDef[];
  activeChannelId: string;
  viewMode: 'home' | 'channel';
  currentChannelPlaylists: any[]; // Using any for now
  setActiveCategory: (category: any) => void; // Using any for now
  setIsFetchAllMode: (fetch: boolean) => void;
  setCurrentPage: (page: number) => void;
  setRefreshKey: (key: number) => void;
  setVideoCache: (cache: Record<string, any>) => void; // Using Record<string, any> for now
  activeCategory: any; // Using any for now
  handleRenameChannel: (channelId: string, newName: string) => void;
  handleRemoveChannel: (channelId: string) => void;
}

interface UseChannelMenuResult {
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
  activeMenuChannel: ChannelDef | undefined;
  handleChannelMenuTrigger: (e: React.MouseEvent, channel: ChannelDef) => void;
  closeChannelMenu: () => void;
  handleRenameChannelSave: () => void;
  handleRemoveChannel: (channelId: string) => void;
  handleRefresh: (fetchAll?: boolean) => void;
  channelInputRef: React.RefObject<HTMLInputElement>;
  channelMenuRef: React.RefObject<HTMLDivElement>;
}

export const useChannelMenu = ({
  channels,
  activeChannelId,
  viewMode,
  currentChannelPlaylists,
  setActiveCategory,
  setIsFetchAllMode,
  setCurrentPage,
  setRefreshKey,
  setVideoCache,
  activeCategory,
  handleRenameChannel,
  handleRemoveChannel,
}: UseChannelMenuProps): UseChannelMenuResult => {
  const [activeChannelMenuId, setActiveChannelMenuId] = useState<string | null>(null);
  const [channelMenuPosition, setChannelMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [channelEditName, setChannelEditName] = useState('');
  const channelMenuRef = useRef<HTMLDivElement>(null);
  const channelInputRef = useRef<HTMLInputElement>(null);

  const activeMenuChannel = activeChannelMenuId
    ? channels.find(c => c.id === activeChannelMenuId)
    : undefined;

  const handleChannelMenuTrigger = (e: React.MouseEvent, channel: ChannelDef) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();

    const MENU_WIDTH = 256;
    let left = rect.left + rect.width / 2 - MENU_WIDTH / 2;
    const top = rect.bottom + 8;

    const padding = 16;
    if (left < padding) {
      left = padding;
    } else if (left + MENU_WIDTH > window.innerWidth - padding) {
      left = window.innerWidth - MENU_WIDTH - padding;
    }

    setChannelMenuPosition({ top, left });
    setActiveChannelMenuId(channel.id);
    setChannelEditName(channel.label);
    setIsEditingChannel(false);
  };

  const closeChannelMenu = () => {
    setActiveChannelMenuId(null);
    setChannelMenuPosition(null);
    setIsEditingChannel(false);
  };

  const handleRenameChannelSave = () => {
    if (activeChannelMenuId && channelEditName.trim()) {
      handleRenameChannel(activeChannelMenuId, channelEditName.trim());
      closeChannelMenu();
    }
  };

  const handleRemoveChannelClick = (channelId: string) => {
    handleRemoveChannel(channelId);
    closeChannelMenu();
  };

  const handleRefresh = (fetchAll: boolean = false) => {
    if (!activeCategory && viewMode !== 'home') return;

    if (viewMode === 'home') {
      setRefreshKey(1);
      return;
    }

    setIsFetchAllMode(fetchAll);
    setCurrentPage(1);

    setVideoCache((prev: Record<string, unknown>) => {
      const next = { ...prev };
      if (activeCategory) delete next[activeCategory.id];
      return next;
    });
    setRefreshKey(1);
  };

  return {
    activeChannelMenuId,
    setActiveChannelMenuId,
    channelMenuPosition,
    setChannelMenuPosition,
    isEditingChannel,
    setIsEditingChannel,
    channelEditName,
    setChannelEditName,
    activeMenuChannel,
    handleChannelMenuTrigger,
    closeChannelMenu,
    handleRenameChannelSave,
    handleRemoveChannel: handleRemoveChannelClick,
    handleRefresh,
    channelInputRef,
    channelMenuRef,
  };
};
