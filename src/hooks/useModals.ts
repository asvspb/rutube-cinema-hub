import { useState } from 'react';
import { RutubeVideo, ChannelDef } from '../types';

interface UseModalsResult {
  // Video modal
  selectedVideo: RutubeVideo | null;
  setSelectedVideo: React.Dispatch<React.SetStateAction<RutubeVideo | null>>;

  // Add playlist modal
  isAddPlaylistModalOpen: boolean;
  setIsAddPlaylistModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Add channel modal
  isAddChannelModalOpen: boolean;
  setIsAddChannelModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Formula settings modal
  isFormulaModalOpen: boolean;
  setIsFormulaModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Import playlists modal
  channelToImport: ChannelDef | null;
  setChannelToImport: React.Dispatch<React.SetStateAction<ChannelDef | null>>;

  // History modal
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // KinoRate modal
  isKinoRateOpen: boolean;
  setIsKinoRateOpen: React.Dispatch<React.SetStateAction<boolean>>;
  kinoRateQuery: string;
  setKinoRateQuery: React.Dispatch<React.SetStateAction<string>>;
  kinoRateContext: string | null;
  setKinoRateContext: React.Dispatch<React.SetStateAction<string | null>>;

  // Confirm modal
  isConfirmModalOpen: boolean;
  setIsConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  confirmMessage: string;
  setConfirmMessage: React.Dispatch<React.SetStateAction<string>>;
  confirmCallback: (() => void) | null;
  setConfirmCallback: (callback: (() => void) | null) => void;

  // Notification modal
  isNotificationModalOpen: boolean;
  setIsNotificationModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  notificationMessage: string;
  setNotificationMessage: React.Dispatch<React.SetStateAction<string>>;
  notificationType: 'success' | 'error' | 'warning' | 'info';
  setNotificationType: React.Dispatch<
    React.SetStateAction<'success' | 'error' | 'warning' | 'info'>
  >;

  // Open/close functions
  openKinoRate: (query?: string) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const useModals = (): UseModalsResult => {
  const [selectedVideo, setSelectedVideo] = useState<RutubeVideo | null>(null);
  const [isAddPlaylistModalOpen, setIsAddPlaylistModalOpen] = useState(false);
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [channelToImport, setChannelToImport] = useState<ChannelDef | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isKinoRateOpen, setIsKinoRateOpen] = useState(false);
  const [kinoRateQuery, setKinoRateQuery] = useState('');
  const [kinoRateContext, setKinoRateContext] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('info');

  const openKinoRate = (query: string = '') => {
    setKinoRateQuery(query);
    setKinoRateContext(query);
    setIsKinoRateOpen(true);
  };

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    setNotificationMessage(message);
    setNotificationType(type);
    setIsNotificationModalOpen(true);
  };

  return {
    // Video modal
    selectedVideo,
    setSelectedVideo,

    // Add playlist modal
    isAddPlaylistModalOpen,
    setIsAddPlaylistModalOpen,

    // Add channel modal
    isAddChannelModalOpen,
    setIsAddChannelModalOpen,

    // Formula settings modal
    isFormulaModalOpen,
    setIsFormulaModalOpen,

    // Import playlists modal
    channelToImport,
    setChannelToImport,

    // History modal
    isHistoryModalOpen,
    setIsHistoryModalOpen,

    // KinoRate modal
    isKinoRateOpen,
    setIsKinoRateOpen,
    kinoRateQuery,
    setKinoRateQuery,
    kinoRateContext,
    setKinoRateContext,

    // Confirm modal
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    confirmMessage,
    setConfirmMessage,
    confirmCallback,
    setConfirmCallback,

    // Notification modal
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    notificationMessage,
    setNotificationMessage,
    notificationType,
    setNotificationType,

    // Functions
    openKinoRate,
    showNotification,
  };
};
