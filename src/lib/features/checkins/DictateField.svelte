<!--
	Where the dictation mic goes (north-client dictate.Field). Wraps a textarea;
	when a `mic` snippet is given it renders it in the bottom-right corner and
	pads the textarea so text never runs under it, exactly as Go does.

	DICTATION SLOT: src/lib/features/voice/Dictate.svelte (being built
	separately) plugs in here, either by passing it as `mic` from each page or
	by rendering it below in place of `mic` once it exists. Used by the
	check-in wizard, the mind journal and the goal forms.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		target,
		children,
		mic
	}: {
		/** The textarea's id, Go's dictate.Props.Target. */
		target: string;
		children: Snippet;
		/** The mic button for target; absent means dictation is unavailable. */
		mic?: Snippet<[target: string]>;
	} = $props();
</script>

{#if mic}
	<div class="relative [&_textarea]:pr-12" data-dictate-target={target}>
		{@render children()}
		<div class="absolute right-0.5 bottom-0.5">{@render mic(target)}</div>
	</div>
{:else}
	{@render children()}
{/if}
