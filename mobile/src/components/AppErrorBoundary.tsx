import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';
import { ScreenState } from '@/components/ScreenState';

type Props = {
  children: ReactNode;
  title?: string;
  message?: string;
  actionLabel?: string;
  onReset?: () => void;
};
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
    this.props.onReset?.();
    this.setState((current) => ({ failed: false, resetKey: current.resetKey + 1 }));
  };

  render() {
    if (this.state.failed) {
      return <ScreenState title={this.props.title ?? 'Gözlənilməz xəta baş verdi'} message={this.props.message ?? 'Tətbiq təhlükəsiz şəkildə yenidən açıla bilər.'} actionLabel={this.props.actionLabel ?? 'Yenidən aç'} onAction={this.reset} />;
    }
    return <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>;
  }
}
