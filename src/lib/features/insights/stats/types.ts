import type { components } from '#lib/api/generated/schema.js';

type Schemas = components['schemas'];

export type StatsRow = Schemas['InsightsStatsRow'];
export type StatsBar = Schemas['InsightsStatsBar'];
export type SleepView = Schemas['InsightsSleep'];
export type CardioView = Schemas['InsightsCardio'];
export type PatternsView = Schemas['InsightsPatterns'];
