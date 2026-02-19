import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { VideoCardSkeleton, VideoGridSkeleton } from '../../src/components/UIComponents';

describe('VideoCardSkeleton', () => {
  it('should render skeleton structure', () => {
    const { container } = render(<VideoCardSkeleton />);

    // Check for animate-pulse class
    const skeletonRoot = container.querySelector('.animate-pulse');
    expect(skeletonRoot).toBeTruthy();

    // Check for aspect-video (thumbnail)
    const thumbnail = container.querySelector('.aspect-video');
    expect(thumbnail).toBeTruthy();

    // Check for bg-zinc-800 (main skeleton color)
    const zincElements = container.querySelectorAll('.bg-zinc-800');
    expect(zincElements.length).toBeGreaterThan(0);
  });

  it('should have proper accessibility structure', () => {
    const { container } = render(<VideoCardSkeleton />);

    // Should be a div with flex layout
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('flex');
    expect(root.className).toContain('flex-col');
  });
});

describe('VideoGridSkeleton', () => {
  it('should render correct number of skeletons for 2 columns', () => {
    const { container } = render(<VideoGridSkeleton gridColumns={2} />);

    // Should render 2 * 2 = 4 skeletons by default
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(4);
  });

  it('should render correct number of skeletons for 3 columns', () => {
    const { container } = render(<VideoGridSkeleton gridColumns={3} />);

    // Should render 3 * 2 = 6 skeletons by default
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(6);
  });

  it('should render correct number of skeletons for 4 columns', () => {
    const { container } = render(<VideoGridSkeleton gridColumns={4} />);

    // Should render 4 * 2 = 8 skeletons by default
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(8);
  });

  it('should respect custom count prop', () => {
    const { container } = render(<VideoGridSkeleton gridColumns={3} count={12} />);

    // Should render 12 skeletons as specified
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(12);
  });

  it('should have grid layout', () => {
    const { container } = render(<VideoGridSkeleton gridColumns={3} />);

    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid');
  });

  it('should have proper accessibility attributes', () => {
    const { container } = render(<VideoGridSkeleton gridColumns={3} />);

    const grid = container.firstChild as HTMLElement;
    expect(grid.getAttribute('role')).toBe('status');
    expect(grid.getAttribute('aria-label')).toBe('Загрузка видео');

    // Should have screen reader text
    const srOnly = container.querySelector('.sr-only');
    expect(srOnly).toBeTruthy();
    expect(srOnly?.textContent).toBe('Загрузка видео...');
  });

  it('should apply correct grid classes for 2 columns', () => {
    const { container } = render(<VideoGridSkeleton gridColumns={2} />);

    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('sm:grid-cols-2');
  });

  it('should apply correct grid classes for 3 columns', () => {
    const { container } = render(<VideoGridSkeleton gridColumns={3} />);

    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('sm:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-3');
  });

  it('should apply correct grid classes for 4 columns', () => {
    const { container } = render(<VideoGridSkeleton gridColumns={4} />);

    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('sm:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-3');
    expect(grid.className).toContain('xl:grid-cols-4');
  });
});
