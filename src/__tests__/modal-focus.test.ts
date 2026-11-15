import { describe, expect, it, vi } from 'vitest';
import { activateModal, getFocusableElements, getModalBackgroundElements } from '../lib/modal-focus';

// Model only the DOM operations used by the manager. These tests cover its
// decisions and cleanup, not native browser tabbing, layout, or accessibility.
class TestElement {
  children: TestElement[] = [];
  parentElement: TestElement | null = null;
  attributes = new Map<string, string>();
  tabIndex = -1;
  disabled = false;
  hiddenInput = false;
  rendered = true;
  visibility = 'visible';
  editable = false;
  candidate = false;
  styleValues = new Map<string, { value: string; priority: string }>();
  style = {
    getPropertyValue: (key: string) => this.styleValues.get(key)?.value ?? '',
    getPropertyPriority: (key: string) => this.styleValues.get(key)?.priority ?? '',
    setProperty: (key: string, value: string, priority = '') => {
      this.styleValues.set(key, { value, priority });
    },
    removeProperty: (key: string) => this.styleValues.delete(key),
  };

  readonly ownerDocument: TestDocument;

  constructor(ownerDocument: TestDocument) {
    this.ownerDocument = ownerDocument;
  }

  get isConnected(): boolean {
    return this === this.ownerDocument.body || Boolean(this.parentElement?.isConnected);
  }

  append(...children: TestElement[]) {
    children.forEach((child) => {
      child.parentElement = this;
      this.children.push(child);
    });
  }

  contains(element: TestElement): boolean {
    return element === this || this.children.some((child) => child.contains(element));
  }

  getAttribute(key: string) { return this.attributes.get(key) ?? null; }
  hasAttribute(key: string) { return this.attributes.has(key); }
  setAttribute(key: string, value: string) { this.attributes.set(key, value); }
  removeAttribute(key: string) { this.attributes.delete(key); }
  getClientRects() { return this.rendered ? [{}] : []; }

  closest(): TestElement | null {
    if (this.hasAttribute('inert') || this.hasAttribute('hidden') || this.getAttribute('aria-hidden') === 'true') {
      return this;
    }
    return this.parentElement?.closest() ?? null;
  }

  matches(selector: string) {
    return selector === '[contenteditable="true"]' ? this.editable : this.disabled || this.hiddenInput;
  }

  querySelectorAll(): TestElement[] {
    return this.children.flatMap((child) => [
      ...(child.candidate ? [child] : []),
      ...child.querySelectorAll(),
    ]);
  }

  focus() {
    if (!this.isConnected || this.closest() || this.disabled) return;
    this.ownerDocument.activeElement = this;
    this.ownerDocument.dispatch('focusin', { target: this });
  }

  get element() { return this as unknown as HTMLElement; }
}

class TestDocument {
  body = new TestElement(this);
  activeElement: TestElement = this.body;
  listeners = new Map<string, Set<(event: never) => void>>();
  mutations: (() => void) | undefined;
  defaultView = {
    getComputedStyle: (element: TestElement) => ({ visibility: element.visibility }),
    MutationObserver: (() => {
      const setMutations = (callback: (() => void) | undefined) => {
        this.mutations = callback;
      };
      return class {
        constructor(callback: () => void) { setMutations(callback); }
        observe() {}
        disconnect() { setMutations(undefined); }
      };
    })(),
  };

  addEventListener(type: string, listener: (event: never) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (event: never) => void) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string, event: object) {
    this.listeners.get(type)?.forEach((listener) => listener(event as never));
  }

  key(key: string, shiftKey = false) {
    const event = { key, shiftKey, preventDefault: vi.fn(), stopImmediatePropagation: vi.fn() };
    this.dispatch('keydown', event);
    return event;
  }

  node(parent = this.body, tabbable = false) {
    const node = new TestElement(this);
    if (tabbable) {
      node.candidate = true;
      node.tabIndex = 0;
    }
    parent.append(node);
    return node;
  }
}

