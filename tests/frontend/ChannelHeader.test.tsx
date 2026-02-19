import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChannelHeader } from '../../src/components/ChannelHeader';

describe('ChannelHeader Fallback UI', () => {
  it('should render fallback UI when channelInfo is null and not loading', () => {
    render(<ChannelHeader channelInfo={null} isLoading={false} fallbackTitle="Тестовый Канал" />);

    expect(screen.getByText('Тестовый Канал')).toBeInTheDocument();
    expect(screen.getByText('Информация недоступна')).toBeInTheDocument();
  });

  it('should render fallback UI with default title when fallbackTitle is undefined', () => {
    render(<ChannelHeader channelInfo={null} isLoading={false} />);

    expect(screen.getByText('Канал')).toBeInTheDocument();
    expect(screen.getByText('Информация недоступна')).toBeInTheDocument();
  });

  it('should render loading skeleton when isLoading is true', () => {
    const { container } = render(<ChannelHeader channelInfo={null} isLoading={true} />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render channel info when available', () => {
    const mockInfo = {
      title: 'Real Channel',
      subscribers: '1000',
      avatarUrl: 'avatar.jpg',
      bannerUrl: 'banner.jpg',
    };

    render(<ChannelHeader channelInfo={mockInfo} isLoading={false} />);
    expect(screen.getByText('Real Channel')).toBeInTheDocument();
    expect(screen.getByText('1000 подписчиков')).toBeInTheDocument();
  });

  it('should show initials in fallback avatar', () => {
    render(
      <ChannelHeader channelInfo={null} isLoading={false} fallbackTitle="Мой Тестовый Канал" />
    );

    // getInitials('Мой Тестовый Канал') = 'МТ'
    expect(screen.getByText('МТ')).toBeInTheDocument();
  });

  it('should show "Подписчики скрыты" when subscribers is 0', () => {
    const mockInfo = {
      title: 'Channel',
      subscribers: '0',
      avatarUrl: '',
      bannerUrl: '',
    };

    render(<ChannelHeader channelInfo={mockInfo} isLoading={false} />);
    expect(screen.getByText('Подписчики скрыты')).toBeInTheDocument();
  });

  it('should show "Без названия" when title is empty', () => {
    const mockInfo = {
      title: '',
      subscribers: '100',
      avatarUrl: '',
      bannerUrl: '',
    };

    render(<ChannelHeader channelInfo={mockInfo} isLoading={false} />);
    expect(screen.getByText('Без названия')).toBeInTheDocument();
  });
});
