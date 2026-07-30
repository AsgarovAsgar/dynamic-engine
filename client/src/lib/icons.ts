import {
  Activity,
  CircleCheck,
  Database,
  Info,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';

/**
 * Icon names → components.
 *
 * The schema carries icon *names*, never components — a server cannot send a
 * React element, and accepting arbitrary markup from a payload would be a
 * injection risk. Unknown names fall back rather than rendering nothing, so a
 * newer server naming an icon this client lacks still shows a chip.
 */
const ICONS: Record<string, LucideIcon> = {
  'circle-check': CircleCheck,
  database: Database,
  'shield-check': ShieldCheck,
  activity: Activity,
  'triangle-alert': TriangleAlert,
  info: Info,
};

export function resolveIcon(name: string | undefined): LucideIcon {
  if (!name) return Info;
  return ICONS[name] ?? Info;
}
