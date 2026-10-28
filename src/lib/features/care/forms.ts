// How the care page's forms behave once script has loaded: the htmx panel
// swap of north-client, done as a SvelteKit enhanced form.
//
// The actions answer a successful write with a 303 back to /app/care (what Go
// did for a plain post). Enhanced, that redirect is not followed: only the
// care data is reloaded, any earlier rejection cleared, and the form that was
// sent goes back to its empty state. A rejection (422) is applied in place, so
// what was typed stays and the field messages appear.

import { applyAction, type SubmitFunction } from '$app/forms';
import { invalidate } from '$app/navigation';

/** Which form a rejected write belongs to, so only that one shows errors. */
export type CareFormName = 'water' | 'sleep' | 'habit' | 'reminder' | 'medication';

/** What a rejected write hands back to its form (the action's fail data). */
export type CareFailure = {
	form: CareFormName;
	errors: Record<string, string>;
	values: Record<string, string | string[]>;
};

export function careSubmit(onSaved?: () => void): SubmitFunction {
	return () =>
		async ({ result }) => {
			if (result.type === 'redirect' || result.type === 'success') {
				await invalidate('north:care');
				await applyAction({ type: 'success', status: 200, location: '/app/care' });
				onSaved?.();
				return;
			}
			await applyAction(result);
		};
}

/** The rejection, when it belongs to this form. */
export function failureFor(form: unknown, name: CareFormName): CareFailure | null {
	const f = form as CareFailure | null | undefined;
	return f && f.form === name ? f : null;
}

/** A one-value field of the rejected form, as typed. */
export function typed(failure: CareFailure | null, field: string): string {
	const v = failure?.values[field];
	return typeof v === 'string' ? v : '';
}

/**
 * Whether a weekday box starts ticked: the rejected form's choice, or every
 * day for an untouched form (Go: dayChecked — "daily" is the common case, and
 * an empty set would be rejected).
 */
export function dayChecked(failure: CareFailure | null, day: number): boolean {
	const v = failure?.values.days_of_week;
	if (!Array.isArray(v) || v.length === 0) return true;
	return v.includes(String(day));
}
