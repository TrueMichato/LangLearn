import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import { activateModal } from '../lib/modal-focus';

interface ModalFocusOptions {
  isOpen: boolean;
  dialogRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onEscape?: () => void;
  layer?: number;
  focusKey?: string | number;
}

/**
 * Put dialogRef on a named role="dialog" aria-modal="true" tabIndex={-1} surface.
 * The highest layer (then innermost/latest modal) owns focus and background
 * inertness. Omit onEscape for a non-dismissible dialog. Changing focusKey moves
 * focus to the current initialFocusRef without closing/reopening the modal.
 * Include a clickable backdrop inside dialogRef so it is not made inert.
 * focusInitial() is safe after async work: it does nothing when closed/covered.
 */
export function useModalFocus({
  isOpen, dialogRef, initialFocusRef, onEscape, layer = 60, focusKey,
}: ModalFocusOptions) {
  const latest = useRef({ initialFocusRef, onEscape });
  const activation = useRef<ReturnType<typeof activateModal> | null>(null);

  useLayoutEffect(() => {
    latest.current = { initialFocusRef, onEscape };
  });

  useLayoutEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const modal = activateModal(dialogRef.current, {
      layer,
      initialFocus: () => latest.current.initialFocusRef?.current ?? null,
      onEscape: () => latest.current.onEscape?.(),
    });
    activation.current = modal;
    return () => {
      activation.current = null;
      modal.deactivate();
    };
  }, [isOpen, dialogRef, layer]);

  useLayoutEffect(() => {
    activation.current?.focusInitial();
  }, [focusKey, initialFocusRef]);

  const focusInitial = useCallback(() => activation.current?.focusInitial(), []);
  return { focusInitial };
}
