import { cn } from '@/lib/cn';

/**
 * Shimmering placeholder block.
 *
 * Always sized by the caller. A skeleton that guesses its own dimensions
 * defeats the purpose — the point is to occupy exactly the space the real
 * content will, so nothing shifts when it arrives.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden rounded-control bg-skeleton',
        // Shimmer via a moving gradient rather than opacity pulsing:
        // transform animations stay on the compositor and never trigger layout.
        'after:absolute after:inset-0 after:-translate-x-full',
        'after:bg-gradient-to-r after:from-transparent after:via-skeleton-shine after:to-transparent',
        'after:animate-[shimmer_1.6s_infinite]',
        className,
      )}
      {...props}
    />
  );
}
