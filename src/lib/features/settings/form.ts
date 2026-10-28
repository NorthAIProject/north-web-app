// Reading the settings forms the way north-client's handlers did
// (internal/settings/handler.go: checked, formHour, formSwitch).

/** A trimmed text field. */
export function text(form: FormData, name: string): string {
	return String(form.get(name) ?? '').trim();
}

/** A checkbox or switch: an unchecked one sends nothing at all. */
export function checked(form: FormData, name: string): boolean {
	const v = form.get(name);
	return v !== null && v !== '';
}

/**
 * An hour select, or undefined when the form had no such field (a page from
 * before it existed keeps the saved hour). Unparsable is -1, so validation
 * names the field.
 */
export function formHour(form: FormData, name: string): number | undefined {
	if (!form.has(name)) return undefined;
	const raw = text(form, name);
	return /^[+-]?\d+$/.test(raw) ? Number(raw) : -1;
}

/**
 * A switch new to the form: its absence alone cannot tell "off" from "this
 * page predates it", so a companion field that is always sent decides.
 */
export function formSwitch(form: FormData, name: string, companion: string): boolean | undefined {
	if (!form.has(companion)) return undefined;
	return checked(form, name);
}

/** Field errors as the forms read them. */
export type FieldErrors = Record<string, string>;
