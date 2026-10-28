// The operator queue's text (north-client web/moderation/ops.templ). The queue
// is an internal tool for the people in OPERATOR_USER_IDS, so its copy is
// English and not in the catalogues, as in Go.

import type { components } from '#lib/api/generated/schema.js';

export type ReportGroup = components['schemas']['ModerationReportGroup'];

/** "abuse ×2, spam ×1", sorted by reason (Go: reasons). The API sends them sorted. */
export function reasonsText(g: ReportGroup): string {
	return g.reasons.map((r) => `${r.reason} ×${r.count}`).join(', ');
}

/** hide is the primary decision; the rest are outline (Go: variant). */
export function actionVariant(action: string): 'default' | 'outline' {
	return action === 'hide' ? 'default' : 'outline';
}
