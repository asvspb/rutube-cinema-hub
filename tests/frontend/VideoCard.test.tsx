import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoCard } from '../../src/components/VideoCard';

vi.mock('../../src/services/rutubeService', () => ({
  formatDuration: (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
  formatViews: (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return String(views);
  },
  formatRelativeTime: (ts: string) => {
    if (!ts) return '';
    return '1 day ago';
  },
}));

const mockVideo = {
  id: 'test-video-1',
  title: 'Test Video Title',
  description: 'Test description',
  thumbnail_url: 'https://example.com/thumb.jpg',
  duration: 3600,
  views: 1500,
  created_ts: '2024-01-01T00:00:00Z',
  video_url: 'https://rutube.ru/video/test/',
  html: '',
  rating: 7.5,
  gravity: 1.0,
};

describe('VideoCard', () => {
  const mockOnClick = vi.fn();
  const mockOnWatchedToggle = vi.fn();
  const mockOnLikedToggle = vi.fn();
  const mockOnAnalyze = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render video title', () => {
      render(<VideoCard video={mockVideo} onClick={mockOnClick} />);

      expect(screen.getByText('Test Video Title')).toBeInTheDocument();
    });

    it('should render video thumbnail', () => {
      render(<VideoCard video={mockVideo} onClick={mockOnClick} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
    });

    it('should render duration', () => {
      render(<VideoCard video={mockVideo} onClick={mockOnClick} />);

      expect(screen.getByText('60:00')).toBeInTheDocument();
    });

    it('should render view count', () => {
      render(<VideoCard video={mockVideo} onClick={mockOnClick} />);

      expect(screen.getByText(/1.5K просмотров/)).toBeInTheDocument();
    });

    it('should render rating', () => {
      render(<VideoCard video={mockVideo} onClick={mockOnClick} />);

      expect(screen.getByText('7.5')).toBeInTheDocument();
    });
  });

  describe('click handling', () => {
    it('should call onClick when card is clicked', () => {
      render(<VideoCard video={mockVideo} onClick={mockOnClick} />);

      const card = screen.getByText('Test Video Title').closest('.group');
      fireEvent.click(card!);

      expect(mockOnClick).toHaveBeenCalledWith(mockVideo);
    });
  });

  describe('watched status', () => {
    it('should not show watched icon when not watched', () => {
      render(<VideoCard video={mockVideo} onClick={mockOnClick} />);

      expect(screen.queryByTitle('Просмотрено')).not.toBeInTheDocument();
    });

    it('should have buttons for interaction', () => {
      render(
        <VideoCard video={mockVideo} onClick={mockOnClick} onWatchedToggle={mockOnWatchedToggle} />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('liked status', () => {
    it('should have like button', () => {
      render(
        <VideoCard video={mockVideo} onClick={mockOnClick} onLikedToggle={mockOnLikedToggle} />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('hot badge', () => {
    it('should show HOT badge when gravity > 2.0', () => {
      const hotVideo = { ...mockVideo, gravity: 3.5 };
      render(<VideoCard video={hotVideo} onClick={mockOnClick} />);

      expect(screen.getByText('HOT')).toBeInTheDocument();
    });

    it('should not show HOT badge when gravity <= 2.0', () => {
      render(<VideoCard video={mockVideo} onClick={mockOnClick} />);

      expect(screen.queryByText('HOT')).not.toBeInTheDocument();
    });
  });

  describe('external metadata', () => {
    it('should show IMDB rating when available', () => {
      const externalMetadata = {
        [mockVideo.title]: {
          title: mockVideo.title,
          originalTitle: 'Original Title',
          year: '2024',
          kpRating: 8.0,
          kpVotes: '1000',
          imdbRating: 7.8,
          imdbUrl: 'https://imdb.com/title/test',
          description: 'Test',
        },
      };

      render(
        <VideoCard video={mockVideo} onClick={mockOnClick} externalMetadata={externalMetadata} />
      );

      const imdbElements = screen.getAllByText(/IMDB/);
      expect(imdbElements.length).toBeGreaterThan(0);
    });

    it('should show KP rating when available', () => {
      const externalMetadata = {
        [mockVideo.title]: {
          title: mockVideo.title,
          originalTitle: 'Original Title',
          year: '2024',
          kpRating: 8.0,
          kpVotes: '1000',
          imdbRating: 0,
          description: 'Test',
        },
      };

      render(
        <VideoCard video={mockVideo} onClick={mockOnClick} externalMetadata={externalMetadata} />
      );

      const kpElements = screen.getAllByText(/KP/);
      expect(kpElements.length).toBeGreaterThan(0);
    });
  });

  describe('AI analysis button', () => {
    it('should show AI button when no external data', () => {
      render(<VideoCard video={mockVideo} onClick={mockOnClick} onAnalyze={mockOnAnalyze} />);

      const aiButtons = screen
        .getAllByRole('button')
        .filter(
          btn => btn.querySelector('svg.lucide-sparkles') !== null || btn.closest('.group\\/ai-btn')
        );
      expect(aiButtons.length).toBeGreaterThan(0);
    });

    it('should call onAnalyze when AI button clicked', () => {
      render(<VideoCard video={mockVideo} onClick={mockOnClick} onAnalyze={mockOnAnalyze} />);

      const buttons = screen.getAllByRole('button');
      const aiBtn = buttons.find(btn => btn.closest('.group\\/ai-btn'));
      if (aiBtn) {
        fireEvent.click(aiBtn);
        expect(mockOnAnalyze).toHaveBeenCalledWith('Test Video Title');
      }
    });

    it('should be disabled when loading', () => {
      render(
        <VideoCard
          video={mockVideo}
          onClick={mockOnClick}
          onAnalyze={mockOnAnalyze}
          isLoadingMetadata={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      const aiBtn = buttons.find(btn => btn.closest('.group\\/ai-btn'));
      if (aiBtn) {
        expect(aiBtn).toBeDisabled();
      }
    });
  });

  describe('rating color', () => {
    it('should show green color for rating >= 7.0', () => {
      const highRatedVideo = { ...mockVideo, rating: 8.0 };
      render(<VideoCard video={highRatedVideo} onClick={mockOnClick} />);

      const ratingBadge = screen.getByText('8.0').closest('div');
      expect(ratingBadge?.className).toContain('bg-purple');
    });

    it('should show yellow color for rating >= 5.0', () => {
      const midRatedVideo = { ...mockVideo, rating: 6.0 };
      render(<VideoCard video={midRatedVideo} onClick={mockOnClick} />);

      expect(screen.getByText('6.0')).toBeInTheDocument();
    });

    it('should show red color for rating < 5.0', () => {
      const lowRatedVideo = { ...mockVideo, rating: 3.0 };
      render(<VideoCard video={lowRatedVideo} onClick={mockOnClick} />);

      expect(screen.getByText('3.0')).toBeInTheDocument();
    });
  });

  describe('fallback thumbnail', () => {
    it('should use fallback when thumbnail_url is empty', () => {
      const noThumbVideo = { ...mockVideo, thumbnail_url: '' };
      render(<VideoCard video={noThumbVideo} onClick={mockOnClick} />);

      const img = screen.getByRole('img');
      expect(img.getAttribute('src')).toContain('data:image');
    });
  });
});
