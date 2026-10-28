<!--
	A one-button form (undo, toggle, delete, take, skip, stop): Go posted each
	of these as its own small form with hidden fields and swapped the panel.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { Button, type ButtonSize, type ButtonVariant } from '#lib/components/ui/button/index.js';
	import { careSubmit } from './forms.js';

	let {
		action,
		fields,
		variant = 'default',
		size = 'sm',
		class: className = '',
		children
	}: {
		/** The page action, such as "?/undoWater". */
		action: string;
		fields: Record<string, string>;
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<form method="post" {action} use:enhance={careSubmit()}>
	{#each Object.entries(fields) as [name, value] (name)}
		<input type="hidden" {name} {value} />
	{/each}
	<Button type="submit" {variant} {size} class={className}>{@render children()}</Button>
</form>
