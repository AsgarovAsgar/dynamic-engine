import { useState } from 'react';
import { AlertCircle, PlugZap } from 'lucide-react';
import { DashboardGrid } from '@/components/DashboardGrid';
import { PromptComposer } from '@/components/PromptComposer';
import { toRenderList, useDashboardStream } from '@/hooks/useDashboardStream';
import { cn } from '@/lib/cn';
import { setForceFailure } from '@/lib/failureMode';
import { WidgetRenderer } from '@/registry/WidgetRenderer';
import { ThemeToggle } from '@/theme/ThemeToggle';

export default function App() {
  const dashboard = useDashboardStream();
  const isStreaming = dashboard.status === 'streaming';
  const items = toRenderList(dashboard);
  const [failing, setFailing] = useState(false);

  return (
    <div className="min-h-svh bg-canvas">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <h1 className="text-lg font-semibold tracking-tight text-content">
            Dynamic Engine
          </h1>

          <div className="flex items-center gap-2">
            {/* Demo affordance: forces widget actions to fail so optimistic
                rollback can be shown deliberately. */}
            <button
              type="button"
              aria-pressed={failing}
              onClick={() => {
                const next = !failing;
                setFailing(next);
                setForceFailure(next);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1.5 text-xs font-medium',
                'transition-colors duration-(--duration-fast) ease-(--ease-out-soft)',
                failing
                  ? 'border-danger/40 bg-danger/10 text-danger'
                  : 'border-border text-content-muted hover:text-content',
              )}
            >
              <PlugZap className="size-3.5" aria-hidden="true" />
              {failing ? 'Failing actions' : 'Simulate failure'}
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <PromptComposer onSubmit={dashboard.generate} isStreaming={isStreaming} />

        {dashboard.meta && (
          <p className="mt-6 text-sm text-content-muted">
            <span className="text-content">{dashboard.meta.prompt}</span>
            {' · '}
            {Math.round(dashboard.meta.confidence * 100)}% confidence
            {' · '}
            {dashboard.meta.sources.length} sources
          </p>
        )}

        {dashboard.status === 'error' && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-widget border border-border bg-surface p-4"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-content">
                Could not generate the dashboard
              </p>
              <p className="mt-1 text-xs text-content-muted">{dashboard.error}</p>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <DashboardGrid layout={dashboard.layout} className="mt-6">
            {items.map(({ slot, payload }) => (
              <WidgetRenderer
                key={slot.id}
                payload={payload}
                layout={slot.layout}
                slotType={slot.type}
              />
            ))}
          </DashboardGrid>
        )}

        {dashboard.status === 'idle' && (
          <p className="mt-16 text-center text-sm text-content-subtle">
            Ask a question to generate a dashboard.
          </p>
        )}

        {/* Announces stream progress to screen readers without stealing focus. */}
        <p aria-live="polite" className="sr-only">
          {isStreaming
            ? `Generating dashboard, ${dashboard.widgets.size} of ${dashboard.slots.length} widgets loaded`
            : dashboard.status === 'complete'
              ? `Dashboard ready with ${dashboard.slots.length} widgets`
              : ''}
        </p>
      </main>
    </div>
  );
}
