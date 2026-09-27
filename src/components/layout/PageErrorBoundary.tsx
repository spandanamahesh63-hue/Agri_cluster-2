import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "../ui/states";

interface Props {
  /** Changing this key (e.g. the route) clears a previous error. */
  resetKey: string;
  children: ReactNode;
}

/** Keeps a crash in one screen from blanking the whole app. */
export class PageErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Screen failed to render", error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (this.state.error)
      return <ErrorState message="This screen could not be displayed." onRetry={() => this.setState({ error: null })} />;
    return this.props.children;
  }
}
