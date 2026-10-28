<!--
	A form that starts a conversation (Go: POST /app/chat). Every "New
	conversation", "New chat", "Start a reflection" and starter chip is one.
	The action redirects to the new thread, carrying `draft` into its composer.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';

	let {
		kind = '',
		draft = '',
		class: className = '',
		children
	}: { kind?: '' | 'reflection'; draft?: string; class?: string; children: Snippet } = $props();
</script>

<form method="post" action="/app/chat?/start" class={className || undefined} use:enhance>
	{#if kind}<input type="hidden" name="kind" value={kind} />{/if}
	{#if draft}<input type="hidden" name="draft" value={draft} />{/if}
	{@render children()}
</form>
