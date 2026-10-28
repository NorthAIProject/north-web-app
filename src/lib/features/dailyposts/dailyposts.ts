// The daily post page's helpers: a port of north-client web/dailyposts/view.go.

import type { components } from '#lib/api/generated/schema.js';

export type DailyPost = components['schemas']['DailyPost'];
export type DailyPosts = components['schemas']['DailyPosts'];

/**
 * paragraphs splits a body on blank lines. The model writes plain text, and a
 * paragraph per element is what keeps it readable without markdown.
 */
export function paragraphs(body: string): string[] {
	return body
		.replaceAll('\r\n', '\n')
		.split('\n\n')
		.map((p) => p.trim())
		.filter((p) => p !== '');
}

/** draft is what "Ask the coach" puts in the composer. */
export function draft(p: Pick<DailyPost, 'title'>): string {
	return `About today's post, "${p.title}": `;
}

/** anchor is the post's element id, which a kudos lands back on. */
export const anchor = (id: string) => `post-${id}`;
