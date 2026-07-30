import { useRef, useState, type FormEvent } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const SUGGESTIONS = [
  'Show me high risk accounts that need review',
  'Show me real-time system analytics and active user regions',
];

/**
 * Prompt input, fixed to the bottom of the viewport.
 *
 * Fixed rather than sticky: the composer should stay reachable regardless of
 * scroll position in a long dashboard. The page reserves matching bottom
 * padding so the last widget can always scroll clear of it.
 */
export function PromptComposer({
  onSubmit,
  isStreaming,
}: {
  onSubmit: (prompt: string) => void;
  isStreaming: boolean;
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Visible while the input is empty or still holds an unedited suggestion.
  // Hiding them the instant one is clicked would strand the other, since
  // clicking fills the field rather than submitting.
  const trimmed = value.trim();
  const showSuggestions =
    trimmed.length === 0 || SUGGESTIONS.includes(trimmed);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed || isStreaming) return;
    onSubmit(trimmed);
    // Clearing returns the suggestions, ready for the next question.
    setValue('');
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 overscroll-none overflow-hidden">
      {/* The bar is centred; the suggestions sit left-aligned above it, so
          they read as a hint attached to the workspace rather than a second
          centred element competing with the input. */}
      <div className="mx-auto flex max-w-2xl flex-col gap-2">
        {showSuggestions && (
          <div className="flex w-full flex-wrap justify-start gap-1 md:gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isStreaming}
                // Fills the input rather than submitting, so the suggestion is
                // a starting point the user can edit before sending.
                onClick={() => {
                  setValue(suggestion);
                  inputRef.current?.focus();
                }}
                className={cn(
                  'rounded-full border border-border bg-surface/80 px-3 py-1 text-xs text-content-muted backdrop-blur-sm',
                  'transition-colors duration-(--duration-fast) ease-(--ease-out-soft)',
                  'hover:border-border-strong hover:text-content',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={submit}
          className={cn(
            'flex w-full items-center gap-2 rounded-widget border border-border p-1.5',
            // Translucent + blur so dashboard content reads as passing beneath
            // the bar rather than being clipped by it.
            'bg-surface/85 shadow-lg backdrop-blur-md',
            'transition-colors duration-(--duration-base) ease-(--ease-out-soft)',
            'focus-within:border-border-strong',
          )}
        >
        <label htmlFor="prompt" className="sr-only">
          Describe the dashboard you want
        </label>
        <input
          id="prompt"
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Type your request here…"
          autoComplete="off"
          className={cn(
            // No border or fill of its own: the surrounding bar provides both,
            // and a nested box inside a floating panel reads as a double frame.
            'min-w-0 flex-1 bg-transparent px-3 py-2',
            'text-sm text-content placeholder:text-content-subtle',
            'focus:outline-none',
          )}
        />
        <button
          type="submit"
          disabled={isStreaming || value.trim().length === 0}
          aria-label="Generate dashboard"
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-control',
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
      </div>
    </div>
  );
}
