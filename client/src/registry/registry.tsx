import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type {
  ActionListWidget,
  DataTableWidget,
  DistributionChartWidget,
  DynamicFormWidget,
  MetricCardWidget,
  NarrativeHeadlineWidget,
  Widget,
  WidgetType,
} from '@/types/widgets';

/**
 * Dynamic Component Registry.
 *
 * The single place where a schema `type` becomes a React component. Adding an
 * archetype means adding one entry here plus its component — no switch
 * statement in a renderer, no conditional chain that grows with every type.
 *
 * Each component is typed against its own widget variant, so the discriminated
 * union is preserved end to end: a component declared for METRIC_CARD cannot
 * be registered under DATA_TABLE.
 */

export interface WidgetComponentProps<TWidget extends Widget = Widget> {
  widget: TWidget;
}

type WidgetComponent<TWidget extends Widget> =
  | ComponentType<WidgetComponentProps<TWidget>>
  | LazyExoticComponent<ComponentType<WidgetComponentProps<TWidget>>>;

/**
 * Heavy archetypes are code-split. The table pulls in virtualization and the
 * chart its own rendering path; neither should sit in the initial bundle when
 * a dashboard might contain neither.
 */
const MetricCard = lazy(() =>
  import('@/widgets/MetricCard').then((m) => ({ default: m.MetricCard })),
);
const DataTable = lazy(() =>
  import('@/widgets/DataTable').then((m) => ({ default: m.DataTable })),
);
const DynamicForm = lazy(() =>
  import('@/widgets/DynamicForm').then((m) => ({ default: m.DynamicForm })),
);
const ActionList = lazy(() =>
  import('@/widgets/ActionList').then((m) => ({ default: m.ActionList })),
);
const DistributionChart = lazy(() =>
  import('@/widgets/DistributionChart').then((m) => ({
    default: m.DistributionChart,
  })),
);
const NarrativeHeadline = lazy(() =>
  import('@/widgets/NarrativeHeadline').then((m) => ({
    default: m.NarrativeHeadline,
  })),
);

/**
 * Mapped over WidgetType, so adding a type to the union makes this object a
 * compile error until the component is registered. The registry cannot fall
 * out of sync with the schema without the build failing.
 */
interface WidgetRegistry {
  METRIC_CARD: WidgetComponent<MetricCardWidget>;
  DATA_TABLE: WidgetComponent<DataTableWidget>;
  DYNAMIC_FORM: WidgetComponent<DynamicFormWidget>;
  ACTION_LIST: WidgetComponent<ActionListWidget>;
  DISTRIBUTION_CHART: WidgetComponent<DistributionChartWidget>;
  NARRATIVE_HEADLINE: WidgetComponent<NarrativeHeadlineWidget>;
}

const REGISTRY: WidgetRegistry = {
  METRIC_CARD: MetricCard,
  DATA_TABLE: DataTable,
  DYNAMIC_FORM: DynamicForm,
  ACTION_LIST: ActionList,
  DISTRIBUTION_CHART: DistributionChart,
  NARRATIVE_HEADLINE: NarrativeHeadline,
};

/** Returns the component for a type, or null when the client cannot render it. */
export function resolveWidget(
  type: string,
): ComponentType<WidgetComponentProps> | null {
  const component = REGISTRY[type as WidgetType] as
    | ComponentType<WidgetComponentProps>
    | undefined;
  return component ?? null;
}

export function isKnownWidgetType(type: string): type is WidgetType {
  return type in REGISTRY;
}
