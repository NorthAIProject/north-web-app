import type { SubmitFunction } from '$app/forms';

/**
 * use:enhance that clears the form once a write lands, as Go's redirect and
 * full reload did; a refusal keeps what was typed. after runs on success too,
 * for state the form element does not hold (a picked Select value).
 */
export function clearOnSuccess(after?: () => void): SubmitFunction {
	return ({ formElement }) =>
		async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'redirect' || result.type === 'success') {
				formElement.reset();
				after?.();
			}
		};
}
