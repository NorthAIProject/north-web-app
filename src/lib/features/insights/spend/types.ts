import type { components } from '#lib/api/generated/schema.js';

export type SpendView = components['schemas']['InsightsSpend'];
export type SpendLine = SpendView['surfaces'][number];
