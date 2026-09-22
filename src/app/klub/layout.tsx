import type { ReactNode } from 'react';

// P0 ISR protection: club detail routes render on request instead of creating
// minute-level ISR artifacts. Public club data and UI semantics are unchanged.
export const dynamic = 'force-dynamic';

export default function ClubRuntimeLayout({ children }: { children: ReactNode }) {
  return children;
}
