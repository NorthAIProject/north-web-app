# North Web — Data Fetching Rules

## The short rule

Use **SvelteKit `load` for route data** and **TanStack Query for interactive server state**. Use **direct client requests only inside a named API/query function**. One owner per read unless SSR hydration is explicitly designed.

## Decision table

| Question | Use |
| --- | --- |
| Is the data necessary to render the route or authenticated shell? | `+page.server.ts`/`+layout.server.ts` when private server context is needed; otherwise universal `+page.ts`/`+layout.ts` |
| Does the data need a private API key or server-only credential? | Server `load` or a `+server.ts` proxy; never browser code |
| Is it paginated, frequently refetched, shared by widgets, or mutation-driven? | TanStack Query |
| Is it a URL-driven filter, date, tab, or page? | URL search parameters, read by `load` or a query key |
| Is it a one-off browser action such as an export download? | A named API function using `fetch`, with abort/error handling |
| Is it a simple form with a server-only write and progressive enhancement? | SvelteKit form action, optionally Superforms/Zod |

## SvelteKit load pattern

Use generated route types and SvelteKit’s provided `fetch` so requests participate in SSR and client navigation. Return serializable, view-ready data. Keep the load function thin and delegate API details to `src/lib/api`.

```ts
// src/routes/(app)/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import { getDashboardSummary } from '$lib/api/dashboard';

export const load: PageServerLoad = async ({ locals, fetch, url, depends }) => {
  depends('north:dashboard');
  const date = url.searchParams.get('date') ?? 'today';
  return { summary: await getDashboardSummary({ fetch, user: locals.user, date }) };
};
```

Use `depends('north:resource')` and `invalidate('north:resource')` for intentional SvelteKit revalidation. Do not call `invalidateAll` after every mutation.

## TanStack Query pattern

Put query keys and query functions near the feature. Query keys must include every server input that changes the result: user scope, date, range, filter, and page cursor.

```ts
const activityQuery = createQuery(() => ({
  queryKey: ['activity', { date, range, filter }],
  queryFn: ({ signal }) => getActivity({ date, range, filter, signal }),
  staleTime: 60_000,
  retry: 2
}));
```

Use `createMutation` for writes, invalidate exact affected keys on success, and use optimistic updates only when rollback is well-defined and safe. Configure retries by operation class: reads may retry transient failures; mutations generally should not retry automatically.

## SSR and hydration boundary

The safe default is:

1. Server load fetches route-critical data.
2. The page renders that data.
3. TanStack Query handles client-only secondary widgets and subsequent refetches.

If a page must share prefetched data across many client components, create a fresh QueryClient per request, prefetch with SvelteKit’s `fetch`, dehydrate into the response, and hydrate once on the client. Never use a module-level QueryClient in SSR; it can leak data between requests. Do not pass secrets into dehydrated state.

## Pagination, search, and history

Prefer cursor pagination when the backend supports it. Keep the cursor and filters in the query key, but use `placeholderData` or an equivalent transition strategy to avoid layout jumps. Debounce free-text search at the query boundary and cancel obsolete requests with `AbortSignal`. Preserve filters in the URL when users should be able to share or return to the view.

## Freshness and health data

Every health response should carry or map to a freshness timestamp/source status when available. UI labels should distinguish “updated at”, “sync pending”, “no record”, and “not supported”; do not imply real-time data. Cache historical, immutable ranges more aggressively than today’s active day. Refetch active-day data on focus or explicit refresh only when backend semantics support it.

## Error handling

API functions throw a normalized error with status, code, message, request ID, and retryability. Route loads use SvelteKit `error`/`redirect` for route-level outcomes. Query components render inline error states and provide retry. Authentication failures go through one shared session path; validation failures stay attached to the relevant fields.
