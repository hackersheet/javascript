'use client';

import { useEffect } from 'react';

/**
 * Custom hook to prevent body scrolling when active.
 *
 * @remarks
 * This hook is useful for modals and overlays that should prevent
 * the background content from scrolling while they are open.
 * The original overflow style is restored on unmount.
 *
 * @example
 * ```tsx
 * function Modal({ isOpen }: { isOpen: boolean }) {
 *   useBodyScrollLock(isOpen);
 *   if (!isOpen) return null;
 *   return <div className="modal">...</div>;
 * }
 * ```
 */
export function useBodyScrollLock(): void {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
}

export default useBodyScrollLock;
