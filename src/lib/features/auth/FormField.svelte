<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Label } from '#lib/components/ui/label/index.js';

	// A label, its control and the validation message beneath it (Go: the
	// auth pages' field(), built on templUI form.Item / form.Message /
	// form.Description). The hint shows only while there is no error.
	let {
		id,
		label,
		error = '',
		hint = '',
		children
	}: { id: string; label: string; error?: string; hint?: string; children: Snippet } = $props();
</script>

<div class="space-y-2">
	<Label for={id} {error}>{label}</Label>
	{@render children()}
	{#if error}
		<p class="text-[0.8rem] font-medium text-destructive" id="{id}-error">{error}</p>
	{:else if hint}
		<p class="text-sm text-muted-foreground">{hint}</p>
	{/if}
</div>
