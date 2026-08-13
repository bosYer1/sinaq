import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  tone?: 'pc' | 'ps' | 'live' | 'neutral' | 'premium';
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<BadgeProps['tone']>, string> = {
  pc: 'bg-primary-light text-primary-dark',
  ps: 'bg-blue-50 text-ps',
  live: 'bg-live-light text-live',
  neutral: 'bg-surface-alt text-muted',
  premium: 'bg-warn-light text-amber-700',
};

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
