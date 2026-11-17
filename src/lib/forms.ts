// Reading text out of a posted form.

/**
 * A form entry as text. An absent field reads as the fallback, and so does an
 * uploaded file: String(file) is "[object File]", which no field means, and
 * Go's r.FormValue never saw file parts either.
 */
export function entryText(value: FormDataEntryValue | null, fallback = ''): string {
	return typeof value === 'string' ? value : fallback;
}

/** The named field as text: entryText of form.get(name). */
export function formText(form: FormData, name: string, fallback = ''): string {
	return entryText(form.get(name), fallback);
}
