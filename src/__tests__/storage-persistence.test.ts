import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  resolvePersistenceState,
  shouldRequestPersistence,
} from '../lib/storage-persistence';

describe('shouldRequestPersistence', () => {
  it('asks when the API exists and the grant is missing', () => {
    expect(shouldRequestPersistence({ supported: true, alreadyPersisted: false })).toBe(true);
  });

  it('does not ask again once granted', () => {
    expect(shouldRequestPersistence({ supported: true, alreadyPersisted: true })).toBe(false);
  });

  it('does not ask when the browser has no such API', () => {
    expect(shouldRequestPersistence({ supported: false, alreadyPersisted: false })).toBe(false);
  });
});

describe('resolvePersistenceState', () => {
  it('reports an unsupported browser distinctly from a refusal', () => {
    // These need different copy: unsupported is nobody's fault, whereas denied
    // on iOS is fixed by installing the PWA.
    expect(resolvePersistenceState(false, false)).toBe('unsupported');
    expect(resolvePersistenceState(true, false)).toBe('denied');
    expect(resolvePersistenceState(true, true)).toBe('persisted');
  });
});

describe('formatBytes', () => {
  it('scales through the units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(formatBytes(64 * 1024 * 1024)).toBe('64 MB');
  });

  it('handles an unavailable estimate', () => {
    expect(formatBytes(null)).toBe('—');
  });
});
