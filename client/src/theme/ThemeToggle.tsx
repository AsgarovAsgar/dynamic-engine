import { Contrast, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ThemeName } from '@/types/widgets';
import { THEMES, useTheme } from './ThemeProvider';

const ICONS: Record<ThemeName, typeof Sun> = {
  dark: Moon,
  light: Sun,
  'high-contrast': Contrast,
};

/**
 * Segmented theme control.
 *
 * A radiogroup rather than three buttons: arrow keys move between options and
 * only the active one is a tab stop, which is the expected keyboard model for
 * a single-choice control.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="inline-flex items-center gap-0.5 rounded-control border border-border bg-elevated p-0.5"
    >
      {THEMES.map(({ value, label }) => {
        const Icon = ICONS[value];
        const isActive = theme === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            tabIndex={isActive ? 0 : -1}
            onClick={() => setTheme(value)}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
              event.preventDefault();
              const index = THEMES.findIndex((t) => t.value === theme);
              const delta = event.key === 'ArrowRight' ? 1 : -1;
              const next = THEMES[(index + delta + THEMES.length) % THEMES.length];
              if (next) setTheme(next.value);
            }}
            className={cn(
              'grid size-6 place-items-center rounded-[0.3125rem]',
              'transition-colors duration-(--duration-fast) ease-(--ease-out-soft)',
              isActive
                ? 'bg-accent text-on-accent'
                : 'text-content-muted hover:bg-overlay hover:text-content',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
