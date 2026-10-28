<script lang="ts">
	import type { Snippet } from 'svelte';

	// The header's right-hand cluster. Go placed, in order: the "connect an
	// agent" pill (settings/connections), the command palette, the nudge bell
	// (polls every 20s, toasts a new nudge) and the awards host (opens the
	// badge celebration after any successful write). Each feature mounts its
	// widget here as it is ported; the palette arrives as children.
	let { children }: { children: Snippet } = $props();
</script>

{@render children()}
