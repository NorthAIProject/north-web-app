import { tick } from 'svelte';
import type { SubmitFunction } from '$app/forms';
import type { Attachment } from 'svelte/attachments';

/**
 * The aria-describedby value for a control whose FieldMessage uses the same
 * id: the error while there is one, otherwise the hint, otherwise nothing.
 */
export function describedBy(id: string, error?: string | null, hint?: string | null): string | undefined {
	if (error) return `${id}-error`;
	if (hint) return `${id}-hint`;
	return undefined;
}

/**
 * For controls that don't take aria-describedby themselves (a snippet child,
 * a select built from parts): sets it on the element with this id inside the
 * node the attachment sits on, or on the node itself.
 */
export function describe(id: string, value: string | undefined): Attachment<HTMLElement> {
	return (node) => {
		const control = node.id === id ? node : node.querySelector<HTMLElement>(`[id="${id}"]`);
		if (!control) return;
		if (value) control.setAttribute('aria-describedby', value);
		else control.removeAttribute('aria-describedby');
	};
}

const INVALID ='[aria-invalid]:not([aria-invalid="false"])';
const FOCUSABLE = 'input:not([type="hidden"]), select, textarea, button, [tabindex]:not([tabindex="-1"])';

/**
 * Moves focus to the first control under root marked aria-invalid, so a
 * keyboard or screen-reader user lands on the field that needs fixing and
 * hears its error. A wrapper marked invalid hands focus to its first
 * focusable child. Returns the element that took focus, if any.
 */
export function focusFirstInvalid(root: ParentNode): HTMLElement | null {
	for (const el of root.querySelectorAll<HTMLElement>(INVALID)) {
		if (el.closest('[hidden], [inert]') || (el as HTMLInputElement).disabled) continue;
		const target = el.matches(FOCUSABLE) || el.tabIndex >= 0 ? el : el.querySelector<HTMLElement>(FOCUSABLE);
		if (!target) continue;
		target.focus();
		if (document.activeElement === target) return target;
	}
	return null;
}

/**
 * Wraps a use:enhance submit function: the page updates exactly as before
 * (the inner callback, or the default update()), then after a failure the
 * first invalid field takes focus.
 */
export function withInvalidFocus(submit?: SubmitFunction): SubmitFunction {
	return async (input) => {
		const after = await submit?.(input);
		return async (opts) => {
			if (typeof after === 'function') await after(opts);
			else await opts.update();
			if (opts.result.type === 'failure') {
				await tick();
				focusFirstInvalid(input.formElement);
			}
		};
	};
}
