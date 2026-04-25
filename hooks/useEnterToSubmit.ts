'use client';

import { useEffect, type RefObject } from 'react';

// Enter advances the wizard step. Skipped only for text inputs and textareas,
// where Enter naturally submits the form (text input) or types a newline
// (textarea). On any other element — including buttons — we preventDefault to
// stop the focused control from re-activating, then submit the form. This
// makes "press Enter to continue" the universal accelerator across all steps.
export function useEnterToSubmit(formRef: RefObject<HTMLFormElement | null>): void {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Enter' || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
      const active = document.activeElement;
      if (active instanceof HTMLTextAreaElement) return;
      if (active instanceof HTMLInputElement) {
        const textTypes = ['text', 'email', 'password', 'search', 'tel', 'url', 'number'];
        if (textTypes.includes(active.type)) return;
      }
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [formRef]);
}
