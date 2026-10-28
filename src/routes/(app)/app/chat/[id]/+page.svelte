<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import ChatPage from '#lib/features/coach/ChatPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>{pageTitle(data.detail.conversation.title)}</title></svelte:head>

<ChatPage
	detail={data.detail}
	list={data.list}
	stats={data.stats}
	draft={data.draft}
	timeZone={data.user.timezone}
/>
