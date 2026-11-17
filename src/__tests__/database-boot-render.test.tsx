import { type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  status: 'opening',
  shellMounts: 0,
  onboardingMounts: 0,
  onboardingComplete: false,
}));

// These tests isolate the primary database boundary after the independent
// restore gate has admitted the app. Its initial blocking state is tested separately.
vi.mock('../components/common/IndependentRestoreGate', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../components/common/DatabaseBootProvider', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../hooks/database-boot-context', () => ({
  useDatabaseBootContext: () => ({ status: { kind: state.status }, dismissRecovery() {} }),
}));
vi.mock('../stores/settingsStore', () => ({
  useSettingsStore: (select: (settings: { onboardingComplete: boolean }) => unknown) =>
    select({ onboardingComplete: state.onboardingComplete }),
}));
vi.mock('../components/layout/Shell', () => ({
  default: () => { state.shellMounts++; return <p>Database writer</p>; },
}));
vi.mock('../components/onboarding/OnboardingOverlay', () => ({
  default: () => { state.onboardingMounts++; return <p>Onboarding writer</p>; },
}));
vi.mock('../components/common/UpdateToast', () => ({ default: () => null }));
vi.mock('react-router-dom', () => ({
  HashRouter: ({ children }: { children: ReactNode }) => children,
  Routes: ({ children }: { children: ReactNode }) => children,
  Route: ({ element }: { element: ReactNode }) => element,
  Navigate: () => null,
}));

import App from '../App';

beforeEach(() => {
  state.status = 'opening';
  state.shellMounts = 0;
  state.onboardingMounts = 0;
  state.onboardingComplete = false;
});

describe('the rendered database boot boundary', () => {
  it('does not mount app or onboarding database writers while opening', () => {
    const html = renderToStaticMarkup(<App />);
    state.onboardingComplete = true;
    renderToStaticMarkup(<App />);
    expect(state.shellMounts).toBe(0);
    expect(state.onboardingMounts).toBe(0);
    expect(html).toContain('role="status"');
    expect(html).toContain('Opening your saved progress');
  });

  it('mounts those components only once safety checks report ready', () => {
    state.status = 'ready';
    const onboardingHtml = renderToStaticMarkup(<App />);
    state.onboardingComplete = true;
    const html = onboardingHtml + renderToStaticMarkup(<App />);
    expect(state.shellMounts).toBe(1);
    expect(state.onboardingMounts).toBe(1);
    expect(html).toContain('Database writer');
  });

  it('replaces writers with an honest reload-required screen after a connection change', () => {
    state.status = 'reload-required';
    const html = renderToStaticMarkup(<App />);
    state.onboardingComplete = true;
    renderToStaticMarkup(<App />);
    expect(state.shellMounts).toBe(0);
    expect(state.onboardingMounts).toBe(0);
    expect(html).toContain('Reload to continue safely');
    expect(html).toContain('Reload the app');
    expect(html).not.toContain('written by a newer version');
  });
});
