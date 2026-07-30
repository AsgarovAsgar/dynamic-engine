import { useState, type FormEvent } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const SUGGESTIONS = [
  'Show me high risk accounts that need review',
  'Show me real-time system analytics and active user regions',
];

export function PromptComposer({
  onSubmit,
  isStreaming,
}: {
  onSubmit: (prompt: string) => void;
  isStreaming: boolean;
}) {
  const [value, setValue] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSubmit(trimmed);
  };

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={submit} className="flex items-center gap-2">
        <label htmlFor="prompt" className="sr-only">
          Describe the dashboard you want
        </label>
        <input
          id="prompt"
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Type your request here…"
          autoComplete="off"
          className={cn(
            'min-w-0 flex-1 rounded-control border border-border bg-elevated px-4 py-2.5',
            'text-sm text-content placeholder:text-content-subtle',
            'transition-colors duration-(--duration-fast) ease-(--ease-out-soft)',
            'hover:border-border-strong focus:border-accent focus:outline-none',
          )}
        />
        <button
          type="submit"
          disabled={isStreaming || value.trim().length === 0}
          aria-label="Generate dashboard"
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-control',
            'bg-accent text-on-accent',
            'transition-colors duration-(--duration-fast) ease-(--ease-out-soft)',
            'hover:bg-accent-hover',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          {isStreaming ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowUp className="size-4" aria-hidden="true" />
          )}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={isStreaming}
            onClick={() => {
              setValue(suggestion);
              onSubmit(suggestion);
            }}
            className={cn(
              'rounded-full border border-border px-3 py-1 text-xs text-content-muted',
              'transition-colors duration-(--duration-fast) ease-(--ease-out-soft)',
              'hover:border-border-strong hover:text-content',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
