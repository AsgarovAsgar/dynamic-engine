import type { Widget } from '../types/widgets.js';

/**
 * "Real-time system analytics" — the prompt named in the assignment brief.
 * Deliberately a different widget mix and column shape from the risk scenario,
 * so re-generating proves the registry resolves whatever schema arrives.
 */
export const analyticsWidgets: Widget[] = [
  {
    id: 'wgt_sys_headline',
    type: 'NARRATIVE_HEADLINE',
    title: 'Summary',
    layout: { colSpan: 4, rowSpan: 1, order: 0, minHeight: 148 },
    data: {
      headline: 'All systems nominal — 14,280 req/sec across 4 regions.',
      subline: 'P99 latency is up 8% in AP-South; everything else is within budget.',
      chips: [
        { label: 'Live telemetry', icon: 'activity', status: 'success' },
        { label: 'Sourced from metrics_db · 6 tables', icon: 'database', status: 'neutral' },
        { label: '1 region degraded', icon: 'triangle-alert', status: 'warning' },
      ],
    },
  },
  {
    id: 'wgt_req_rate',
    type: 'METRIC_CARD',
    title: 'API Request Rate',
    layout: { colSpan: 1, rowSpan: 1, order: 1, minHeight: 132 },
    data: {
      value: '14,280',
      unit: 'req/sec',
      trend: '12.4%',
      trendDirection: 'up',
      status: 'success',
      sparkline: [10, 25, 40, 35, 60, 85, 90],
    },
  },
  {
    id: 'wgt_p99',
    type: 'METRIC_CARD',
    title: 'P99 Latency',
    layout: { colSpan: 1, rowSpan: 1, order: 2, minHeight: 132 },
    data: {
      value: '284',
      unit: 'ms',
      trend: '8.1%',
      trendDirection: 'up',
      status: 'warning',
      sparkline: [240, 248, 255, 262, 270, 278, 284],
    },
  },
  {
    id: 'wgt_error_rate',
    type: 'METRIC_CARD',
    title: 'Error Rate',
    layout: { colSpan: 1, rowSpan: 1, order: 3, minHeight: 132 },
    data: {
      value: '0.14',
      unit: '%',
      trend: '0.03%',
      trendDirection: 'down',
      status: 'success',
      sparkline: [0.22, 0.2, 0.19, 0.17, 0.16, 0.15, 0.14],
    },
  },
  {
    id: 'wgt_active_users',
    type: 'METRIC_CARD',
    title: 'Active Users',
    layout: { colSpan: 1, rowSpan: 1, order: 4, minHeight: 132 },
    data: {
      value: '48,912',
      trend: '5.6%',
      trendDirection: 'up',
      status: 'success',
      sparkline: [39000, 41200, 43100, 44800, 46300, 47600, 48912],
    },
  },
  {
    id: 'wgt_regions_table',
    type: 'DATA_TABLE',
    title: 'Active user regions',
    // Matches the risk table: the scroll body is a fixed five rows regardless
    // of how many rows arrive, so both tables occupy the same height.
    layout: { colSpan: 4, rowSpan: 2, order: 5, minHeight: 330 },
    data: {
      columns: [
        { key: 'region', label: 'Region', align: 'left', sortable: true, format: 'text', weight: 3 },
        { key: 'users', label: 'Active Users', align: 'right', sortable: true, format: 'number', weight: 2 },
        { key: 'latency', label: 'P99 (ms)', align: 'right', sortable: true, format: 'number', weight: 1 },
        { key: 'share', label: 'Share', align: 'right', sortable: true, format: 'percent', weight: 1 },
      ],
      rows: [
        { region: 'US-East', users: 18_420, latency: 212, share: 0.377 },
        { region: 'EU-West', users: 12_880, latency: 236, share: 0.263 },
        { region: 'AP-South', users: 9_640, latency: 412, share: 0.197 },
        { region: 'US-West', users: 5_310, latency: 198, share: 0.109 },
        { region: 'AP-Northeast', users: 2_662, latency: 274, share: 0.054 },
      ],
      totalRows: 5,
      defaultSort: { key: 'users', direction: 'desc' },
      virtualized: false,
    },
  },
  {
    id: 'wgt_latency_dist',
    type: 'DISTRIBUTION_CHART',
    title: 'Latency distribution',
    layout: { colSpan: 2, rowSpan: 1, order: 6, minHeight: 236 },
    data: {
      bins: [
        { label: '50', value: 320 },
        { label: '100', value: 540 },
        { label: '150', value: 880 },
        { label: '200', value: 1240 },
        { label: '250', value: 960 },
        { label: '300', value: 610 },
        { label: '350', value: 340 },
        { label: '400', value: 180 },
        { label: '450', value: 90 },
      ],
      xAxisLabel: 'Latency (ms)',
      yAxisLabel: 'Requests',
      highlightIndex: 3,
    },
  },
  {
    id: 'wgt_agent_params',
    type: 'DYNAMIC_FORM',
    title: 'Agent Parameter Adjuster',
    layout: { colSpan: 2, rowSpan: 1, order: 7, minHeight: 260 },
    data: {
      submitLabel: 'Update agent',
      actionEndpoint: '/api/widget-action',
      fields: [
        {
          name: 'temperature',
          label: 'Model Temperature',
          type: 'slider',
          description: 'Higher values make responses more varied.',
          defaultValue: 0.7,
          min: 0,
          max: 1,
          step: 0.05,
          validation: { required: true, min: 0, max: 1 },
        },
        {
          name: 'maxTokens',
          label: 'Max Tokens',
          type: 'number',
          defaultValue: 2048,
          min: 256,
          max: 8192,
          step: 256,
          validation: { required: true, min: 256, max: 8192, message: 'Must be between 256 and 8192.' },
        },
        {
          name: 'fallbackMode',
          label: 'Enable Fallback',
          type: 'toggle',
          defaultValue: true,
        },
      ],
    },
  },
];
