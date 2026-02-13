import { useMemo } from 'react';
import { ChannelDef } from '../types';

interface UseActiveMenuChannelProps {
  activeChannelMenuId: string | null;
  channels: ChannelDef[];
}

export const useActiveMenuChannel = ({
  activeChannelMenuId,
  channels,
}: UseActiveMenuChannelProps) => {
  const activeMenuChannel = useMemo(() => {
    if (!activeChannelMenuId) return undefined;
    return channels.find(c => c.id === activeChannelMenuId);
  }, [activeChannelMenuId, channels]);

  return {
    activeMenuChannel,
  };
};
