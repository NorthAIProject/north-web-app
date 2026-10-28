import { QueryClient } from '@tanstack/svelte-query';
import { browser } from '$app/env';

// The app's one TanStack Query client, made by the root layout and provided to
// every page through context (`useQueryClient()` / `createQuery`). The layout
// component is instantiated per request on the server, so nothing is shared
// between users; queries only run in the browser, SSR data comes from `load`.
export function createAppQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser,
				staleTime: 30_000,
				retry: 2,
				refetchOnWindowFocus: false
			}
		}
	});
}
