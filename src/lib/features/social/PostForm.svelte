<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';

	// One small form that posts to a page action, as each Go button on the
	// Friends page posted to its own route (/app/friends/<id>/<verb>, the kudos
	// and phone routes). Works without JavaScript; enhanced, it keeps the
	// scroll position and refreshes the page data in place.
	let {
		action,
		fields = {},
		class: className = '',
		children
	}: {
		action: string;
		fields?: Record<string, string>;
		class?: string;
		children: Snippet;
	} = $props();

	let busy = $state(false);
</script>

<form
	method="post"
	{action}
	class={className}
	aria-busy={busy}
	use:enhance={() => {
		busy = true;
		return async ({ update }) => {
			await update({ reset: false });
			busy = false;
		};
	}}
>
	{#each Object.entries(fields) as [name, value] (name)}
		<input type="hidden" {name} {value} />
	{/each}
	{@render children()}
</form>
