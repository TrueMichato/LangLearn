import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import IndependentRestoreGate from '../components/common/IndependentRestoreGate';

describe('the independent restore admission boundary', () => {
  it('initially blocks every writer while announcing its safety-storage check', () => {
    const databaseWriter = vi.fn(() => <p>Database writer</p>);
    const onboardingWriter = vi.fn(() => <p>Onboarding writer</p>);
    const DatabaseWriter = databaseWriter;
    const OnboardingWriter = onboardingWriter;
    const html = renderToStaticMarkup(
      <IndependentRestoreGate>
        <DatabaseWriter />
        <OnboardingWriter />
      </IndependentRestoreGate>,
    );
    expect(databaseWriter).not.toHaveBeenCalled();
    expect(onboardingWriter).not.toHaveBeenCalled();
    expect(html).not.toContain('Database writer');
    expect(html).not.toContain('Onboarding writer');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain('Checking for an interrupted recovery');
    expect(html).toContain('Opening backup safety storage');
  });
});
