import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';
import { ScreenState } from '@/components/ScreenState';

type Props = { children: ReactNode };
type State = { failed: boolean; resetKey: number };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, resetKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Intentionally do not expose or log runtime details in the production client.
  }

  private reset = () => {
    this.setState((current) => ({ failed: false, resetKey: current.resetKey + 1 }));
  };

  render() {
    if (this.state.failed) {
      return <ScreenState title="Gözlənilməz xəta baş verdi" message="Tətbiq məlumatlarınızı paylaşmadan təhlükəsiz şəkildə bərpa oluna bilər." actionLabel="Yenidən aç" onAction={this.reset} />;
    }
    return <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>;
  }
}
