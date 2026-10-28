<script lang="ts">
	import { page } from '$app/state';
	import AppShell from '#lib/components/layout/AppShell.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// Onboarding renders in the auth card, not the shell (Go: layout.AuthWide).
	const bare = $derived(page.url.pathname.startsWith('/app/onboarding'));
	// A page opts into the edge-to-edge shell with `export const load = () => ({ wide: true })`.
	const wide = $derived(Boolean((page.data as { wide?: boolean }).wide));
</script>

{#if bare}
	{@render children()}
{:else}
	<AppShell user={data.user} simpleNav={data.simpleNav} {wide}>
		{@render children()}
	</AppShell>
{/if}
