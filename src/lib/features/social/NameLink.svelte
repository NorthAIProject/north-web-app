<script lang="ts">
	import { profileHref } from './format.js';

	// Go: nameLink — a name inside a line of text, linked to the person's
	// profile when they have a handle. An inline anchor, not the Button: the
	// button is block chrome.
	let { name, handle }: { name: string; handle: string } = $props();
</script>

{#if handle}
	<a href={profileHref(handle)} class="hover:underline">{name}</a>
{:else}
	{name}
{/if}
