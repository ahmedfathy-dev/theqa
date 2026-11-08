import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// shadcn/ui helper: merge conditional class names and resolve Tailwind conflicts.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
