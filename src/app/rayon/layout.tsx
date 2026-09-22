import type { ReactNode } from 'react';

// P0 ISR protection: district route families render on request instead of
// creating minute-level ISR artifacts. SEO content and club result logic stay unchanged.
export const dynamic = 'force-dynamic';

export default function DistrictRuntimeLayout({ children }: { children: ReactNode }) {
  return children;
}
