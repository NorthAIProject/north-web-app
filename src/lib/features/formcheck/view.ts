// View helpers for form checks (north-client web/form/form.templ and
// internal/media/analysis). The API sends the analysis as FormCheck; these are
// the methods the templ called on analysis.Analysis / FormAnalysis.

import type { components } from '#lib/api/generated/schema.js';
import type { BadgeVariant } from '#lib/components/ui/badge/index.js';
import type { Translator } from '#lib/i18n/index.js';

export type FormCheck = components['schemas']['FormCheck'];
export type FormResult = NonNullable<FormCheck['result']>;
export type FormIssue = FormResult['issues'][number];

/** How many previous checks the upload page lists (Go: ListAnalyses(…, 20)). */
export const PREVIOUS_LIMIT = 20;

/** How often a running analysis is polled (Go: hx-trigger="every 3s"). */
export const POLL_MS = 3000;

/** Go: Analysis.InProgress. */
export function inProgress(c: Pick<FormCheck, 'status'> | undefined): boolean {
	return c?.status === 'pending' || c?.status === 'running';
}

/** Go: Analysis.IsFailed. */
export function isFailed(c: Pick<FormCheck, 'status'>): boolean {
	return c.status === 'failed';
}

/** Go: FormAnalysis.Trustworthy — the model saw enough to be worth acting on. */
export function trustworthy(r: FormResult): boolean {
	return r.confidence === 'high' || r.confidence === 'medium';
}

/** Go: FormAnalysis.Clean — readable footage and nothing to fix. */
export function clean(r: FormResult): boolean {
	return trustworthy(r) && r.issues.length === 0;
}

/** "1:05" (Go: FormIssue.Timestamp). */
export function timestamp(seconds: number): string {
	const total = Math.trunc(seconds);
	return `${Math.trunc(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** The singular spelled out: "1 things" reads as a bug (Go: issuesHeading). */
export function issuesHeading(i18n: Translator, n: number): string {
	return n === 1 ? i18n.t('form.result.issues.one') : i18n.tf('form.result.issues.many', n);
}

type BadgeView = { variant: BadgeVariant; label: string };

/** The list row's badge (Go: issueCountBadge). */
export function issueCountBadge(i18n: Translator, r: FormResult): BadgeView {
	if (clean(r)) return { variant: 'secondary', label: i18n.t('form.badge.clean') };
	if (!trustworthy(r)) return { variant: 'outline', label: i18n.t('form.badge.unclear') };
	return { variant: 'secondary', label: i18n.tf('form.badge.tofix', r.issues.length) };
}

/** Go: confidenceBadge. */
export function confidenceBadge(i18n: Translator, confidence: string): BadgeView {
	if (confidence === 'high') return { variant: 'secondary', label: i18n.t('form.badge.clear') };
	if (confidence === 'medium') return { variant: 'outline', label: i18n.t('form.badge.mostly') };
	return { variant: 'outline', label: i18n.t('form.badge.unclear') };
}

/** Go: severityBadge. */
export function severityBadge(i18n: Translator, severity: string): BadgeView {
	if (severity === 'critical') return { variant: 'destructive', label: i18n.t('form.severity.critical') };
	if (severity === 'moderate') return { variant: 'secondary', label: i18n.t('form.severity.moderate') };
	return { variant: 'outline', label: i18n.t('form.severity.minor') };
}

/** A wait worth reading: "in 47 minutes", not seconds (Go: quota.DelayLabel). */
export function delayLabel(i18n: Translator, seconds: number): string {
	const minutes = seconds / 60;
	if (minutes < 1) return i18n.t('quota.delay.underminute');
	if (minutes < 2) return i18n.t('quota.delay.minute');
	if (minutes < 60) return i18n.tf('quota.delay.minutes', Math.trunc(minutes));
	if (minutes < 120) return i18n.t('quota.delay.hour');
	return i18n.tf('quota.delay.hours', Math.trunc(minutes / 60));
}
