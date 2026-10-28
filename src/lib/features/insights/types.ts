import type { components } from '#lib/api/generated/schema.js';

type Schemas = components['schemas'];

/** Range selector state (Go RangeView). */
export type RangeView = Schemas['InsightsRange'];

/** Change against the previous window (Go DeltaView). */
export type DeltaView = { pct: number; direction: number; hasPrior: boolean };

/** One or more labelled series (API Chart). */
export type InsightsChart = Schemas['InsightsChart'];
