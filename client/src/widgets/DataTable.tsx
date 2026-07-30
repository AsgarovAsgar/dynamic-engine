import type { WidgetComponentProps } from '@/registry/registry';
import type { DataTableWidget } from '@/types/widgets';

/** Placeholder — real implementation lands with the widget pass. */
export function DataTable({ widget }: WidgetComponentProps<DataTableWidget>) {
  return (
    <div className="flex h-full flex-col p-5">
      <h3 className="text-sm font-medium text-content">{widget.title}</h3>
      <p className="mt-1 text-xs text-content-subtle">{widget.type}</p>
    </div>
  );
}
