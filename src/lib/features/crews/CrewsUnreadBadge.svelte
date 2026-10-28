<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { crewQueryClient, unreadQuery } from './queries.js';

	// The unread count for the Crews nav item (GET /crews/unread), for the
	// shell to mount next to the link. The Go web app had no such badge (only
	// the dots on the crew rail); iOS shows it. It polls, and an open crew
	// page's live stream invalidates the same key, so both stay in step when
	// the shell provides the app's QueryClient.
	let { class: className = '' }: { class?: string } = $props();
	crewQueryClient();
	const unread = createQuery(unreadQuery);
	const total = $derived(unread.data?.total ?? 0);
</script>

{#if total > 0}
	<Badge variant="secondary" class={['h-5 min-w-5 justify-center px-1 tabular-nums', className]} data-crews-unread={total}>
		{total > 99 ? '99+' : total}
	</Badge>
{/if}
