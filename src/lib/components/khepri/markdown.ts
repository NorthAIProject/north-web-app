// Coach replies as HTML: a port of north-client web/shared/markdown
// (goldmark with Strikethrough, Table, Linkify, XHTML output, unsafe off).
//
// Model output is untrusted — it reflects whatever the user typed and whatever
// their documents contain — so raw HTML in the source is escaped, never passed
// through (html: false), and markdown-it's validateLink drops javascript:,
// vbscript:, file: and non-image data: URLs, as goldmark does. Task lists are
// not enabled: a checkbox the user cannot tick is worse than a dash.

import MarkdownIt from 'markdown-it';

let engine: MarkdownIt | null = null;

function md(): MarkdownIt {
	if (!engine) {
		engine = new MarkdownIt('default', {
			html: false,
			xhtmlOut: true,
			breaks: false,
			linkify: true,
			typographer: false
		});
		// Strikethrough and tables are on in the default preset. goldmark
		// writes strikethrough as <del>, markdown-it as <s>: match Go.
		engine.renderer.rules.s_open = () => '<del>';
		engine.renderer.rules.s_close = () => '</del>';
	}
	return engine;
}

const escapes: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&#34;', "'": '&#39;' };

/** HTML-escapes text (templ.EscapeString). */
export function escapeHTML(s: string): string {
	return s.replace(/[&<>"']/g, (c) => escapes[c]);
}

/**
 * Converts markdown to HTML safe for {@html}. On failure the original text
 * comes back escaped: a reply readable as plain text beats an empty bubble.
 */
export function renderMarkdown(source: string): string {
	try {
		return md().render(source);
	} catch {
		return escapeHTML(source);
	}
}
