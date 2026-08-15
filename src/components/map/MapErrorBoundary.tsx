'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('GameYer map runtime error:', error, info);

    const payload = {
      message: `MapError: ${error.message}`,
      stack: `${error.stack ?? ''}\n${info.componentStack ?? ''}`,
      path: window.location.pathname + window.location.search,
      userAgent: navigator.userAgent,
    };

    fetch('/api/client-error', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[320px] items-center justify-center bg-surface px-6 text-center">
          <div>
            <p className="font-display text-base font-semibold text-ink">Xəritə yüklənmədi</p>
            <p className="mt-1 text-sm text-muted">Klub siyahısından istifadə edə bilərsiniz.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
