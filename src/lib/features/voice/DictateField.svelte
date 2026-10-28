<!--
	The microphone in the bottom corner of the textarea it wraps (north-client
	dictate.Field), for a labelled form field with no row of buttons to join.

	<DictateField target="note"><Textarea id="note" … /></DictateField>

	The padding keeps the last line of text from running under the button. On a
	deployment that cannot transcribe the button renders nothing and the padding
	is harmless.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '#lib/utils.js';
	import Dictate from './Dictate.svelte';

	let {
		target,
		surface = '',
		class: className = '',
		children
	}: { target: string; surface?: string; class?: string; children: Snippet } = $props();
</script>

<div class="relative [&_textarea]:pr-12">
	{@render children()}
	<Dictate {target} {surface} variant="ghost" class={cn('absolute right-0.5 bottom-0.5', className)} />
</div>
