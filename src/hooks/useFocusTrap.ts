/**
 * useFocusTrap - Hook for trapping focus within a container (for modals, dialogs)
 * Implements WCAG 2.1 focus management requirements
 */
import { useEffect, useCallback, useRef } from 'react';

interface UseFocusTrapOptions {
  isActive: boolean;
  onEscape?: () => void;
  initialFocusSelector?: string;
}

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(options: UseFocusTrapOptions) {
  const { isActive, onEscape, initialFocusSelector } = options;
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter(el => el.offsetParent !== null && !el.getAttribute('aria-hidden'));
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isActive || !containerRef.current) return;

      // Handle Escape key
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      // Handle Tab key for focus trap
      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [isActive, onEscape, getFocusableElements]
  );

  useEffect(() => {
    if (isActive) {
      // Store the currently focused element to restore later
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Add event listener for keyboard navigation
      document.addEventListener('keydown', handleKeyDown);

      // Set initial focus
      requestAnimationFrame(() => {
        if (!containerRef.current) return;

        if (initialFocusSelector) {
          const initialElement =
            containerRef.current.querySelector<HTMLElement>(initialFocusSelector);
          if (initialElement) {
            initialElement.focus();
            return;
          }
        }

        // Default: focus the first focusable element
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          // If no focusable elements, focus the container itself
          containerRef.current.focus();
        }
      });

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Restore focus when trap is deactivated
      if (previousActiveElement.current) {
        requestAnimationFrame(() => {
          previousActiveElement.current?.focus();
        });
      }
    }
  }, [isActive, handleKeyDown, initialFocusSelector, getFocusableElements]);

  return containerRef;
}
