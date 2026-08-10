import { describe, it, expect } from 'vitest';

/**
 * Database boot must happen exactly once per app load.
 *
 * `useDatabaseBoot` requests persistent storage and takes the daily snapshot,
 * so calling it from a second component re-requested a storage permission every
 * time that component mounted and gave boot status two sources of truth that
 * could disagree. That is precisely what happened: both `App` and `Settings`
 * called it.
 *
 * The effect itself cannot be counted here — these tests render statically, so
 * effects never run — but the structural rule that prevents the regression can
 * be enforced directly: only the provider may call the hook.
 */

const SOURCES = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const PROVIDER = 'components/common/DatabaseBootProvider.tsx';

describe('database boot', () => {
  it('reads its own source tree', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(50);
  });

  it('is invoked only by the provider', () => {
    const importers = Object.entries(SOURCES)
      .filter(([, src]) => /from\s+'[^']*\/useDatabaseBoot'/.test(src))
      .map(([path]) => path.replace(/^\.\.\//, ''));

    expect(
      importers,
      'useDatabaseBoot runs storage-permission and snapshot side effects, so only ' +
        'DatabaseBootProvider may call it. Everything else must use useDatabaseBootContext.',
    ).toEqual([PROVIDER]);
  });

  it('exposes boot state to other components through the context', () => {
    const consumers = Object.entries(SOURCES)
      .filter(([, src]) => src.includes('useDatabaseBootContext('))
      .map(([path]) => path.replace(/^\.\.\//, ''));

    // App and Settings are the two consumers the context exists to serve.
    expect(consumers).toContain('App.tsx');
    expect(consumers).toContain('pages/Settings.tsx');
  });
});
