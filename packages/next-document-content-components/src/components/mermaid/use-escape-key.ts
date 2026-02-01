'use client';

import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle ESC key press.
 *
 * @remarks
 * Uses a ref to store the callback to avoid re-registering the event
 * listener when the callback changes. This follows the advanced-event-handler-refs
 * pattern for stable callback references.
 *
 * @param onEscape - Callback function to execute when ESC key is pressed
 *
 * @example
 * ```tsx
 * function Modal({ onClose }: { onClose: () => void }) {
 *   useEscapeKey(onClose);
 *   return <div className="modal">...</div>;
 * }
 * ```
 */
export function useEscapeKey(onEscape: () => void): void {
  const callbackRef = useRef(onEscape);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    callbackRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callbackRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}

export default useEscapeKey;
