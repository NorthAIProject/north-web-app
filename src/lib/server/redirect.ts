/**
 * A same-site path to send somebody back to after a form, or the fallback.
 * Mirrors north-client's auth.SafeRedirect: a leading "/" but not "//" or
 * "/\", so a crafted next cannot bounce to another origin.
 */
export function safeNext(next: FormDataEntryValue | string | null | undefined, fallback = '/'): string {
	if (typeof next !== 'string') return fallback;
	if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
	return next;
}
