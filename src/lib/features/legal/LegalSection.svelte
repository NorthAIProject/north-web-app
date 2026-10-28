<!-- One titled block of a policy (north-client web/legal/document.templ section). -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { heading, children }: { heading: string; children: Snippet } = $props();
</script>

<section class="space-y-3">
	<h2 class="text-foreground text-base font-medium tracking-tight">{heading}</h2>
	{@render children()}
</section>
