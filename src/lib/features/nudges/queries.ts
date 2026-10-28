// TanStack Query keys and calls for the nudge bell (Go: hx-get /app/nudges/bell
// every 20 s). Every bell action invalidates the one key, so the dropdown and
// the unread dot never disagree.

import { browserApi } from '#lib/api/client.js';
import type { components } from '#lib/api/generated/schema.js';

export type NudgeList = components['schemas']['NudgeList'];
export type Nudge = NudgeList['nudges'][number];

/** Go: hx-trigger="load, every 20s". */
export const BELL_POLL_MS = 20_000;

export const nudgeKeys = {
	bell: ['nudges', 'bell'] as const
};

export function bellQuery() {
	return {
		queryKey: nudgeKeys.bell,
		queryFn: async ({ signal }: { signal: AbortSignal }): Promise<NudgeList> => {
			const { data } = await browserApi().GET('/nudges', { signal });
			return data ?? { nudges: [], unread: 0 };
		},
		refetchInterval: BELL_POLL_MS,
		refetchIntervalInBackground: false,
		staleTime: 0,
		retry: 1
	};
}

export async function dismissNudge(id: string): Promise<void> {
	await browserApi().POST('/nudges/{nudgeID}/dismiss', { params: { path: { nudgeID: id } } });
}

/** The newest unread nudge's title and destination, for the toast (Go newestTitle/newestHref). */
export function newestUnread(list: Nudge[]): { title: string; href: string } {
	const n = list.find((x) => x.unread);
	if (!n) return { title: '', href: '/app' };
	return { title: n.title, href: n.href || '/app' };
}
