<!--
	The message under a form control: the error when there is one, otherwise
	the hint. Ids are "{id}-error" / "{id}-hint", so the control points at it
	with aria-describedby={describedBy(id, error, hint)}. Errors are role=alert
	so a failed submit is announced, not only painted.
-->
<script lang="ts">
	import { cn } from '#lib/utils.js';

	let {
		id,
		error = '',
		hint = '',
		class: className = ''
	}: { id: string; error?: string | null; hint?: string | null; class?: string } = $props();
</script>

{#if error}
	<p id="{id}-error" role="alert" class={cn('text-[0.8rem] font-medium text-destructive', className)}>{error}</p>
{:else if hint}
	<p id="{id}-hint" class={cn('text-sm text-muted-foreground', className)}>{hint}</p>
{/if}
