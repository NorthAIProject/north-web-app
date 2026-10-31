// What the chat page draws of a transcript, and what it tells a screen
// reader. GET /conversations/{id} returns every turn, so the page draws only
// the latest window and lets the person reveal more of what is already loaded.

/** Turns drawn at first, and added by each "Show earlier". */
export const TRANSCRIPT_WINDOW = 50;

/** The latest `limit` items, and how many earlier ones stay hidden. */
export function latest<T>(items: T[], limit: number): { shown: T[]; hidden: number } {
	const hidden = Math.max(0, items.length - Math.max(0, limit));
	return { shown: hidden ? items.slice(hidden) : items, hidden };
}

/** Longest reply read out in full; past it the announcement stops at a word. */
export const ANNOUNCE_MAX = 400;

/**
 * The finished reply as plain words for an aria-live region: the streamed
 * text is markdown source, so the marks a screen reader would spell out go,
 * links keep their text, and a long reply is cut at a word with an ellipsis.
 */
export function announcement(text: string, max = ANNOUNCE_MAX): string {
	const plain = text
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^\s{0,3}(?:#{1,6}|>|[-*+]|\d+[.)])\s+/gm, '')
		.replace(/[*_`~]+/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	if (plain.length <= max) return plain;
	const cut = plain.slice(0, max);
	const space = cut.lastIndexOf(' ');
	return (space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,;:.-]+$/, '') + '…';
}
