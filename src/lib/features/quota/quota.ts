// The quota refusal (Go web/quota): what a person sees instead of the thing
// they asked for once a kind of request's quota is spent.
//
// The API's 429 carries code "quota_exceeded" with fields.action (the quota's
// wire name, such as coach_message) and fields.retryAfter (seconds), so the
// web draws the same panel the cookie-session pages swapped in.

import { isApiError } from '#lib/api/errors.js';
import type { Translator } from '#lib/i18n/index.js';

export const QUOTA_CODE = 'quota_exceeded';

/** What QuotaPanel needs: the quota's wire name and the wait in seconds. */
export type QuotaRefusal = { action: string; retryAfter: number; message?: string };

/**
 * The refusal in err, or null when err is not one. A 429 from an older API
 * without the code still yields a refusal, carrying only its message.
 */
export function quotaRefusal(err: unknown): QuotaRefusal | null {
	if (!isApiError(err) || err.status !== 429) return null;
	const retryAfter = Number(err.fields.retryAfter);
	return {
		action: err.code === QUOTA_CODE ? (err.fields.action ?? '') : '',
		retryAfter: Number.isFinite(retryAfter) ? retryAfter : 0,
		message: err.message
	};
}

/** Go ActionLabel: an action with no catalogue entry reads as its wire name. */
export function actionLabel(i18n: Translator, action: string): string {
	return i18n.t('quota.action.' + action);
}

/** Go DelayLabel: "in 47 minutes", never "in 2823 seconds". */
export function delayLabel(i18n: Translator, seconds: number): string {
	if (seconds < 60) return i18n.t('quota.delay.underminute');
	if (seconds < 120) return i18n.t('quota.delay.minute');
	if (seconds < 3600) return i18n.tf('quota.delay.minutes', Math.floor(seconds / 60));
	if (seconds < 7200) return i18n.t('quota.delay.hour');
	return i18n.tf('quota.delay.hours', Math.floor(seconds / 3600));
}
