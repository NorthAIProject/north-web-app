// TanStack Query keys and options for the crew state the live stream keeps
// fresh: the space (channels with their unread counts, members, the viewer's
// role) and the unread totals behind the badge. A live event invalidates the
// key it affects instead of the page refetching by hand.
import { QueryClient, getQueryClientContext, setQueryClientContext } from '@tanstack/svelte-query';
import * as crewApi from './api.js';

export const crewKeys = {
	all: ['crews'] as const,
	unread: () => ['crews', 'unread'] as const,
	space: (crewID: string) => ['crews', crewID, 'space'] as const
};

/**
 * The QueryClient in context, or a new one set for this subtree when the app
 * has none yet. Call during component init. A client made here lives with the
 * component, so nothing is shared between server requests.
 */
export function crewQueryClient(): QueryClient {
	try {
		return getQueryClientContext();
	} catch {
		const client = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 2 } } });
		setQueryClientContext(client);
		return client;
	}
}

export function spaceQuery(crewID: string) {
	return {
		queryKey: crewKeys.space(crewID),
		queryFn: () => crewApi.getSpace(crewID)
	};
}

/** How often the badge looks for messages from crews whose page is not open. */
export const UNREAD_POLL_MS = 30_000;

export function unreadQuery() {
	return {
		queryKey: crewKeys.unread(),
		queryFn: () => crewApi.getUnread(),
		refetchInterval: UNREAD_POLL_MS
	};
}
