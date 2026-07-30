import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface Props {
  widgetId: string;
  widgetTitle?: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Isolates a single widget's render failures.
 *
 * Scoped per widget rather than per dashboard: one malformed payload should
 * cost the user that one card, not the workspace. Error boundaries must be
 * class components — there is no hook equivalent.
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // In a real app this would go to an error reporter, keyed by widget so a
    // single broken archetype is visible across sessions.
    console.error(`[widget:${this.props.widgetId}] render failed`, error, info);
  }

  private readonly reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        className="flex h-full flex-col items-start justify-center gap-3 p-5"
      >
        <div className="flex items-center gap-2 text-danger">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium">
            {this.props.widgetTitle ?? 'This widget'} could not be displayed
          </p>
        </div>

        <p className="text-xs leading-relaxed text-content-muted">
          The rest of the dashboard is unaffected. {error.message}
        </p>

        <button
          type="button"
          onClick={this.reset}
          className="inline-flex items-center gap-1.5 rounded-control border border-border px-2.5 py-1.5 text-xs font-medium text-content-muted transition-colors duration-(--duration-fast) hover:bg-overlay hover:text-content"
        >
          <RotateCw className="size-3" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }
}
