import type { DashboardPayload, LayoutType, Widget } from '../types/widgets.js';
import { analyticsWidgets } from './analyticsScenario.js';
import { riskWidgets } from './riskScenario.js';

interface Scenario {
  id: string;
  layout: LayoutType;
  keywords: string[];
  confidence: number;
  sources: string[];
  widgets: Widget[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'high-risk-accounts',
    layout: 'grid-4-col',
    keywords: ['risk', 'account', 'critical', 'fraud', 'exposure', 'credit', 'customer'],
    confidence: 0.94,
    sources: ['customers_db.accounts', 'customers_db.exposures', 'customers_db.regions', 'customers_db.risk_scores'],
    widgets: riskWidgets,
  },
  {
    id: 'system-analytics',
    layout: 'grid-4-col',
    keywords: ['system', 'analytics', 'latency', 'traffic', 'region', 'user', 'performance', 'uptime', 'api'],
    confidence: 0.91,
    sources: ['metrics_db.requests', 'metrics_db.latency', 'metrics_db.sessions'],
    widgets: analyticsWidgets,
  },
];

/** Falls back to the risk scenario, which mirrors the assignment mockup. */
const DEFAULT_SCENARIO = SCENARIOS[0]!;

/** Scores each scenario by keyword hits and returns the best match. */
function selectScenario(prompt: string): Scenario {
  const normalized = prompt.toLowerCase();

  let best = DEFAULT_SCENARIO;
  let bestScore = 0;

  for (const scenario of SCENARIOS) {
    const score = scenario.keywords.reduce(
      (total, keyword) => (normalized.includes(keyword) ? total + 1 : total),
      0,
    );
    if (score > bestScore) {
      best = scenario;
      bestScore = score;
    }
  }

  return best;
}

/** Builds the full payload for a prompt; the stream slices this into frames. */
export function buildDashboard(prompt: string): DashboardPayload {
  const scenario = selectScenario(prompt);

  return {
    dashboardId: `dsh_${Date.now().toString(36)}`,
    layout: scenario.layout,
    theme: 'dark',
    meta: {
      prompt,
      generatedAt: new Date().toISOString(),
      confidence: scenario.confidence,
      sources: scenario.sources,
    },
    widgets: [...scenario.widgets].sort((a, b) => a.layout.order - b.layout.order),
  };
}