describe('modal focus manager decisions', () => {
  it('filters hidden, inert, disabled and negative-tabindex controls, keeping native tab order', () => {
    const document = new TestDocument();
    const dialog = document.node();
    const ordinary = document.node(dialog, true);
    const second = document.node(dialog, true);
    second.tabIndex = 2;
    const first = document.node(dialog, true);
    first.tabIndex = 1;
    document.node(dialog, true).disabled = true;
    document.node(dialog, true).hiddenInput = true;
    document.node(dialog, true).rendered = false;
    document.node(dialog, true).visibility = 'hidden';
    document.node(dialog, true).tabIndex = -1;
    const hiddenPanel = document.node(dialog);
    hiddenPanel.setAttribute('aria-hidden', 'true');
    document.node(hiddenPanel, true);
    const offSlide = document.node(dialog);
    offSlide.setAttribute('inert', '');
    document.node(offSlide, true);

    expect(getFocusableElements(dialog.element)).toEqual([first, second, ordinary]);
  });

  it('inerts only sibling branches, keeps clickable backdrops available and restores prior state', () => {
    const document = new TestDocument();
    const app = document.node();
    const header = document.node(app);
    const opener = document.node(header, true);
    const main = document.node(app);
    const overlay = document.node(main);
    const backdrop = document.node(overlay);
    const input = document.node(overlay, true);
    const page = document.node(main);
    page.setAttribute('inert', 'already-inert');
    opener.focus();
    document.body.style.setProperty('overflow', 'clip', 'important');
    const modal = activateModal(overlay.element, { layer: 60, initialFocus: () => input.element });

    expect(document.activeElement).toBe(input);
    expect(getModalBackgroundElements(overlay.element, document.body.element)).toEqual([page, header]);
    expect(header.hasAttribute('inert')).toBe(true);
    expect(backdrop.hasAttribute('inert')).toBe(false);
    expect(overlay.closest()).toBe(null);
    const lateSibling = document.node(main);
    document.mutations?.();
    expect(lateSibling.hasAttribute('inert')).toBe(true);
    modal.deactivate();

    expect(document.activeElement).toBe(opener);
    expect(header.hasAttribute('inert')).toBe(false);
    expect(page.getAttribute('inert')).toBe('already-inert');
    expect(lateSibling.hasAttribute('inert')).toBe(false);
    expect(document.body.style.getPropertyValue('overflow')).toBe('clip');
    expect(document.body.style.getPropertyPriority('overflow')).toBe('important');
    expect(document.mutations).toBeUndefined();
  });

  it('wraps both Tab boundaries, recovers escaped focus, and falls back when there are no controls', () => {
    const document = new TestDocument();
    const outside = document.node(document.body, true);
    const dialog = document.node();
    const first = document.node(dialog, true);
    const last = document.node(dialog, true);
    const modal = activateModal(dialog.element, { layer: 60 });
    expect(document.activeElement).toBe(first);
    expect(document.key('Tab', true).preventDefault).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(last);
    expect(document.key('Tab').preventDefault).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(first);
    expect(document.key('Tab').preventDefault).not.toHaveBeenCalled();
    document.activeElement = outside;
    document.dispatch('focusin', { target: outside });
    expect(document.activeElement).toBe(first);
    first.disabled = true;
    last.disabled = true;
    expect(document.key('Tab').preventDefault).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(dialog);
    modal.deactivate();
  });

  it('keeps the innermost same-layer modal active even if its parent registers later', () => {
    const document = new TestDocument();
    const outer = document.node();
    const outerButton = document.node(outer, true);
    outerButton.focus();
    const inner = document.node(outer);
    const innerButton = document.node(inner, true);
    const childEscape = vi.fn();
    const child = activateModal(inner.element, { layer: 60, onEscape: childEscape });
    const sibling = document.node();
    const siblingButton = document.node(sibling, true);
    const siblingModal = activateModal(sibling.element, { layer: 60 });
    const parentEscape = vi.fn();
    const parent = activateModal(outer.element, { layer: 60, onEscape: parentEscape });
    expect(document.activeElement).toBe(siblingButton);
    parent.focusInitial();
    expect(document.activeElement).toBe(siblingButton);
    siblingModal.deactivate();
    expect(document.activeElement).toBe(innerButton);
    expect(inner.closest()).toBe(null);
    expect(outerButton.hasAttribute('inert')).toBe(true);
    document.key('Escape');
    expect(childEscape).toHaveBeenCalledOnce();
    expect(parentEscape).not.toHaveBeenCalled();
    child.deactivate();
    expect(document.activeElement).toBe(outerButton);
    expect(document.body.style.getPropertyValue('overflow')).toBe('hidden');
    parent.deactivate();
    expect(document.body.style.getPropertyValue('overflow')).toBe('');
  });

  it('lets onboarding own Escape and focus above later lower-layer dialogs', () => {
    const document = new TestDocument();
    const onboarding = document.node();
    const heading = document.node(onboarding);
    const firstPanel = document.node(onboarding);
    document.node(firstPanel, true);
    const secondPanel = document.node(onboarding);
    secondPanel.setAttribute('inert', '');
    const secondHeading = document.node(secondPanel);
    let currentHeading = heading;
    const welcome = activateModal(onboarding.element, { layer: 100, initialFocus: () => currentHeading.element });
    const dictionary = document.node();
    document.node(dictionary, true);
    const closeDictionary = vi.fn();
    const search = activateModal(dictionary.element, { layer: 60, onEscape: closeDictionary });
    expect(document.activeElement).toBe(heading);
    document.key('Escape');
    expect(closeDictionary).not.toHaveBeenCalled();
    search.focusInitial();
    expect(document.activeElement).toBe(heading);
    firstPanel.setAttribute('inert', '');
    secondPanel.removeAttribute('inert');
    currentHeading = secondHeading;
    welcome.focusInitial();
    expect(document.activeElement).toBe(secondHeading);
    search.deactivate();
    expect(document.activeElement).toBe(secondHeading);
    welcome.deactivate();
  });

  it('restores a connected opener during StrictMode-style cleanup without stale listeners or focus work', () => {
    const document = new TestDocument();
    const opener = document.node(document.body, true);
    const dialog = document.node();
    const input = document.node(dialog, true);
    opener.focus();
    const initial = activateModal(dialog.element, { layer: 60 });
    initial.deactivate();
    initial.deactivate();
    initial.focusInitial();
    expect(document.activeElement).toBe(opener);
    const close = vi.fn();
    const replay = activateModal(dialog.element, { layer: 60, onEscape: close });
    expect(document.activeElement).toBe(input);
    document.key('Escape');
    expect(close).toHaveBeenCalledOnce();
    opener.parentElement = null;
    replay.deactivate();
    expect(document.activeElement).toBe(input);
    expect(document.listeners.get('keydown')?.size).toBe(0);
    expect(document.listeners.get('focusin')?.size).toBe(0);
    expect(document.body.style.getPropertyValue('overflow')).toBe('');
  });
});
