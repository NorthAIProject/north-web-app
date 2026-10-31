<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Label } from '#lib/components/ui/label/index.js';
	import { FieldMessage, describe, describedBy } from '#lib/components/ui/field-message/index.js';

	// A label, its control and the validation message beneath it (Go: the
	// auth pages' field(), built on templUI form.Item / form.Message /
	// form.Description). The hint shows only while there is no error, and the
	// control with this id is pointed at whichever is showing.
	let {
		id,
		label,
		error = '',
		hint = '',
		children
	}: { id: string; label: string; error?: string; hint?: string; children: Snippet } = $props();
</script>

<div class="space-y-2" {@attach describe(id, describedBy(id, error, hint))}>
	<Label for={id} {error}>{label}</Label>
	{@render children()}
	<FieldMessage {id} {error} {hint} />
</div>
