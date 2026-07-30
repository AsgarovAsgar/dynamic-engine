import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges conditional class names, with later Tailwind utilities winning over
 * earlier conflicting ones — so a component's own `p-4` can be overridden by a
 * caller's `p-6` without specificity hacks or arbitrary values.
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
