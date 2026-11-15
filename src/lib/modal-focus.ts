const FOCUSABLE = [
  'a[href]', 'area[href]', 'button', 'input', 'select', 'textarea',
  'iframe', 'object', 'embed', '[tabindex]', '[contenteditable="true"]',
  'audio[controls]', 'video[controls]', 'summary',
].join(',');

function isAvailable(element: HTMLElement): boolean {
  const visibility = element.ownerDocument.defaultView?.getComputedStyle(element).visibility;
  return element.isConnected
    && !element.closest('[inert], [hidden], [aria-hidden="true"]')
    && !element.matches(':disabled, input[type="hidden"]')
    && element.getClientRects().length > 0
    && visibility !== 'hidden'
    && visibility !== 'collapse';
}

export function getFocusableElements(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
    .filter((element) => (
      (element.tabIndex >= 0 || (
        element.matches('[contenteditable="true"]') && !element.hasAttribute('tabindex')
      )) && isAvailable(element)
    ))
    .sort((a, b) => (a.tabIndex > 0 ? a.tabIndex : Infinity) - (b.tabIndex > 0 ? b.tabIndex : Infinity));
}

/** Inert sibling branches, never the dialog or one of its ancestors. */
export function getModalBackgroundElements(dialog: HTMLElement, body: HTMLElement): Element[] {
  const background: Element[] = [];
  let branch: Element = dialog;
  while (branch !== body && branch.parentElement) {
    const parent = branch.parentElement;
    background.push(...Array.from(parent.children).filter((child) => child !== branch));
    branch = parent;
  }
  return background;
}

interface ModalOptions {
  initialFocus?: () => HTMLElement | null;
  onEscape?: () => void;
  layer: number;
}

interface ModalEntry extends ModalOptions {
  dialog: HTMLElement;
  opener: HTMLElement | null;
  lastFocus: HTMLElement | null;
}

interface ModalActivation {
  focusInitial: () => void;
  deactivate: () => void;
}

function createManager(document: Document) {
  const entries: ModalEntry[] = [];
  const inerted = new Map<Element, string | null>();
  let overflow = '';
  let overflowPriority = '';
  let observer: MutationObserver | undefined;
  let activeEntry: ModalEntry | undefined;

  function top() {
    const connected = entries.filter((entry) => entry.dialog.isConnected);
    const layer = Math.max(...connected.map((entry) => entry.layer));
    const peers = connected.filter((entry) => entry.layer === layer);
    return peers.findLast((entry) => !peers.some((other) => (
      other.dialog !== entry.dialog && entry.dialog.contains(other.dialog)
    )));
  }

  function restoreBackground() {
    inerted.forEach((value, element) => {
      if (value === null) element.removeAttribute('inert');
      else element.setAttribute('inert', value);
    });
    inerted.clear();
  }

  function updateBackground() {
    restoreBackground();
    const active = top();
    activeEntry = active;
    if (!active) return;
    for (const element of getModalBackgroundElements(active.dialog, document.body)) {
      inerted.set(element, element.getAttribute('inert'));
      element.setAttribute('inert', '');
    }
  }

  function focusInitial(entry: ModalEntry) {
    if (top() !== entry) return;
    const preferred = entry.initialFocus?.();
    const target = preferred && entry.dialog.contains(preferred) && isAvailable(preferred)
      ? preferred
      : getFocusableElements(entry.dialog)[0] ?? entry.dialog;
    target.focus({ preventScroll: true });
  }

  function resume(entry: ModalEntry) {
    if (entry.lastFocus && entry.dialog.contains(entry.lastFocus) && isAvailable(entry.lastFocus)) {
      entry.lastFocus.focus({ preventScroll: true });
    } else {
      focusInitial(entry);
    }
  }

  function onFocusIn(event: FocusEvent) {
    const active = top();
    if (!active) return;
    const target = event.target as HTMLElement;
    if (active.dialog.contains(target)) {
      active.lastFocus = target;
    } else {
      resume(active);
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    const active = top();
    if (!active) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      active.onEscape?.();
    } else if (event.key === 'Tab') {
      const focusable = getFocusableElements(active.dialog);
      const index = focusable.indexOf(document.activeElement as HTMLElement);
      if (focusable.length === 0) {
        event.preventDefault();
        active.dialog.focus({ preventScroll: true });
      } else if (index < 0 || (event.shiftKey ? index === 0 : index === focusable.length - 1)) {
        event.preventDefault();
        focusable[event.shiftKey ? focusable.length - 1 : 0].focus();
      }
    }
  }

  function activate(dialog: HTMLElement, options: ModalOptions): ModalActivation {
    const previous = top();
    const focused = document.activeElement as HTMLElement | null;
    const entry: ModalEntry = {
      ...options,
      dialog,
      opener: focused && dialog.contains(focused)
        ? previous?.opener ?? null
        : focused,
      lastFocus: null,
    };
    if (entries.length === 0) {
      overflow = document.body.style.getPropertyValue('overflow');
      overflowPriority = document.body.style.getPropertyPriority('overflow');
      document.body.style.setProperty('overflow', 'hidden');
      document.addEventListener('keydown', onKeyDown, true);
      document.addEventListener('focusin', onFocusIn, true);
      const Observer = document.defaultView?.MutationObserver;
      if (Observer) {
        observer = new Observer(updateBackground);
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
    entries.push(entry);
    updateBackground();
    focusInitial(entry);

    return {
      focusInitial: () => focusInitial(entry),
      deactivate: () => {
        const index = entries.indexOf(entry);
        if (index < 0) return;
        const wasTop = activeEntry === entry;
        entries.splice(index, 1);
        updateBackground();
        if (entries.length === 0) {
          observer?.disconnect();
          observer = undefined;
          document.removeEventListener('keydown', onKeyDown, true);
          document.removeEventListener('focusin', onFocusIn, true);
          if (overflow) document.body.style.setProperty('overflow', overflow, overflowPriority);
          else document.body.style.removeProperty('overflow');
        }
        if (!wasTop) return;
        const next = top();
        if (entry.opener && typeof entry.opener.focus === 'function' && isAvailable(entry.opener)
          && (!next || next.dialog.contains(entry.opener))) {
          entry.opener.focus({ preventScroll: true });
        } else if (next) {
          resume(next);
        }
      },
    };
  }

  return { activate };
}

const managers = new WeakMap<Document, ReturnType<typeof createManager>>();

export function activateModal(dialog: HTMLElement, options: ModalOptions): ModalActivation {
  const document = dialog.ownerDocument;
  let manager = managers.get(document);
  if (!manager) {
    manager = createManager(document);
    managers.set(document, manager);
  }
  return manager.activate(dialog, options);
}
