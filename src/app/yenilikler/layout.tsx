import type { ReactNode } from 'react';

// P0 ISR protection: keep tournaments/offers request-fresh without route-level
// minute ISR writes. The existing update query/cache semantics remain untouched.
export const dynamic = 'force-dynamic';

export default function UpdatesRuntimeLayout({ children }: { children: ReactNode }) {
  return children;
}
