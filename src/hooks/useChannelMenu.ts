import { useState } from 'react';
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
}: UseChannelMenuProps): UseChannelMenuResult => {
  const [activeChannelMenuId, setActiveChannelMenuId] = useState<string | null>(null);
  const [channelMenuPosition, setChannelMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [channelEditName, setChannelEditName] = useState('');

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
      // This would need to call the channels hook function
      closeChannelMenu();
    }
  };

  const handleRemoveChannel = (channelId: string) => {
    // This would need to call the channels hook function
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

    setVideoCache(prev => {
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
    handleRemoveChannel,
    handleRefresh,
  };
};
