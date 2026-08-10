import type { ReactNode } from 'react';
import { DatabaseBootContext } from '../../hooks/database-boot-context';
import { useDatabaseBoot } from '../../hooks/useDatabaseBoot';

/** Runs database boot once and shares the result with every consumer below it. */
export default function DatabaseBootProvider({ children }: { children: ReactNode }) {
  const boot = useDatabaseBoot();
  return <DatabaseBootContext.Provider value={boot}>{children}</DatabaseBootContext.Provider>;
}
